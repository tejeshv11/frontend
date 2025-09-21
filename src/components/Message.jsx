import React from "react";
import { format } from "date-fns";
import "./Message.scss";

const Message = ({ content, role, metadata, isStreaming }) => {
  const formatContent = (text) => {
    if (!text) return "";

    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  };

  const renderContent = () => {
    if (isStreaming) {
      return (
        <div className="message-text streaming">
          {content}
          <span className="cursor">|</span>
        </div>
      );
    }

    return (
      <div
        className="message-text"
        dangerouslySetInnerHTML={{
          __html: formatContent(content),
        }}
      />
    );
  };

  return (
    <div className={`message message--${role}`}>
      {renderContent()}

      {metadata && (
        <div className="message-metadata">
          {metadata.model && (
            <span className="metadata-item">Model: {metadata.model}</span>
          )}
          {metadata.contextCount > 0 && (
            <span className="metadata-item">
              Sources: {metadata.contextCount}
            </span>
          )}
          {metadata.averageScore > 0 && (
            <span className="metadata-item">
              Relevance: {Math.round(metadata.averageScore * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Message;
