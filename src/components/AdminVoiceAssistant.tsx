"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

export default function AdminVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [rawTranscript, setRawTranscript] = useState("");
  const [correctedTranscript, setCorrectedTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pathname = usePathname();

  // Only show on admin pages
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "es-ES";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          let finalTranscript = "";

          // Only process from the last result to avoid duplicates
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript = transcript; // Don't accumulate interim
            }
          }

          // Only update with final transcript to avoid repetitions
          if (finalTranscript) {
            setRawTranscript((prev) => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setError(`Error de reconocimiento: ${event.error}`);
          setIsRecording(false);
        };

        recognition.onend = () => {
          if (isRecording) {
            recognition.start();
          }
        };

        recognitionRef.current = recognition;
      } else {
        setError("Tu navegador no soporta reconocimiento de voz");
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    if (recognitionRef.current) {
      setRawTranscript("");
      setCorrectedTranscript("");
      setError(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const processCommand = async (transcriptToProcess?: string) => {
    // Use the provided transcript or the current rawTranscript
    const commandText = transcriptToProcess || rawTranscript.trim();

    console.log("[Frontend] processCommand called with:", {
      transcriptToProcess,
      rawTranscript,
      commandText,
    });

    if (!commandText) {
      setError("No se detectó ningún comando");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const requestBody = { command: commandText };
      console.log("[Frontend] Sending request with body:", requestBody);

      // Send the raw transcript to backend
      // Gemini will correct and process it
      const response = await fetch("/api/admin/voice-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      console.log("[Frontend] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error al procesar el comando de voz"
        );
      }

      const data = await response.json();

      // Show the corrected transcript if available
      if (data.correctedCommand) {
        setCorrectedTranscript(data.correctedCommand);
      }

      // Add user message with the command that was sent
      const userMessage: Message = {
        role: "user",
        content: commandText,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "Comando procesado exitosamente",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Handle file download if applicable
      if (data.fileData && data.fileName && data.mimeType) {
        // Convert base64 to blob and download
        const byteCharacters = atob(data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.mimeType });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Clear transcripts after a delay
      setTimeout(() => {
        setRawTranscript("");
        setCorrectedTranscript("");
      }, 3000);
    } catch (err) {
      console.error("Error processing command:", err);
      setError(
        err instanceof Error ? err.message : "Error al procesar el comando"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAdminPage) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          aria-label="Abrir asistente de voz"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>
      )}

      {/* Assistant panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
              <h3 className="font-semibold">Asistente de Voz Admin</h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                if (isRecording) stopRecording();
              }}
              className="hover:bg-white/20 rounded-lg p-1 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && !isProcessing && (
              <div className="text-center text-gray-500 text-sm mt-8">
                <p className="mb-4 font-medium">
                  Presiona el micrófono y habla tu comando
                </p>
                <div className="bg-white rounded-lg p-4 text-left space-y-2 text-xs">
                  <p className="font-semibold text-emerald-700">Ejemplos:</p>
                  <p>💊 &quot;Genera reporte de alertas en PDF&quot;</p>
                  <p>📋 &quot;Exporta bitácora a Excel&quot;</p>
                  <p>👥 &quot;Dame reporte de clientes&quot;</p>
                  <p>🧾 &quot;Quiero reporte de facturas&quot;</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Procesando con Gemini...
                </p>
              </div>
            )}
          </div>

          {/* Raw transcript display */}
          {rawTranscript && (
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
              <p className="text-xs text-blue-800 font-medium mb-1">
                🎙️ Transcripción en tiempo real:
              </p>
              <p className="text-sm text-gray-800">{rawTranscript}</p>
            </div>
          )}

          {/* Corrected transcript display */}
          {correctedTranscript && (
            <div className="px-4 py-3 bg-green-50 border-t border-green-200">
              <p className="text-xs text-green-800 font-medium mb-1">
                ✓ Gemini corrigió a:
              </p>
              <p className="text-sm text-gray-800 font-medium">
                {correctedTranscript}
              </p>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <p className="text-xs text-red-800 font-medium">
                  Escuchando... Di tu comando y presiona &quot;Procesar&quot;
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-600">❌ {error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              {!isRecording && !isProcessing ? (
                <button
                  onClick={startRecording}
                  className="flex-1 bg-emerald-600 text-white rounded-lg py-3 font-medium hover:bg-emerald-700 active:bg-emerald-800 transition flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                  Iniciar Grabación
                </button>
              ) : isRecording ? (
                <>
                  <button
                    onClick={stopRecording}
                    className="flex-1 bg-red-600 text-white rounded-lg py-3 font-medium hover:bg-red-700 active:bg-red-800 transition flex items-center justify-center gap-2"
                  >
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                    Detener
                  </button>
                  <button
                    onClick={() => {
                      // Save transcript before stopping
                      const currentTranscript = rawTranscript.trim();
                      stopRecording();
                      // Pass the saved transcript to processCommand
                      processCommand(currentTranscript);
                    }}
                    disabled={!rawTranscript.trim()}
                    className="flex-1 bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 active:bg-green-800 transition disabled:opacity-50"
                  >
                    Procesar
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="flex-1 bg-gray-400 text-white rounded-lg py-3 font-medium cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Procesando...
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
