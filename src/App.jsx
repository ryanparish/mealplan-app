import React, { useState, useEffect, useRef } from "react";
import { MEALS_PROFILE, GROCERY_PROFILE, SWAP_PROFILE, RECIPE_URL_PROFILE } from "./profile.js";

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
  const iv = useRef(null); const t0 = useRef(null);
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

// ── Shared Claude call ────────────────────────────────────────────────────────
async function callClaude(system, userMessage, maxTokens = 4000) {
  const res = await fetch("/.netlify/functions/generate", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages: [{ role: "user", content: userMessage }], max_tokens: maxTokens }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || JSON.stringify(data.error) || `API error ${res.status}`);
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("No response from Claude");
  try { return JSON.parse(text); } catch {}
  try { return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("Claude returned invalid JSON. Please try again.");
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function savePlan(plan) {
  const res = await fetch("/.netlify/functions/save-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed"); }
}
async function loadPlans() {
  const res = await fetch("/.netlify/functions/load-plans");
  if (!res.ok) return [];
  const { plans } = await res.json();
  return plans || [];
}

// ── Small components ──────────────────────────────────────────────────────────
function Toggle({ val, on }) {
  return <div onClick={on} style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", background: val ? G : "#ccc", position: "relative", transition: "background .2s", flexShrink: 0 }}>
    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: val ? 21 : 3, transition: "left .2s" }} />
  </div>;
}
function Card({ children, style = {} }) {
  return <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BD}`, overflow: "hidden", boxShadow: "0 1px 5px rgba(0,0,0,.04)", marginBottom: 12, ...style }}>{children}</div>;
}
function Sec({ title }) {
  return <div style={{ fontSize: 10, fontWeight: "bold", color: "#bbb", letterSpacing: 2, textTransform: "uppercase", margin: "18px 0 7px" }}>{title}</div>;
}
function Bdg({ label }) {
  const fl = label.includes("⚡"), pr = label.includes("🧑"), hu = label.includes("Husband");
  return <span style={{ fontSize: 10, borderRadius: 20, padding: "2px 8px", background: fl ? "#fff3cd" : pr ? "#e8f4f1" : hu ? "#eef4f1" : "#f0f0f0", color: fl ? GOLD : pr ? G : hu ? G : "#555" }}>{label}</span>;
}
function Spinner() {
  return <div style={{ width: 16, height: 16, border: `2px solid ${G}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />;
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
  const handleExit = () => { if (timer.elapsed > 0 && !showSave) setShowSave(true); else onExit(); };
  return (
    <div style={{ minHeight: "100vh", background: "#1a2e27", color: "#f5ede0", paddingBottom: 40 }}>
      <div style={{ background: "#0f1f1a", padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "#7a9e8e", letterSpacing: 2, textTransform: "uppercase" }}>🔆 Cook Mode</div>
          <div style={{ fontSize: 17, marginTop: 2 }}>{meal.name}</div>
        </div>
        <button onClick={handleExit} style={{ background: "#2d4a3e", border: "none", color: "#f5ede0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>✕ Exit</button>
      </div>
      <div style={{ margin: "14px 14px 0", background: "#0f2a22", borderRadius: 12, padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#7a9e8e", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Cook Timer</div>
        <div style={{ fontSize: 46, fontFamily: "monospace", color: timer.running ? "#a8d8a8" : "#f5ede0", letterSpacing: 2, marginBottom: 8 }}>{timer.fmt(timer.elapsed)}</div>
        <div style={{ fontSize: 12, color: "#7a9e8e", marginBottom: 12 }}>
          Estimated: <b style={{ color: "#f5ede0" }}>{meal.estMin} min</b>
          {timer.elapsed > 0 && <span style={{ marginLeft: 10, color: timer.elapsed / 60 > meal.estMin + 5 ? "#ef9a9a" : "#a8d8a8" }}>{Math.abs(Math.round(timer.elapsed / 60 - meal.estMin))} min {timer.elapsed / 60 > meal.estMin ? "over" : "under"}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {!timer.running
            ? <button onClick={timer.start} style={{ background: G, color: "#f5ede0", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>{timer.elapsed === 0 ? "▶ Start" : "▶ Resume"}</button>
            : <button onClick={timer.pause} style={{ background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>⏸ Pause</button>}
          {timer.elapsed > 0 && <button onClick={timer.reset} style={{ background: "transparent", color: "#7a9e8e", border: "1px solid #2d5a48", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>↺</button>}
        </div>
      </div>
      {showSave && (
        <div style={{ margin: "12px 14px 0", background: "#0f2a22", borderRadius: 12, padding: "14px", border: "1px solid #2d5a48" }}>
          <div style={{ fontSize: 13, color: "#f0e8d8", marginBottom: 10 }}>Cooked for <b>{timer.fmt(timer.elapsed)}</b> (est. {meal.estMin} min). Save?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onSaveTime(meal.id, timer.elapsed); onExit(); }} style={{ flex: 1, background: G, color: "#f5ede0", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, cursor: "pointer", fontWeight: "bold" }}>✅ Save & Exit</button>
            <button onClick={onExit} style={{ flex: 1, background: "transparent", color: "#7a9e8e", border: "1px solid #2d5a48", borderRadius: 8, padding: "9px", fontSize: 13, cursor: "pointer" }}>Skip</button>
          </div>
        </div>
      )}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 14px" }}>
        <div style={{ background: "#0f2a22", borderRadius: 12, padding: "13px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#a8c5b5", marginBottom: 7, textTransform: "uppercase", letterSpacing: 1 }}>Ingredients</div>
          {(meal.ingredients || []).map((g, i) => <div key={i} style={{ fontSize: 15, color: g.startsWith("—") ? "#7a9e8e" : "#e8d8c0", marginBottom: 5, fontStyle: g.startsWith("—") ? "italic" : "normal" }}>{g}</div>)}
        </div>
        <div style={{ fontSize: 10, color: "#a8c5b5", marginBottom: 9, textTransform: "uppercase", letterSpacing: 1 }}>Steps — tap to check off</div>
        {(meal.steps || []).map((step, i) => {
          const key = `${meal.id}-${i}`, done = checked[key], isNote = step.startsWith("💡") || step.startsWith("🐌");
          return (
            <div key={i} onClick={() => !isNote && togStep(meal.id, i)} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: done ? "#0f2a22" : "#1e3830", borderRadius: 10, padding: "13px 14px", marginBottom: 9, cursor: isNote ? "default" : "pointer", opacity: done ? 0.5 : 1, border: `1px solid ${done ? "#2d4a3e" : "#2d5a48"}` }}>
              {!isNote && <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: done ? "#4caf50" : "transparent", border: `2px solid ${done ? "#4caf50" : "#7a9e8e"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>{done ? "✓" : <span style={{ fontSize: 11, color: "#7a9e8e" }}>{i + 1}</span>}</div>}
              <div style={{ fontSize: 15, color: isNote ? "#7a9e8e" : "#f0e8d8", lineHeight: 1.5, fontStyle: isNote ? "italic" : "normal" }}>{step}</div>
            </div>
          );
        })}
        <div style={{ background: "#0f2a22", borderRadius: 12, padding: "14px", marginTop: 6 }}>
          <div style={{ fontSize: 12, color: "#a8c5b5", marginBottom: 9 }}>How was it?</div>
          <div style={{ display: "flex", gap: 7, marginBottom: 11 }}>
            {[["loved", "👍 Loved it"], ["okay", "😐 Okay"], ["disliked", "👎 Nope"]].map(([v, l]) => (
              <button key={v} onClick={() => setRat(meal.id, v)} style={{ flex: 1, padding: "9px 4px", border: `2px solid ${ratings[meal.id] === v ? "#4caf50" : "#2d5a48"}`, background: ratings[meal.id] === v ? "#1a4a30" : "transparent", borderRadius: 8, color: "#f0e8d8", fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <textarea value={notes[meal.id] || ""} onChange={e => setNotes(p => ({ ...p, [meal.id]: e.target.value }))} placeholder="Notes for next time..." style={{ width: "100%", background: "#1e3830", border: "1px solid #2d5a48", borderRadius: 8, color: "#f0e8d8", fontSize: 13, padding: "9px 11px", minHeight: 60, resize: "vertical", boxSizing: "border-box" }} />
        </div>
      </div>
    </div>
  );
}

// ── Generate Tab ──────────────────────────────────────────────────────────────
function GenerateTab({ onPlanGenerated, plan, favs, tasteProfile }) {
  const [form, setForm] = useState({ date: "", prepday: "Sunday", mustInclude: "", ingredients: "", schedule: "", daughter: "", lastWeek: "", extras: "", other: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const handler = (e) => setForm(p => ({ ...p, other: `Repeat meals from week of ${e.detail.weekOf}: ${e.detail.hint}. Adjust as needed.` }));
    window.addEventListener("prefill-generate", handler);
    return () => window.removeEventListener("prefill-generate", handler);
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!form.date) { setError("Please enter the week start date."); return; }
    setError(""); setLoading(true);
    const favMealNames = (plan?.meals || []).filter(m => (favs || {})[m.id]).map(m => m.name).join(", ");
    const ctx = `Week: ${form.date}. Prep day: ${form.prepday}.
Ingredients to use up: ${form.ingredients || "nothing special"}.
Scheduling: ${form.schedule || "normal week"}.
Daughter requests: ${form.daughter || "TBD"}.
Last week's meals (don't repeat): ${form.lastWeek || "not specified"}.
Must include this week: ${form.mustInclude || "none"}.
Favorites to rotate in: ${favMealNames || "none"}.
Extra grocery items: ${form.extras || "none"}.
Other: ${form.other || "none"}.${tasteProfile ? `\n\nFamily taste history (use this to make better choices):\n${tasteProfile}` : ""}`;
    try {
      setStatus("Step 1 of 2 — Creating your meal plan...");
      const mealPlan = await callClaude(MEALS_PROFILE, `Create a weekly meal plan.\n\n${ctx}`, 4000);
      setStatus("Step 2 of 2 — Building your grocery list...");
      const mealSummary = (mealPlan.meals || []).map(m => `${m.day}: ${m.name} (${m.protein || "?"}g protein) — ingredients: ${(m.ingredients || []).join(", ")}`).join("\n");
      const groceryResult = await callClaude(GROCERY_PROFILE, `Generate a grocery list for these meals:\n\n${mealSummary}\n\nExtra items: ${form.extras || "none"}.`, 4000);
      onPlanGenerated({ ...mealPlan, ...groceryResult });
      setStatus("");
    } catch (err) {
      setError(`Something went wrong: ${err.message}`);
    } finally { setLoading(false); }
  };

  const favMealNames = (plan?.meals || []).filter(m => (favs || {})[m.id]).map(m => m.name);
  const fields = [
    { k: "date", label: "Week start date *", ph: "e.g. Sunday, May 18, 2026" },
    { k: "prepday", label: "Prep day", ph: "Sunday (default) or Saturday" },
    { k: "mustInclude", label: "Must include this week?", ph: "e.g. tacos, something with shrimp — or leave blank" },
    { k: "ingredients", label: "Ingredients to use up?", ph: "e.g. rotisserie chicken — or leave blank" },
    { k: "schedule", label: "Scheduling notes?", ph: "e.g. husband out Mon–Tue, busy Thursday" },
    { k: "daughter", label: "Daughter's breakfast & lunch requests?", ph: "e.g. waffles, quesadillas — or TBD" },
    { k: "lastWeek", label: "Last week's meals (to avoid repeats)", ph: "e.g. Tacos, Korean Beef, Salmon, Gyros, Turkey Skillet" },
    { k: "extras", label: "Extra one-off grocery items this week?", ph: "e.g. birthday cake ingredients" },
    { k: "other", label: "Anything else?", ph: "e.g. trying a new cuisine, special occasion" },
  ];

  return (
    <div>
      <div style={{ background: "#eef4f1", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: G, lineHeight: 1.6 }}>
        <b>Fill in your weekly details and tap Generate.</b> Claude creates your full meal plan, recipes, and grocery list automatically!
      </div>
      {favMealNames.length > 0 && (
        <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 10, padding: "10px 13px", marginBottom: 13, fontSize: 13, color: GOLD }}>
          ⭐ <b>Favorites from last week:</b> {favMealNames.join(", ")} — Claude will try to rotate these in.
        </div>
      )}
      {fields.map(f => (
        <div key={f.k} style={{ marginBottom: 11 }}>
          <div style={{ fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 5 }}>{f.label}</div>
          <textarea value={form[f.k] || ""} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={{ width: "100%", background: "#fff", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333", minHeight: 46, resize: "vertical", boxSizing: "border-box" }} />
        </div>
      ))}
      {error && <div style={{ background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#c62828", marginBottom: 12 }}>{error}</div>}
      {status && <div style={{ background: "#eef4f1", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: G, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}><Spinner />{status}</div>}
      <button onClick={generate} disabled={loading} style={{ width: "100%", background: loading ? "#7a9e8e" : G, color: "#f5ede0", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, cursor: loading ? "default" : "pointer", fontWeight: "bold" }}>
        {loading ? "Generating..." : "✨ Generate This Week's Plan"}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
const DEF_SETTINGS = { leftoverTracker: true, source: true, quickAdd: true, twoWeek: true };
const SET_LABELS = {
  leftoverTracker: ["Leftover Tracker", "Track what's in the fridge mid-week"],
  source: ["Recipe Source URLs", "Link meals to original recipe sources"],
  quickAdd: ["Quick Grocery Add", "Add one-off items to the list"],
  twoWeek: ["Two-Week Meal Log", "Avoid repeating last week's meals"],
};
const LEFTOVER_OPTIONS = ["Taco meat", "Korean beef + rice", "Salmon + peppers", "Turkey/chicken skillet", "Rotisserie chicken", "Cooked rice/quinoa", "Marinated meat"];

export default function App() {
  const [tab, setTab] = useState("generate");
  const [plan, setPlan] = usePersist("mp_plan", null);
  const [history, setHistory] = useState([]);
  const [viewingPast, setViewingPast] = useState(null);
  const [syncStatus, setSyncStatus] = useState("");
  const [openMeal, setOpenMeal] = useState(null);
  const [prepChecked, setPrepChecked] = usePersist("mp_prepchecked", {});
  const [customPrepSteps, setCustomPrepSteps] = usePersist("mp_customprep", []);
  const [customPrepInput, setCustomPrepInput] = useState("");
  const [cook, setCook] = useState(false);
  const [cookId, setCookId] = useState(null);
  const [checked, setChecked] = useState({});
  // Ratings/notes persisted by meal NAME not id, so they survive week changes
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
  const [swapping, setSwapping] = useState(null);
  const [swapInput, setSwapInput] = useState("");
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState("");
  const [swapStatus, setSwapStatus] = useState("");
  const [groceryRegenLoading, setGroceryRegenLoading] = useState(false);

  // ── Taste profile builder ─────────────────────────────────────────────────
  // Reads ratings/notes from localStorage and builds a concise summary for Claude
  const buildTasteProfile = () => {
    const loved = [], disliked = [], noted = [];
    Object.entries(ratings).forEach(([name, rating]) => {
      if (rating === "loved") loved.push(name);
      if (rating === "disliked") disliked.push(name);
    });
    Object.entries(notes).forEach(([name, note]) => {
      if (note?.trim()) noted.push(`${name}: "${note.trim()}"`);
    });
    const parts = [];
    if (loved.length) parts.push(`Meals family loved: ${loved.join(", ")}`);
    if (disliked.length) parts.push(`Meals family disliked (avoid repeating): ${disliked.join(", ")}`);
    if (noted.length) parts.push(`Notes: ${noted.slice(0, 8).join(" · ")}`);
    return parts.join("\n");
  };
  // Recipe URL
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState("");
  const [recipeResult, setRecipeResult] = useState(null);
  const [recipeAction, setRecipeAction] = useState(null);
  const [recipeReplaceId, setRecipeReplaceId] = useState("");
  const [recipeLeftovers, setRecipeLeftovers] = useState(false);
  const [showRecipePanel, setShowRecipePanel] = useState(false);
  const [recipeMode, setRecipeMode] = useState("url"); // "url" or "manual"
  const [manualMealName, setManualMealName] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");
  const [manualReplaceId, setManualReplaceId] = useState("");
  const [manualLeftovers, setManualLeftovers] = useState(false);

  // Key ratings/notes by meal NAME so they persist across weeks
  const ratingKey = (m) => m.name;
  const noteKey = (m) => m.name;

  const togStep = (id, j) => setChecked(p => ({ ...p, [`${id}-${j}`]: !p[`${id}-${j}`] }));
  const setRat = (m, v) => setRatings(p => ({ ...p, [ratingKey(m)]: p[ratingKey(m)] === v ? null : v }));
  const togFav = (m) => setFavs(p => ({ ...p, [m.name]: !p[m.name] }));
  const togSet = k => setSettings(p => ({ ...p, [k]: !p[k] }));
  const togLeft = item => setLftovrs(p => ({ ...p, [item]: !p[item] }));
  const addQuick = () => { if (quickIn.trim()) { setQuickItems(p => [...p, quickIn.trim()]); setQuickIn(""); } };
  const rmQuick = i => setQuickItems(p => p.filter((_, x) => x !== i));
  const togCart = key => setCartChecked(p => ({ ...p, [key]: !p[key] }));
  const clearCart = () => setCartChecked({});
  const saveTime = (id, secs) => setActualTimes(p => ({ ...p, [id]: [...(p[id] || []), secs] }));
  const togPrep = key => setPrepChecked(p => ({ ...p, [key]: !p[key] }));
  const addCustomPrep = () => { if (customPrepInput.trim()) { setCustomPrepSteps(p => [...p, customPrepInput.trim()]); setCustomPrepInput(""); } };
  const rmCustomPrep = i => setCustomPrepSteps(p => p.filter((_, x) => x !== i));
  const fmtAvg = secs => `${Math.round(secs / 60)} min`;
  const cartCount = Object.values(cartChecked).filter(Boolean).length;
  const leftoverList = Object.entries(lftovrs).filter(([, v]) => v).map(([k]) => k);
  const favMeals = (plan?.meals || []).filter(m => favs[m.name]);
  const hasPlan = plan && plan.meals && plan.meals.length > 0;

  // Load from cloud on mount
  useEffect(() => {
    loadPlans().then(plans => {
      if (plans?.length > 0) { setPlan(plans[0].data); setHistory(plans); }
    }).catch(() => {});
  }, []);

  const syncToCloud = async (updatedPlan) => {
    setSyncStatus("Saving...");
    try {
      await savePlan(updatedPlan);
      const plans = await loadPlans();
      setHistory(plans);
      setSyncStatus("✅ Saved");
    } catch { setSyncStatus("⚠️ Saved locally only"); }
    setTimeout(() => setSyncStatus(""), 3000);
  };

  const handlePlanGenerated = async (newPlan) => {
    // Reset week-specific state but keep ratings/notes/favs (keyed by meal name)
    setCartChecked({});
    setChecked({});
    setPrepChecked({});
    setCustomPrepSteps([]);
    setRecipeResult(null);
    setShowRecipePanel(false);
    setPlan(newPlan);
    setTab("dinners");
    await syncToCloud(newPlan);
  };

  // ── Meal day swap (reorder) ──────────────────────────────────────────────
  const moveMeal = async (idx, dir) => {
    if (!plan) return;
    const meals = [...plan.meals];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= meals.length) return;

    // Swap the meals
    [meals[idx], meals[swapIdx]] = [meals[swapIdx], meals[idx]];

    // Re-assign days to maintain correct day order
    const days = plan.meals.map(m => m.day);
    const updatedMeals = meals.map((m, i) => ({ ...m, day: days[i] }));

    // Rebuild lunch coverage based on new order
    const updatedLunch = (plan.lunchCoverage || []).map((l, i) => {
      // Monday is always false; others depend on what meal is now on the previous day
      if (l.day === "Monday") return l;
      const prevMeal = updatedMeals[i - 1];
      if (!prevMeal) return l;
      return { ...l, source: `${prevMeal.day.split(",")[0]} leftovers → ${prevMeal.name}` };
    });

    const updatedPlan = { ...plan, meals: updatedMeals, lunchCoverage: updatedLunch };
    setPlan(updatedPlan);
    await syncToCloud(updatedPlan);
  };

  // ── Meal swap (replace content) ──────────────────────────────────────────
  const swapMeal = async (mealId) => {
    setSwapLoading(true); setSwapError("");
    try {
      const mealToSwap = plan.meals.find(m => m.id === mealId);
      const otherMeals = plan.meals.filter(m => m.id !== mealId).map(m => m.name).join(", ");
      const result = await callClaude(SWAP_PROFILE,
        `Replace: ${mealToSwap.day} — ${mealToSwap.name}.\nOther meals this week (don't repeat): ${otherMeals}.\nCraving/reason: ${swapInput || "want something different"}.\nKeep same day (${mealToSwap.day}) and id (${mealToSwap.id}).`,
        2000);

      const updatedMeals = plan.meals.map(m => m.id === mealId ? result.meal : m);
      let updatedPrepSteps = [...(plan.prepSteps || [])];
      if (result.prepStepUpdate !== undefined) {
        const idx = updatedPrepSteps.findIndex(s => s.toUpperCase().includes(mealToSwap.name.toUpperCase()));
        if (result.prepStepUpdate?.trim()) { if (idx >= 0) updatedPrepSteps[idx] = result.prepStepUpdate; else updatedPrepSteps.push(result.prepStepUpdate); }
        else if (idx >= 0) updatedPrepSteps.splice(idx, 1);
      }
      let updatedNightBefore = [...(plan.nightBeforeSteps || [])];
      if (result.nightBeforeUpdate !== undefined) {
        const idx = updatedNightBefore.findIndex(s => s.toUpperCase().includes(mealToSwap.name.toUpperCase()));
        if (result.nightBeforeUpdate?.trim()) { if (idx >= 0) updatedNightBefore[idx] = result.nightBeforeUpdate; else updatedNightBefore.push(result.nightBeforeUpdate); }
        else if (idx >= 0) updatedNightBefore.splice(idx, 1);
      }
      let updatedLunch = [...(plan.lunchCoverage || [])];
      if (result.lunchUpdate) { const li = updatedLunch.findIndex(l => l.day === result.lunchUpdate.day); if (li >= 0) updatedLunch[li] = result.lunchUpdate; }

      // Save meal swap — grocery update is a separate step triggered by the user
      const updatedPlan = { ...plan, meals: updatedMeals, prepSteps: updatedPrepSteps, nightBeforeSteps: updatedNightBefore, lunchCoverage: updatedLunch, groceryNeedsUpdate: true };
      setPlan(updatedPlan);
      setSwapping(null); setSwapInput(""); setSwapStatus("");
      await syncToCloud(updatedPlan);
    } catch (err) { setSwapError(`Swap failed: ${err.message}`); }
    finally { setSwapLoading(false); }
  };

  // ── Grocery regen (separate step after swap) ──────────────────────────────
  const regenGrocery = async () => {
    if (!plan) return;
    setGroceryRegenLoading(true);
    try {
      const mealSummary = plan.meals.map(m => `${m.day}: ${m.name} — ingredients: ${(m.ingredients || []).join(", ")}`).join("\n");
      const gr = await callClaude(GROCERY_PROFILE, `Grocery list for:\n\n${mealSummary}\n\nExtra items: none.`, 4000);
      if (gr.grocery) {
        const updatedPlan = { ...plan, grocery: gr.grocery, groceryNeedsUpdate: false };
        setPlan(updatedPlan);
        await syncToCloud(updatedPlan);
      }
    } catch (err) { setSyncStatus(`⚠️ Grocery update failed: ${err.message}`); }
    finally { setGroceryRegenLoading(false); }
  };

  // ── Recipe URL fetch ──────────────────────────────────────────────────────
  const fetchRecipe = async () => {
    if (!recipeUrl.trim()) return;
    setRecipeLoading(true); setRecipeError(""); setRecipeResult(null);
    try {
      const res = await fetch("/.netlify/functions/fetch-recipe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipeUrl, system: RECIPE_URL_PROFILE, max_tokens: 2000 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message || "Fetch failed");
      const text = data.content?.[0]?.text;
      if (!text) throw new Error("No response");
      let result;
      try { result = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); if (m) result = JSON.parse(m[0]); else throw new Error("Invalid response"); }
      setRecipeResult(result);
    } catch (err) { setRecipeError(`Could not fetch recipe: ${err.message}`); }
    finally { setRecipeLoading(false); }
  };

  // Shared helper: categorize grocery items into sections
  const categorizeItems = (items, existingGrocery) => {
    const grocery = { ...existingGrocery };
    items.forEach(item => {
      const name = (item.i || "").toLowerCase();
      let section = "🧂 Pantry";
      if (name.includes("chicken") || name.includes("beef") || name.includes("salmon") || name.includes("pork") || name.includes("turkey") || name.includes("shrimp") || name.includes("lamb") || name.includes("fish") || name.includes("tuna")) section = "🥩 Meat & Seafood";
      else if (name.includes("tomato") || name.includes("pepper") || name.includes("lettuce") || name.includes("cucumber") || name.includes("lemon") || name.includes("lime") || name.includes("herb") || name.includes("cilantro") || name.includes("parsley") || name.includes("onion") || name.includes("garlic") || name.includes("potato") || name.includes("avocado") || name.includes("fruit") || name.includes("berry") || name.includes("apple") || name.includes("zucchini") || name.includes("broccoli") || name.includes("spinach") || name.includes("kale")) section = "🥦 Produce";
      else if (name.includes("cheese") || name.includes("milk") || name.includes("yogurt") || name.includes("butter") || name.includes("cream") || name.includes("egg")) section = "🧀 Dairy";
      else if (name.includes("rice") || name.includes("pasta") || name.includes("bread") || name.includes("tortilla") || name.includes("bun") || name.includes("quinoa") || name.includes("noodle")) section = "🍚 Grains";
      grocery[section] = [...(grocery[section] || []), item];
    });
    return grocery;
  };

  // Shared helper: update lunch coverage for the day after a replaced meal
  const updateLunchForMeal = (lunchCoverage, meal, makesLeftovers) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sat & Sun"];
    const mealDayShort = meal.day.split(",")[0]; // e.g. "Sunday"
    const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const mealIdx = dayOrder.indexOf(mealDayShort);
    if (mealIdx < 0 || mealIdx >= dayOrder.length - 1) return lunchCoverage;
    const nextDay = days[mealIdx]; // Monday = index 0, Tuesday = 1, etc.
    return lunchCoverage.map(l => {
      if (l.day !== nextDay) return l;
      if (makesLeftovers) return { ...l, ok: true, source: `${mealDayShort} ${meal.name} leftovers`, detail: "2 adults ✅", fix: undefined };
      else return { ...l, ok: false, source: `${mealDayShort} — no leftovers`, fix: "No-cook lunch for 2", detail: undefined };
    });
  };

  const applyRecipe = async () => {
    if (!recipeResult || !plan) return;
    let updatedMeals = [...plan.meals];
    let updatedGrocery = { ...plan.grocery };
    let updatedLunch = [...(plan.lunchCoverage || [])];

    if (recipeAction === "replace" && recipeReplaceId) {
      const mealToReplace = plan.meals.find(m => m.id === recipeReplaceId);
      const newMeal = {
        ...mealToReplace,
        name: recipeResult.name,
        ingredients: recipeResult.ingredients || [],
        steps: [recipeUrl ? `See full recipe at: ${recipeUrl}` : "Prepare as desired."],
        leftoverNote: recipeLeftovers ? "Makes leftovers for next day lunch" : "No planned leftovers",
        spiceNote: "Adjust seasoning to taste. Mild adaptation for teen as needed.",
        estMin: 30, protein: 25,
      };
      updatedMeals = plan.meals.map(m => m.id === recipeReplaceId ? newMeal : m);
      updatedLunch = updateLunchForMeal(updatedLunch, newMeal, recipeLeftovers);
    }

    updatedGrocery = categorizeItems(recipeResult.groceryItems || [], updatedGrocery);
    const updatedPlan = { ...plan, meals: updatedMeals, lunchCoverage: updatedLunch, grocery: updatedGrocery };
    setPlan(updatedPlan);
    setShowRecipePanel(false); setRecipeResult(null); setRecipeUrl("");
    setRecipeAction(null); setRecipeReplaceId(""); setRecipeLeftovers(false);
    await syncToCloud(updatedPlan);
  };

  const applyManual = async () => {
    if (!manualMealName.trim() || !plan) return;
    // Parse ingredients — one per line
    const lines = manualIngredients.split("\n").map(l => l.trim()).filter(Boolean);
    const groceryItems = lines.map(line => ({ i: line, q: "as needed", s: `used in: ${manualMealName}`, c: false }));
    let updatedMeals = [...plan.meals];
    let updatedLunch = [...(plan.lunchCoverage || [])];

    if (manualReplaceId) {
      const mealToReplace = plan.meals.find(m => m.id === manualReplaceId);
      const newMeal = {
        ...mealToReplace,
        name: manualMealName.trim(),
        ingredients: lines.length > 0 ? lines : ["See your own recipe"],
        steps: ["Prepare as desired."],
        leftoverNote: manualLeftovers ? "Makes leftovers for next day lunch" : "No planned leftovers",
        spiceNote: "Adjust seasoning to taste. Mild adaptation for teen as needed.",
        estMin: 30, protein: 25,
      };
      updatedMeals = plan.meals.map(m => m.id === manualReplaceId ? newMeal : m);
      updatedLunch = updateLunchForMeal(updatedLunch, newMeal, manualLeftovers);
    }

    const updatedGrocery = categorizeItems(groceryItems, plan.grocery || {});
    const updatedPlan = { ...plan, meals: updatedMeals, lunchCoverage: updatedLunch, grocery: updatedGrocery };
    setPlan(updatedPlan);
    setShowRecipePanel(false); setManualMealName(""); setManualIngredients("");
    setManualReplaceId(""); setManualLeftovers(false);
    await syncToCloud(updatedPlan);
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

  if (cook && cookId && plan) {
    const m = plan.meals.find(x => x.id === cookId);
    if (m) return <CookScreen meal={m} checked={checked} togStep={togStep} ratings={ratings} setRat={(id, v) => setRat(m, v)} notes={notes} setNotes={setNotes} onExit={() => { setCook(false); setCookId(null); }} onSaveTime={saveTime} />;
  }

  const TABS = ["generate", "dinners", "lunches", "groceries", "history", "settings"];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div style={{ background: G, color: "#f5ede0", padding: "20px 16px 14px", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#a8c5b5", marginBottom: 4 }}>{hasPlan ? `Week of ${plan.weekOf}` : "Family Meal Planner"}</div>
        <h1 style={{ margin: "0 0 5px", fontSize: 21, fontWeight: "normal" }}>{hasPlan ? "Family Meal Plan" : "Let's Plan Your Week"}</h1>
        {hasPlan && <div style={{ fontSize: 11, color: "#a8c5b5", marginBottom: 8 }}>🍕 Friday = Pizza &nbsp;·&nbsp; 🍽️ Saturday = Dining Out</div>}
        {syncStatus && <div style={{ fontSize: 11, color: "#a8c5b5", marginBottom: 6 }}>{syncStatus}</div>}
        {hasPlan && plan.daughterReminder && (
          <div style={{ background: "#fff3cd", color: GOLD, borderRadius: 8, padding: "8px 13px", fontSize: 12, display: "inline-block", maxWidth: 360 }}>
            ⚠️ Ask your daughter what she wants for breakfasts & lunches!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `2px solid ${BD}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: "0 0 auto", padding: "11px 10px", border: "none", background: "none", fontSize: 11, cursor: "pointer", color: tab === t ? G : "#999", fontWeight: tab === t ? "bold" : "normal", borderBottom: tab === t ? `3px solid ${G}` : "3px solid transparent", marginBottom: -2, whiteSpace: "nowrap" }}>
            {t === "generate" ? "✨ Generate" : t === "dinners" ? "🍳 Dinners" : t === "lunches" ? "🥗 Lunches" : t === "groceries" ? "🛒 Groceries" : t === "history" ? "📚 History" : "⚙️ Settings"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "13px 13px 60px" }}>

        {/* ── GENERATE ── */}
        {tab === "generate" && <GenerateTab onPlanGenerated={handlePlanGenerated} plan={plan} favs={favs} tasteProfile={buildTasteProfile()} />}

        {/* ── DINNERS ── */}
        {tab === "dinners" && !hasPlan && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>No meal plan yet</div>
            <div style={{ fontSize: 13 }}>Go to Generate to create this week's plan!</div>
          </div>
        )}

        {tab === "dinners" && hasPlan && <>
          {/* Prep Card */}
          {((plan.prepSteps?.length > 0) || (plan.nightBeforeSteps?.length > 0) || customPrepSteps.length > 0) && (
            <Card>
              <div style={{ padding: "13px 14px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: "#7a9e8e", letterSpacing: 1, textTransform: "uppercase" }}>{plan.prepDay}</span>
                  <Bdg label="🧑‍🍳 Prep" />
                </div>
                <div style={{ fontSize: 15, color: "#222", marginBottom: 4 }}>Weekend Meal Prep</div>
                {plan.prepNote && <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>{plan.prepNote}</div>}

                {(plan.prepSteps?.length > 0) && <>
                  <div style={{ fontSize: 10, fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Prep Day Tasks</div>
                  {plan.prepSteps.map((s, i) => {
                    const key = `prep-${i}`, done = prepChecked[key];
                    const colon = s.indexOf(":");
                    return (
                      <div key={i} onClick={() => togPrep(key)} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "9px 10px", marginBottom: 6, borderRadius: 8, background: done ? "#f0f7f0" : "#fafaf7", border: `1px solid ${done ? "#a5d6a7" : "#eee"}`, cursor: "pointer", opacity: done ? 0.6 : 1 }}>
                        <div style={{ width: 19, height: 19, borderRadius: 4, flexShrink: 0, marginTop: 1, background: done ? "#4caf50" : "#fff", border: `2px solid ${done ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{done ? "✓" : ""}</div>
                        <div style={{ fontSize: 13, color: done ? "#aaa" : "#333", lineHeight: 1.4 }}>
                          {colon > 0 ? <><b style={{ color: done ? "#aaa" : G }}>{s.slice(0, colon)}:</b>{s.slice(colon + 1)}</> : s}
                        </div>
                      </div>
                    );
                  })}
                </>}

                {(plan.nightBeforeSteps?.length > 0) && <>
                  <div style={{ fontSize: 10, fontWeight: "bold", color: "#856404", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, marginTop: 14 }}>🌙 Night-Before Tasks</div>
                  {plan.nightBeforeSteps.map((s, i) => {
                    const key = `nightbefore-${i}`, done = prepChecked[key];
                    const colon = s.indexOf(":");
                    return (
                      <div key={i} onClick={() => togPrep(key)} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "9px 10px", marginBottom: 6, borderRadius: 8, background: done ? "#f0f7f0" : "#fffdf5", border: `1px solid ${done ? "#a5d6a7" : "#f0d080"}`, cursor: "pointer", opacity: done ? 0.6 : 1 }}>
                        <div style={{ width: 19, height: 19, borderRadius: 4, flexShrink: 0, marginTop: 1, background: done ? "#4caf50" : "#fff", border: `2px solid ${done ? "#4caf50" : "#f0d080"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{done ? "✓" : ""}</div>
                        <div style={{ fontSize: 13, color: done ? "#aaa" : "#333", lineHeight: 1.4 }}>
                          {colon > 0 ? <><b style={{ color: done ? "#aaa" : GOLD }}>{s.slice(0, colon)}:</b>{s.slice(colon + 1)}</> : s}
                        </div>
                      </div>
                    );
                  })}
                </>}

                {customPrepSteps.length > 0 && <>
                  <div style={{ fontSize: 10, fontWeight: "bold", color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, marginTop: 14 }}>My Added Steps</div>
                  {customPrepSteps.map((s, i) => {
                    const key = `custom-${i}`, done = prepChecked[key];
                    return (
                      <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "9px 10px", marginBottom: 6, borderRadius: 8, background: done ? "#f0f7f0" : "#fafafa", border: `1px solid ${done ? "#a5d6a7" : "#eee"}` }}>
                        <div onClick={() => togPrep(key)} style={{ width: 19, height: 19, borderRadius: 4, flexShrink: 0, marginTop: 1, background: done ? "#4caf50" : "#fff", border: `2px solid ${done ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", cursor: "pointer" }}>{done ? "✓" : ""}</div>
                        <div style={{ fontSize: 13, color: done ? "#aaa" : "#333", lineHeight: 1.4, flex: 1 }}>{s}</div>
                        <button onClick={() => rmCustomPrep(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>×</button>
                      </div>
                    );
                  })}
                </>}

                {/* Add custom prep step */}
                <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
                  <input value={customPrepInput} onChange={e => setCustomPrepInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomPrep()} placeholder="Add a prep step..." style={{ flex: 1, background: "#fff", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "7px 10px", color: "#333" }} />
                  <button onClick={addCustomPrep} style={{ background: G, color: "#fff", border: "none", borderRadius: 8, padding: "7px 13px", fontSize: 13, cursor: "pointer" }}>Add</button>
                </div>
              </div>
            </Card>
          )}

          {/* Recipe / Manual Meal Panel */}
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => { setShowRecipePanel(!showRecipePanel); setRecipeResult(null); setRecipeError(""); }} style={{ width: "100%", background: showRecipePanel ? "#eef4f1" : "#f5f0e8", border: `1px solid ${showRecipePanel ? G : BD}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: showRecipePanel ? G : "#555", cursor: "pointer", textAlign: "left", fontWeight: showRecipePanel ? "bold" : "normal" }}>
              🍽️ {showRecipePanel ? "Hide Meal Panel" : "Add Your Own Meal"}
            </button>

            {showRecipePanel && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 10, padding: "13px 14px", marginTop: 6 }}>
                {/* Mode tabs */}
                <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
                  {[["url", "🔗 From URL"], ["manual", "✏️ Manual Entry"]].map(([mode, label]) => (
                    <button key={mode} onClick={() => { setRecipeMode(mode); setRecipeResult(null); setRecipeError(""); }} style={{ flex: 1, padding: "8px", border: `2px solid ${recipeMode === mode ? G : BD}`, borderRadius: 8, background: recipeMode === mode ? "#eef4f1" : "#fafaf7", color: recipeMode === mode ? G : "#777", fontSize: 12, cursor: "pointer", fontWeight: recipeMode === mode ? "bold" : "normal" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* URL mode */}
                {recipeMode === "url" && (
                  <div>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>Paste a recipe URL — Claude will extract the ingredients and update your grocery list.</div>
                    <input value={recipeUrl} onChange={e => setRecipeUrl(e.target.value)} placeholder="https://www.example.com/recipe/..." style={{ width: "100%", background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333", boxSizing: "border-box", marginBottom: 8 }} />
                    {recipeError && <div style={{ fontSize: 12, color: "#c62828", marginBottom: 8 }}>{recipeError}</div>}
                    <button onClick={fetchRecipe} disabled={recipeLoading || !recipeUrl.trim()} style={{ width: "100%", background: recipeLoading ? "#aaa" : G, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, cursor: recipeLoading ? "default" : "pointer", fontWeight: "bold", marginBottom: recipeResult ? 12 : 0 }}>
                      {recipeLoading ? "Fetching..." : "🔍 Fetch Recipe"}
                    </button>

                    {recipeResult && (
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: 14, color: G, marginBottom: 6 }}>✅ {recipeResult.name}</div>
                        {recipeResult.warnings?.length > 0 && <div style={{ background: "#fff8ee", border: "1px solid #f0d080", borderRadius: 8, padding: "8px 11px", marginBottom: 10, fontSize: 12, color: GOLD }}>⚠️ {recipeResult.warnings.join(" · ")}</div>}
                        <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
                          {(recipeResult.ingredients || []).slice(0, 6).map((ing, i) => <div key={i}>• {ing}</div>)}
                          {recipeResult.ingredients?.length > 6 && <div style={{ color: "#aaa" }}>...and {recipeResult.ingredients.length - 6} more</div>}
                        </div>

                        {/* Day picker */}
                        <div style={{ fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 6 }}>Assign to a day? (optional)</div>
                        <select value={recipeReplaceId} onChange={e => setRecipeReplaceId(e.target.value)} style={{ width: "100%", background: "#fff", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333", marginBottom: 10, boxSizing: "border-box" }}>
                          <option value="">Just add ingredients to grocery list</option>
                          {plan.meals.map(m => <option key={m.id} value={m.id}>{m.day.split(",")[0]}: {m.name} → replace with {recipeResult.name}</option>)}
                        </select>

                        {recipeReplaceId && (
                          <div onClick={() => setRecipeLeftovers(!recipeLeftovers)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", marginBottom: 10, cursor: "pointer" }}>
                            <div style={{ width: 19, height: 19, borderRadius: 4, background: recipeLeftovers ? G : "#fff", border: `2px solid ${recipeLeftovers ? G : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{recipeLeftovers ? "✓" : ""}</div>
                            <div style={{ fontSize: 13, color: "#333" }}>This meal makes leftovers for next day's lunch</div>
                          </div>
                        )}

                        <button onClick={applyRecipe} style={{ width: "100%", background: G, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, cursor: "pointer", fontWeight: "bold" }}>
                          ✅ {recipeReplaceId ? "Apply — replace meal & update groceries" : "Apply — add ingredients to grocery list"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual mode */}
                {recipeMode === "manual" && (
                  <div>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>Type your meal name and ingredients — we'll add them to the grocery list.</div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 5 }}>Meal name</div>
                    <input value={manualMealName} onChange={e => setManualMealName(e.target.value)} placeholder="e.g. Burgers" style={{ width: "100%", background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333", boxSizing: "border-box", marginBottom: 10 }} />
                    <div style={{ fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 5 }}>Ingredients <span style={{ fontWeight: "normal", color: "#aaa" }}>(one per line)</span></div>
                    <textarea value={manualIngredients} onChange={e => setManualIngredients(e.target.value)} placeholder={"1.75 lbs ground beef\nHamburger buns (GF)\nCheddar cheese slices\nLettuce, tomato, onion\nFrozen fries"} style={{ width: "100%", background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333", minHeight: 100, resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />

                    <div style={{ fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 6 }}>Assign to a day? (optional)</div>
                    <select value={manualReplaceId} onChange={e => setManualReplaceId(e.target.value)} style={{ width: "100%", background: "#fff", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333", marginBottom: 10, boxSizing: "border-box" }}>
                      <option value="">Just add ingredients to grocery list</option>
                      {plan.meals.map(m => <option key={m.id} value={m.id}>{m.day.split(",")[0]}: {m.name} → replace with {manualMealName || "this meal"}</option>)}
                    </select>

                    {manualReplaceId && (
                      <div onClick={() => setManualLeftovers(!manualLeftovers)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", marginBottom: 10, cursor: "pointer" }}>
                        <div style={{ width: 19, height: 19, borderRadius: 4, background: manualLeftovers ? G : "#fff", border: `2px solid ${manualLeftovers ? G : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{manualLeftovers ? "✓" : ""}</div>
                        <div style={{ fontSize: 13, color: "#333" }}>This meal makes leftovers for next day's lunch</div>
                      </div>
                    )}

                    <button onClick={applyManual} disabled={!manualMealName.trim()} style={{ width: "100%", background: !manualMealName.trim() ? "#aaa" : G, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, cursor: !manualMealName.trim() ? "default" : "pointer", fontWeight: "bold" }}>
                      ✅ {manualReplaceId ? "Apply — replace meal & update groceries" : "Apply — add ingredients to grocery list"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meal Cards */}
          {plan.meals.map((m, idx) => {
            const times = actualTimes[m.id] || [];
            const avgSec = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
            const rKey = ratingKey(m); const nKey = noteKey(m);
            return (
              <Card key={m.id}>
                <button onClick={() => setOpenMeal(openMeal === m.id ? null : m.id)} style={{ width: "100%", background: "none", border: "none", padding: "13px 14px", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#7a9e8e", letterSpacing: 1, textTransform: "uppercase" }}>{m.day}</span>
                      <Bdg label={m.badge} />
                      {favs[m.name] && <span>⭐</span>}
                      {ratings[rKey] === "loved" && <span>👍</span>}
                      {ratings[rKey] === "okay" && <span>😐</span>}
                      {ratings[rKey] === "disliked" && <span>👎</span>}
                    </div>
                    <div style={{ fontSize: 15, color: "#222", marginBottom: 2 }}>{m.name}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 11, color: "#bbb" }}>⏱ Est: {m.estMin} min</div>
                      {m.protein && <div style={{ fontSize: 11, color: "#7a9e8e" }}>💪 ~{m.protein}g protein</div>}
                      {avgSec && <div style={{ fontSize: 11, color: "#7a9e8e" }}>Actual avg: {fmtAvg(avgSec)}</div>}
                    </div>
                  </div>
                  {/* Up/down reorder buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 8, paddingTop: 2 }}>
                    <button onClick={e => { e.stopPropagation(); moveMeal(idx, -1); }} disabled={idx === 0} style={{ background: "none", border: `1px solid ${BD}`, borderRadius: 5, padding: "2px 6px", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#ddd" : "#888", fontSize: 11 }}>▲</button>
                    <button onClick={e => { e.stopPropagation(); moveMeal(idx, 1); }} disabled={idx === plan.meals.length - 1} style={{ background: "none", border: `1px solid ${BD}`, borderRadius: 5, padding: "2px 6px", cursor: idx === plan.meals.length - 1 ? "default" : "pointer", color: idx === plan.meals.length - 1 ? "#ddd" : "#888", fontSize: 11 }}>▼</button>
                  </div>
                  <span style={{ fontSize: 13, color: "#ccc" }}>{openMeal === m.id ? "▲" : "▼"}</span>
                </button>

                {openMeal === m.id && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f0ebe2" }}>
                    {times.length > 0 && <div style={{ background: "#eef4f1", borderRadius: 8, padding: "8px 11px", marginTop: 11, marginBottom: 8, fontSize: 12, color: G }}>⏱ Cook history: {times.map((s, i) => `#${i + 1}: ${fmtAvg(s)}`).join(" · ")} · Avg: {fmtAvg(avgSec)}</div>}
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 6, marginTop: times.length ? 4 : 11, marginBottom: 10, flexWrap: "wrap" }}>
                      <button onClick={() => { setCook(true); setCookId(m.id); }} style={{ background: G, color: "#f5ede0", border: "none", borderRadius: 8, padding: "7px 11px", fontSize: 12, cursor: "pointer" }}>🔆 Cook Mode</button>
                      <button onClick={() => togFav(m)} style={{ background: favs[m.name] ? "#fff8e6" : "#f5f0e8", color: favs[m.name] ? GOLD : "#555", border: `1px solid ${favs[m.name] ? "#f0d080" : BD}`, borderRadius: 8, padding: "7px 11px", fontSize: 12, cursor: "pointer" }}>{favs[m.name] ? "⭐ Fav'd" : "☆ Favorite"}</button>
                      <button onClick={() => { setSwapping(swapping === m.id ? null : m.id); setSwapError(""); setSwapInput(""); }} style={{ background: swapping === m.id ? "#fff3cd" : "#f5f0e8", color: swapping === m.id ? GOLD : "#555", border: `1px solid ${swapping === m.id ? "#f0d080" : BD}`, borderRadius: 8, padding: "7px 11px", fontSize: 12, cursor: "pointer" }}>🔄 Swap</button>
                      {[["loved", "👍"], ["okay", "😐"], ["disliked", "👎"]].map(([v, e]) => (
                        <button key={v} onClick={() => setRat(m, v)} style={{ background: ratings[rKey] === v ? (v === "loved" ? "#e8f5e9" : v === "okay" ? "#fff8e1" : "#ffebee") : "#f5f0e8", border: `1px solid ${ratings[rKey] === v ? (v === "loved" ? "#a5d6a7" : v === "okay" ? "#ffe082" : "#ef9a9a") : BD}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer" }}>{e}</button>
                      ))}
                    </div>

                    {/* Swap panel */}
                    {swapping === m.id && (
                      <div style={{ background: "#fffdf5", border: `1px solid #f0d080`, borderRadius: 10, padding: "12px 13px", marginBottom: 11 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: GOLD, marginBottom: 7 }}>🔄 Swap this meal</div>
                        <input value={swapInput} onChange={e => setSwapInput(e.target.value)} placeholder="What are you craving? (or leave blank)" style={{ width: "100%", background: "#fff", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333", boxSizing: "border-box", marginBottom: 8 }} />
                        {swapError && <div style={{ fontSize: 12, color: "#c62828", marginBottom: 8 }}>{swapError}</div>}
                        {swapStatus && <div style={{ fontSize: 12, color: G, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Spinner />{swapStatus}</div>}
                        <div style={{ display: "flex", gap: 7 }}>
                          <button onClick={() => swapMeal(m.id)} disabled={swapLoading} style={{ flex: 1, background: swapLoading ? "#aaa" : GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, cursor: swapLoading ? "default" : "pointer", fontWeight: "bold" }}>
                            {swapLoading ? "Swapping..." : "✨ Generate swap"}
                          </button>
                          <button onClick={() => { setSwapping(null); setSwapInput(""); setSwapError(""); }} style={{ background: "#f5f0e8", color: "#555", border: `1px solid ${BD}`, borderRadius: 8, padding: "9px 13px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    <textarea value={notes[nKey] || ""} onChange={e => setNotes(p => ({ ...p, [nKey]: e.target.value }))} placeholder="Notes for next time..." style={{ width: "100%", background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#444", minHeight: 46, resize: "vertical", boxSizing: "border-box", marginBottom: settings.source ? 7 : 11 }} />
                    {settings.source && <input value={sources[m.id] || ""} onChange={e => setSources(p => ({ ...p, [m.id]: e.target.value }))} placeholder="Recipe source URL (optional)..." style={{ width: "100%", background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#444", boxSizing: "border-box", marginBottom: 11 }} />}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 13 }}>
                      <div style={{ background: "#eef4f1", borderRadius: 8, padding: "8px 11px", fontSize: 13, color: G }}>🥡 <b>Leftovers:</b> {m.leftoverNote}</div>
                      <div style={{ background: "#fff8ee", borderRadius: 8, padding: "8px 11px", fontSize: 13, color: "#7a5c00" }}>🌶️ <b>Spice:</b> {m.spiceNote}</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Ingredients</div>
                    <ul style={{ margin: "0 0 13px 0", paddingLeft: 16 }}>
                      {(m.ingredients || []).map((g, i) => <li key={i} style={{ fontSize: 13, color: g.startsWith("—") ? "#bbb" : "#444", marginBottom: 4, fontStyle: g.startsWith("—") ? "italic" : "normal" }}>{g}</li>)}
                    </ul>
                    <div style={{ fontSize: 10, fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Steps — tap to check off</div>
                    {(m.steps || []).map((step, j) => {
                      const key = `${m.id}-${j}`, done = checked[key], isNote = step.startsWith("💡") || step.startsWith("🐌");
                      return (
                        <div key={j} onClick={() => !isNote && togStep(m.id, j)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 9px", marginBottom: 5, borderRadius: 8, background: done ? "#f0f7f0" : "#fafaf7", border: `1px solid ${done ? "#a5d6a7" : "#eee"}`, cursor: isNote ? "default" : "pointer", opacity: done ? 0.6 : 1 }}>
                          {!isNote && <div style={{ width: 19, height: 19, borderRadius: 4, flexShrink: 0, marginTop: 1, background: done ? "#4caf50" : "#fff", border: `2px solid ${done ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{done ? "✓" : ""}</div>}
                          <div style={{ fontSize: 13, color: isNote ? "#aaa" : done ? "#888" : "#333", fontStyle: isNote ? "italic" : "normal", lineHeight: 1.4 }}>{step}</div>
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
              <div style={{ fontWeight: "bold", fontSize: 13, color: GOLD, marginBottom: 7 }}>⭐ Favorites this week</div>
              {favMeals.map(m => (
                <div key={m.id} style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
                  • {m.name}
                  {notes[noteKey(m)] && <span style={{ color: "#aaa" }}> — "{notes[noteKey(m)]}"</span>}
                  {sources[m.id] && <a href={sources[m.id]} target="_blank" rel="noreferrer" style={{ color: "#2d6a8a", marginLeft: 6, fontSize: 12 }}>source ↗</a>}
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 7 }}>💡 Claude will try to rotate these in next week automatically!</div>
            </div>
          )}
        </>}

        {/* ── LUNCHES ── */}
        {tab === "lunches" && !hasPlan && <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 13 }}>Generate a meal plan first!</div>}
        {tab === "lunches" && hasPlan && (
          <div>
            <Card>
              <div style={{ background: G, color: "#f5ede0", padding: "11px 14px", fontSize: 13 }}>📅 Full Week Lunch Coverage</div>
              {(plan.lunchCoverage || []).map((l, i, arr) => (
                <div key={i} style={{ padding: "11px 14px", borderBottom: i < arr.length - 1 ? "1px solid #f0ebe2" : "none", display: "flex", gap: 10, alignItems: "flex-start", background: l.ok ? "#fff" : "#fffdf7" }}>
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
              <div style={{ fontWeight: "bold", fontSize: 13, color: GOLD, marginBottom: 4 }}>No-Cook Lunch Options</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Mon & Fri: 2 adults · Sat & Sun: all 4</div>
              {(plan.noCookLunch || []).map((item, j) => <div key={j} style={{ fontSize: 13, color: "#555", paddingLeft: 8, marginBottom: 4 }}>• {item}</div>)}
            </div>
            {settings.leftoverTracker && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px", marginBottom: 11 }}>
                <div style={{ fontWeight: "bold", fontSize: 13, color: G, marginBottom: 6 }}>🧊 Leftover Tracker</div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 9 }}>Tap items in fridge to add to next week's plan.</div>
                {LEFTOVER_OPTIONS.map(item => (
                  <div key={item} onClick={() => togLeft(item)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: "1px solid #f5f0ea", cursor: "pointer" }}>
                    <div style={{ width: 19, height: 19, borderRadius: 4, background: lftovrs[item] ? G : "#fff", border: `2px solid ${lftovrs[item] ? G : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{lftovrs[item] ? "✓" : ""}</div>
                    <div style={{ fontSize: 13, color: "#333" }}>{item}</div>
                  </div>
                ))}
                {leftoverList.length > 0 && <div style={{ fontSize: 12, color: "#7a9e8e", marginTop: 8 }}>✅ Will be noted in next week's Generate form.</div>}
              </div>
            )}
            <div style={{ background: "#f0f7ff", border: "1px solid #b0d0f0", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: "bold", fontSize: 13, color: "#1a4a7a", marginBottom: 4 }}>👧 Daughter's Requests</div>
              <div style={{ fontSize: 13, color: "#444" }}>Add her breakfast & lunch requests in the Generate form each week!</div>
            </div>
          </div>
        )}

        {/* ── GROCERIES ── */}
        {tab === "groceries" && !hasPlan && <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 13 }}>Generate a meal plan first!</div>}
        {tab === "groceries" && hasPlan && (
          <div>
            <button onClick={() => cp(groceryText(), setGCopied)} style={{ width: "100%", background: gCopied ? "#2d6a3e" : G, color: "#f5ede0", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, cursor: "pointer", marginBottom: 9, fontWeight: "bold" }}>
              {gCopied ? "✅ Copied! Paste into Cub app or notes" : "📋 Copy Full Grocery List"}
            </button>

            {plan.groceryNeedsUpdate && (
              <div style={{ background: "#fff8ee", border: "1px solid #f0d080", borderRadius: 12, padding: "12px 14px", marginBottom: 11, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, color: GOLD }}>⚠️ A meal was swapped — grocery list may be outdated.</div>
                <button onClick={regenGrocery} disabled={groceryRegenLoading} style={{ background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "8px 13px", fontSize: 12, cursor: groceryRegenLoading ? "default" : "pointer", fontWeight: "bold", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {groceryRegenLoading ? "Updating..." : "Update Now"}
                </button>
              </div>
            )}
            {cartCount > 0 && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "11px 14px", marginBottom: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: G, fontWeight: "bold" }}>🛒 {cartCount} item{cartCount > 1 ? "s" : ""} in cart</div>
                <button onClick={clearCart} style={{ background: "none", border: `1px solid ${BD}`, borderRadius: 8, padding: "5px 11px", fontSize: 12, color: "#888", cursor: "pointer" }}>Clear all</button>
              </div>
            )}
            {settings.quickAdd && (
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px", marginBottom: 11 }}>
                <div style={{ fontWeight: "bold", fontSize: 13, color: G, marginBottom: 7 }}>➕ Quick Add</div>
                <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                  <input value={quickIn} onChange={e => setQuickIn(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuick()} placeholder="Type item and press Enter..." style={{ flex: 1, background: "#fafaf7", border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, padding: "8px 10px", color: "#333" }} />
                  <button onClick={addQuick} style={{ background: G, color: "#fff", border: "none", borderRadius: 8, padding: "8px 13px", fontSize: 13, cursor: "pointer" }}>Add</button>
                </div>
                {quickItems.map((item, i) => {
                  const qKey = `quick-${i}`, inCart = cartChecked[qKey];
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f0ea" }}>
                      <div onClick={() => togCart(qKey)} style={{ display: "flex", gap: 9, alignItems: "center", flex: 1, cursor: "pointer" }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, background: inCart ? "#4caf50" : "#fff", border: `2px solid ${inCart ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>{inCart ? "✓" : ""}</div>
                        <div style={{ fontSize: 13, color: inCart ? "#aaa" : "#333", textDecoration: inCart ? "line-through" : "none" }}>• {item}</div>
                      </div>
                      <button onClick={() => rmQuick(i)} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: 17, padding: "0 4px" }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
              <div style={{ background: "#eef4f1", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: G }}>📦 = Costco</div>
              <div style={{ background: "#fff8ee", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: GOLD }}>🔁 = Staple</div>
            </div>
            {/* All sections expanded by default */}
            {Object.entries(plan.grocery || {}).map(([sec, items]) => {
              if (!items?.length) return null;
              return (
                <div key={sec} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: "bold", color: G, marginBottom: 8, paddingLeft: 2 }}>{sec}</div>
                  {items.map((it, j) => {
                    const st = it.s?.includes("🔁");
                    const cartKey = `${sec}-${j}`, inCart = cartChecked[cartKey];
                    return (
                      <div key={j} onClick={() => togCart(cartKey)} style={{ padding: "9px 11px", marginBottom: 6, borderRadius: 8, background: inCart ? "#f0f7f0" : it.c ? "#f0f7f4" : st ? "#fffdf5" : "#fafafa", border: `1px solid ${inCart ? "#a5d6a7" : it.c ? "#c8e6d8" : st ? "#f0e0a0" : "#eee"}`, cursor: "pointer", opacity: inCart ? 0.6 : 1, display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 19, height: 19, borderRadius: 4, flexShrink: 0, marginTop: 1, background: inCart ? "#4caf50" : "#fff", border: `2px solid ${inCart ? "#4caf50" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{inCart ? "✓" : ""}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: "600", color: inCart ? "#aaa" : "#222", flex: 1, textDecoration: inCart ? "line-through" : "none" }}>{it.c && <span style={{ marginRight: 4 }}>📦</span>}{st && <span style={{ marginRight: 4 }}>🔁</span>}{it.i}</div>
                            <div style={{ fontSize: 12, fontWeight: "bold", color: inCart ? "#aaa" : G, whiteSpace: "nowrap" }}>{it.q}</div>
                          </div>
                          {!st && <div style={{ fontSize: 11, color: inCart ? "#ccc" : "#2d6a8a", marginTop: 2, fontStyle: "italic" }}>📐 {it.s}</div>}
                          {st && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{it.s?.replace("🔁 ", "")}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div style={{ background: "#f0f7ff", border: "1px solid #b0d0f0", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: "bold", fontSize: 13, color: "#1a4a7a", marginBottom: 4 }}>👧 Daughter's Items — TBD</div>
              <div style={{ fontSize: 13, color: "#444" }}>Add her requests in the Generate form and they'll appear automatically!</div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div>
            <div style={{ background: "#eef4f1", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: G }}>
              Past meal plans from the last 3 months. Tap any week to browse or use as a starting point.
            </div>
            {viewingPast ? (
              <div>
                <button onClick={() => setViewingPast(null)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: G, fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}>← Back to history</button>
                <div style={{ background: G, color: "#f5ede0", borderRadius: 12, padding: "13px 15px", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#a8c5b5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Past Plan</div>
                  <div style={{ fontSize: 17 }}>Week of {viewingPast.weekOf}</div>
                </div>
                <button onClick={() => {
                  const meals = viewingPast.meals?.map(m => m.name).join(", ");
                  setTab("generate");
                  setViewingPast(null);
                  setTimeout(() => window.dispatchEvent(new CustomEvent("prefill-generate", { detail: { hint: meals, weekOf: viewingPast.weekOf } })), 100);
                }} style={{ width: "100%", background: GOLD, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", fontWeight: "bold", marginBottom: 14 }}>
                  🔄 Use this week as a starting point
                </button>
                {(viewingPast.meals || []).map((m, i) => (
                  <Card key={i}>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "#7a9e8e", letterSpacing: 1, textTransform: "uppercase" }}>{m.day}</span>
                        <Bdg label={m.badge} />
                      </div>
                      <div style={{ fontSize: 15, color: "#222", marginBottom: 6 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#bbb", marginBottom: 10 }}>⏱ Est: {m.estMin} min{m.protein ? ` · 💪 ~${m.protein}g protein` : ""}</div>
                      <div style={{ fontSize: 11, fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Ingredients</div>
                      <ul style={{ margin: "0 0 10px", paddingLeft: 16 }}>
                        {(m.ingredients || []).map((g, j) => <li key={j} style={{ fontSize: 13, color: "#555", marginBottom: 3 }}>{g}</li>)}
                      </ul>
                      <div style={{ fontSize: 11, fontWeight: "bold", color: G, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Steps</div>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {(m.steps || []).map((s, j) => <li key={j} style={{ fontSize: 13, color: s.startsWith("💡") ? "#aaa" : "#444", marginBottom: 4, fontStyle: s.startsWith("💡") ? "italic" : "normal" }}>{s}</li>)}
                      </ol>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              history.length === 0
                ? <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}><div style={{ fontSize: 32, marginBottom: 12 }}>📚</div><div style={{ fontSize: 13 }}>No past plans yet!</div></div>
                : history.map((record, i) => {
                  const p = record.data;
                  const isCurrentWeek = i === 0;
                  return (
                    <div key={record.id} onClick={() => setViewingPast(p)} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${isCurrentWeek ? G : BD}`, padding: "13px 15px", marginBottom: 10, cursor: "pointer", boxShadow: "0 1px 5px rgba(0,0,0,.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          {isCurrentWeek && <div style={{ fontSize: 10, color: G, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Current Week</div>}
                          <div style={{ fontSize: 15, color: "#222", marginBottom: 5 }}>Week of {p.weekOf}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {(p.meals || []).map(m => <span key={m.id} style={{ fontSize: 11, background: "#f5f0e8", borderRadius: 20, padding: "2px 9px", color: "#666" }}>{m.name}</span>)}
                          </div>
                        </div>
                        <span style={{ fontSize: 13, color: "#ccc" }}>›</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div>
            <div style={{ background: "#eef4f1", borderRadius: 12, padding: "11px 14px", marginBottom: 14, fontSize: 13, color: G }}>Toggle features on or off. Changes take effect immediately.</div>
            {/* Taste Profile */}
            {buildTasteProfile() && <>
              <Sec title="Your Taste Profile" />
              <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px", marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Built from your ratings and notes. Sent to Claude every week automatically.</div>
                {Object.entries(ratings).filter(([, v]) => v === "loved").length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: "bold", color: G, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>👍 Loved</div>
                    <div style={{ fontSize: 13, color: "#333" }}>{Object.entries(ratings).filter(([, v]) => v === "loved").map(([n]) => n).join(", ")}</div>
                  </div>
                )}
                {Object.entries(ratings).filter(([, v]) => v === "disliked").length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: "bold", color: "#c62828", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>👎 Disliked</div>
                    <div style={{ fontSize: 13, color: "#333" }}>{Object.entries(ratings).filter(([, v]) => v === "disliked").map(([n]) => n).join(", ")}</div>
                  </div>
                )}
                {Object.entries(notes).filter(([, v]) => v?.trim()).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: "bold", color: GOLD, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>📝 Notes</div>
                    {Object.entries(notes).filter(([, v]) => v?.trim()).slice(0, 8).map(([name, note]) => (
                      <div key={name} style={{ fontSize: 13, color: "#555", marginBottom: 3 }}>• <b>{name}:</b> {note}</div>
                    ))}
                  </div>
                )}
                <button onClick={() => { if (window.confirm("Clear all ratings and notes? This will reset your taste profile.")) { setRatings({}); setNotes({}); } }} style={{ marginTop: 10, background: "none", border: `1px solid #ef9a9a`, borderRadius: 8, padding: "6px 13px", fontSize: 12, color: "#c62828", cursor: "pointer" }}>
                  🗑 Clear taste profile
                </button>
              </div>
            </>}

            <Sec title="Features" />            {Object.entries(SET_LABELS).map(([k, [lbl, desc]]) => (
              <div key={k} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${BD}`, padding: "12px 14px", marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 11 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#222", fontWeight: "500" }}>{lbl}</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{desc}</div>
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
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f0ea", fontSize: 13 }}>
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
                <div style={{ fontSize: 13, color: "#333", marginBottom: 8 }}>Week of <b>{plan.weekOf}</b></div>
                {plan.meals.map(m => (
                  <div key={m.id} style={{ fontSize: 13, color: "#555", padding: "4px 0", borderBottom: "1px solid #f5f0ea" }}>
                    {m.day.split(",")[0]}: {m.name}
                    {ratings[ratingKey(m)] && <span style={{ marginLeft: 8 }}>{ratings[ratingKey(m)] === "loved" ? "👍" : ratings[ratingKey(m)] === "okay" ? "😐" : "👎"}</span>}
                  </div>
                ))}
                <button onClick={() => { if (window.confirm("Clear this week's plan and start fresh?")) { setPlan(null); setTab("generate"); } }} style={{ marginTop: 12, background: "none", border: `1px solid #ef9a9a`, borderRadius: 8, padding: "7px 14px", fontSize: 12, color: "#c62828", cursor: "pointer" }}>
                  🗑 Clear plan & start fresh
                </button>
              </div>
            </>}
            <Sec title="How to save this app" />
            <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px" }}>
              {[["📱", "Add to Home Screen", "iPhone: Share → 'Add to Home Screen'. Android: Chrome menu → 'Add to Home Screen'."], ["🔖", "Bookmark this site", "Bookmark the Netlify URL in your browser."]].map(([icon, title, desc], i) => (
                <div key={i} style={{ display: "flex", gap: 11, marginBottom: i < 1 ? 13 : 0, paddingBottom: i < 1 ? 13 : 0, borderBottom: i < 1 ? "1px solid #f0ebe2" : "none" }}>
                  <div style={{ fontSize: 21, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: "#222", marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
