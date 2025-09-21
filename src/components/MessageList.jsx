import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { User, Bot, Clock, ExternalLink } from "lucide-react";
import Message from "./Message";
import "./MessageList.scss";

const MessageList = ({ messages, isLoading, isStreaming }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getMessageIcon = (role) => {
    if (role === "user") {
      return <User size={16} />;
    }
    return <Bot size={16} />;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    return format(new Date(timestamp), "HH:mm");
  };

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty" ref={containerRef}>
        <div className="empty-state">
          <Bot size={48} className="empty-state__icon" />
          <h3 className="empty-state__title">Welcome to Voosh Chatbot</h3>
          <p className="empty-state__description">
            Ask me anything about recent news and current events. I'll help you
            find relevant information from our news corpus.
          </p>
          <div className="empty-state__examples">
            <p className="examples-title">Try asking:</p>
            <ul className="examples-list">
              <li>"What's the latest news about technology?"</li>
              <li>"Tell me about recent developments in AI"</li>
              <li>"What happened in the world today?"</li>
            </ul>
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef}>
      {messages.map((message, index) => (
        <div key={message.id} className="message-wrapper">
          <div
            className={`message-container message-container--${message.role}`}
          >
            <div className="message-avatar">{getMessageIcon(message.role)}</div>

            <div className="message-content">
              <div className="message-header">
                <span className="message-role">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </span>
                <span className="message-timestamp">
                  <Clock size={12} />
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>

              <Message
                content={message.content}
                role={message.role}
                metadata={message.metadata}
                isStreaming={message.isStreaming}
              />

              {message.metadata?.context &&
                message.metadata.context.length > 0 && (
                  <div className="message-sources">
                    <p className="sources-title">Sources:</p>
                    <div className="sources-list">
                      {message.metadata.context
                        .slice(0, 3)
                        .map((source, idx) => (
                          <div key={idx} className="source-item">
                            <span className="source-title">
                              {source.metadata?.title || "News Article"}
                            </span>
                            <span className="source-source">
                              {source.metadata?.source || "Unknown Source"}
                            </span>
                            {source.metadata?.url && (
                              <a
                                href={source.metadata.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-link"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="message-wrapper">
          <div className="message-container message-container--assistant">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
