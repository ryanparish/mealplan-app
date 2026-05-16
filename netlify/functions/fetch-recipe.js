exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const { url, system, max_tokens } = JSON.parse(event.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: { message: "ANTHROPIC_API_KEY not set" } }) };

    // Fetch the recipe page
    const pageRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MealPlanBot/1.0)" } });
    if (!pageRes.ok) throw new Error(`Could not fetch URL: ${pageRes.status}`);
    const html = await pageRes.text();

    // Strip HTML tags to get readable text (simple approach)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit to avoid token overflow

    // Call Claude with the page content
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: max_tokens || 2000,
        system,
        messages: [{ role: "user", content: `Extract the recipe from this page content:\n\n${text}` }],
      }),
    });
    const data = await response.json();
    return { statusCode: response.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: err.message } }) };
  }
};
