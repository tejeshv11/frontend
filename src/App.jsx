import React from "react";
import { Routes, Route } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import "./styles/App.scss";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App;
