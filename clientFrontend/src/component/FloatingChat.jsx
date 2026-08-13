import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { useProductData } from "../store/useProductStore";
import "./FloatingChat.css";

export default function FloatingChat() {
  const assistant = useProductData((state) => state.assistant);
  const applyAssistantLike = useProductData((state) => state.applyAssistantLike);
  const navigate = useNavigate();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", from: "bot", text: "Hi! I can help you discover listings, compare products, or find an owner's contact details." },
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

  const addMessage = (from, text, extra = {}) => {
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-${current.length}`, from, text, ...extra },
    ]);
  };

  const handleAction = async (action) => {
    if (action.type === "openProduct") {
      navigate(`/product/${action.productId}`);
      return;
    }

    if (action.type === "syncProductLike") {
      applyAssistantLike(action);
      return;
    }

    if (action.type === "commentCreated") {
      window.dispatchEvent(
        new CustomEvent("assistant:product-comment-created", {
          detail: { productId: action.productId, commentId: action.commentId },
        })
      );
      return;
    }

  };

  const sendMessage = async (retryPrompt = "") => {
    const override = typeof retryPrompt === "string" ? retryPrompt : "";
    const userMessage = (override || input).trim();
    if (!userMessage || isLoading) return;

    addMessage("user", userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((message) => message.id !== "welcome" && !message.isError)
        .slice(-8)
        .map((message) => ({
          role: message.from === "user" ? "user" : "assistant",
          content: message.text,
        }));
      const data = await assistant(userMessage, history, {
        pathname: location.pathname,
      });
      addMessage(
        "bot",
        data.reply || "I couldn't understand that request.",
        {
          products: Array.isArray(data.products) ? data.products : [],
          sources: Array.isArray(data.sources) ? data.sources : [],
        }
      );
      for (const action of Array.isArray(data.actions) ? data.actions : []) {
        await handleAction(action);
      }
    } catch (error) {
      const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
      const rateLimited = error.response?.status === 429;
      addMessage(
        "bot",
        timedOut
          ? "That response took too long. You can retry it without losing this conversation."
          : rateLimited
            ? "The AI provider is busy right now. Please wait a moment and retry."
            : error.response?.data?.message ||
              "I couldn't reach the assistant service. Make sure the backend is running, then retry.",
        { isError: true, retryPrompt: userMessage }
      );
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
                {message.retryPrompt && (
                  <button
                    type="button"
                    className="chat-retry"
                    disabled={isLoading}
                    onClick={() => sendMessage(message.retryPrompt)}
                  >
                    <RotateCcw size={14} /> Retry
                  </button>
                )}
                {message.products?.length > 0 && (
                  <div className="chat-products" aria-label="Suggested products">
                    {message.products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        <strong>{product.name}</strong>
                        <small>{Number(product.price).toFixed(2)} ETB</small>
                      </button>
                    ))}
                  </div>
                )}
                {message.sources?.length > 0 && (
                  <small className="chat-sources">
                    Sources:{" "}
                    {message.sources.map((source, index) => (
                      <span key={`${source.url || source.productId || source.title}-${index}`}>
                        {index > 0 && ", "}
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                        ) : source.productId ? (
                          <button type="button" onClick={() => navigate(`/product/${source.productId}`)}>{source.title}</button>
                        ) : source.title}
                      </span>
                    ))}
                  </small>
                )}
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
