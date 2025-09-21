import React, { useEffect } from "react";
import { useChat } from "../hooks/useChat";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import "./ChatPage.scss";

const ChatPage = () => {
  const {
    messages,
    sessionId,
    isLoading,
    isStreaming,
    connectionStatus,
    sendMessage,
    sendStreamingMessage,
    sendSocketMessage,
    clearSession,
    getConnectionStatus,
  } = useChat();

  const connectionInfo = getConnectionStatus();

  // Auto-create session on mount
  useEffect(() => {
    if (!sessionId && messages.length === 0) {
      // Don't auto-create session, let user start conversation
    }
  }, [sessionId, messages.length]);

  const handleSendMessage = (message) => {
    sendMessage(message);
  };

  const handleSendStreamingMessage = (message) => {
    sendStreamingMessage(message);
  };

  const handleSendSocketMessage = (message) => {
    sendSocketMessage(message);
  };

  const handleClearSession = () => {
    clearSession();
  };

  return (
    <div className="chat-page">
      <ChatHeader
        sessionId={sessionId}
        messageCount={messages.length}
        onClearSession={handleClearSession}
        connectionStatus={connectionStatus}
        isStreaming={isStreaming}
      />

      <main className="chat-main">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
        />
      </main>

      <ChatInput
        onSendMessage={handleSendMessage}
        onSendStreamingMessage={handleSendStreamingMessage}
        onSendSocketMessage={handleSendSocketMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
        disabled={
          !connectionInfo.isConnected && connectionStatus !== "disconnected"
        }
      />
    </div>
  );
};

export default ChatPage;
