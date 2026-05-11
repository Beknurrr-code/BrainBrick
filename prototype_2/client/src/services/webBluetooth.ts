import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

/**
 * BrainBricks Web Bluetooth Service
 * Implements LEGO Wireless Protocol v3 (LWP v3) for direct browser-to-hub communication.
 */

const LEGO_SERVICE_UUID = "00001623-1212-efde-1623-785feabcd123";
const LEGO_CHARACTERISTIC_UUID = "00001624-1212-efde-1623-785feabcd123";

export class WebBluetoothService {
  private device: any = null;
  private characteristic: any = null;
  private serialPort: any = null;
  private writer: any = null;
  private isNative: boolean = Capacitor.isNativePlatform();
  private initialized: boolean = false;

  async initNative() {
    if (this.isNative && !this.initialized) {
      try {
        await BleClient.initialize();
        this.initialized = true;
        console.log("[Native] Bluetooth LE Initialized");
      } catch (e) {
        console.error("[Native] Initialization failed", e);
      }
    }
  }

  async connect(): Promise<boolean> {
    if (this.isNative) return this.connectNative();
    
    try {
      console.log("[BLE] Requesting LEGO Hub...");
      const nav = navigator as any;
      if (!nav.bluetooth) {
        throw new Error("Web Bluetooth is not supported in this browser.");
      }

      this.device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: "LEGO" },
          { namePrefix: "Hub" },
          { namePrefix: "Technic" },
          { namePrefix: "LPF2" },
          { namePrefix: "SPIKE" },
          { namePrefix: "Spike" }
        ],
        optionalServices: [
            LEGO_SERVICE_UUID,
            "00001623-0000-1000-8000-00805f9b34fb",
            "0000180f-0000-1000-8000-00805f9b34fb",
            "0000180a-0000-1000-8000-00805f9b34fb"
        ]
      });

      console.log("[BLE] Connecting to GATT Server...");
      const server = await this.device.gatt?.connect();
      
      console.log("[BLE] Getting Service...");
      const service = await server?.getPrimaryService(LEGO_SERVICE_UUID);
      
      console.log("[BLE] Getting Characteristic...");
      this.characteristic = await service?.getCharacteristic(LEGO_CHARACTERISTIC_UUID) || null;

      console.log("[BLE] Connected to LEGO Hub via Bluetooth!");
      return true;
    } catch (error) {
      console.error("[BLE] Connection failed:", error);
      return false;
    }
  }

  private async connectNative(): Promise<boolean> {
    await this.initNative();
    try {
      console.log("[Native] Scanning for LEGO Hub...");
      // AGGRESSIVE SCAN: Search by name prefixes if services are hidden
      this.device = await BleClient.requestDevice({
        optionalServices: [
          LEGO_SERVICE_UUID,
          "00001623-0000-1000-8000-00805f9b34fb",
          "0000180f-0000-1000-8000-00805f9b34fb",
          "0000180a-0000-1000-8000-00805f9b34fb"
        ]
      });

      console.log("[Native] Connecting to", this.device.deviceId);
      await BleClient.connect(this.device.deviceId, (deviceId) => {
        console.log("[Native] Disconnected from", deviceId);
        this.device = null;
      });

      console.log("[Native] Connected to LEGO Hub!");
      return true;
    } catch (error) {
      console.error("[Native] Connection failed:", error);
      return false;
    }
  }

  async connectSerial(): Promise<boolean> {
    try {
      console.log("[Serial] Requesting Port...");
      const nav = navigator as any;
      if (!nav.serial) {
        throw new Error("Web Serial is not supported in this browser.");
      }

      this.serialPort = await nav.serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });
      this.writer = this.serialPort.writable.getWriter();
      
      console.log("[Serial] Connected to LEGO Hub via USB!");
      return true;
    } catch (error) {
      console.error("[Serial] Connection failed:", error);
      return false;
    }
  }

  async disconnect() {
    if (this.isNative && this.device) {
      await BleClient.disconnect(this.device.deviceId);
      this.device = null;
      return;
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }
    if (this.serialPort) {
      await this.serialPort.close();
      this.serialPort = null;
    }
    this.device = null;
    this.characteristic = null;
  }

  async sendRaw(data: Uint8Array) {
    // Try Native BLE
    if (this.isNative && this.device) {
      try {
        await BleClient.writeWithoutResponse(
          this.device.deviceId,
          LEGO_SERVICE_UUID,
          LEGO_CHARACTERISTIC_UUID,
          this.dataViewFromBytes(data)
        );
      } catch (e) {
        console.error("[Native] Write error:", e);
      }
      return;
    }

    // Try Web Bluetooth
    if (this.characteristic) {
      try {
        await this.characteristic.writeValueWithoutResponse(data);
      } catch (e) {
        console.error("[BLE] Write error:", e);
      }
    } 
    // Try Serial
    else if (this.writer) {
      try {
        await this.writer.write(data);
      } catch (e) {
        console.error("[Serial] Write error:", e);
      }
    }
  }

  private dataViewFromBytes(bytes: Uint8Array): DataView {
    const buffer = new ArrayBuffer(bytes.length);
    const view = new DataView(buffer);
    bytes.forEach((b, i) => view.setUint8(i, b));
    return view;
  }

  get isConnected(): boolean {
    if (this.isNative) return !!this.device;
    return !!(this.device?.gatt?.connected || this.serialPort);
  }

  /**
   * Set motor speed
   * @param portName "A", "B", "C", "D", "E", "F"
   * @param speed -100 to 100
   */
  async setMotorSpeed(portName: string, speed: number) {
    const portMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
    const port = portMap[portName.toUpperCase()] ?? 0;
    
    const normalizedSpeed = Math.max(-100, Math.min(100, speed));
    // LWP v3: Length, Hub ID (0x00), MsgType (0x81), Port, ExecInfo (0x11), SubCmd (0x51), Mode (0x00), Value
    const data = new Uint8Array([
      0x08, 0x00, 0x81, port, 0x11, 0x51, 0x00, normalizedSpeed & 0xFF
    ]);
    await this.sendRaw(data);
  }

  async stopAll() {
    for (const port of ["A", "B", "C", "D", "E", "F"]) {
      await this.setMotorSpeed(port, 0);
    }
  }
}

export const legoBLE = new WebBluetoothService();
