import { useEffect } from "react";

const BREVO_ID = "69bcd78ccbba0db032059d91";

const BrevoChat = ({ visible = true }) => {
  // Load script once
  useEffect(() => {
    if (window.BrevoConversationsID) return; // already loaded

    window.BrevoConversationsID = BREVO_ID;
    window.BrevoConversations = window.BrevoConversations || function () {
      (window.BrevoConversations.q = window.BrevoConversations.q || []).push(arguments);
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://conversations-widget.brevo.com/brevo-conversations.js";
    document.head.appendChild(script);
  }, []);

  // Show / hide based on prop
  useEffect(() => {
    if (!window.BrevoConversations) return;
    window.BrevoConversations(visible ? "show" : "hide");
  }, [visible]);

  return null;
};

export default BrevoChat;
