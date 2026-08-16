exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let text = "";
  try {
    const body = JSON.parse(event.body || "{}");
    text = (body.text || "").trim();
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Bad request" }) };
  }

  if (!text) {
    return {
      statusCode: 200,
      body: JSON.stringify({ reflection: "Nothing came through — that's okay too." })
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing API key on the server." })
    };
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
      return {
        statusCode: 200,
        body: JSON.stringify({ reflection: data.content[0].text.trim() })
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ reflection: "I'm here, but the words didn't quite come through this time. Try once more?" })
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Couldn't reach the reflection service." })
    };
  }
};

