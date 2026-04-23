import React, { useState, useEffect, useRef } from "react";

const G = "#2d4a3e", CREAM = "#f7f4ef", BD = "#e8e2d8", GOLD = "#856404";

// ── Persistent state hook ─────────────────────────────────────────────────────
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
  const start = () => { t0.current = Date.now() - elapsed*1000; setRunning(true); };
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setElapsed(0); };
  useEffect(() => {
    if (running) { iv.current = setInterval(()=>setElapsed(Math.floor((Date.now()-t0.current)/1000)),500); }
    else clearInterval(iv.current);
    return ()=>clearInterval(iv.current);
  }, [running]);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  return { running, elapsed, start, pause, reset, fmt };
}

// ── Static data ───────────────────────────────────────────────────────────────
const DEF_SETTINGS = { twoWeek:true, leftoverTracker:true, budget:true, source:true, quickAdd:true };
const SET_LABELS = {
  twoWeek:["Two-Week Meal Log","Avoid repeating last week's meals"],
  leftoverTracker:["Leftover Tracker","Track what's in the fridge mid-week"],
  budget:["Budget Estimate","Rough weekly grocery cost"],
  source:["Recipe Source URLs","Link meals to original recipe sources"],
  quickAdd:["Quick Grocery Add","Add one-off items to the list"],
};

const PREP = {
  day:"Saturday, Apr 26", label:"🧑‍🍳 Prep — Before Dining Out", name:"Weekend Meal Prep",
  note:"Knock these out before dinner. Makes Sun–Wed nights dramatically easier.",
  steps:[
    "TACO MEAT (Sun dinner + Tue lunch): Brown 2 lbs ground beef in garlic oil. Drain. Add 2½ tsp cumin, 1¼ tsp chili powder, 1¼ tsp paprika, ½ tsp salt, ¼ tsp pepper. Cook 2 min. Cool and refrigerate. (1.5 lbs dinner, ~0.5 lbs Tue lunch.)",
    "KOREAN BEEF SAUCE (Mon): Mix 3 tbsp GF tamari, 1 tbsp sesame oil, 2 tbsp brown sugar, 1 tsp ginger in a jar. Refrigerate.",
    "BELL PEPPERS (Tue): Slice 3 mixed bell peppers. Zip bag in fridge.",
    "GYRO MARINADE + CHICKEN (Wed): Mix 3 tbsp garlic oil, juice of 1 lemon, 1 tsp each cumin/paprika/oregano, salt & pepper. Marinate 1.5 lbs sliced chicken in zip bag overnight.",
  ],
};

const MEALS = [
  { id:"sun", day:"Sunday, Apr 27", badge:"⚡ Reluctant Cook · 5 min", name:"Ground Beef Tacos",
    estMin:5, time:"5 min (meat pre-browned Sat)", source:"",
    left:"~0.5 lbs taco meat → Tuesday lunch rice bowls",
    spice:"Adults add hot sauce/jalapeños. Teen builds mild bar.",
    ing:["Pre-browned taco meat (1.5 lbs of 2 lbs from Sat)","8–10 corn tortillas (2–3 per person)","Green onion tops","Shredded lettuce","Cherry tomatoes, halved","Shredded lactose-free cheese","Compliant salsa","Optional: jalapeños, hot sauce"],
    steps:["Reheat taco meat in skillet 3–4 min, or microwave 2 min.","Warm tortillas: damp paper towel, microwave 45 sec.","Set out toppings and build tacos.","💡 Save ~0.5 lbs taco meat — Tuesday lunch rice bowls."] },
  { id:"mon", day:"Monday, Apr 28", badge:"⚡ Reluctant Cook · 15 min", name:"Korean Beef Rice Bowls",
    estMin:15, time:"15 min · One Pan", source:"",
    left:"Leftovers → Wednesday lunch for 2 adults",
    spice:"Plate teen first. Adults add red pepper flakes.",
    ing:["1.5 lbs ground beef (80/20)","1 tbsp garlic-infused olive oil","Pre-made Korean sauce jar (Sat prep)","3 rice packets (8.5 oz, serves 2) — 2 dinner + 1 lunch","Red pepper flakes (adults)","Green onion tops","Sesame seeds (optional)"],
    steps:["Start 3 rice packets in microwave (90 sec each).","Heat oil in large skillet medium-high. Brown beef 5–7 min. Drain.","Pour sauce over beef. Simmer 2–3 min.","Plate teen's portion over rice now.","Add red pepper flakes for adults. Simmer 1 more min.","Serve over rice with green onions and sesame seeds.","💡 Pack extra beef + rice for Wednesday lunch."] },
  { id:"tue", day:"Tuesday, Apr 29", badge:"⚡ Reluctant Cook · 25 min", name:"Sheet Pan Salmon with Bell Peppers",
    estMin:25, time:"25 min · Sheet Pan", source:"",
    left:"2 extra fillets + rice → Thursday lunch for 2 adults",
    spice:"Season teen's fillet plain first, then add cayenne to adults'.",
    ing:["6 salmon fillets (6 oz each — 4 dinner + 2 Thu lunch)","2 tbsp garlic-infused olive oil","2 lemons (1 juiced, 1 sliced)","1 tsp rosemary, 1 tsp paprika, salt & pepper","Pre-sliced bell peppers (Sat prep, 3 peppers)","3 rice packets (8.5 oz, serves 2) — 2 dinner + 1 lunch","Optional adults: ½ tsp cayenne"],
    steps:["Preheat oven to 400°F. Line sheet pan with foil.","Spread peppers on one side with 1 tbsp oil, salt, pepper.","Pat salmon dry. Place on other side.","Mix oil, lemon juice, rosemary, paprika, salt, pepper.","Brush teen's fillet first. Add cayenne for adults.","Top with lemon slices. Bake 12–15 min.","Microwave 3 rice packets (90 sec) while salmon bakes.","💡 Pack 2 salmon portions + peppers + rice for Thursday lunch."] },
  { id:"wed", day:"Wednesday, Apr 30", badge:"Husband Cooks · 30 min", name:"Chicken Gyros with Tzatziki",
    estMin:30, time:"30 min (chicken marinated since Sat)", source:"",
    left:"No leftovers — Wednesday lunch covered by Monday's Korean beef.",
    spice:"Naturally mild. Adults add hot sauce or jalapeños.",
    ing:["Pre-marinated chicken strips (1.5 lbs, Sat prep)","4 GF pitas or lettuce leaves (1 per person)","1 cucumber sliced, cherry tomatoes, green onion tops","— Tzatziki —","1 cup (8 oz) lactose-free plain yogurt","½ cucumber grated + squeezed dry","1 tbsp garlic oil, 1 tbsp dill, juice ½ lemon, salt"],
    steps:["Make tzatziki: combine yogurt, grated cucumber (squeezed dry), garlic oil, dill, lemon juice, salt. Refrigerate.","Heat skillet medium-high. Cook chicken 3–4 min per side until golden. Batch if needed.","Warm pitas in dry skillet or microwave.","Set out toppings. Build wraps and serve."] },
  { id:"thu", day:"Thursday, May 1", badge:"⚡ Fastest Meal · 15 min", name:"Ground Turkey & Rice Skillet",
    estMin:15, time:"15 min · One Pan", source:"",
    left:"No leftovers — Thursday lunch covered by Tuesday's salmon.",
    spice:"Plate teen first, then add red pepper flakes for adults.",
    ing:["1.5 lbs ground turkey (93% lean)","1 tbsp garlic-infused olive oil","1 can (14 oz) plain diced tomatoes","1 tsp cumin, 1 tsp paprika, ½ tsp oregano, salt & pepper","2 rice packets (8.5 oz each, serves 2)","Green onion tops, ~2 oz lactose-free cheddar (optional)","Optional: red pepper flakes adults"],
    steps:["Start 2 rice packets in microwave (90 sec).","Heat oil in large skillet medium-high.","Brown turkey 5–6 min, break apart. Drain liquid.","Add tomatoes + spices. Stir. Simmer 3–4 min.","Plate teen's portion over rice.","Add red pepper flakes for adults. Plate remainder.","Top with green onions + cheese. Done ✅"] },
];

const GROCERY = {
  "🥦 Produce":[
    {i:"Bell peppers, mixed",q:"6 total",s:"Medium · Tue dinner (3, Sat prep) + lunches (3 sides)",c:false},
    {i:"Lemons",q:"5 total",s:"Sat prep (2) · Tue salmon (2) · Wed tzatziki (½)",c:false},
    {i:"Cucumber",q:"3 total",s:"English · Wed gyros (1) + tzatziki (½) + lunches (1½)",c:false},
    {i:"Cherry tomatoes",q:"2 pints",s:"Sun tacos · Wed gyros · lunches",c:false},
    {i:"Shredded lettuce",q:"1 bag (10–12 oz)",s:"Sun tacos · lunches",c:false},
    {i:"Green onions (tops)",q:"2 bunches",s:"Sun · Mon · Thu · lunches",c:false},
    {i:"Fresh dill or dried",q:"1 bunch or jar",s:"~1 tbsp fresh / ½ tsp dried · Wed tzatziki",c:false},
    {i:"Ginger paste (tube)",q:"1 tube",s:"~1 tsp · Mon Korean beef sauce",c:false},
    {i:"Fresh fruit",q:"1–2 pints",s:"Mon/Fri/weekend no-cook lunches",c:false},
  ],
  "🥩 Meat & Seafood":[
    {i:"Ground beef (80/20)",q:"3.5 lbs",s:"2 lbs Sat taco prep (1.5 dinner + 0.5 Tue lunch) · 1.5 lbs Mon Korean beef",c:true},
    {i:"Ground turkey (93%)",q:"1.5 lbs",s:"1.5 lbs feeds 4 · Thu skillet",c:false},
    {i:"Salmon fillets",q:"6 × 6 oz",s:"6 oz per person · 4 dinner + 2 Thu lunch",c:true},
    {i:"Chicken breast/thighs",q:"1.5 lbs",s:"1.5 lbs feeds 4 as wrap filling · Wed gyros",c:false},
    {i:"GF deli turkey",q:"~¾–1 lb",s:"3–4 oz per person · Mon/Fri (2) + Sat/Sun (4)",c:true},
  ],
  "🧀 Dairy":[
    {i:"Lactose-free milk",q:"Usual amount",s:"🔁 Weekly staple",c:false},
    {i:"Butter",q:"1 lb",s:"🔁 Weekly staple",c:false},
    {i:"Lactose-free plain yogurt",q:"8 oz container",s:"Makes ~1½ cups tzatziki for 4 · Wed",c:false},
    {i:"Shredded lactose-free cheese",q:"1 bag (8 oz)",s:"Tacos for 4 + optional Thu skillet topping",c:false},
    {i:"Lactose-free cheese slices",q:"1 pack (12–16)",s:"2 slices per person · Mon/Fri/weekend lunches",c:false},
  ],
  "🧂 Pantry":[
    {i:"Garlic-infused olive oil",q:"1 bottle (check supply)",s:"Used in ALL dinners + Sat prep",c:true},
    {i:"GF tamari or coconut aminos",q:"1 bottle",s:"~3 tbsp · Mon Korean beef sauce",c:false},
    {i:"Sesame oil",q:"1 small bottle",s:"~1 tbsp · Mon Korean beef sauce",c:false},
    {i:"Corn tortillas",q:"1 pack (10–12)",s:"2–3 per person for 4 · Sun tacos",c:true},
    {i:"GF pita bread",q:"1 pack (4–6)",s:"1 per person · Wed gyros (TJ's or Lunds)",c:false},
    {i:"Compliant salsa",q:"1 jar (16 oz)",s:"No garlic/onion high on label · Sun tacos",c:false},
    {i:"Diced tomatoes, plain",q:"1 can (14 oz)",s:"No garlic/onion added · Thu turkey skillet",c:false},
    {i:"GF chips",q:"1–2 bags",s:"Crunchy side · Mon/Fri/weekend lunches",c:false},
    {i:"Chili garlic sauce",q:"1 bottle",s:"Adults only · Mon Korean beef",c:false},
    {i:"Schar Sourdough Bread",q:"2 loaves",s:"🔁 Weekly staple · no-cook lunches",c:false},
    {i:"Goldfish crackers",q:"1 large box",s:"🔁 Weekly staple · lunch sides",c:true},
  ],
  "🍚 Grains":[
    {i:"Microwaveable rice packets",q:"7 minimum",s:"8.5 oz pouches, serves 2 · Mon (3) + Tue (3) + Thu (2) + Tue lunch (1) = 7",c:true},
  ],
  "🧊 Frozen":[{i:"Uncrustables",q:"1 box",s:"🔁 Weekly staple",c:true}],
  "🥤 Beverages":[
    {i:"Polar sparkling water",q:"7 cases",s:"🔁 Weekly staple",c:true},
    {i:"Bubblr sparkling water",q:"2 flavors",s:"🔁 Weekly staple",c:true},
  ],
  "🥚 Eggs & Staples":[
    {i:"Eggs",q:"4 dozen",s:"🔁 Weekly staple",c:true},
    {i:"Orange cups",q:"1 pack",s:"🔁 Weekly staple · lunches",c:true},
  ],
};

const BUDGET_BASE = 265;
const LUNCH_DATA = [
  {day:"Monday",ok:false,src:"Saturday = dining out",fix:"No-cook deli lunch for 2"},
  {day:"Tuesday",ok:true,src:"Sunday taco meat → rice bowls",det:"2 adults ✅"},
  {day:"Wednesday",ok:true,src:"Monday Korean beef & rice",det:"2 adults ✅"},
  {day:"Thursday",ok:true,src:"Tuesday salmon + peppers + rice",det:"2 adults ✅"},
  {day:"Friday",ok:false,src:"Pizza night — no leftovers",fix:"No-cook deli lunch for 2"},
  {day:"Sat & Sun",ok:false,src:"No dinner leftovers",fix:"No-cook lunch for all 4"},
];
const NO_COOK = ["GF deli turkey on Schar sourdough or rice cakes","Lactose-free cheese slices","Cucumber slices or bell pepper strips","Goldfish crackers or GF chips 🍟","Orange cup or fresh fruit"];
const LEFTOVER_OPTIONS = ["Taco meat","Korean beef + rice","Salmon + peppers + rice","Turkey skillet","Tzatziki","Rotisserie chicken","Cooked rice"];
const PROMPT_QS = [
  {id:"date",label:"Week start date?",ph:"e.g. Sunday, May 4"},
  {id:"ingredients",label:"Ingredients to use up?",ph:"e.g. rotisserie chicken — or 'nothing special'"},
  {id:"schedule",label:"Scheduling notes?",ph:"e.g. husband out Mon–Tue, need fast meals"},
  {id:"daughter",label:"Daughter's breakfast & lunch requests?",ph:"e.g. waffles, quesadillas — or TBD"},
  {id:"prepday",label:"Prep day this week?",ph:"Sunday (default) or Saturday"},
  {id:"other",label:"Anything else?",ph:"New cuisine, avoid a protein, special occasion..."},
];

// ── Small components ──────────────────────────────────────────────────────────
function Toggle({val,on}) {
  return <div onClick={on} style={{width:40,height:22,borderRadius:11,cursor:"pointer",background:val?G:"#ccc",position:"relative",transition:"background .2s",flexShrink:0}}>
    <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:val?21:3,transition:"left .2s"}}/>
  </div>;
}
function Card({children,style={}}) {
  return <div style={{background:"#fff",borderRadius:12,border:`1px solid ${BD}`,overflow:"hidden",boxShadow:"0 1px 5px rgba(0,0,0,.04)",marginBottom:12,...style}}>{children}</div>;
}
function Sec({title}) {
  return <div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:"bold",color:"#bbb",letterSpacing:2,textTransform:"uppercase",margin:"18px 0 7px",paddingLeft:2}}>{title}</div>;
}
function Bdg({label}) {
  const fl=label.includes("⚡"),pr=label.includes("🧑"),hu=label.includes("Husband");
  return <span style={{fontSize:10,borderRadius:20,padding:"2px 8px",fontFamily:"sans-serif",background:fl?"#fff3cd":pr?"#e8f4f1":hu?"#eef4f1":"#f0f0f0",color:fl?GOLD:pr?G:hu?G:"#555"}}>{label}</span>;
}

// ── Cook Mode screen ──────────────────────────────────────────────────────────
function CookScreen({meal, checked, togStep, ratings, setRat, notes, setNotes, onExit, onSaveTime}) {
  const timer = useTimer();
  const [saved, setSaved] = useState(false);
  const [showSave, setShowSave] = useState(false);

  const handleExit = () => {
    if (timer.elapsed > 0 && !saved) setShowSave(true);
    else onExit();
  };

  const saveAndExit = () => {
    onSaveTime(meal.id, timer.elapsed);
    setSaved(true);
    onExit();
  };

  const estColor = () => {
    if (!saved || timer.elapsed === 0) return "#7a9e8e";
    const diff = timer.elapsed/60 - meal.estMin;
    return diff > 5 ? "#ef9a9a" : diff < -3 ? "#a5d6a7" : "#7a9e8e";
  };

  return (
    <div style={{minHeight:"100vh",background:"#1a2e27",color:"#f5ede0",paddingBottom:40}}>
      <div style={{background:"#0f1f1a",padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
        <div>
          <div style={{fontSize:10,color:"#7a9e8e",letterSpacing:2,textTransform:"uppercase",fontFamily:"sans-serif"}}>🔆 Cook Mode</div>
          <div style={{fontSize:17,marginTop:2}}>{meal.name}</div>
        </div>
        <button onClick={handleExit} style={{background:"#2d4a3e",border:"none",color:"#f5ede0",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontFamily:"sans-serif",fontSize:13}}>✕ Exit</button>
      </div>

      {/* Timer */}
      <div style={{margin:"14px 14px 0",background:"#0f2a22",borderRadius:12,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:11,fontFamily:"sans-serif",color:"#7a9e8e",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Cook Timer</div>
        <div style={{fontSize:48,fontFamily:"monospace",color:timer.running?"#a8d8a8":"#f5ede0",letterSpacing:2,marginBottom:10}}>
          {timer.fmt(timer.elapsed)}
        </div>
        <div style={{fontSize:12,fontFamily:"sans-serif",color:"#7a9e8e",marginBottom:12}}>
          Estimated: <b style={{color:"#f5ede0"}}>{meal.estMin} min</b>
          {timer.elapsed>0&&<span style={{marginLeft:10,color:estColor()}}>
            {Math.abs(Math.round(timer.elapsed/60-meal.estMin))} min {timer.elapsed/60>meal.estMin?"over":"under"} estimate
          </span>}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          {!timer.running
            ? <button onClick={timer.start} style={{background:G,color:"#f5ede0",border:"none",borderRadius:8,padding:"10px 22px",fontFamily:"sans-serif",fontSize:14,cursor:"pointer",fontWeight:"bold"}}>{timer.elapsed===0?"▶ Start":"▶ Resume"}</button>
            : <button onClick={timer.pause} style={{background:"#856404",color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontFamily:"sans-serif",fontSize:14,cursor:"pointer",fontWeight:"bold"}}>⏸ Pause</button>
          }
          {timer.elapsed>0&&<button onClick={timer.reset} style={{background:"transparent",color:"#7a9e8e",border:"1px solid #2d5a48",borderRadius:8,padding:"10px 16px",fontFamily:"sans-serif",fontSize:13,cursor:"pointer"}}>↺ Reset</button>}
        </div>
      </div>

      {/* Save time prompt */}
      {showSave&&<div style={{margin:"12px 14px 0",background:"#0f2a22",borderRadius:12,padding:"14px",border:"1px solid #2d5a48"}}>
        <div style={{fontFamily:"sans-serif",fontSize:13,color:"#f0e8d8",marginBottom:10}}>
          You cooked for <b>{timer.fmt(timer.elapsed)}</b> (estimated {meal.estMin} min). Save this time?
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={saveAndExit} style={{flex:1,background:G,color:"#f5ede0",border:"none",borderRadius:8,padding:"9px",fontFamily:"sans-serif",fontSize:13,cursor:"pointer",fontWeight:"bold"}}>✅ Save & Exit</button>
          <button onClick={onExit} style={{flex:1,background:"transparent",color:"#7a9e8e",border:"1px solid #2d5a48",borderRadius:8,padding:"9px",fontFamily:"sans-serif",fontSize:13,cursor:"pointer"}}>Skip</button>
        </div>
      </div>}

      <div style={{maxWidth:600,margin:"0 auto",padding:"12px 14px"}}>
        {/* Ingredients */}
        <div style={{background:"#0f2a22",borderRadius:12,padding:"13px",marginBottom:14}}>
          <div style={{fontSize:10,fontFamily:"sans-serif",color:"#a8c5b5",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>Ingredients</div>
          {meal.ing.map((g,i)=><div key={i} style={{fontSize:15,fontFamily:"sans-serif",color:g.startsWith("—")?"#7a9e8e":"#e8d8c0",marginBottom:5,fontStyle:g.startsWith("—")?"italic":"normal"}}>{g}</div>)}
        </div>
        {/* Steps */}
        <div style={{fontSize:10,fontFamily:"sans-serif",color:"#a8c5b5",marginBottom:9,textTransform:"uppercase",letterSpacing:1}}>Steps — tap to check off</div>
        {meal.steps.map((step,i)=>{
          const key=`${meal.id}-${i}`,done=checked[key],isNote=step.startsWith("💡")||step.startsWith("🐌");
          return <div key={i} onClick={()=>!isNote&&togStep(meal.id,i)} style={{display:"flex",gap:12,alignItems:"flex-start",background:done?"#0f2a22":"#1e3830",borderRadius:10,padding:"13px 14px",marginBottom:9,cursor:isNote?"default":"pointer",opacity:done?.5:1,border:`1px solid ${done?"#2d4a3e":"#2d5a48"}`}}>
            {!isNote&&<div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:done?"#4caf50":"transparent",border:`2px solid ${done?"#4caf50":"#7a9e8e"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff"}}>{done?"✓":<span style={{fontSize:11,color:"#7a9e8e"}}>{i+1}</span>}</div>}
            <div style={{fontSize:15,fontFamily:"sans-serif",color:isNote?"#7a9e8e":"#f0e8d8",lineHeight:1.5,fontStyle:isNote?"italic":"normal"}}>{step}</div>
          </div>;
        })}
        {/* Rating */}
        <div style={{background:"#0f2a22",borderRadius:12,padding:"14px",marginTop:6}}>
          <div style={{fontSize:12,fontFamily:"sans-serif",color:"#a8c5b5",marginBottom:9}}>How was it?</div>
          <div style={{display:"flex",gap:7,marginBottom:11}}>
            {[["loved","👍 Loved it"],["okay","😐 Okay"],["disliked","👎 Nope"]].map(([v,l])=>(
              <button key={v} onClick={()=>setRat(meal.id,v)} style={{flex:1,padding:"9px 4px",border:`2px solid ${ratings[meal.id]===v?"#4caf50":"#2d5a48"}`,background:ratings[meal.id]===v?"#1a4a30":"transparent",borderRadius:8,color:"#f0e8d8",fontFamily:"sans-serif",fontSize:12,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
          <textarea value={notes[meal.id]||""} onChange={e=>setNotes(p=>({...p,[meal.id]:e.target.value}))} placeholder="Notes for next time..." style={{width:"100%",background:"#1e3830",border:"1px solid #2d5a48",borderRadius:8,color:"#f0e8d8",fontFamily:"sans-serif",fontSize:13,padding:"9px 11px",minHeight:60,resize:"vertical",boxSizing:"border-box"}}/>
        </div>
      </div>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab] = useState("dinners");
  const [openMeal,setOpenMeal] = useState(null);
  const [openGrp,setOpenGrp] = useState(null);
  const [prepOpen,setPrepOpen] = useState(false);
  const [cook,setCook] = useState(false);
  const [cookId,setCookId] = useState(null);
  const [checked,setChecked] = useState({});
  const [ratings,setRatings] = usePersist("mp_ratings",{});
  const [notes,setNotes] = usePersist("mp_notes",{});
  const [sources,setSources] = usePersist("mp_sources",{});
  const [favs,setFavs] = usePersist("mp_favs",{});
  const [pAnswers,setPAnswers] = usePersist("mp_prompt",{});
  const [promptDone,setPromptDone] = useState(false);
  const [copied,setCopied] = useState(false);
  const [gCopied,setGCopied] = useState(false);
  const [settings,setSettings] = usePersist("mp_settings",DEF_SETTINGS);
  const [lastWeek,setLastWeek] = usePersist("mp_lastweek","");
  const [lftovrs,setLftovrs] = usePersist("mp_leftovers",{});
  const [quickItems,setQuickItems] = usePersist("mp_quickitems",[]);
  const [quickIn,setQuickIn] = useState("");
  const [cartChecked,setCartChecked] = usePersist("mp_cart",{});
  const [actualTimes,setActualTimes] = usePersist("mp_times",{});
  const togCart = key => setCartChecked(p=>({...p,[key]:!p[key]}));
  const clearCart = () => setCartChecked({});
  const cartCount = Object.values(cartChecked).filter(Boolean).length;
  const wl = useRef(null);

  useEffect(()=>{
    if(cook) navigator.wakeLock?.request("screen").then(l=>{wl.current=l;}).catch(()=>{});
    else { wl.current?.release(); wl.current=null; }
    return ()=>{ wl.current?.release(); };
  },[cook]);

  const togStep = (id,j) => setChecked(p=>({...p,[`${id}-${j}`]:!p[`${id}-${j}`]}));
  const setRat = (id,v) => setRatings(p=>({...p,[id]:p[id]===v?null:v}));
  const togFav = id => setFavs(p=>({...p,[id]:!p[id]}));
  const togLeft = item => setLftovrs(p=>({...p,[item]:!p[item]}));
  const togSet = k => setSettings(p=>({...p,[k]:!p[k]}));
  const addQuick = () => { if(quickIn.trim()){setQuickItems(p=>[...p,quickIn.trim()]);setQuickIn("");} };
  const rmQuick = i => setQuickItems(p=>p.filter((_,x)=>x!==i));

  const saveTime = (id, secs) => {
    setActualTimes(p => ({ ...p, [id]: [...(p[id]||[]), secs] }));
  };

  const fmtAvg = (secs) => {
    const m = Math.round(secs/60);
    return `${m} min`;
  };

  const timeHistory = () => {
    const lines = MEALS
      .filter(m => actualTimes[m.id]?.length)
      .map(m => {
        const times = actualTimes[m.id];
        const avg = times.reduce((a,b)=>a+b,0)/times.length;
        return `${m.name}: est ${m.estMin} min, actual avg ${fmtAvg(avg)} (${times.length} cook${times.length>1?"s":""})`;
      });
    return lines.length ? `\nActual cook times from past weeks:\n${lines.join("\n")}` : "";
  };

  const leftoverList = Object.entries(lftovrs).filter(([,v])=>v).map(([k])=>k);
  const favMeals = MEALS.filter(m=>favs[m.id]);

  const genPrompt = () => {
    const a = pAnswers;
    const lw = settings.twoWeek && lastWeek ? `\nLast week's meals (don't repeat): ${lastWeek}.` : "";
    const lf = leftoverList.length ? `\nLeftovers to use up: ${leftoverList.join(", ")}.` : "";
    const qi = quickItems.length ? `\nExtra grocery items: ${quickItems.join(", ")}.` : "";
    const fv = favMeals.length ? `\nFavorites to consider repeating: ${favMeals.map(m=>m.name).join(", ")}.` : "";
    const th = timeHistory();
    return `Using the profile above, create this week's meal plan and grocery list.\n\nDate: ${a.date||"[DATE]"}.\nIngredients to use up: ${a.ingredients||"nothing special"}.\nScheduling: ${a.schedule||"normal week"}.\nDaughter requests: ${a.daughter||"TBD — remind me"}.\nPrep day: ${a.prepday||"Sunday"}.${lw}${lf}${qi}${fv}${th}\nOther: ${a.other||"none"}.\n\nFormat: (1) 5-dinner plan with day assignments, leftover notes, and time estimates adjusted based on actual cook times above if available. (2) Grocery list by section with quantities, size notes, meal tags, Costco flags, staples, and any extra items. (3) Remind me if daughter's items are TBD.`;
  };

  const groceryText = () => {
    let t = "GROCERY LIST — Week of Apr 25\n\n";
    Object.entries(GROCERY).forEach(([sec,items])=>{
      t += sec+"\n";
      items.forEach(it=>{ t+=`• ${it.i} — ${it.q}${it.c?" [Costco]":""}${it.s.includes("🔁")?" [Staple]":""}\n`; });
      t+="\n";
    });
    if(quickItems.length){ t+="➕ Added This Week\n"; quickItems.forEach(i=>{t+=`• ${i}\n`;}); }
    return t;
  };

  const cp = (text,set) => navigator.clipboard.writeText(text).then(()=>{set(true);setTimeout(()=>set(false),2500);});
  const budgetTotal = BUDGET_BASE + quickItems.length*5;

  if(cook && cookId) {
    const m = MEALS.find(x=>x.id===cookId);
    return <CookScreen meal={m} checked={checked} togStep={togStep} ratings={ratings} setRat={setRat} notes={notes} setNotes={setNotes} onExit={()=>{setCook(false);setCookId(null);}} onSaveTime={saveTime}/>;
  }

  const TABS = ["dinners","lunches","groceries","prompt","settings"];

  return (
    <div style={{minHeight:"100vh",background:CREAM,fontFamily:"Georgia, serif"}}>
      {/* Header */}
      <div style={{background:G,color:"#f5ede0",padding:"20px 16px 14px",textAlign:"center"}}>
        <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#a8c5b5",marginBottom:4}}>Week of April 25, 2026</div>
        <h1 style={{margin:"0 0 5px",fontSize:21,fontWeight:"normal"}}>Family Meal Plan</h1>
        <div style={{fontSize:11,color:"#a8c5b5",marginBottom:10}}>🍕 Friday = Pizza &nbsp;·&nbsp; 🍽️ Saturday = Dining Out</div>
        <div style={{background:"#fff3cd",color:GOLD,borderRadius:8,padding:"8px 13px",fontSize:12,fontFamily:"sans-serif",display:"inline-block",maxWidth:360}}>
          ⚠️ Ask your daughter what she wants for breakfasts & lunches!
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"#fff",borderBottom:`2px solid ${BD}`,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:"0 0 auto",padding:"11px 10px",border:"none",background:"none",fontFamily:"sans-serif",fontSize:11,cursor:"pointer",color:tab===t?G:"#999",fontWeight:tab===t?"bold":"normal",borderBottom:tab===t?`3px solid ${G}`:"3px solid transparent",marginBottom:-2,whiteSpace:"nowrap"}}>
            {t==="dinners"?"🍳 Dinners":t==="lunches"?"🥗 Lunches":t==="groceries"?"🛒 Groceries":t==="prompt"?"📋 Next Week":"⚙️ Settings"}
          </button>
        ))}
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"13px 13px 60px"}}>

        {/* ── DINNERS ── */}
        {tab==="dinners"&&<>
          <Card>
            <button onClick={()=>setPrepOpen(!prepOpen)} style={{width:"100%",background:"none",border:"none",padding:"13px 14px",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:10,color:"#7a9e8e",fontFamily:"sans-serif",letterSpacing:1,textTransform:"uppercase"}}>{PREP.day}</span>
                  <Bdg label={PREP.label}/>
                </div>
                <div style={{fontSize:15,color:"#222"}}>{PREP.name}</div>
                <div style={{fontSize:11,color:"#bbb",fontFamily:"sans-serif",marginTop:2}}>Tap to see all 4 prep tasks</div>
              </div>
              <span style={{fontSize:13,color:"#ccc",paddingLeft:8}}>{prepOpen?"▲":"▼"}</span>
            </button>
            {prepOpen&&<div style={{padding:"0 14px 14px",borderTop:"1px solid #f0ebe2"}}>
              <div style={{background:"#e8f4f1",borderRadius:8,padding:"8px 11px",fontSize:13,fontFamily:"sans-serif",color:G,marginTop:10,marginBottom:11}}>💡 {PREP.note}</div>
              <ol style={{margin:0,paddingLeft:17}}>
                {PREP.steps.map((s,i)=>{const c=s.indexOf(":");return <li key={i} style={{fontSize:13,fontFamily:"sans-serif",color:"#333",marginBottom:8,lineHeight:1.5}}><b style={{color:G}}>{s.slice(0,c)}:</b>{s.slice(c+1)}</li>;})}
              </ol>
            </div>}
          </Card>

          {MEALS.map(m=>{
            const times = actualTimes[m.id]||[];
            const avgSec = times.length ? times.reduce((a,b)=>a+b,0)/times.length : null;
            return (
              <Card key={m.id}>
                <button onClick={()=>setOpenMeal(openMeal===m.id?null:m.id)} style={{width:"100%",background:"none",border:"none",padding:"13px 14px",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:10,color:"#7a9e8e",fontFamily:"sans-serif",letterSpacing:1,textTransform:"uppercase"}}>{m.day}</span>
                      <Bdg label={m.badge}/>
                      {favs[m.id]&&<span>⭐</span>}
                      {ratings[m.id]==="loved"&&<span>👍</span>}
                      {ratings[m.id]==="okay"&&<span>😐</span>}
                      {ratings[m.id]==="disliked"&&<span>👎</span>}
                    </div>
                    <div style={{fontSize:15,color:"#222",marginBottom:2}}>{m.name}</div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <div style={{fontSize:11,color:"#bbb",fontFamily:"sans-serif"}}>⏱ Est: {m.estMin} min</div>
                      {avgSec&&<div style={{fontSize:11,fontFamily:"sans-serif",color:"#7a9e8e"}}>· Actual avg: {fmtAvg(avgSec)} ({times.length}x)</div>}
                    </div>
                  </div>
                  <span style={{fontSize:13,color:"#ccc",paddingLeft:8}}>{openMeal===m.id?"▲":"▼"}</span>
                </button>

                {openMeal===m.id&&<div style={{padding:"0 14px 14px",borderTop:"1px solid #f0ebe2"}}>
                  {/* Time history strip */}
                  {times.length>0&&<div style={{background:"#eef4f1",borderRadius:8,padding:"8px 11px",marginTop:11,marginBottom:8,fontFamily:"sans-serif",fontSize:12,color:G}}>
                    ⏱ <b>Cook time history:</b> {times.map((s,i)=>`#${i+1}: ${fmtAvg(s)}`).join(" · ")} · Avg: {fmtAvg(avgSec)}
                  </div>}
                  {/* Actions */}
                  <div style={{display:"flex",gap:6,marginTop:times.length?4:11,marginBottom:10,flexWrap:"wrap"}}>
                    <button onClick={()=>{setCook(true);setCookId(m.id);}} style={{background:G,color:"#f5ede0",border:"none",borderRadius:8,padding:"7px 11px",fontFamily:"sans-serif",fontSize:12,cursor:"pointer"}}>🔆 Cook Mode</button>
                    <button onClick={()=>togFav(m.id)} style={{background:favs[m.id]?"#fff8e6":"#f5f0e8",color:favs[m.id]?GOLD:"#555",border:`1px solid ${favs[m.id]?"#f0d080":BD}`,borderRadius:8,padding:"7px 11px",fontFamily:"sans-serif",fontSize:12,cursor:"pointer"}}>{favs[m.id]?"⭐ Fav'd":"☆ Favorite"}</button>
                    {[["loved","👍"],["okay","😐"],["disliked","👎"]].map(([v,e])=>(
                      <button key={v} onClick={()=>setRat(m.id,v)} style={{background:ratings[m.id]===v?(v==="loved"?"#e8f5e9":v==="okay"?"#fff8e1":"#ffebee"):"#f5f0e8",border:`1px solid ${ratings[m.id]===v?(v==="loved"?"#a5d6a7":v==="okay"?"#ffe082":"#ef9a9a"):BD}`,borderRadius:8,padding:"7px 10px",fontSize:13,cursor:"pointer"}}>{e}</button>
                    ))}
                  </div>
                  <textarea value={notes[m.id]||""} onChange={e=>setNotes(p=>({...p,[m.id]:e.target.value}))} placeholder="Notes for next time..." style={{width:"100%",background:"#fafaf7",border:`1px solid ${BD}`,borderRadius:8,fontFamily:"sans-serif",fontSize:13,padding:"8px 10px",color:"#444",minHeight:46,resize:"vertical",boxSizing:"border-box",marginBottom:settings.source?7:11}}/>
                  {settings.source&&<input value={sources[m.id]||""} onChange={e=>setSources(p=>({...p,[m.id]:e.target.value}))} placeholder="Recipe source URL (optional)..." style={{width:"100%",background:"#fafaf7",border:`1px solid ${BD}`,borderRadius:8,fontFamily:"sans-serif",fontSize:13,padding:"8px 10px",color:"#444",boxSizing:"border-box",marginBottom:11}}/>}
                  <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:13}}>
                    <div style={{background:"#eef4f1",borderRadius:8,padding:"8px 11px",fontSize:13,fontFamily:"sans-serif",color:G}}>🥡 <b>Leftovers:</b> {m.left}</div>
                    <div style={{background:"#fff8ee",borderRadius:8,padding:"8px 11px",fontSize:13,fontFamily:"sans-serif",color:"#7a5c00"}}>🌶️ <b>Spice:</b> {m.spice}</div>
                  </div>
                  <div style={{fontSize:10,fontFamily:"sans-serif",fontWeight:"bold",color:G,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Ingredients</div>
                  <ul style={{margin:"0 0 13px 0",paddingLeft:16}}>
                    {m.ing.map((g,i)=><li key={i} style={{fontSize:13,color:g.startsWith("—")?"#bbb":"#444",fontFamily:"sans-serif",marginBottom:4,fontStyle:g.startsWith("—")?"italic":"normal"}}>{g}</li>)}
                  </ul>
                  <div style={{fontSize:10,fontFamily:"sans-serif",fontWeight:"bold",color:G,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Steps — tap to check off</div>
                  {m.steps.map((step,j)=>{
                    const key=`${m.id}-${j}`,done=checked[key],isNote=step.startsWith("💡")||step.startsWith("🐌");
                    return <div key={j} onClick={()=>!isNote&&togStep(m.id,j)} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"8px 9px",marginBottom:5,borderRadius:8,background:done?"#f0f7f0":"#fafaf7",border:`1px solid ${done?"#a5d6a7":"#eee"}`,cursor:isNote?"default":"pointer",opacity:done?.6:1}}>
                      {!isNote&&<div style={{width:19,height:19,borderRadius:4,flexShrink:0,marginTop:1,background:done?"#4caf50":"#fff",border:`2px solid ${done?"#4caf50":"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>{done?"✓":""}</div>}
                      <div style={{fontSize:13,fontFamily:"sans-serif",color:isNote?"#aaa":done?"#888":"#333",fontStyle:isNote?"italic":"normal",lineHeight:1.4}}>{step}</div>
                    </div>;
                  })}
                </div>}
              </Card>
            );
          })}

          {favMeals.length>0&&<div style={{background:"#fff8e6",border:"1px solid #f0d080",borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:13,color:GOLD,marginBottom:7}}>⭐ Favorites this week</div>
            {favMeals.map(m=><div key={m.id} style={{fontFamily:"sans-serif",fontSize:13,color:"#555",marginBottom:4}}>
              • {m.name}
              {notes[m.id]&&<span style={{color:"#aaa"}}> — "{notes[m.id]}"</span>}
              {sources[m.id]&&<a href={sources[m.id]} target="_blank" rel="noreferrer" style={{color:"#2d6a8a",marginLeft:6,fontSize:12}}>source ↗</a>}
            </div>)}
            <div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa",marginTop:7}}>💡 Copy to ⭐ Favorites in your Google Doc profile!</div>
          </div>}
        </>}

        {/* ── LUNCHES ── */}
        {tab==="lunches"&&<div>
          <Card>
            <div style={{background:G,color:"#f5ede0",padding:"11px 14px",fontSize:13,fontFamily:"sans-serif"}}>📅 Full Week Lunch Coverage</div>
            {LUNCH_DATA.map((l,i)=>(
              <div key={i} style={{padding:"11px 14px",fontFamily:"sans-serif",borderBottom:i<LUNCH_DATA.length-1?"1px solid #f0ebe2":"none",display:"flex",gap:10,alignItems:"flex-start",background:l.ok?"#fff":"#fffdf7"}}>
                <div style={{fontSize:18,marginTop:1}}>{l.ok?"✅":"⚠️"}</div>
                <div>
                  <div style={{fontWeight:"bold",fontSize:13,color:"#222",marginBottom:2}}>{l.day}</div>
                  <div style={{fontSize:13,color:"#666"}}>{l.src}</div>
                  {l.det&&<div style={{fontSize:12,color:"#7a9e8e",marginTop:1}}>{l.det}</div>}
                  {l.fix&&<div style={{fontSize:12,color:GOLD,marginTop:1}}>→ {l.fix}</div>}
                </div>
              </div>
            ))}
          </Card>
          <div style={{background:"#fff8ee",border:"1px solid #f0d080",borderRadius:12,padding:"12px 14px",marginBottom:11}}>
            <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:13,color:GOLD,marginBottom:4}}>Monday, Friday & Weekends — No-Cook Lunch</div>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:8}}>Mon & Fri: 2 adults · Sat & Sun: all 4</div>
            {NO_COOK.map((item,j)=><div key={j} style={{fontFamily:"sans-serif",fontSize:13,color:"#555",paddingLeft:8,marginBottom:4}}>• {item}</div>)}
          </div>
          {settings.leftoverTracker&&<div style={{background:"#fff",border:`1px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:11}}>
            <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:13,color:G,marginBottom:6}}>🧊 Leftover Tracker</div>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:9}}>Tap items in your fridge to add to next week's "use up" list.</div>
            {LEFTOVER_OPTIONS.map(item=>(
              <div key={item} onClick={()=>togLeft(item)} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:"1px solid #f5f0ea",cursor:"pointer"}}>
                <div style={{width:19,height:19,borderRadius:4,background:lftovrs[item]?G:"#fff",border:`2px solid ${lftovrs[item]?G:"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>{lftovrs[item]?"✓":""}</div>
                <div style={{fontFamily:"sans-serif",fontSize:13,color:"#333"}}>{item}</div>
              </div>
            ))}
            {leftoverList.length>0&&<div style={{fontFamily:"sans-serif",fontSize:12,color:"#7a9e8e",marginTop:8}}>✅ Will appear in next week's prompt automatically.</div>}
          </div>}
          <div style={{background:"#f0f7ff",border:"1px solid #b0d0f0",borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:13,color:"#1a4a7a",marginBottom:4}}>👧 Daughter's Requests — TBD</div>
            <div style={{fontFamily:"sans-serif",fontSize:13,color:"#444"}}>Ask her and add to next week's prompt before ordering!</div>
          </div>
        </div>}

        {/* ── GROCERIES ── */}
        {tab==="groceries"&&<div>
          <button onClick={()=>cp(groceryText(),setGCopied)} style={{width:"100%",background:gCopied?"#2d6a3e":G,color:"#f5ede0",border:"none",borderRadius:10,padding:"12px",fontFamily:"sans-serif",fontSize:14,cursor:"pointer",marginBottom:9,fontWeight:"bold"}}>
            {gCopied?"✅ Copied! Paste into Cub app or notes":"📋 Copy Full Grocery List"}
          </button>
          <div style={{background:"#eef4f1",borderRadius:8,padding:"8px 11px",marginBottom:11,fontSize:12,fontFamily:"sans-serif",color:"#444"}}>
            💡 <b>To use with Cub:</b> Tap Copy → open Cub app → paste into shopping list or cart notes.
          </div>

          {/* Cart progress */}
          {cartCount>0&&<div style={{background:"#fff",border:`1px solid ${BD}`,borderRadius:12,padding:"11px 14px",marginBottom:11,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"sans-serif",fontSize:13,color:G,fontWeight:"bold"}}>🛒 {cartCount} item{cartCount>1?"s":""} in cart</div>
            <button onClick={clearCart} style={{background:"none",border:`1px solid ${BD}`,borderRadius:8,padding:"5px 11px",fontFamily:"sans-serif",fontSize:12,color:"#888",cursor:"pointer"}}>Clear all</button>
          </div>}
          {settings.quickAdd&&<div style={{background:"#fff",border:`1px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:11}}>
            <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:13,color:G,marginBottom:7}}>➕ Quick Add — one-off items this week</div>
            <div style={{display:"flex",gap:7,marginBottom:7}}>
              <input value={quickIn} onChange={e=>setQuickIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addQuick()} placeholder="Type item and press Enter..." style={{flex:1,background:"#fafaf7",border:`1px solid ${BD}`,borderRadius:8,fontFamily:"sans-serif",fontSize:13,padding:"8px 10px",color:"#333"}}/>
              <button onClick={addQuick} style={{background:G,color:"#fff",border:"none",borderRadius:8,padding:"8px 13px",fontFamily:"sans-serif",fontSize:13,cursor:"pointer"}}>Add</button>
            </div>
            {quickItems.map((item,i)=>{
              const qKey=`quick-${i}`;
              const inCart=cartChecked[qKey];
              return (
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f5f0ea"}}>
                  <div onClick={()=>togCart(qKey)} style={{display:"flex",gap:9,alignItems:"center",flex:1,cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:4,background:inCart?"#4caf50":"#fff",border:`2px solid ${inCart?"#4caf50":"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{inCart?"✓":""}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:13,color:inCart?"#aaa":"#333",textDecoration:inCart?"line-through":"none"}}>• {item}</div>
                  </div>
                  <button onClick={()=>rmQuick(i)} style={{background:"none",border:"none",color:"#bbb",cursor:"pointer",fontSize:17,padding:"0 4px"}}>×</button>
                </div>
              );
            })}
            {quickItems.length>0&&<div style={{fontFamily:"sans-serif",fontSize:11,color:"#7a9e8e",marginTop:6}}>✅ Included when you copy the list and in next week's prompt.</div>}
          </div>}
          {settings.budget&&<div style={{background:"#fff",border:`1px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:11,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:13,color:G}}>💰 Estimated Weekly Total</div>
              <div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa",marginTop:2}}>Rough estimate — actual varies by store & sales</div>
            </div>
            <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:22,color:G}}>${budgetTotal}</div>
          </div>}
          <div style={{display:"flex",gap:6,marginBottom:11}}>
            <div style={{background:"#eef4f1",borderRadius:8,padding:"5px 10px",fontSize:11,fontFamily:"sans-serif",color:G}}>📦 = Costco</div>
            <div style={{background:"#fff8ee",borderRadius:8,padding:"5px 10px",fontSize:11,fontFamily:"sans-serif",color:GOLD}}>🔁 = Staple</div>
          </div>
          {Object.entries(GROCERY).map(([sec,items],si)=>(
            <Card key={si}>
              <button onClick={()=>setOpenGrp(openGrp===si?null:si)} style={{width:"100%",background:"#f5f0e8",border:"none",padding:"11px 14px",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",color:G}}>
                <span>{sec}</span><span style={{color:"#aaa",fontWeight:"normal"}}>{openGrp===si?"▲":"▼"}</span>
              </button>
              {openGrp===si&&<div style={{padding:"9px 11px 12px"}}>
                {items.map((it,j)=>{
                  const st=it.s.includes("🔁");
                  const cartKey=`${si}-${j}`;
                  const inCart=cartChecked[cartKey];
                  return <div key={j} onClick={()=>togCart(cartKey)} style={{padding:"8px 10px",marginBottom:5,borderRadius:8,background:inCart?"#f0f7f0":it.c?"#f0f7f4":st?"#fffdf5":"#fafafa",border:`1px solid ${inCart?"#a5d6a7":it.c?"#c8e6d8":st?"#f0e0a0":"#eee"}`,cursor:"pointer",opacity:inCart?0.6:1,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:19,height:19,borderRadius:4,flexShrink:0,marginTop:1,background:inCart?"#4caf50":"#fff",border:`2px solid ${inCart?"#4caf50":"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>{inCart?"✓":""}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                        <div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:"600",color:inCart?"#aaa":"#222",flex:1,textDecoration:inCart?"line-through":"none"}}>{it.c&&<span style={{marginRight:4}}>📦</span>}{st&&<span style={{marginRight:4}}>🔁</span>}{it.i}</div>
                        <div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",color:inCart?"#aaa":G,whiteSpace:"nowrap"}}>{it.q}</div>
                      </div>
                      {!st&&<div style={{fontFamily:"sans-serif",fontSize:11,color:inCart?"#ccc":"#2d6a8a",marginTop:2,fontStyle:"italic"}}>📐 {it.s}</div>}
                      {st&&<div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa",marginTop:2}}>{it.s.replace("🔁 ","")}</div>}
                    </div>
                  </div>;
                })}
              </div>}
            </Card>
          ))}
          <div style={{background:"#f0f7ff",border:"1px solid #b0d0f0",borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontFamily:"sans-serif",fontWeight:"bold",fontSize:13,color:"#1a4a7a",marginBottom:4}}>👧 Daughter's Items — TBD</div>
            <div style={{fontFamily:"sans-serif",fontSize:13,color:"#444"}}>Add her requests to next week's prompt before ordering!</div>
          </div>
        </div>}

        {/* ── NEXT WEEK ── */}
        {tab==="prompt"&&<div>
          <div style={{background:"#eef4f1",borderRadius:12,padding:"12px 14px",marginBottom:13,fontFamily:"sans-serif",fontSize:13,color:G,lineHeight:1.7}}>
            <b>How to use:</b><br/>1. Fill in the fields below<br/>2. Tap <b>Generate My Prompt</b><br/>3. Tap <b>Copy Prompt</b><br/>4. Open a new Claude chat → paste your <b>Google Doc profile</b> → paste this prompt → send!
          </div>
          {PROMPT_QS.map(q=>(
            <div key={q.id} style={{marginBottom:11}}>
              <div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",color:"#333",marginBottom:5}}>{q.label}</div>
              <textarea value={pAnswers[q.id]||""} onChange={e=>setPAnswers(p=>({...p,[q.id]:e.target.value}))} placeholder={q.ph} style={{width:"100%",background:"#fff",border:`1px solid ${BD}`,borderRadius:8,fontFamily:"sans-serif",fontSize:13,padding:"8px 10px",color:"#333",minHeight:46,resize:"vertical",boxSizing:"border-box"}}/>
            </div>
          ))}
          {settings.twoWeek&&<div style={{marginBottom:11}}>
            <div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",color:"#333",marginBottom:5}}>Last week's meals (to avoid repeats)</div>
            <textarea value={lastWeek} onChange={e=>setLastWeek(e.target.value)} placeholder="e.g. Tacos, Korean Beef, Salmon, Gyros, Turkey Skillet" style={{width:"100%",background:"#fff",border:`1px solid ${BD}`,borderRadius:8,fontFamily:"sans-serif",fontSize:13,padding:"8px 10px",color:"#333",minHeight:46,resize:"vertical",boxSizing:"border-box"}}/>
          </div>}
          {leftoverList.length>0&&<div style={{background:"#eef4f1",border:`1px solid ${BD}`,borderRadius:10,padding:"9px 12px",marginBottom:11,fontFamily:"sans-serif",fontSize:13,color:G}}>🧊 <b>Leftovers to use up:</b> {leftoverList.join(", ")} — added automatically.</div>}
          {quickItems.length>0&&<div style={{background:"#eef4f1",border:`1px solid ${BD}`,borderRadius:10,padding:"9px 12px",marginBottom:11,fontFamily:"sans-serif",fontSize:13,color:G}}>➕ <b>Extra items:</b> {quickItems.join(", ")} — added automatically.</div>}
          {favMeals.length>0&&<div style={{background:"#fff8e6",border:"1px solid #f0d080",borderRadius:10,padding:"9px 12px",marginBottom:11,fontFamily:"sans-serif",fontSize:13,color:GOLD}}>⭐ <b>Favorites to repeat:</b> {favMeals.map(m=>m.name).join(", ")} — added automatically.</div>}
          {Object.keys(actualTimes).length>0&&<div style={{background:"#eef4f1",border:`1px solid ${BD}`,borderRadius:10,padding:"9px 12px",marginBottom:11,fontFamily:"sans-serif",fontSize:13,color:G}}>
            ⏱ <b>Cook time data included</b> — Claude will use your actual times to give better estimates.
          </div>}
          <button onClick={()=>setPromptDone(true)} style={{width:"100%",background:G,color:"#f5ede0",border:"none",borderRadius:10,padding:"12px",fontFamily:"sans-serif",fontSize:14,cursor:"pointer",fontWeight:"bold",marginBottom:11}}>✨ Generate My Prompt</button>
          {promptDone&&<>
            <div style={{background:"#fff",border:`1px solid ${BD}`,borderRadius:12,padding:"12px 14px",marginBottom:9}}>
              <div style={{fontFamily:"sans-serif",fontSize:10,color:"#aaa",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Your prompt</div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:"#333",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{genPrompt()}</div>
            </div>
            <button onClick={()=>cp(genPrompt(),setCopied)} style={{width:"100%",background:copied?"#2d6a3e":G,color:"#f5ede0",border:"none",borderRadius:10,padding:"12px",fontFamily:"sans-serif",fontSize:14,cursor:"pointer",fontWeight:"bold"}}>
              {copied?"✅ Copied! Open Claude and paste your profile first":"📋 Copy Prompt"}
            </button>
          </>}
        </div>}

        {/* ── SETTINGS ── */}
        {tab==="settings"&&<div>
          <div style={{background:"#eef4f1",borderRadius:12,padding:"11px 14px",marginBottom:14,fontFamily:"sans-serif",fontSize:13,color:G}}>Toggle features on or off. Changes take effect immediately.</div>
          <Sec title="Features"/>
          {Object.entries(SET_LABELS).map(([k,[lbl,desc]])=>(
            <div key={k} style={{background:"#fff",borderRadius:10,border:`1px solid ${BD}`,padding:"12px 14px",marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center",gap:11}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"sans-serif",fontSize:14,color:"#222",fontWeight:"500"}}>{lbl}</div>
                <div style={{fontFamily:"sans-serif",fontSize:12,color:"#aaa",marginTop:2}}>{desc}</div>
              </div>
              <Toggle val={settings[k]} on={()=>togSet(k)}/>
            </div>
          ))}
          {Object.keys(actualTimes).length>0&&<>
            <Sec title="Cook Time History"/>
            <Card>
              <div style={{padding:"11px 14px"}}>
                {MEALS.filter(m=>actualTimes[m.id]?.length).map(m=>{
                  const times=actualTimes[m.id];
                  const avg=times.reduce((a,b)=>a+b,0)/times.length;
                  return <div key={m.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f5f0ea",fontFamily:"sans-serif",fontSize:13}}>
                    <div style={{color:"#333"}}>{m.name}</div>
                    <div style={{color:G,fontWeight:"bold"}}>avg {fmtAvg(avg)} <span style={{color:"#aaa",fontWeight:"normal",fontSize:11}}>est {m.estMin} min · {times.length}x</span></div>
                  </div>;
                })}
              </div>
            </Card>
          </>}
          <Sec title="How to save this app"/>
          <div style={{background:"#fff",border:`1px solid ${BD}`,borderRadius:12,padding:"12px 14px"}}>
            {[
              ["📱","Add to Home Screen (recommended)","iPhone: tap Share → 'Add to Home Screen'. Android: tap menu → 'Add to Home Screen'. Opens like an app!"],
              ["🔖","Bookmark this conversation","Bookmark this Claude chat. The artifact stays here as long as the conversation exists."],
              ["💾","Save the code file","Download the .jsx file as a backup. A developer can host it on Vercel or Netlify for free."],
            ].map(([icon,title,desc],i)=>(
              <div key={i} style={{display:"flex",gap:11,marginBottom:i<2?13:0,paddingBottom:i<2?13:0,borderBottom:i<2?"1px solid #f0ebe2":"none"}}>
                <div style={{fontSize:21,flexShrink:0}}>{icon}</div>
                <div>
                  <div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",color:"#222",marginBottom:3}}>{title}</div>
                  <div style={{fontFamily:"sans-serif",fontSize:12,color:"#666",lineHeight:1.5}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>}

      </div>
    </div>
  );
}
