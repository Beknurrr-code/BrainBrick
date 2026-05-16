import { WebSocket } from "ws";

export class GeminiLiveService {
  private googleWs: WebSocket | null = null;
  private clientWs: WebSocket;
  private apiKey: string;
  private onExpertHandoff: (task: string) => void;
  private model: string = "models/gemini-3-flash-live";

  constructor(clientWs: WebSocket, apiKey: string, onExpertHandoff: (task: string) => void) {
    this.clientWs = clientWs;
    this.apiKey = apiKey;
    this.onExpertHandoff = onExpertHandoff;
  }

  public connect() {
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
    
    this.googleWs = new WebSocket(url);

    this.googleWs.on("open", () => {
      console.log("[GeminiLive] Connected to Google Bidi Stream");
      
      // Small delay before setup to ensure stability
      setTimeout(() => {
        this.sendSetup();
        this.clientWs.send(JSON.stringify({ type: "live_status", payload: { status: "Active" } }));
      }, 500);
      
      const pingInterval = setInterval(() => {
        if (this.googleWs?.readyState === WebSocket.OPEN) {
          this.googleWs.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 20000);
    });

    this.googleWs.on("message", (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.error) {
          console.error("[GeminiLive] Google Error Message:", response.error);
          this.clientWs.send(JSON.stringify({ type: "live_status", payload: { status: "Error", details: response.error.message } }));
          return;
        }
        this.handleGoogleMessage(response);
      } catch (e) {
        console.error("[GeminiLive] Parse Error:", e);
      }
    });

    this.googleWs.on("error", (err) => {
      console.error("[GeminiLive] Google WS Error:", err);
      this.clientWs.send(JSON.stringify({ type: "live_status", payload: { status: "Error" } }));
    });

    this.googleWs.on("close", (code, reason) => {
      console.log(`[GeminiLive] Google WS Closed: ${code} - ${reason}`);
      this.clientWs.send(JSON.stringify({ type: "live_status", payload: { status: "Disconnected" } }));
    });
  }

  private sendSetup() {
    const setup = {
      setup: {
        model: this.model,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: { prebuilt_voice_config: { voice_name: "Puck" } }
          }
        },
        tools: [
          {
            function_declarations: [
              {
                name: "requestExpertHelp",
                description: "Activates Expert Mode for complex robotics tasks.",
                parameters: {
                  type: "OBJECT",
                  properties: { task: { type: "STRING" } },
                  required: ["task"]
                }
              }
            ]
          }
        ],
        system_instruction: {
          parts: [{ text: "You are BrainBot. You are in LIVE mode. Respond naturally and keep it short." }]
        }
      }
    };
    console.log("[GeminiLive] Sending Setup...");
    this.googleWs?.send(JSON.stringify(setup));
  }

  public sendAudio(base64: string) {
    if (this.googleWs?.readyState !== WebSocket.OPEN) return;
    const realTimeInput = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "audio/pcm;rate=24000",
            data: base64
          }
        ]
      }
    };
    this.googleWs.send(JSON.stringify(realTimeInput));
  }

  public sendFrame(base64Image: string) {
    if (this.googleWs?.readyState !== WebSocket.OPEN) return;
    // Strip prefix if exists
    const data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const realTimeInput = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "image/jpeg",
            data: data
          }
        ]
      }
    };
    this.googleWs.send(JSON.stringify(realTimeInput));
  }

  private handleGoogleMessage(msg: any) {
    // Handle incoming audio from model
    if (msg.serverContent?.modelTurn?.parts) {
      for (const part of msg.serverContent.modelTurn.parts) {
        if (part.inlineData) {
          this.clientWs.send(JSON.stringify({
            type: "live_audio_response",
            payload: { base64: part.inlineData.data }
          }));
        }
      }
    }

    // Handle tool calls
    if (msg.serverContent?.toolCall?.functionCalls) {
      for (const call of msg.serverContent.toolCall.functionCalls) {
        console.log(`[GeminiLive] Tool Call: ${call.name}`, call.args);
        
        // Notify client about the handoff or tool execution
        this.clientWs.send(JSON.stringify({
          type: "live_tool_call",
          payload: { 
            name: call.name, 
            args: call.args,
            callId: call.id 
          }
        }));

        // Send tool response back to Google to continue the conversation if needed
        // (For expert handoff, we actually trigger the server-side reasoning)
        if (call.name === "requestExpertHelp") {
           this.onExpertHandoff(call.args.task);
        }
      }
    }
  }

  public disconnect() {
    this.googleWs?.close();
    this.googleWs = null;
  }
}
