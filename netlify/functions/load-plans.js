const { createClient } = require("@supabase/supabase-js");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Supabase environment variables not set" }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: plans, error } = await supabase
      .from("meal_plans")
      .select("id, week_of, created_at, data")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ plans }),
    };
  } catch (err) {
    console.error("load-plans error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
