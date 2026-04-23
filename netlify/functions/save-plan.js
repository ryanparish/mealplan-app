const { createClient } = require("@supabase/supabase-js");

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

    const supabase = createClient(supabaseUrl, supabaseKey);
    const id = plan.weekOf.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const { error } = await supabase
      .from("meal_plans")
      .upsert({ id, week_of: plan.weekOf, data: plan });

    if (error) throw new Error(error.message);

    // Clean up plans older than 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    await supabase
      .from("meal_plans")
      .delete()
      .lt("created_at", threeMonthsAgo.toISOString());

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
