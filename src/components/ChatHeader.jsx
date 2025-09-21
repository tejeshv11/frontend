import React from "react";
import { MessageCircle, RotateCcw, Wifi, WifiOff } from "lucide-react";
import "./ChatHeader.scss";

const ChatHeader = ({
  sessionId,
  messageCount,
  onClearSession,
  connectionStatus,
  isStreaming,
}) => {
  const getStatusIcon = () => {
    if (isStreaming) {
      return <div className="status-indicator streaming" />;
    }

    if (connectionStatus === "connected") {
      return <Wifi className="status-icon connected" size={16} />;
    }

    return <WifiOff className="status-icon disconnected" size={16} />;
  };

  const getStatusText = () => {
    if (isStreaming) return "AI is typing...";
    if (connectionStatus === "connected") return "Connected";
    return "Disconnected";
  };

  return (
    <header className="chat-header">
      <div className="chat-header__left">
        <div className="chat-header__title">
          <MessageCircle size={24} />
          <h1>Voosh Chatbot</h1>
        </div>
        <div className="chat-header__subtitle">AI-powered news assistant</div>
      </div>

      <div className="chat-header__center">
        {sessionId && (
          <div className="session-info">
            <span className="session-id">
              Session: {sessionId.slice(0, 8)}...
            </span>
            <span className="message-count">{messageCount} messages</span>
          </div>
        )}
      </div>

      <div className="chat-header__right">
        <div className="connection-status">
          {getStatusIcon()}
          <span className="status-text">{getStatusText()}</span>
        </div>

        <button
          className="clear-button"
          onClick={onClearSession}
          title="Start new conversation"
        >
          <RotateCcw size={18} />
          New Chat
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
