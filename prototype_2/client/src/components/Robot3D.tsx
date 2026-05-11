import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, Environment, ContactShadows, Float, TransformControls } from "@react-three/drei";
import { Suspense, useState, useRef, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";

interface PartProps {
  position: [number, number, number];
  color: string;
  scale?: [number, number, number];
  name?: string;
  activePort?: string | null;
}

interface Robot3DProps {
  type?: string;
  parts?: any[];
  editable?: boolean;
  onPartSelect?: (id: string) => void;
  onPartMove?: (id: string, axis: 'x'|'y'|'z', val: number) => void;
  onPartScale?: (id: string, axis: 'x'|'y'|'z', val: number) => void;
  activePort?: string | null;
  motorSpeed?: number;
}

function RobotModel({ type, motorSpeed, activePort }: { type: string, motorSpeed: number, activePort?: string | null }) {
  const groupRef = useRef<any>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += motorSpeed * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {type === "rover" && (
        <>
          <LegoPart position={[0, 0, 0]} color="#3b82f6" scale={[2, 0.5, 3]} name="chassis" />
          <LegoPart position={[1.1, -0.2, 1]} color="#1f2937" scale={[0.2, 1, 1]} name="wheel_fr" />
          <LegoPart position={[-1.1, -0.2, 1]} color="#1f2937" scale={[0.2, 1, 1]} name="wheel_fl" />
          <LegoPart position={[1.1, -0.2, -1]} color="#1f2937" scale={[0.2, 1, 1]} name="wheel_br" />
          <LegoPart position={[-1.1, -0.2, -1]} color="#1f2937" scale={[0.2, 1, 1]} name="wheel_bl" />
          <LegoPart position={[0, 0.5, 1]} color="#ef4444" scale={[0.5, 0.5, 0.5]} name="port_A" activePort={activePort} />
        </>
      )}
      {type === "arm" && (
        <>
          <LegoPart position={[0, 0, 0]} color="#1f2937" scale={[2, 0.2, 2]} name="base" />
          <LegoPart position={[0, 0.6, 0]} color="#3b82f6" scale={[0.5, 1, 0.5]} name="joint1" />
          <LegoPart position={[0, 1.5, 0.5]} color="#3b82f6" scale={[0.4, 0.4, 1.5]} name="joint2" />
          <LegoPart position={[0, 1.5, 1.3]} color="#ef4444" scale={[0.6, 0.2, 0.2]} name="port_B" activePort={activePort} />
        </>
      )}
      {type === "pet" && (
        <>
          <LegoPart position={[0, 0, 0]} color="#10b981" scale={[1.5, 1.5, 1.5]} name="body" />
          <LegoPart position={[0.6, 0.8, 0.8]} color="#ffffff" scale={[0.4, 0.4, 0.1]} name="eye_r" />
          <LegoPart position={[-0.6, 0.8, 0.8]} color="#ffffff" scale={[0.4, 0.4, 0.1]} name="eye_l" />
          <LegoPart position={[0, -0.8, 0]} color="#1f2937" scale={[1.6, 0.2, 1.6]} name="base" />
        </>
      )}
    </group>
  );
}

function LegoPart({ position, color, scale = [1, 0.5, 1], name, activePort, type }: PartProps & { type?: string }) {
  const isActive = activePort && name?.includes(activePort);
  
  // Minecraft blocks don't have studs, they are clean cubes
  const isMinecraft = type === "minecraft_block";
  
  // Calculate stud grid based on scale (assuming 0.5 units per stud)
  const studsX = isMinecraft ? 0 : Math.max(1, Math.floor(scale[0] / 0.5));
  const studsZ = isMinecraft ? 0 : Math.max(1, Math.floor(scale[2] / 0.5));
  const studSpacing = 0.5;
  
  const studs = [];
  if (!isMinecraft) {
    for (let x = 0; x < studsX; x++) {
      for (let z = 0; z < studsZ; z++) {
        const px = (x - (studsX - 1) / 2) * studSpacing;
        const pz = (z - (studsZ - 1) / 2) * studSpacing;
        studs.push(
          <mesh key={`${x}-${z}`} position={[px, scale[1]/2 + 0.05, pz]}>
            <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
            <meshStandardMaterial color={color} roughness={0.3} />
          </mesh>
        );
      }
    }
  }

  return (
    <mesh position={position} castShadow>
      <boxGeometry args={scale} />
      <meshStandardMaterial 
        color={color} 
        roughness={isMinecraft ? 0.8 : 0.3} 
        metalness={isMinecraft ? 0.1 : 0.2} 
        emissive={isActive ? color : "black"}
        emissiveIntensity={isActive ? 0.5 : 0}
      />
      {studs}
    </mesh>
  );
}

export default function Robot3D({ 
  type = "custom", 
  parts = [], 
  editable = true, 
  onPartSelect,
  onPartMove,
  onPartScale,
  activePort: activePortProp,
  motorSpeed: motorSpeedProp
}: Robot3DProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<"translate" | "scale">("translate");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const { on } = useSocket();
  const [motorSpeed, setMotorSpeed] = useState(motorSpeedProp || 0);
  const [activePort, setActivePort] = useState<string | null>(activePortProp || null);

  useEffect(() => {
    on("motor", (payload: any) => {
      setMotorSpeed(payload.speed / 50);
      setActivePort(payload.port);
      setTimeout(() => setActivePort(null), 500); // Pulse effect
    });
    on("stop", () => {
      setMotorSpeed(0);
      setActivePort(null);
    });
  }, [on]);

  return (
    <div className={`w-full h-full bg-gray-950 rounded-3xl overflow-hidden border border-gray-800 shadow-inner relative transition-all duration-500 ${isEditing ? 'ring-2 ring-purple-500/50' : ''}`}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={40} />
        <OrbitControls makeDefault enablePan={isEditing} minDistance={2} maxDistance={12} autoRotate={!isEditing && motorSpeed === 0} autoRotateSpeed={0.5} />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          <Float speed={isEditing ? 0 : 1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <group onClick={(e) => {
              e.stopPropagation();
              if (!editable) return;
              setIsEditing(true);
            }}>
              {/* If template type is provided, show template, else show custom parts */}
              {type !== "custom" ? (
                <RobotModel type={type} motorSpeed={motorSpeed} activePort={activePort} />
              ) : (
                <group>
                  {Array.isArray(parts) && parts.map(p => {
                    const pos = Array.isArray(p.position) ? p.position : [0, 0, 0];
                    const sc = Array.isArray(p.scale) ? p.scale : [1, 1, 1];
                    return (
                      <group key={p.id} position={pos}>
                        <mesh 
                          castShadow 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditing) {
                              setSelectedPartId(p.id);
                              onPartSelect?.(p.id);
                            }
                          }}
                        >
                          <boxGeometry args={sc} />
                          <meshStandardMaterial 
                            color={p.color || "#ffffff"} 
                            roughness={0.2} 
                            metalness={0.4} 
                            emissive={selectedPartId === p.id ? "#ffffff" : "black"}
                            emissiveIntensity={selectedPartId === p.id ? 0.2 : 0}
                          />
                        </mesh>
                        {isEditing && selectedPartId === p.id && (
                          <TransformControls 
                            mode={editMode}
                            onMouseUp={(e: any) => {
                              const obj = e.target.object;
                              if (obj) {
                                if (editMode === "translate") {
                                  onPartMove?.(p.id, 'x', obj.position.x);
                                  onPartMove?.(p.id, 'y', obj.position.y);
                                  onPartMove?.(p.id, 'z', obj.position.z);
                                } else {
                                  onPartScale?.(p.id, 'x', obj.scale.x);
                                  onPartScale?.(p.id, 'y', obj.scale.y);
                                  onPartScale?.(p.id, 'z', obj.scale.z);
                                }
                              }
                            }}
                          />
                        )}
                        {/* Simplified Studs for custom parts */}
                        {!p.type?.includes("minecraft") && (
                          <mesh position={[0, (sc[1] || 0.5)/2 + 0.05, 0]}>
                             <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
                             <meshStandardMaterial color={p.color || "#ffffff"} />
                          </mesh>
                        )}
                      </group>
                    );
                  })}
                </group>
              )}
            </group>
          </Float>
          <Environment preset="city" />
          <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        </Suspense>

        <Grid
          renderOrder={-1}
          position={[0, -0.01, 0]}
          infiniteGrid
          cellSize={1}
          cellThickness={1}
          sectionSize={3}
          sectionThickness={1.5}
          sectionColor={isEditing ? "#4f46e5" : "#334155"}
          fadeDistance={30}
        />
      </Canvas>

      {/* Status indicator */}
      {!isEditing ? (
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-800 flex items-center gap-2 pointer-events-none">
          <div className={`w-2 h-2 rounded-full ${motorSpeed !== 0 ? 'bg-green-500' : 'bg-cyan-500'} animate-pulse`} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {motorSpeed !== 0 ? "Hardware Active" : "3D Real-time Render"}
          </span>
        </div>
      ) : (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
           <button 
             onClick={() => setEditMode("translate")}
             className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editMode === "translate" ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
           >
             Move
           </button>
           <button 
             onClick={() => setEditMode("scale")}
             className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editMode === "scale" ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
           >
             Scale
           </button>
        </div>
      )}
    </div>
  );
}
