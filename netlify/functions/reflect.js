export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  let text = "";
  try {
    const body = await req.json();
    text = (body.text || "").trim();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!text) {
    return new Response(JSON.stringify({ reflection: "Nothing came through — that's okay too." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key on the server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const systemPrompt =
    "You are a quiet, warm witness. Someone has just spent sixty seconds " +
    "emptying their mind onto the page — a raw brain dump, maybe messy. " +
    "Reflect it back to them in 2-4 short sentences. Name what you notice: " +
    "the feeling underneath, the thread running through it, what seems to be " +
    "asking for attention. Do not give advice. Do not fix. Do not add " +
    "spiritual or clinical language. Just witness them clearly and gently, " +
    "the way a trusted friend would say 'here's what I heard.' Speak directly " +
    "to them as 'you.'";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: text }]
      })
    });

    const data = await response.json();

    if (data && data.content && data.content[0] && data.content[0].text) {
      return new Response(JSON.stringify({ reflection: data.content[0].text.trim() }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ reflection: "I'm here, but the words didn't quite come through this time. Try once more?" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "Couldn't reach the reflection service." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
