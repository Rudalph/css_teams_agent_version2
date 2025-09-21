"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, MessageSquare, Volume2 } from "lucide-react";

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("SpeechRecognition is not supported in this browser. Use Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      sendQuestion(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (!isListening) {
      recognitionRef.current.start();
      setIsListening(true);
      setAnswer("");
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const sendQuestion = async (text) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });

      const data = await res.json();
      if (data.answer) {
        setAnswer(data.answer);
        speakAnswer(data.answer);
      } else if (data.error) {
        setAnswer("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      setAnswer("Error connecting to backend.");
    } finally {
      setLoading(false);
      setIsListening(false);
    }
  };

  const speakAnswer = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Voice Assistant</h1>
            <p className="text-gray-600">Click the microphone to start speaking</p>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={toggleListening}
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-200 ${
                isListening
                  ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                  : "bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <div className="mt-3">
              <span className={`text-sm font-medium ${isListening ? "text-red-600" : "text-gray-600"}`}>
                {isListening ? "Listening..." : "Click to speak"}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={18} className="text-blue-600" />
                <h3 className="font-medium text-gray-800">Your Question</h3>
              </div>
              <p className="text-gray-700 min-h-[24px]">
                {question || "Your question will appear here..."}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={18} className="text-blue-600" />
                <h3 className="font-medium text-gray-800">Assistant Answer</h3>
              </div>
              <p className="text-gray-700 min-h-[24px] leading-relaxed">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                    Thinking...
                  </span>
                ) : (
                  answer || "The answer will appear here..."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}