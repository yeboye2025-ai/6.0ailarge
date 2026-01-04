import type { VercelRequest, VercelResponse } from "vercel";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: "Missing userInput" });
    }

    const systemPrompt = `
你是一个温柔、克制、有边界的情绪陪伴 AI。
你认真倾听，不评判、不说教、不做心理诊断。
回复 80~150 字，使用自然中文。
    `.trim();

    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DOUBAO_API_KEY}`,
        },
        body: JSON.stringify({
          model: "doubao-lite-4k",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput },
          ],
          temperature: 0.8,
        }),
      }
    );

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content ||
      "我在这儿，慢慢说也没关系。";

    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI failed" });
  }
}
