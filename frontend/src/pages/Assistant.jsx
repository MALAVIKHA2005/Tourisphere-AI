import React, { useEffect, useRef, useState } from "react";
import { askAssistant, clearAssistantHistory, fetchAssistantHistory } from "../services/ragService";

const STARTER_PROMPTS = [
  "Suggest a cool hill station for a family trip",
  "Which destinations are good for solo adventure travel?",
  "What's the best time to visit Goa?",
  "Any luxury beach destinations?",
];

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchAssistantHistory().then((saved) => {
      setMessages(
        saved.map((m) => ({ role: m.role, content: m.content, sources: m.sources }))
      );
      setHistoryLoaded(true);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleClear = async () => {
    await clearAssistantHistory();
    setMessages([]);
  };

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    const result = await askAssistant(question, history);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: result.answer, sources: result.sources },
    ]);
    setLoading(false);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto flex flex-col">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 17 • RAG AI ASSISTANT
        </p>

        <h1 className="text-5xl font-bold mt-2">Ask Tourisphere</h1>

        <p className="text-gray-500 mt-4 mb-6 max-w-3xl">
          Answers are grounded in this platform's own real data -- retrieved
          from the curated catalogue (real climate, live budget, live Wikipedia
          popularity, real traveler reviews) before being handed to the model,
          not invented from general knowledge. If the real data doesn't cover
          your question, it'll say so instead of guessing.
        </p>

        <div className="bg-white rounded-2xl shadow-sm flex-1 flex flex-col max-w-3xl w-full min-h-[60vh]">

          {messages.length > 0 && (
            <div className="flex justify-end px-6 pt-4">
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear chat
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {historyLoaded && messages.length === 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-xs px-3 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all text-left"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                      : "bg-gray-50 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.sources?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.sources.map((s, si) => (
                        <span
                          key={si}
                          className="text-xs bg-white/70 text-gray-500 px-2 py-0.5 rounded-full"
                        >
                          📍 {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-400">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 p-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about a destination..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Send
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
