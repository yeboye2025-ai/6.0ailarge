import { useState } from "react";

export default function DeepChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: userText,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.text || "我在这儿。" },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "好像有点问题，但我还在你这边。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>深度对话</h2>

      <div style={{ minHeight: 300, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <b>{m.role === "user" ? "你：" : "AI："}</b>
            <span>{m.text}</span>
          </div>
        ))}
        {loading && <div>AI 正在思考中…</div>}
      </div>

      <div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="把你的想法慢慢写下来…"
          style={{ width: "100%", height: 80 }}
        />
        <button onClick={sendMessage} style={{ marginTop: 8 }}>
          发送
        </button>
      </div>
    </div>
  );
}
