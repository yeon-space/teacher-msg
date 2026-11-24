// 선생님 말투 변환기 — Gemini 호출 서버 함수
// API 키는 여기(서버)에서만 쓰이고, 화면 코드에는 절대 드러나지 않아요.
// Vercel 환경 변수:
//   GEMINI_API_KEY  (필수) 구글 AI 스튜디오에서 받은 키
//   APP_PASSWORD    (선택) 넣으면 이 비밀번호를 아는 사람만 쓸 수 있어요
//   GEMINI_MODEL    (선택) 기본값 gemini-3.8-flash

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았어요." });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { prompt, password } = body || {};

  const appPw = process.env.APP_PASSWORD;
  if (appPw && password !== appPw) {
    return res.status(401).json({ error: "비밀번호가 맞지 않아요." });
  }

  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 12000) {
    return res.status(400).json({ error: "입력이 비어 있거나 너무 길어요." });
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  // Gemini 호출 (25초 넘으면 중단). 생각 단계는 짧게(low) 해서 빨리 답하게 함.
  async function callGemini(withThinking) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const generationConfig = { temperature: 1.0, maxOutputTokens: 2048 };
    if (withThinking) generationConfig.thinkingConfig = { thinkingLevel: "low" };
    try {
      const r = await fetch(url, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig })
      });
      const data = await r.json().catch(() => ({}));
      return { r, data };
    } finally { clearTimeout(t); }
  }

  try {
    let { r, data } = await callGemini(true);
    if (r.status === 400) ({ r, data } = await callGemini(false)); // 설정이 안 맞으면 기본값으로 재시도
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "";
      console.error("Gemini error", r.status, msg);
      return res.status(r.status === 429 ? 429 : 502).json({ error: `AI 응답 실패 (${r.status}) ${msg.slice(0, 160)}` });
    }
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join("").trim();
    if (!text) return res.status(502).json({ error: "AI가 빈 답을 보냈어요." });
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    if (e && e.name === "AbortError") return res.status(504).json({ error: "AI 응답이 너무 늦어요 (25초 초과)" });
    return res.status(500).json({ error: "서버 오류: " + (e && e.message || "") });
  }
};
