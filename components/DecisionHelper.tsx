import { useState } from "react";

export default function DecisionHelper() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: `我现在在做选择，请帮我理清思路：${question}`,
        }),
      });

      const data = await res.json();
      setAnswer(data.text || "也许可以再等等看。");
    } catch (e) {
      setAnswer("现在有点卡住了，但你的问题是重要的。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>决定辅助</h2>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="你正在纠结什么？"
        style={{ width: "100%", height: 80 }}
      />

      <button onClick={askAI} style={{ marginTop: 8 }}>
        帮我想想
      </button>

      {loading && <div style={{ marginTop: 12 }}>AI 正在整理思路…</div>}

      {answer && (
        <div style={{ marginTop: 12 }}>
          <b>AI：</b>
          <div>{answer}</div>
        </div>
      )}
    </div>
  );
}
