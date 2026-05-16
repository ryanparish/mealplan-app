const { createClient } = require("@supabase/supabase-js");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const { plan } = JSON.parse(event.body);
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
    const supabaseKey = (process.env.SUPABASE_KEY || "").trim();
    if (!supabaseUrl || !supabaseKey) return { statusCode: 500, body: JSON.stringify({ error: "Missing Supabase env vars" }) };

    const supabase = createClient(supabaseUrl, supabaseKey);
    const id = (plan.weekOf || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("meal_plans").upsert({ id, week_of: plan.weekOf, data: plan }, { onConflict: "id" });
    if (error) throw new Error(error.message);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    await supabase.from("meal_plans").delete().lt("created_at", threeMonthsAgo.toISOString());

    return { statusCode: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
