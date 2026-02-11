import { useEffect, useRef, useState } from "react";

export function useVoiceSearch(onTranscriptChange?: (text: string) => void) {
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<string>("");

    useEffect(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceSupported(false);
            return;
        }

        setVoiceSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "es-ES";

        recognition.onstart = () => {
            console.log("[Voice] Iniciando escucha...");
            setIsListening(true);
            setError(null);
            setTranscript("");
            transcriptRef.current = "";
        };

        recognition.onresult = (event: any) => {
            console.log("[Voice] Evento result:", event.results.length);
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPart = event.results[i][0].transcript;
                console.log(`[Voice] Part ${i}: "${transcriptPart}" (final: ${event.results[i].isFinal})`);

                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPart + " ";
                } else {
                    interimTranscript += transcriptPart;
                }
            }

            const combined = (finalTranscript + interimTranscript).trim();
            transcriptRef.current = combined;

            console.log("[Voice] Transcript actualizado:", combined);
            setTranscript(combined);
            onTranscriptChange?.(combined);
        };

        recognition.onerror = (event: any) => {
            console.error("[Voice] Error:", event.error);
            let errorMsg = "Error en reconocimiento de voz";
            if (event.error === "network") {
                errorMsg = "Error de red, verifica tu conexión";
            } else if (event.error === "no-speech") {
                errorMsg = "No se detectó voz, intenta de nuevo";
            } else if (event.error === "not-allowed") {
                errorMsg = "El navegador necesita permiso para usar el micrófono";
            } else if (event.error === "service-not-allowed") {
                errorMsg = "Servicio de voz no disponible";
            }
            setError(errorMsg);
            setIsListening(false);
        };

        recognition.onend = () => {
            console.log("[Voice] Finalizando escucha");
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onTranscriptChange]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const clearTranscript = () => {
        setTranscript("");
        setError(null);
    };

    return {
        isListening,
        voiceSupported,
        transcript,
        error,
        startListening,
        stopListening,
        toggleListening,
        clearTranscript,
    };
}
