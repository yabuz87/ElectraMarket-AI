import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { useProductData } from "../store/useProductStore";
import { useAuthStore } from "../store/useAuthStore";
import "./FloatingChat.css";

export default function FloatingChat() {
  const assistant = useProductData((state) => state.assistant);
  const fetchProductById = useProductData((state) => state.fetchProductById);
  const authUser = useAuthStore((state) => state.authUser);
  const addToCart = useAuthStore((state) => state.addToCart);
  const cart = useAuthStore((state) => state.cart);
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", from: "bot", text: "Hi! How can I help you shop today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const addMessage = (from, text) => {
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-${current.length}`, from, text },
    ]);
  };

  const handleAction = async (data) => {
    if (data.action === "addToCart") {
      if (!authUser) {
        addMessage("bot", "Please log in first, then I can add that item.");
        navigate("/login");
        return;
      }

      const product = await fetchProductById(data.productId);
      if (!product) {
        addMessage("bot", "I couldn't find that product.");
        return;
      }
      addToCart(product, data.quantity);
      addMessage("bot", `${product.name} was added to your cart.`);
      return;
    }

    if (data.action === "checkoutOrder") {
      if (!authUser) {
        addMessage("bot", "Please log in before checking out.");
        navigate("/login");
        return;
      }
      if (!cart.length) {
        addMessage("bot", "Your cart is empty. Add a product first.");
        return;
      }
      sessionStorage.setItem(
        "assistantCheckout",
        JSON.stringify({
          shippingAddress: data.shippingAddress,
          shippingOption: data.shippingOption,
        })
      );
      addMessage("bot", "I opened checkout and prepared your shipping details.");
      navigate("/checkout");
    }
  };

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    addMessage("user", userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const data = await assistant(userMessage);
      if (data.action) await handleAction(data);
      else addMessage("bot", data.reply || "I couldn't understand that request.");
    } catch {
      addMessage("bot", "The assistant is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setChatOpen((open) => !open)}
        aria-label={chatOpen ? "Close customer assistant" : "Open customer assistant"}
        aria-expanded={chatOpen}
        className="chat-icon rounded-circle"
        title="Customer assistant"
      >
        <MessageCircle aria-hidden="true" size={26} />
      </button>

      {chatOpen && (
        <section className="chat-window" role="dialog" aria-label="Customer assistant">
          <header className="chat-header">
            <strong>Customer Assistant</strong>
            <button
              aria-label="Close chat"
              className="btn btn-sm btn-light"
              onClick={() => setChatOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </header>

          <div className="chat-messages" ref={chatRef} aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.from === "user" ? "message-user" : "message-bot"}
              >
                <span>{message.text}</span>
              </div>
            ))}
            {isLoading && (
              <div className="message-bot">
                <span>Typing...</span>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              aria-label="Type your message"
              placeholder="Type a message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              autoFocus
              disabled={isLoading}
              className="form-control"
            />
            <button
              onClick={sendMessage}
              aria-label="Send message"
              disabled={isLoading || !input.trim()}
              className="btn btn-primary"
            >
              <Send aria-hidden="true" size={18} />
              <span className="visually-hidden">Send</span>
            </button>
          </div>
        </section>
      )}
    </>
  );
}
