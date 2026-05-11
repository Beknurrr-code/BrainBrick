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
      this.sendSetup();
      this.clientWs.send(JSON.stringify({ type: "live_status", payload: { status: "Active" } }));
      
      // Keep alive ping every 30s
      const pingInterval = setInterval(() => {
        if (this.googleWs?.readyState === WebSocket.OPEN) {
          this.googleWs.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    this.googleWs.on("message", (data) => {
      const response = JSON.parse(data.toString());
      this.handleGoogleMessage(response);
    });

    this.googleWs.on("error", (err) => {
      console.error("[GeminiLive] Google WS Error:", err);
      this.clientWs.send(JSON.stringify({ type: "live_status", payload: { status: "Error" } }));
    });

    this.googleWs.on("close", () => {
      console.log("[GeminiLive] Google WS Closed");
      this.clientWs.send(JSON.stringify({ type: "live_status", payload: { status: "Disconnected" } }));
    });
  }

  private sendSetup() {
    const setup = {
      setup: {
        model: this.model,
        generation_config: {
          response_modalities: ["AUDIO"]
        },
        tools: [
          {
            function_declarations: [
              {
                name: "requestExpertHelp",
                description: "Activates Expert Mode for complex robotics tasks like navigation, finding objects, or precise movements. Use this when the user asks for a task that requires long-horizon planning or spatial reasoning.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    task: {
                      type: "STRING",
                      description: "The specific complex task to be performed by the Expert reasoning model."
                    }
                  },
                  required: ["task"]
                }
              },
              {
                name: "stopRobot",
                description: "Immediately stops all robot motors and actions in case of emergency or when requested.",
                parameters: { type: "OBJECT", properties: {} }
              }
            ]
          }
        ],
        system_instruction: {
          parts: [
            {
              text: "You are BrainBot, an advanced AI robot companion built with LEGO and powered by Gemini. You are currently in LIVE streaming mode. You can see through the robot's camera and hear through its microphone. Respond naturally and helpfully. \n\nIMPORTANT: If the user asks for a complex robotics task (e.g. 'go find the keys', 'park yourself', 'navigate to the kitchen'), you MUST call the 'requestExpertHelp' tool. This will hand over control to a specialized robotics reasoning model. \n\nKeep your live responses concise and friendly."
            }
          ]
        }
      }
    };
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
