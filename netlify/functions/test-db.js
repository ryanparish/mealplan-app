const { createClient } = require("@supabase/supabase-js");

exports.handler = async function (event, context) {
  try {
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
    let supabaseKey = (process.env.SUPABASE_KEY || "").trim();

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "error",
          message: "Missing env vars",
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
        }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try a simple select
    const { data, error } = await supabase
      .from("meal_plans")
      .select("id")
      .limit(1);

    if (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "supabase_error",
          error: error.message,
          code: error.code,
          urlUsed: supabaseUrl,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        message: "Connected to Supabase successfully!",
        rowCount: data.length,
        urlUsed: supabaseUrl,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "exception", error: err.message }),
    };
  }
};
