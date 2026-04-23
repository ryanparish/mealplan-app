exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { plan } = JSON.parse(event.body);
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Supabase environment variables not set" }),
      };
    }

    // Use week_of as the unique ID, slugified
    const id = plan.weekOf.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const response = await fetch(`${supabaseUrl}/rest/v1/meal_plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ id, week_of: plan.weekOf, data: plan }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Supabase error: ${err}`);
    }

    // Clean up plans older than 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    await fetch(`${supabaseUrl}/rest/v1/meal_plans?created_at=lt.${threeMonthsAgo.toISOString()}`, {
      method: "DELETE",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, id }),
    };
  } catch (err) {
    console.error("save-plan error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
