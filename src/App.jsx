import React, { useState, useEffect, useRef } from "react";
import { MEALS_PROFILE, GROCERY_PROFILE, SWAP_PROFILE } from "./profile.js";

const G = "#2d4a3e", CREAM = "#f7f4ef", BD = "#e8e2d8", GOLD = "#856404";

// ── Persist hook ──────────────────────────────────────────────────────────────
function usePersist(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
    catch { return def; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const iv = useRef(null);
  const t0 = useRef(null);
  const start = () => { t0.current = Date.now() - elapsed * 1000; setRunning(true); };
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setElapsed(0); };
  useEffect(() => {
    if (running) { iv.current = setInterval(() => setElapsed(Math.floor((Date.now() - t0.current) / 1000)), 500); }
    else clearInterval(iv.current);
    return () => clearInterval(iv.current);
  }, [running]);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { running, elapsed, start, pause, reset, fmt };
}

// ── Small UI components ───────────────────────────────────────────────────────
function Toggle({ val, on }) {
  return (
    <div onClick={on} style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", background: val ? G : "#ccc", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: val ? 21 : 3, transition: "left .2s" }} />
    </div>
  );
}
function Card({ children, style = {} }) {
  return <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BD}`, overflow: "hidden", boxShadow: "0 1px 5px rgba(0,0,0,.04)", marginBottom: 12, ...style }}>{children}</div>;
}
function Sec({ title }) {
  return <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: "bold", color: "#bbb", letterSpacing: 2, textTransform: "uppercase", margin: "18px 0 7px", paddingLeft: 2 }}>{title}</div>;
}
function Bdg({ label }) {
  const fl = label.includes("⚡"), pr = label.includes("🧑"), hu = label.includes("Husband");
  return <span style={{ fontSize: 10, borderRadius: 20, padding: "2px 8px", fontFamily: "sans-serif", background: fl ? "#fff3cd" : pr ? "#e8f4f1" : hu ? "#eef4f1" : "#f0f0f0", color: fl ? GOLD : pr ? G : hu ? G : "#555" }}>{label}</span>;
}

// ── Cook Mode ─────────────────────────────────────────────────────────────────
function CookScreen({ meal, checked, togStep, ratings, setRat, notes, setNotes, onExit, onSaveTime }) {
  const timer = useTimer();
  const [showSave, setShowSave] = useState(false);
  const wl = useRef(null);

  useEffect(() => {
    navigator.wakeLock?.request("screen").then(l => { wl.current = l; }).catch(() => {});
    return () => { wl.current?.release(); };
  }, []);

  const handleExit = () => {
    if (timer.elapsed > 0 && !showSave) { setShowSave(true); }
    else onExit();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1a2e27", color: "#f5ede0", paddingBottom: 40 }}>
      <div style={{ background: "#0f1f1a", padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "#7a9e8e", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif" }}>🔆 Cook Mode</div>
          <div style={{ fontSize: 17, marginTop: 2 }}>{meal.name}</div>
        </div>
        <button onClick={handleExit} style={{ background: "#2d4a3e", border: "none", color: "#f5ede0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "sans-serif", fontSize: 13 }}>✕ Exit</button>
      </div>

      {/* Timer */}
      <div style={{ margin: "14px 14px 0", background: "#0f2a22", borderRadius: 12, padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontFamily: "sans-serif", color: "#7a9e8e", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Cook Timer</div>
        <div style={{ fontSize: 46, fontFamily: "monospace", color: timer.running ? "#a8d8a8" : "#f5ede0", letterSpacing: 2, marginBottom: 8 }}>{timer.fmt(timer.elapsed)}</div>
        <div style={{ fontSize: 12, fontFamily: "sans-serif", color: "#7a9e8e", marginBottom: 12 }}>
          Estimated: <b style={{ color: "#f5ede0" }}>{meal.estMin} min</b>
          {timer.elapsed > 0 && <span style={{ marginLeft: 10, color: timer.elapsed / 60 > meal.estMin + 5 ? "#ef9a9a" : "#a8d8a8" }}>
            {Math.abs(Math.round(timer.elapsed / 60 - meal.estMin))} min {timer.elapsed / 60 > meal.estMin ? "over" : "under"}
          </span>}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {!timer.running
            ? <button onClick={timer.start} style={{ background: G, color: "#f5ede0", border: "none", borderRadius: 8, padding: "10px 22px", fontFamily: "sans-serif", fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>{timer.elapsed === 0 ? "▶ Start" : "▶ Resume"}</button>
            : <button onClick={timer.pause} style={{ background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontFamily: "sans-serif", fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>⏸ Pause</button>}
          {timer.elapsed > 0 && <button onClick={timer.reset} style={{ background: "transparent", color: "#7a9e8e", border: "1px solid #2d5a48", borderRadius: 8, padding: "10px 16px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer" }}>↺</button>}
        </div>
      </div>

      {showSave && (
        <div style={{ margin: "12px 14px 0", background: "#0f2a22", borderRadius: 12, padding: "14px", border: "1px solid #2d5a48" }}>
          <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#f0e8d8", marginBottom: 10 }}>
            Cooked for <b>{timer.fmt(timer.elapsed)}</b> (est. {meal.estMin} min). Save?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onSaveTime(meal.id, timer.elapsed); onExit(); }} style={{ flex: 1, background: G, color: "#f5ede0", border: "none", borderRadius: 8, padding: "9px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer", fontWeight: "bold" }}>✅ Save & Exit</button>
            <button onClick={onExit} style={{ flex: 1, background: "transparent", color: "#7a9e8e", border: "1px solid #2d5a48", borderRadius: 8, padding: "9px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer" }}>Skip</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 14px" }}>
        <div style={{ background: "#0f2a22", borderRadius: 12, padding: "13px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontFamily: "sans-serif", color: "#a8c5b5", marginBottom: 7, textTransform: "uppercase", letterSpacing: 1 }}>Ingredients</div>
          {(meal.ingredients || []).map((g, i) => <div key={i} style={{ fontSize: 15, fontFamily: "sans-serif", color: g.startsWith("—") ? "#7a9e8e" : "#e8d8c0", marginBottom: 5, fontStyle: g.startsWith("—") ? "italic" : "normal" }}>{g}</div>)}
        </div>
        <div style={{ fontSize: 10, fontFamily: "sans-serif", color: "#a8c5b5", marginBottom: 9, textTransform: "uppercase", letterSpacing: 1 }}>Steps — tap to check off</div>
        {(meal.steps || []).map((step, i) => {
          const key = `${meal.id}-${i}`, done = checked[key], isNote = step.startsWith("💡") || step.startsWith("🐌");
          return (
            <div key={i} onClick={() => !isNote && togStep(meal.id, i)} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: done ? "#0f2a22" : "#1e3830", borderRadius: 10, padding: "13px 14px", marginBottom: 9, cursor: isNote ? "default" : "pointer", opacity: done ? 0.5 : 1, border: `1px solid ${done ? "#2d4a3e" : "#2d5a48"}` }}>
              {!isNote && <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: done ? "#4caf50" : "transparent", border: `2px solid ${done ? "#4caf50" : "#7a9e8e"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>{done ? "✓" : <span style={{ fontSize: 11, color: "#7a9e8e" }}>{i + 1}</span>}</div>}
              <div style={{ fontSize: 15, fontFamily: "sans-serif", color: isNote ? "#7a9e8e" : "#f0e8d8", lineHeight: 1.5, fontStyle: isNote ? "italic" : "normal" }}>{step}</div>
            </div>
          );
        })}
        <div style={{ background: "#0f2a22", borderRadius: 12, padding: "14px", marginTop: 6 }}>
          <div style={{ fontSize: 12, fontFamily: "sans-serif", color: "#a8c5b5", marginBottom: 9 }}>How was it?</div>
          <div style={{ display: "flex", gap: 7, marginBottom: 11 }}>
            {[["loved", "👍 Loved it"], ["okay", "😐 Okay"], ["disliked", "👎 Nope"]].map(([v, l]) => (
              <button key={v} onClick={() => setRat(meal.id, v)} style={{ flex: 1, padding: "9px 4px", border: `2px solid ${ratings[meal.id] === v ? "#4caf50" : "#2d5a48"}`, background: ratings[meal.id] === v ? "#1a4a30" : "transparent", borderRadius: 8, color: "#f0e8d8", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <textarea value={notes[meal.id] || ""} onChange={e => setNotes(p => ({ ...p, [meal.id]: e.target.value }))} placeholder="Notes for next time..." style={{ width: "100%", background: "#1e3830", border: "1px solid #2d5a48", borderRadius: 8, color: "#f0e8d8", fontFamily: "sans-serif", fontSize: 13, padding: "9px 11px", minHeight: 60, resize: "vertical", boxSizing: "border-box" }} />
        </div>
      </div>
    </div>
  );
}

// ── Generate tab ──────────────────────────────────────────────────────────────
function GenerateTab({ onPlanGenerated, plan, favs }) {
  const [form, setForm] = useState({
    date: "", prepday: "Sunday", ingredients: "", schedule: "", daughter: "", lastWeek: "", leftovers: "", extras: "", other: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Listen for "use this week again" prefill from history tab
  useEffect(() => {
    const handler = (e) => {
      setForm(p => ({
        ...p,
        other: `Repeat meals from week of ${e.detail.weekOf}: ${e.detail.hint}. Adjust as needed.`,
      }));
    };
    window.addEventListener("prefill-generate", handler);
    return () => window.removeEventListener("prefill-generate", handler);
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const callClaude = async (system, userMessage, maxTokens) => {
    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system,
        messages: [{ role: "user", content: userMessage }],
        max_tokens: maxTokens,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      const errMsg = data.error?.message || JSON.stringify(data.error) || JSON.stringify(data);
      throw new Error(`API returned ${res.status}: ${errMsg}`);
    }
    const text = data.content?.[0]?.text;
    if (!text) throw new Error("No response from Claude");
    // Robust JSON parsing
    try { return JSON.parse(text); } catch {}
    try { return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()); } catch {}
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Claude returned invalid JSON. Please try again.");
  };

  const generate = async () => {
    if (!form.date) { setError("Please enter the week start date."); return; }
    setError(""); setLoading(true);

    const favMealNames = (plan?.meals || [])
      .filter(m => (favs || {})[m.id])
      .map(m => m.name)
      .join(", ");

    const weekContext = `Week: ${form.date}. Prep day: ${form.prepday}.
Ingredients to use up: ${form.ingredients || "nothing special"}.
Scheduling: ${form.schedule || "normal week"}.
Daughter requests: ${form.daughter || "TBD"}.
Last week's meals (don't repeat): ${form.lastWeek || "not specified"}.
Leftovers in fridge: ${form.leftovers || "none"}.
Must include this week: ${form.mustInclude || "none"}.
Favorites to rotate in if possible: ${favMealNames || "none"}.
Other: ${form.other || "none"}.`;

    try {
      // Call 1: Generate meal plan
      setStatus("Step 1 of 2 — Creating your meal plan...");
      const mealPlan = await callClaude(
        MEALS_PROFILE,
        `Create a weekly meal plan for this week.\n\n${weekContext}`,
        4000
      );

      // Call 2: Generate grocery list based on the meals
      setStatus("Step 2 of 2 — Building your grocery list...");
      const mealSummary = (mealPlan.meals || []).map(m =>
        `${m.day}: ${m.name} — ingredients: ${(m.ingredients || []).join(", ")}`
      ).join("\n");

      const groceryResult = await callClaude(
        GROCERY_PROFILE,
        `Generate a grocery list for this week's meals:\n\n${mealSummary}\n\nExtra items needed: ${form.extras || "none"}.`,
        4000
      );

      const fullPlan = { ...mealPlan, ...groceryResult };
      onPlanGenerated(fullPlan);
      setStatus("");
    } catch (err) {
      setError(`Something went wrong: ${err.message}. Try again or check your API key in Netlify.`);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { k: "date", label: "Week start date *", ph: "e.g. Sunday, May 4, 2026", req: true },
    { k: "prepday", label: "Prep day", ph: "Sunday (default) or Saturday" },
    { k: "mustInclude", label: "Must include this week?", ph: "e.g. tacos, something with shrimp — or leave blank" },
    { k: "ingredients", label: "Ingredients to use up?", ph: "e.g. rotisserie chicken — or leave blank" },
    { k: "schedule", label: "Scheduling notes?", ph: "e.g. husband out Mon–Tue, busy Thursday" },
    { k: "daughter", label: "Daughter's breakfast & lunch requests?", ph: "e.g. waffles, quesadillas — or TBD" },
    { k: "lastWeek", label: "Last week's meals (to avoid repeats)", ph: "e.g. Tacos, Korean Beef, Salmon, Gyros, Turkey Skillet" },
    { k: "leftovers", label: "Leftovers in fridge to use up?", ph: "e.g. half a rotisserie chicken — or leave blank" },
    { k: "extras", label: "Extra one-off grocery items this week?", ph: "e.g. birthday cake ingredients, sunscreen" },
    { k: "other", label: "Anything else Claude should know?", ph: "e.g. trying a new cuisine, someone's birthday dinner" },
  ];

  const favMealNames = (plan?.meals || [])
    .filter(m => (favs || {})[m.id])
    .map(m => m.name);

  return (
    <div>
      <div style={{ background: "#eef4f1", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontFamily: "sans-serif", fontSize: 13, color: G, lineHeight: 1.6 }}>
        <b>Fill in your weekly details and tap Generate.</b> Claude will create your complete meal plan, recipes, and grocery list automatically!
      </div>

      {favMealNames.length > 0 && (
        <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 10, padding: "10px 13px", marginBottom: 13, fontFamily: "sans-serif", fontSize: 13, color: GOLD }}>
          ⭐ <b>Favorites from last week:</b> {favMealNames.join(", ")} — Claude will try to rotate these in.
        </div>
      )}

      {fields.map(f => (
        <div key={f.k} style={{ marginBottom: 11 }}>
          <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 5 }}>{f.label}</div>
          <textarea value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={{ width: "100%", background: "#fff", border: `1px solid ${BD}`, borderRadius: 8, fontFamily: "sans-serif", fontSize: 13, padding: "8px 10px", color: "#333", minHeight: 46, resize: "vertical", boxSizing: "border-box" }} />
        </div>
      ))}

      {error && <div style={{ background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 8, padding: "10px 12px", fontFamily: "sans-serif", fontSize: 13, color: "#c62828", marginBottom: 12 }}>{error}</div>}

      {status && (
        <div style={{ background: "#eef4f1", borderRadius: 8, padding: "12px 14px", fontFamily: "sans-serif", fontSize: 13, color: G, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 16, height: 16, border: `2px solid ${G}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          {status}
        </div>
      )}

      <button onClick={generate} disabled={loading} style={{ width: "100%", background: loading ? "#7a9e8e" : G, color: "#f5ede0", border: "none", borderRadius: 10, padding: "14px", fontFamily: "sans-serif", fontSize: 15, cursor: loading ? "default" : "pointer", fontWeight: "bold" }}>
        {loading ? "Generating..." : "✨ Generate This Week's Plan"}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
const DEF_SETTINGS = { leftoverTracker: true, budget: true, source: true, quickAdd: true, twoWeek: true };
const SET_LABELS = {
  leftoverTracker: ["Leftover Tracker", "Track what's in the fridge mid-week"],
  budget: ["Budget Estimate", "Rough weekly grocery cost"],
  source: ["Recipe Source URLs", "Link meals to original recipe sources"],
  quickAdd: ["Quick Grocery Add", "Add one-off items to the list"],
  twoWeek: ["Two-Week Meal Log", "Avoid repeating last week's meals"],
};
const LEFTOVER_OPTIONS = ["Taco meat", "Korean beef + rice", "Salmon + peppers + rice", "Turkey skillet", "Tzatziki", "Rotisserie chicken", "Cooked rice"];

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function savePlanToCloud(plan) {
  const res = await fetch("/.netlify/functions/save-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed"); }
  return res.json();
}

async function loadPlansFromCloud() {
  const res = await fetch("/.netlify/functions/load-plans");
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Load failed"); }
  const { plans } = await res.json();
  return plans;
}

export default function App() {
  const [tab, setTab] = useState("generate");
  const [plan, setPlan] = usePersist("mp_plan", null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [viewingPast, setViewingPast] = useState(null);
  const [syncStatus, setSyncStatus] = useState("");
  const [openMeal, setOpenMeal] = useState(null);
  const [openGrp, setOpenGrp] = useState(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [cook, setCook] = useState(false);
  const [cookId, setCookId] = useState(null);
  const [checked, setChecked] = useState({});
  const [ratings, setRatings] = usePersist("mp_ratings", {});
  const [notes, setNotes] = usePersist("mp_notes", {});
  const [sources, setSources] = usePersist("mp_sources", {});
  const [favs, setFavs] = usePersist("mp_favs", {});
  const [settings, setSettings] = usePersist("mp_settings", DEF_SETTINGS);
  const [lftovrs, setLftovrs] = usePersist("mp_leftovers", {});
  const [quickItems, setQuickItems] = usePersist("mp_quickitems", []);
  const [quickIn, setQuickIn] = useState("");
  const [cartChecked, setCartChecked] = usePersist("mp_cart", {});
  const [actualTimes, setActualTimes] = usePersist("mp_times", {});
  const [gCopied, setGCopied] = useState(false);
  const [swapping, setSwapping] = useState(null); // meal id being swapped
  const [swapInput, setSwapInput] = useState("");
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState("");

  const togStep = (id, j) => setChecked(p => ({ ...p, [`${id}-${j}`]: !p[`${id}-${j}`] }));
  const setRat = (id, v) => setRatings(p => ({ ...p, [id]: p[id] === v ? null : v }));
  const togFav = id => setFavs(p => ({ ...p, [id]: !p[id] }));
  const togLeft = item => setLftovrs(p => ({ ...p, [item]: !p[item] }));
  const togSet = k => setSettings(p => ({ ...p, [k]: !p[k] }));
  const addQuick = () => { if (quickIn.trim()) { setQuickItems(p => [...p, quickIn.trim()]); setQuickIn(""); } };
  const rmQuick = i => setQuickItems(p => p.filter((_, x) => x !== i));
  const togCart = key => setCartChecked(p => ({ ...p, [key]: !p[key] }));
  const clearCart = () => setCartChecked({});
  const saveTime = (id, secs) => setActualTimes(p => ({ ...p, [id]: [...(p[id] || []), secs] }));

  const swapMeal = async (mealId) => {
    setSwapLoading(true);
    setSwapError("");
    try {
      const mealToSwap = plan.meals.find(m => m.id === mealId);
      const otherMeals = plan.meals.filter(m => m.id !== mealId).map(m => m.name).join(", ");
      const prompt = `Replace this meal: ${mealToSwap.day} — ${mealToSwap.name}.
Other meals this week (do not repeat these): ${otherMeals}.
Reason for swap / craving: ${swapInput || "just want something different"}.
Keep the same day (${mealToSwap.day}) and id (${mealToSwap.id}).`;

      const res = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SWAP_PROFILE,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message || "API error");
      const text = data.content?.[0]?.text;
      if (!text) throw new Error("No response");

      let result;
      try { result = JSON.parse(text); } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) result = JSON.parse(match[0]);
        else throw new Error("Invalid JSON response");
      }

      // Update the plan with the new meal
      const updatedMeals = plan.meals.map(m => m.id === mealId ? result.meal : m);

      // Update prep steps if needed
      let updatedPrepSteps = [...(plan.prepSteps || [])];
      if (result.prepStepUpdate) {
        // Replace or add prep step for this meal
        const dayLabel = mealToSwap.name.toUpperCase();
        const existingIdx = updatedPrepSteps.findIndex(s => s.toUpperCase().includes(mealToSwap.name.toUpperCase()));
        if (result.prepStepUpdate.trim()) {
          if (existingIdx >= 0) updatedPrepSteps[existingIdx] = result.prepStepUpdate;
          else updatedPrepSteps.push(result.prepStepUpdate);
        } else {
          if (existingIdx >= 0) updatedPrepSteps.splice(existingIdx, 1);
        }
      }

      // Update lunch coverage if needed
      let updatedLunchCoverage = [...(plan.lunchCoverage || [])];
      if (result.lunchUpdate) {
        const lunchIdx = updatedLunchCoverage.findIndex(l => l.day === result.lunchUpdate.day);
        if (lunchIdx >= 0) updatedLunchCoverage[lunchIdx] = result.lunchUpdate;
      }

      const updatedPlan = {
        ...plan,
        meals: updatedMeals,
        prepSteps: updatedPrepSteps,
        lunchCoverage: updatedLunchCoverage,
      };

      setPlan(updatedPlan);
      setSwapping(null);
      setSwapInput("");

      // Save to cloud
      setSyncStatus("Saving...");
      try {
        await savePlanToCloud(updatedPlan);
        const plans = await loadPlansFromCloud();
        setHistory(plans);
        setSyncStatus("✅ Saved");
      } catch { setSyncStatus("⚠️ Saved locally only"); }
      setTimeout(() => setSyncStatus(""), 3000);

    } catch (err) {
      setSwapError(`Swap failed: ${err.message}. Try again.`);
    } finally {
      setSwapLoading(false);
    }
  };
  const fmtAvg = secs => `${Math.round(secs / 60)} min`;
  const cartCount = Object.values(cartChecked).filter(Boolean).length;
  const leftoverList = Object.entries(lftovrs).filter(([, v]) => v).map(([k]) => k);
  const favMeals = (plan?.meals || []).filter(m => favs[m.id]);

  // Load latest plan from cloud on mount
  useEffect(() => {
    loadPlansFromCloud().then(plans => {
      if (plans && plans.length > 0) {
        const latest = plans[0].data;
        setPlan(latest);
        setHistory(plans);
      }
    }).catch(() => {}); // Fail silently — localStorage fallback still works
  }, []);

  const handlePlanGenerated = async (newPlan) => {
    setPlan(newPlan);
    setCartChecked({});
    setChecked({});
    setTab("dinners");
    // Save to cloud
    setSyncStatus("Saving...");
    try {
      await savePlanToCloud(newPlan);
      const plans = await loadPlansFromCloud();
      setHistory(plans);
      setSyncStatus("✅ Saved");
    } catch (e) {
      setSyncStatus("⚠️ Saved locally only");
    }
    setTimeout(() => setSyncStatus(""), 3000);
  };

  const groceryText = () => {
    if (!plan) return "";
    let t = `GROCERY LIST — Week of ${plan.weekOf}\n\n`;
    Object.entries(plan.grocery || {}).forEach(([sec, items]) => {
      if (!items?.length) return;
      t += sec + "\n";
      items.forEach(it => { t += `• ${it.i} — ${it.q}${it.c ? " [Costco]" : ""}${it.s?.includes("🔁") ? " [Staple]" : ""}\n`; });
      t += "\n";
    });
    if (quickItems.length) { t += "➕ Added This Week\n"; quickItems.forEach(i => { t += `• ${i}\n`; }); }
    return t;
  };

  const cp = (text, set) => navigator.clipboard.writeText(text).then(() => { set(true); setTimeout(() => set(false), 2500); });
  const budgetBase = 265;
  const budgetTotal = budgetBase + quickItems.length * 5;

  if (cook && cookId && plan) {
    const m = plan.meals.find(x => x.id === cookId);
    return <CookScreen meal={m} checked={checked} togStep={togStep} ratings={ratings} setRat={setRat} notes={notes} setNotes={setNotes} onExit={() => { setCook(false); setCookId(null); }} onSaveTime={saveTime} />;
  }

  const TABS = ["generate", "dinners", "lunches", "groceries", "history", "settings"];
  const hasPlan = plan && plan.meals && plan.meals.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div style={{ background: G, color: "#f5ede0", padding: "20px 16px 14px", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#a8c5b5", marginBottom: 4 }}>
          {hasPlan ? `Week of ${plan.weekOf}` : "Family Meal Planner"}
        </div>
        <h1 style={{ margin: "0 0 5px", fontSize: 21, fontWeight: "normal" }}>
          {hasPlan ? "Family Meal Plan" : "Let's Plan Your Week"}
        </h1>
        {hasPlan && <div style={{ fontSize: 11, color: "#a8c5b5", marginBottom: 10 }}>🍕 Friday = Pizza &nbsp;·&nbsp; 🍽️ Saturday = Dining Out</div>}
        {syncStatus && <div style={{ fontSize: 11, color: "#a8c5b5", marginTop: 6, fontFamily: "sans-serif" }}>{syncStatus}</div>}
        {hasPlan && plan.daughterReminder && (
          <div style={{ background: "#fff3cd", color: GOLD, borderRadius: 8, padding: "8px 13px", fontSize: 12, fontFamily: "sans-serif", display: "inline-block", maxWidth: 360 }}>
            ⚠️ Ask your daughter what she wants for breakfasts & lunches!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `2px solid ${BD}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: "0 0 auto", padding: "11px 10px", border: "none", background: "none", fontFamily: "sans-serif", fontSize: 11, cursor: "pointer", color: tab === t ? G : "#999", fontWeight: tab === t ? "bold" : "normal", borderBottom: tab === t ? `3px solid ${G}` : "3px solid transparent", marginBottom: -2, whiteSpace: "nowrap" }}>
            {t === "generate" ? "✨ Generate" : t === "dinners" ? "🍳 Dinners" : t === "lunches" ? "🥗 Lunches" : t === "groceries" ? "🛒 Groceries" : t === "history" ? "📚 History" : "⚙️ Settings"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "13px 13px 60px" }}>

        {/* ── GENERATE ── */}
        {tab === "generate" && <GenerateTab onPlanGenerated={handlePlanGenerated} plan={plan} favs={favs} />}

        {/* ── DINNERS ── */}
        {tab === "dinners" && !hasPlan && (
          <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: "sans-serif", color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 15, marginBottom: 8, color: "#555" }}>No meal plan yet</div>
            <div style={{ fontSize: 13 }}>Go to the Generate tab to create this week's plan!</div>
          </div>
        )}

        {tab === "dinners" && hasPlan && <>
          {/* Prep Card */}
          <Card>
            <button onClick={() => setPrepOpen(!prepOpen)} style={{ width: "100%", background: "none", border: "none", padding: "13px 14px", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#7a9e8e", fontFamily: "sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{plan.prepDay}</span>
                  <Bdg label="🧑‍🍳 Prep — Before Dining Out" />
                </div>
                <div style={{ fontSize: 15, color: "#222" }}>Weekend Meal Prep</div>
                <div style={{ fontSize: 11, color: "#bbb", fontFamily: "sans-serif", marginTop: 2 }}>Tap to see all prep tasks</div>
              </div>
              <span style={{ fontSize: 13, color: "#ccc", paddingLeft: 8 }}>{prepOpen ? "▲" : "▼"}</span>
            </button>
            {prepOpen && (
              <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f0ebe2" }}>
                <div style={{ background: "#e8f4f1", borderRadius: 8, padding: "8px 11px", fontSize: 13, fontFamily: "sans-serif", color: G, marginTop: 10, marginBottom: 11 }}>💡 {plan.prepNote}</div>
                <ol style={{ margin: 0, paddingLeft: 17 }}>
                  {(plan.prepSteps || []).map((s, i) => {
                    const c = s.indexOf(":");
                    return c > 0
                      ? <li key={i} style={{ fontSize: 13, fontFamily: "sans-serif", color: "#333", marginBottom: 8, lineHeight: 1.5 }}><b style={{ color: G }}>{s.slice(0, c)}:</b>{s.slice(c + 1)}</li>
                      : <li key={i} style={{ fontSize: 13, fontFamily: "sans-serif", color: "#333", marginBottom: 8, lineHeight: 1.5 }}>{s}</li>;
                  })}
                </ol>
              </div>
            )}
          </Card>

          {/* Meal Cards */}
          {plan.meals.map(m => {
            const times = actualTimes[m.id] || [];
            const avgSec = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
            return (
              <Card key={m.id}>
                <button onClick={() => setOpenMeal(openMeal === m.id ? null : m.id)} style={{ width: "100%", background: "none", border: "none", padding: "13px 14px", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#7a9e8e", fontFamily: "sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{m.day}</span>
                      <Bdg label={m.badge} />
                      {favs[m.id] && <span>⭐</span>}
                      {ratings[m.id] === "loved" && <span>👍</span>}
                      {ratings[m.id] === "okay" && <span>😐</span>}
                      {ratings[m.id] === "disliked" && <span>👎</span>}
                    </div>
                    <div style={{ fontSize: 15, color: "#222", marginBottom: 2 }}>{m.name}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: "#bbb", fontFamily: "sans-serif" }}>⏱ Est: {m.estMin} min</div>
                      {avgSec && <div style={{ fontSize: 11, fontFamily: "sans-serif", color: "#7a9e8e" }}>· Actual avg: {fmtAvg(avgSec)} ({times.length}x)</div>}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: "#ccc", paddingLeft: 8 }}>{openMeal === m.id ? "▲" : "▼"}</span>
                </button>

                {openMeal === m.id && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f0ebe2" }}>
                    {times.length > 0 && (
                      <div style={{ background: "#eef4f1", borderRadius: 8, padding: "8px 11px", marginTop: 11, marginBottom: 8, fontFamily: "sans-serif", fontSize: 12, color: G }}>
                        ⏱ Cook history: {times.map((s, i) => `#${i + 1}: ${fmtAvg(s)}`).join(" · ")} · Avg: {fmtAvg(avgSec)}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, marginTop: times.length ? 4 : 11, marginBottom: 10, flexWrap: "wrap" }}>
                      <button onClick={() => { setCook(true); setCookId(m.id); }} style={{ background: G, color: "#f5ede0", border: "none", borderRadius: 8, padding: "7px 11px", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>🔆 Cook Mode</button>
                      <button onClick={() => togFav(m.id)} style={{ background: favs[m.id] ? "#fff8e6" : "#f5f0e8", color: favs[m.id] ? GOLD : "#555", border: `1px solid ${favs[m.id] ? "#f0d080" : BD}`, borderRadius: 8, padding: "7px 11px", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>{favs[m.id] ? "⭐ Fav'd" : "☆ Favorite"}</button>
                      <button onClick={() => { setSwapping(swapping === m.id ? null : m.id); setSwapError(""); setSwapInput(""); }} style={{ background: swapping === m.id ? "#fff3cd" : "#f5f0e8", color: swapping === m.id ? GOLD : "#555", border: `1px solid ${swapping === m.id ? "#f0d080" : BD}`, borderRadius: 8, padding: "7px 11px", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>🔄 Swap</button>
                      {[["loved", "👍"], ["okay", "😐"], ["disliked", "👎"]].map(([v, e]) => (
                        <button key={v} onClick={() => setRat(m.id, v)} style={{ background: ratings[m.id] === v ? (v === "loved" ? "#e8f5e9" : v === "okay" ? "#fff8e1" : "#ffebee") : "#f5f0e8", border: `1px solid ${ratings[m.id] === v ? (v === "loved" ? "#a5d6a7" : v === "okay" ? "#ffe082" : "#ef9a9a") : BD}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer" }}>{e}</button>
                      ))}
                    </div>

                    {/* Swap panel */}
                    {swapping === m.id && (
                      <div style={{ background: "#fffdf5", border: `1px solid #f0d080`, borderRadius: 10, padding: "12px 13px", marginBottom: 11 }}>
                        <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: "bold", color: GOLD, marginBottom: 7 }}>🔄 Swap this meal</div>
                        <input
                          value={swapInput}
                          onChange={e => setSwapInput(e.target.value)}
                          placeholder="What are you craving? (or leave blank for a surprise)"
                          style={{ width: "100%", background: "#fff", border: `1px solid ${BD}`, borderRadius: 8, fontFamily: "sans-serif", fontSize: 13, padding: "8px 10px", color: "#333", boxSizing: "border-box", marginBottom: 8 }}
                        />
                        {swapError && <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#c62828", marginBottom: 8 }}>{swapError}</div>}
                        <div style={{ display: "flex", gap: 7 }}>
                          <button onClick={() => swapMeal(m.id)} disabled={swapLoading} style={{ flex: 1, background: swapLoading ? "#aaa" : GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontFamily: "sans-serif", fontSize: 13, cursor: swapLoading ? "default" : "pointer", fontWeight: "bold" }}>
                            {swapLoading ? "Finding a new meal..." : "✨ Generate swap"}
                          </button>
                          <button onClick={() => { setSwapping(null); setSwapInput(""); setSwapError(""); }} style={{ background: "#f5f0e8", color: "#555", border: `1px solid ${BD}`, borderRadius: 8, padding: "9px 13px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <textarea value={notes[m.id] || ""} onChange={e => setNotes(p => ({ ...p, [m.id]: e.target.value }))} placeholder="Notes for next time..." style={{ width: "100%", background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontFamily: "sans-serif", fontSize: 13, padding: "8px 10px", color: "#444", minHeight: 46, resize: "vertical", boxSizing: "border-box", marginBottom: settings.source ? 7 : 11 }} />
                    {settings.source && <input value={sources[m.id] || ""} onChange={e => setSources(p => ({ ...p, [m.id]: e.target.value }))} placeholder="Recipe source URL (optional)..." style={{ width: "100%", background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontFamily: "sans-serif", fontSize: 13, padding: "8px 10px", color: "#444", boxSizing: "border-box", marginBottom: 11 }} />}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 13 }}>
                      <div style={{ background: "#eef4f1", borderRadius: 8, padding: "8px 11px", fontSize: 13, fontFamily: "sans-serif", color: G }}>🥡 <b>Leftovers:</b> {m.leftoverNote}</div>
                      <div style={{ background: "#fff8ee", borderRadius: 8, padding: "8px 11px", fontSize: 13, fontFamily: "sans-serif", color: "#7a5c00" }}>🌶️ <b>Spice:</b> {m.spiceNote}</div>
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "sans-serif", fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Ingredients</div>
                    <ul style={{ margin: "0 0 13px 0", paddingLeft: 16 }}>
                      {(m.ingredients || []).map((g, i) => <li key={i} style={{ fontSize: 13, color: g.startsWith("—") ? "#bbb" : "#444", fontFamily: "sans-serif", marginBottom: 4, fontStyle: g.startsWith("—") ? "italic" : "normal" }}>{g}</li>)}
                    </ul>
                    <div style={{ fontSize: 10, fontFamily: "sans-serif", fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Steps — tap to check off</div>
                    {(m.steps || []).map((step, j) => {
                      const key = `${m.id}-${j}`, done = checked[key], isNote = step.startsWith("💡") || step.startsWith("🐌");
                      return (
                        <div key={j} onClick={() => !isNote && togStep(m.id, j)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 9px", marginBottom: 5, borderRadius: 8, background: done ? "#f0f7f0" : "#fafaf7", border: `1px solid ${done ? "#a5d6a7" : "#eee"}`, cursor: isNote ? "default" : "pointer", opacity: done ? 0.6 : 1 }}>
                          {!isNote && <div style={{ width: 19, height: 19, borderRadius: 4, flexShrink: 0, marginTop: 1, background: done ? "#4caf50" : "#fff", border: `2px solid ${done ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{done ? "✓" : ""}</div>}
                          <div style={{ fontSize: 13, fontFamily: "sans-serif", color: isNote ? "#aaa" : done ? "#888" : "#333", fontStyle: isNote ? "italic" : "normal", lineHeight: 1.4 }}>{step}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}

          {favMeals.length > 0 && (
            <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13, color: GOLD, marginBottom: 7 }}>⭐ Favorites this week</div>
              {favMeals.map(m => (
                <div key={m.id} style={{ fontFamily: "sans-serif", fontSize: 13, color: "#555", marginBottom: 4 }}>
                  • {m.name}
                  {notes[m.id] && <span style={{ color: "#aaa" }}> — "{notes[m.id]}"</span>}
                  {sources[m.id] && <a href={sources[m.id]} target="_blank" rel="noreferrer" style={{ color: "#2d6a8a", marginLeft: 6, fontSize: 12 }}>source ↗</a>}
                </div>
              ))}
              <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#aaa", marginTop: 7 }}>💡 Mention these in next week's Generate form to repeat them!</div>
            </div>
          )}
        </>}

        {/* ── LUNCHES ── */}
        {tab === "lunches" && !hasPlan && (
          <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: "sans-serif", color: "#aaa" }}>
            <div style={{ fontSize: 13 }}>Generate a meal plan first!</div>
          </div>
        )}
        {tab === "lunches" && hasPlan && (
          <div>
            <Card>
              <div style={{ background: G, color: "#f5ede0", padding: "11px 14px", fontSize: 13, fontFamily: "sans-serif" }}>📅 Full Week Lunch Coverage</div>
              {(plan.lunchCoverage || []).map((l, i) => (
                <div key={i} style={{ padding: "11px 14px", fontFamily: "sans-serif", borderBottom: i < plan.lunchCoverage.length - 1 ? "1px solid #f0ebe2" : "none", display: "flex", gap: 10, alignItems: "flex-start", background: l.ok ? "#fff" : "#fffdf7" }}>
                  <div style={{ fontSize: 18, marginTop: 1 }}>{l.ok ? "✅" : "⚠️"}</div>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 13, color: "#222", marginBottom: 2 }}>{l.day}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{l.source}</div>
                    {l.detail && <div style={{ fontSize: 12, color: "#7a9e8e", marginTop: 1 }}>{l.detail}</div>}
                    {l.fix && <div style={{ fontSize: 12, color: GOLD, marginTop: 1 }}>→ {l.fix}</div>}
                  </div>
                </div>
              ))}
            </Card>
            <div style={{ background: "#fff8ee", border: "1px solid #f0d080", borderRadius: 12, padding: "12px 14px", marginBottom: 11 }}>
              <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13, color: GOLD, marginBottom: 4 }}>No-Cook Lunch Options</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#888", marginBottom: 8 }}>Mon & Fri: 2 adults · Sat & Sun: all 4</div>
              {(plan.noCookLunch || []).map((item, j) => <div key={j} style={{ fontFamily: "sans-serif", fontSize: 13, color: "#555", paddingLeft: 8, marginBottom: 4 }}>• {item}</div>)}
            </div>
            {settings.leftoverTracker && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px", marginBottom: 11 }}>
                <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13, color: G, marginBottom: 6 }}>🧊 Leftover Tracker</div>
                <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#888", marginBottom: 9 }}>Tap items in fridge to add to next week's plan.</div>
                {LEFTOVER_OPTIONS.map(item => (
                  <div key={item} onClick={() => togLeft(item)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: "1px solid #f5f0ea", cursor: "pointer" }}>
                    <div style={{ width: 19, height: 19, borderRadius: 4, background: lftovrs[item] ? G : "#fff", border: `2px solid ${lftovrs[item] ? G : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{lftovrs[item] ? "✓" : ""}</div>
                    <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#333" }}>{item}</div>
                  </div>
                ))}
                {leftoverList.length > 0 && <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#7a9e8e", marginTop: 8 }}>✅ Will appear in next week's Generate form automatically.</div>}
              </div>
            )}
            <div style={{ background: "#f0f7ff", border: "1px solid #b0d0f0", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13, color: "#1a4a7a", marginBottom: 4 }}>👧 Daughter's Requests</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#444" }}>Add her breakfast & lunch requests when you fill in the Generate form each week!</div>
            </div>
          </div>
        )}

        {/* ── GROCERIES ── */}
        {tab === "groceries" && !hasPlan && (
          <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: "sans-serif", color: "#aaa" }}>
            <div style={{ fontSize: 13 }}>Generate a meal plan first!</div>
          </div>
        )}
        {tab === "groceries" && hasPlan && (
          <div>
            <button onClick={() => cp(groceryText(), setGCopied)} style={{ width: "100%", background: gCopied ? "#2d6a3e" : G, color: "#f5ede0", border: "none", borderRadius: 10, padding: "12px", fontFamily: "sans-serif", fontSize: 14, cursor: "pointer", marginBottom: 9, fontWeight: "bold" }}>
              {gCopied ? "✅ Copied! Paste into Cub app or notes" : "📋 Copy Full Grocery List"}
            </button>
            <div style={{ background: "#eef4f1", borderRadius: 8, padding: "8px 11px", marginBottom: 11, fontSize: 12, fontFamily: "sans-serif", color: "#444" }}>
              💡 Tap any item to mark it as added to your cart.
            </div>

            {cartCount > 0 && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "11px 14px", marginBottom: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "sans-serif", fontSize: 13, color: G, fontWeight: "bold" }}>🛒 {cartCount} item{cartCount > 1 ? "s" : ""} in cart</div>
                <button onClick={clearCart} style={{ background: "none", border: `1px solid ${BD}`, borderRadius: 8, padding: "5px 11px", fontFamily: "sans-serif", fontSize: 12, color: "#888", cursor: "pointer" }}>Clear all</button>
              </div>
            )}

            {settings.quickAdd && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px", marginBottom: 11 }}>
                <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13, color: G, marginBottom: 7 }}>➕ Quick Add — one-off items</div>
                <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                  <input value={quickIn} onChange={e => setQuickIn(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuick()} placeholder="Type item and press Enter..." style={{ flex: 1, background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontFamily: "sans-serif", fontSize: 13, padding: "8px 10px", color: "#333" }} />
                  <button onClick={addQuick} style={{ background: G, color: "#fff", border: "none", borderRadius: 8, padding: "8px 13px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer" }}>Add</button>
                </div>
                {quickItems.map((item, i) => {
                  const qKey = `quick-${i}`, inCart = cartChecked[qKey];
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f0ea" }}>
                      <div onClick={() => togCart(qKey)} style={{ display: "flex", gap: 9, alignItems: "center", flex: 1, cursor: "pointer" }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, background: inCart ? "#4caf50" : "#fff", border: `2px solid ${inCart ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>{inCart ? "✓" : ""}</div>
                        <div style={{ fontFamily: "sans-serif", fontSize: 13, color: inCart ? "#aaa" : "#333", textDecoration: inCart ? "line-through" : "none" }}>• {item}</div>
                      </div>
                      <button onClick={() => rmQuick(i)} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: 17, padding: "0 4px" }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}

            {settings.budget && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px", marginBottom: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13, color: G }}>💰 Estimated Weekly Total</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>Rough estimate — varies by store & sales</div>
                </div>
                <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 22, color: G }}>${budgetTotal}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
              <div style={{ background: "#eef4f1", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontFamily: "sans-serif", color: G }}>📦 = Costco</div>
              <div style={{ background: "#fff8ee", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontFamily: "sans-serif", color: GOLD }}>🔁 = Staple</div>
            </div>

            {Object.entries(plan.grocery || {}).map(([sec, items], si) => {
              if (!items?.length) return null;
              return (
                <Card key={si}>
                  <button onClick={() => setOpenGrp(openGrp === si ? null : si)} style={{ width: "100%", background: "#f5f0e8", border: "none", padding: "11px 14px", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", fontFamily: "sans-serif", fontSize: 13, fontWeight: "bold", color: G }}>
                    <span>{sec}</span><span style={{ color: "#aaa", fontWeight: "normal" }}>{openGrp === si ? "▲" : "▼"}</span>
                  </button>
                  {openGrp === si && (
                    <div style={{ padding: "9px 11px 12px" }}>
                      {items.map((it, j) => {
                        const st = it.s?.includes("🔁");
                        const cartKey = `${si}-${j}`, inCart = cartChecked[cartKey];
                        return (
                          <div key={j} onClick={() => togCart(cartKey)} style={{ padding: "8px 10px", marginBottom: 5, borderRadius: 8, background: inCart ? "#f0f7f0" : it.c ? "#f0f7f4" : st ? "#fffdf5" : "#fafafa", border: `1px solid ${inCart ? "#a5d6a7" : it.c ? "#c8e6d8" : st ? "#f0e0a0" : "#eee"}`, cursor: "pointer", opacity: inCart ? 0.6 : 1, display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ width: 19, height: 19, borderRadius: 4, flexShrink: 0, marginTop: 1, background: inCart ? "#4caf50" : "#fff", border: `2px solid ${inCart ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{inCart ? "✓" : ""}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: "600", color: inCart ? "#aaa" : "#222", flex: 1, textDecoration: inCart ? "line-through" : "none" }}>{it.c && <span style={{ marginRight: 4 }}>📦</span>}{st && <span style={{ marginRight: 4 }}>🔁</span>}{it.i}</div>
                                <div style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: "bold", color: inCart ? "#aaa" : G, whiteSpace: "nowrap" }}>{it.q}</div>
                              </div>
                              {!st && <div style={{ fontFamily: "sans-serif", fontSize: 11, color: inCart ? "#ccc" : "#2d6a8a", marginTop: 2, fontStyle: "italic" }}>📐 {it.s}</div>}
                              {st && <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>{it.s?.replace("🔁 ", "")}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}

            <div style={{ background: "#f0f7ff", border: "1px solid #b0d0f0", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 13, color: "#1a4a7a", marginBottom: 4 }}>👧 Daughter's Items</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#444" }}>Add her requests in the Generate form and they'll appear in the grocery list automatically!</div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div>
            <div style={{ background: "#eef4f1", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontFamily: "sans-serif", fontSize: 13, color: G }}>
              Past meal plans from the last 3 months. Tap any week to browse it, or use it as a starting point for a new plan.
            </div>

            {viewingPast ? (
              // ── Past plan viewer ──
              <div>
                <button onClick={() => setViewingPast(null)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: G, fontFamily: "sans-serif", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}>
                  ← Back to history
                </button>
                <div style={{ background: G, color: "#f5ede0", borderRadius: 12, padding: "13px 15px", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#a8c5b5", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif", marginBottom: 4 }}>Past Plan</div>
                  <div style={{ fontSize: 17 }}>Week of {viewingPast.weekOf}</div>
                </div>

                {/* Use again button */}
                <button onClick={() => {
                  const meals = viewingPast.meals?.map(m => m.name).join(", ");
                  setTab("generate");
                  setViewingPast(null);
                  // Pre-fill last week field with these meals as a hint
                  setTimeout(() => {
                    const event = new CustomEvent("prefill-generate", { detail: { hint: meals, weekOf: viewingPast.weekOf } });
                    window.dispatchEvent(event);
                  }, 100);
                }} style={{ width: "100%", background: GOLD, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer", fontWeight: "bold", marginBottom: 14 }}>
                  🔄 Use this week as a starting point
                </button>

                {/* Past meals read-only */}
                {(viewingPast.meals || []).map((m, i) => (
                  <Card key={i}>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "#7a9e8e", fontFamily: "sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{m.day}</span>
                        <Bdg label={m.badge} />
                      </div>
                      <div style={{ fontSize: 15, color: "#222", marginBottom: 6 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#bbb", fontFamily: "sans-serif", marginBottom: 10 }}>⏱ Est: {m.estMin} min</div>
                      <div style={{ fontSize: 12, color: "#999", fontFamily: "sans-serif", marginBottom: 8, fontStyle: "italic" }}>Read-only — generate a new plan to cook again</div>
                      <div style={{ fontSize: 11, fontFamily: "sans-serif", fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Ingredients</div>
                      <ul style={{ margin: "0 0 10px", paddingLeft: 16 }}>
                        {(m.ingredients || []).map((g, j) => <li key={j} style={{ fontSize: 13, color: "#555", fontFamily: "sans-serif", marginBottom: 3 }}>{g}</li>)}
                      </ul>
                      <div style={{ fontSize: 11, fontFamily: "sans-serif", fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Steps</div>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {(m.steps || []).map((s, j) => <li key={j} style={{ fontSize: 13, color: s.startsWith("💡") ? "#aaa" : "#444", fontFamily: "sans-serif", marginBottom: 4, fontStyle: s.startsWith("💡") ? "italic" : "normal" }}>{s}</li>)}
                      </ol>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // ── History list ──
              history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: "sans-serif", color: "#aaa" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
                  <div style={{ fontSize: 13 }}>No past plans yet. Generate your first plan to start building history!</div>
                </div>
              ) : (
                history.map((record, i) => {
                  const p = record.data;
                  const isCurrentWeek = i === 0;
                  return (
                    <div key={record.id} onClick={() => setViewingPast(p)} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${isCurrentWeek ? G : BD}`, padding: "13px 15px", marginBottom: 10, cursor: "pointer", boxShadow: "0 1px 5px rgba(0,0,0,.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          {isCurrentWeek && <div style={{ fontSize: 10, fontFamily: "sans-serif", color: G, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Current Week</div>}
                          <div style={{ fontSize: 15, color: "#222", marginBottom: 5 }}>Week of {p.weekOf}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {(p.meals || []).map(m => (
                              <span key={m.id} style={{ fontSize: 11, background: "#f5f0e8", borderRadius: 20, padding: "2px 9px", fontFamily: "sans-serif", color: "#666" }}>{m.name}</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: 13, color: "#ccc", paddingLeft: 8, marginTop: 2 }}>›</span>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div>
            <div style={{ background: "#eef4f1", borderRadius: 12, padding: "11px 14px", marginBottom: 14, fontFamily: "sans-serif", fontSize: 13, color: G }}>Toggle features on or off. Changes take effect immediately.</div>
            <Sec title="Features" />
            {Object.entries(SET_LABELS).map(([k, [lbl, desc]]) => (
              <div key={k} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${BD}`, padding: "12px 14px", marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 11 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "sans-serif", fontSize: 14, color: "#222", fontWeight: "500" }}>{lbl}</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#aaa", marginTop: 2 }}>{desc}</div>
                </div>
                <Toggle val={settings[k]} on={() => togSet(k)} />
              </div>
            ))}

            {Object.keys(actualTimes).filter(k => actualTimes[k]?.length).length > 0 && <>
              <Sec title="Cook Time History" />
              <Card>
                <div style={{ padding: "11px 14px" }}>
                  {(plan?.meals || []).filter(m => actualTimes[m.id]?.length).map(m => {
                    const times = actualTimes[m.id];
                    const avg = times.reduce((a, b) => a + b, 0) / times.length;
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f0ea", fontFamily: "sans-serif", fontSize: 13 }}>
                        <div style={{ color: "#333" }}>{m.name}</div>
                        <div style={{ color: G, fontWeight: "bold" }}>avg {fmtAvg(avg)} <span style={{ color: "#aaa", fontWeight: "normal", fontSize: 11 }}>est {m.estMin} min · {times.length}x</span></div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>}

            {hasPlan && <>
              <Sec title="Current Plan" />
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#333", marginBottom: 8 }}>Week of <b>{plan.weekOf}</b></div>
                {plan.meals.map(m => (
                  <div key={m.id} style={{ fontFamily: "sans-serif", fontSize: 13, color: "#555", padding: "4px 0", borderBottom: "1px solid #f5f0ea" }}>
                    {m.day.split(",")[0]}: {m.name}
                    {ratings[m.id] && <span style={{ marginLeft: 8 }}>{ratings[m.id] === "loved" ? "👍" : ratings[m.id] === "okay" ? "😐" : "👎"}</span>}
                  </div>
                ))}
                <button onClick={() => { if (window.confirm("Clear this week's plan and start fresh?")) { setPlan(null); setTab("generate"); } }} style={{ marginTop: 12, background: "none", border: `1px solid #ef9a9a`, borderRadius: 8, padding: "7px 14px", fontFamily: "sans-serif", fontSize: 12, color: "#c62828", cursor: "pointer" }}>
                  🗑 Clear plan & start fresh
                </button>
              </div>
            </>}
          </div>
        )}
      </div>
    </div>
  );
}
