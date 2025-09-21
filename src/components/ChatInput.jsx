import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Loader } from "lucide-react";
import "./ChatInput.scss";

const ChatInput = ({
  onSendMessage,
  onSendStreamingMessage,
  onSendSocketMessage,
  isLoading,
  isStreaming,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [inputMode, setInputMode] = useState("regular"); // 'regular', 'streaming', 'socket'
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading || isStreaming || disabled) return;

    const messageText = message.trim();
    setMessage("");

    switch (inputMode) {
      case "streaming":
        onSendStreamingMessage(messageText);
        break;
      case "socket":
        onSendSocketMessage(messageText);
        break;
      default:
        onSendMessage(messageText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        // Here you would typically send the audio to a speech-to-text service
        // For now, we'll just show a placeholder
        console.log("Audio recorded:", audioBlob);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
  };

  const isDisabled = isLoading || isStreaming || disabled;

  return (
    <div className="chat-input">
      <form onSubmit={handleSubmit} className="chat-input__form">
        <div className="chat-input__container">
          <div className="input-modes">
            <button
              type="button"
              className={`mode-button ${
                inputMode === "regular" ? "active" : ""
              }`}
              onClick={() => handleModeChange("regular")}
              disabled={isDisabled}
              title="Regular API"
            >
              API
            </button>
            <button
              type="button"
              className={`mode-button ${
                inputMode === "streaming" ? "active" : ""
              }`}
              onClick={() => handleModeChange("streaming")}
              disabled={isDisabled}
              title="Streaming Response"
            >
              Stream
            </button>
            <button
              type="button"
              className={`mode-button ${
                inputMode === "socket" ? "active" : ""
              }`}
              onClick={() => handleModeChange("socket")}
              disabled={isDisabled}
              title="Socket.IO"
            >
              Socket
            </button>
          </div>

          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDisabled
                  ? isStreaming
                    ? "AI is responding..."
                    : "Please wait..."
                  : "Type your message..."
              }
              disabled={isDisabled}
              className="message-textarea"
              rows={1}
              maxLength={1000}
            />

            <div className="input-actions">
              <button
                type="button"
                className={`voice-button ${isRecording ? "recording" : ""}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isDisabled}
                title={isRecording ? "Stop recording" : "Start voice recording"}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                type="submit"
                disabled={!message.trim() || isDisabled}
                className="send-button"
                title="Send message"
              >
                {isLoading || isStreaming ? (
                  <Loader size={18} className="spinning" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="input-footer">
        <div className="character-count">{message.length}/1000</div>
        <div className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
