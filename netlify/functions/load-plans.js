const { createClient } = require("@supabase/supabase-js");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method not allowed" };
  try {
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
    const supabaseKey = (process.env.SUPABASE_KEY || "").trim();
    if (!supabaseUrl || !supabaseKey) return { statusCode: 500, body: JSON.stringify({ error: "Missing Supabase env vars" }) };

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: plans, error } = await supabase.from("meal_plans").select("id, week_of, created_at, data").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return { statusCode: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ plans: plans || [] }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
