import { useState, useEffect } from "react";

// ── Design Tokens ─────────────────────────────────────────────
const C = {
  bg:"#FDF8F5", card:"#FFFFFF", surface:"#F8F3EF", border:"#EDE5DF",
  brand:"#9B1C2E", brandLight:"#B91C3A",
  text:"#1C1412", textSub:"#78716C", textMuted:"#A8A29E",
  safe:"#15803D", safeBg:"#F0FDF4", safeBorder:"#BBF7D0", safeLight:"#DCFCE7",
  warning:"#B45309", warningBg:"#FFFBEB", warningLight:"#FEF3C7",
  emergency:"#B91C1C", emergencyBg:"#FEF2F2", emergencyLight:"#FEE2E2",
  gold:"#B45309", goldBg:"#FFFBEB",
};

const SEV = {
  emergency:{ bg:"#FEF2F2", border:"#FECACA", color:"#B91C1C", light:"#FEE2E2", icon:"🚨", label:"GO TO ER NOW" },
  warning:  { bg:"#FFFBEB", border:"#FDE68A", color:"#B45309", light:"#FEF3C7", icon:"⚠️", label:"MONITOR CLOSELY" },
  safe:     { bg:"#F0FDF4", border:"#BBF7D0", color:"#15803D", light:"#DCFCE7", icon:"✅", label:"MANAGE AT HOME" },
};

const SYMPTOMS = [
  { id:"fever",     label:"Fever / High temperature",   icon:"🌡️", critical:true  },
  { id:"chest",     label:"Chest pain",                  icon:"💔", critical:true  },
  { id:"breathing", label:"Difficulty breathing",        icon:"😮‍💨", critical:true  },
  { id:"vision",    label:"Vision changes / blurry",     icon:"👁️", critical:true  },
  { id:"stroke",    label:"Slurred speech or numbness",  icon:"🧠", critical:true  },
  { id:"priapism",  label:"Priapism",                    icon:"⚡", critical:true  },
  { id:"headache",  label:"Severe headache",             icon:"🤕", critical:false },
  { id:"swelling",  label:"Swelling / puffiness",        icon:"🦵", critical:false },
  { id:"vomiting",  label:"Nausea / vomiting",           icon:"🤢", critical:false },
  { id:"fatigue",   label:"Extreme weakness",            icon:"😓", critical:false },
  { id:"jaundice",  label:"Yellow eyes or skin",         icon:"🟡", critical:false },
];

const LOCATIONS = ["Head","Neck","Chest","Abdomen","Lower Back","Arms","Legs","Joints","Full Body"];

const DEMO_HISTORY = [
  { id:1, date:"May 10, 2026", pain:9, location:"Chest",      severity:"emergency", verdict:"ER Visit",  symptoms:["Fever","Chest pain"] },
  { id:2, date:"Apr 22, 2026", pain:6, location:"Lower Back", severity:"warning",   verdict:"Monitored", symptoms:["Headache","Swelling"] },
  { id:3, date:"Mar 15, 2026", pain:4, location:"Legs",       severity:"safe",      verdict:"Home Care", symptoms:["Fatigue"] },
];

const ENCOURAGEMENTS = [
  { message:"You are stronger than your pain. Every crisis you've survived is proof of that.", author:"WARRIOR" },
  { message:"Sickle cell does not define you. Your courage, your story, your light — that's who you are.", author:"WARRIOR" },
  { message:"Rest is not giving up. Rest is how warriors recharge.", author:"WARRIOR" },
  { message:"You are not alone. Millions of warriors around the world wake up every day and choose to fight, just like you.", author:"WARRIOR" },
  { message:"Your body is working hard. Give it grace. Give it water. Give it warmth.", author:"WARRIOR" },
  { message:"Bad days don't last. You have survived every single one so far.", author:"WARRIOR" },
  { message:"It's okay to ask for help. Strength is knowing when you need support.", author:"WARRIOR" },
  { message:"You are seen. Your pain is real. Your fight is real. And you are remarkable.", author:"WARRIOR" },
  { message:"Today might be hard. But you've had hard days before — and you're still here.", author:"WARRIOR" },
  { message:"Take your medications. Drink your water. Rest when you need to. These are acts of self-love.", author:"WARRIOR" },
];

const DEFAULT_PROFILE = {
  name:"", dob:"", genotype:"SS", blood:"", doctor:"", emergency:"",
};

const DEFAULT_MEDS = [
  { id:1, name:"Hydroxyurea", dose:"500mg", frequency:"Once daily", time:"08:00", enabled:true },
  { id:2, name:"Folic Acid",  dose:"5mg",   frequency:"Once daily", time:"08:00", enabled:true },
];

// ── Gemma 4 Integration ───────────────────────────────────────
const SYSTEM_PROMPT = `You are WARRIOR, a sickle cell disease crisis management AI.
Respond ONLY with valid JSON — no markdown, no preamble.
Format exactly:
{"severity":"safe|warning|emergency","verdict":"short 6-word decision","reasoning":"2-sentence plain language explanation","pre_hospital":["5 actions to do before leaving for ER"],"steps":["4 main action steps"],"home_care":{"hydration":"specific instruction","medication":"OTC med, dose, timing","heat_therapy":"warm compress instruction","rest":"rest position and restriction","review_in":"when to reassess"},"escalate_if":["4 signs that mean go to ER"],"doctor_note":"professional 2-sentence ER note with pain score and symptoms","watch_for":["3 danger signs to monitor"]}
Rules: emergency=ANY fever/chest pain/breathing difficulty/priapism/stroke signs/pain≥8. warning=pain 5-7 moderate. safe=pain 1-4 no critical. Never dismiss pain.`;

async function callGemma4(pain, location, syms) {
  const labels = syms.map(id => SYMPTOMS.find(s=>s.id===id)?.label).filter(Boolean);
  const res = await fetch("/api/assess", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      pain,
      location,
      symptoms: labels.join(", ") || "None beyond pain"
    })
  });
  return await res.json();
}

// ── Shared ────────────────────────────────────────────────────
const btn = {background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"'Outfit',sans-serif"};
function Card({ children, style }) {
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,0.05)",...style}}>{children}</div>;
}
function SLabel({ children, color }) {
  return <div style={{fontSize:10,letterSpacing:1.8,textTransform:"uppercase",fontWeight:700,color:color||C.textMuted,marginBottom:14}}>{children}</div>;
}
function BackBtn({ onBack }) {
  return <button onClick={onBack} style={{...btn,fontSize:22,color:C.textSub,marginBottom:20}}>←</button>;
}
function Input({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:C.textMuted,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 16px",fontSize:15,color:C.text,background:C.card,fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────
function ResultScreen({ result, pain, location, selectedSymptoms, onLog, onHome, onReport }) {
  const [copied, setCopied] = useState(false);
  const sev = SEV[result.severity]||SEV.safe;
  const isEmergency = result.severity==="emergency";
  const isHome = result.severity==="safe"||result.severity==="warning";
  const copy = () => { navigator.clipboard?.writeText(result.doctor_note||""); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div className="fi" style={{padding:"20px 20px 32px"}}>
      <BackBtn onBack={onHome}/>

      {/* Verdict */}
      <div style={{background:sev.bg,border:`2px solid ${sev.border}`,borderRadius:24,padding:28,textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:52,marginBottom:12}}>{sev.icon}</div>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:700,color:sev.color,lineHeight:1.1,marginBottom:10}}>{sev.label}</div>
        <div style={{color:C.textSub,fontSize:14,lineHeight:1.7}}>{result.reasoning}</div>
      </div>

      {/* Pre-hospital (Emergency) */}
      {isEmergency && (
        <Card style={{marginBottom:14,border:`1.5px solid ${C.emergency}`,background:"#FFF5F5"}}>
          <SLabel color={C.emergency}>🚑 Do This Right Now — Before You Leave</SLabel>
          {(result.pre_hospital||["Call someone to drive you — do NOT drive yourself","Drink a full glass of water immediately","Grab your medications bag and this phone","Wear warm clothing — cold worsens the crisis","Screenshot this screen to show ER staff"]).map((a,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:i<4?12:0,alignItems:"flex-start"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:C.emergencyLight,color:C.emergency,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>!</div>
              <div style={{color:C.text,fontSize:14,lineHeight:1.6,paddingTop:3}}>{a}</div>
            </div>
          ))}
          <div style={{marginTop:14,background:C.emergencyLight,borderRadius:12,padding:"10px 14px"}}>
            <div style={{color:C.emergency,fontSize:13,fontWeight:600,marginBottom:4}}>In the car / while waiting:</div>
            <div style={{color:C.text,fontSize:13,lineHeight:1.7}}>• Sit upright — do not lie flat if chest pain<br/>• Breathe slowly and deeply<br/>• Stay warm at all times<br/>• <strong>No extra pain meds</strong> without doctor approval</div>
          </div>
        </Card>
      )}

      {/* Steps */}
      <Card style={{marginBottom:14}}>
        <SLabel>{isEmergency?"What to Tell the ER Team":"Action Steps"}</SLabel>
        {(result.steps||[]).map((step,i)=>(
          <div key={i} style={{display:"flex",gap:14,marginBottom:i<result.steps.length-1?16:0,alignItems:"flex-start"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:sev.light,color:sev.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{i+1}</div>
            <div style={{color:C.text,fontSize:14,lineHeight:1.6,paddingTop:4}}>{step}</div>
          </div>
        ))}
      </Card>

      {/* Home care */}
      {isHome && result.home_care && (
        <Card style={{marginBottom:14}}>
          <SLabel color={C.safe}>🏠 Your Home Care Plan</SLabel>
          {[
            {icon:"💧",title:"Hydration",      content:result.home_care.hydration||"Drink 2–3 litres of water or ORS today. No fizzy drinks."},
            {icon:"💊",title:"Pain Medication", content:result.home_care.medication||"Ibuprofen 400mg with food OR Paracetamol 1000mg. Wait 4–6 hours between doses."},
            {icon:"🌡️",title:"Heat Therapy",  content:result.home_care.heat_therapy||"Warm compress on painful area. 15 mins on, 15 mins off. Never hot."},
            {icon:"🛏️",title:"Rest",           content:result.home_care.rest||"Lie comfortably. Elevate affected limb. No physical exertion today."},
            {icon:"⏱️",title:"Review In",      content:result.home_care.review_in||"Re-assess in 2 hours. If pain rises above 7/10 re-assess immediately."},
          ].map((item,i,arr)=>(
            <div key={i} style={{marginBottom:i<arr.length-1?18:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:18}}>{item.icon}</span>
                <span style={{fontWeight:600,color:C.text,fontSize:14}}>{item.title}</span>
              </div>
              <div style={{color:C.textSub,fontSize:14,lineHeight:1.7,paddingLeft:26}}>{item.content}</div>
              {i<arr.length-1&&<div style={{height:1,background:C.border,marginTop:18}}/>}
            </div>
          ))}
        </Card>
      )}

      {/* Escalate if */}
      {isHome && (
        <Card style={{marginBottom:14,border:"1.5px solid #FECACA",background:C.emergencyBg}}>
          <SLabel color={C.emergency}>🚨 Go to ER Immediately If:</SLabel>
          {(result.escalate_if||["Fever develops above 38.5°C","Chest pain or breathing difficulty appears","Pain jumps above 8/10 suddenly","You feel confused, dizzy, or faint"]).map((sign,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:i<3?10:0,alignItems:"flex-start"}}>
              <span style={{color:C.emergency,fontWeight:700,flexShrink:0}}>→</span>
              <span style={{color:C.text,fontSize:14,lineHeight:1.5}}>{sign}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Watch for (Emergency) */}
      {isEmergency && result.watch_for?.length>0 && (
        <Card style={{marginBottom:14,background:C.warningBg,border:"1px solid #FDE68A"}}>
          <SLabel color={C.warning}>⚠️ Also Watch For</SLabel>
          {result.watch_for.map((s,i)=>(
            <div key={i} style={{color:C.text,fontSize:14,marginBottom:i<result.watch_for.length-1?8:0,display:"flex",gap:8}}>
              <span style={{color:C.warning,flexShrink:0}}>→</span>{s}
            </div>
          ))}
        </Card>
      )}

      {/* Encouragement after assessment */}
      <div style={{background:`linear-gradient(135deg,${C.brand}11,${C.brand}05)`,border:`1px solid ${C.brand}22`,borderRadius:20,padding:20,marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:8}}>🛡️</div>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:16,color:C.brand,lineHeight:1.6,fontStyle:"italic"}}>
          "You are stronger than your pain.<br/>Every crisis you survive is proof of that."
        </div>
        <div style={{color:C.textMuted,fontSize:12,marginTop:8}}>— WARRIOR</div>
      </div>

      {/* Doctor note */}
      <Card style={{marginBottom:18}}>
        <SLabel>Tell the Doctor / Copy to WhatsApp</SLabel>
        <div style={{background:C.surface,borderRadius:12,padding:14,color:C.textSub,fontSize:13,lineHeight:1.7,fontStyle:"italic",marginBottom:12}}>{result.doctor_note}</div>
        <button onClick={copy} style={{width:"100%",background:copied?C.safe:"transparent",border:`1px solid ${copied?C.safe:C.border}`,borderRadius:12,padding:"12px",color:copied?"#fff":C.textSub,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.2s"}}>
          {copied?"✓ Copied!":"📋 Copy for doctor / WhatsApp"}
        </button>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <button onClick={onLog} style={{background:C.brand,border:"none",borderRadius:16,padding:"16px",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Log episode</button>
        <button onClick={onHome} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",color:C.text,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Back home</button>
      </div>
      <button onClick={onReport} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px",color:C.textSub,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
        📄 View full doctor report
      </button>
    </div>
  );
}

// ── Doctor Report ─────────────────────────────────────────────
function DoctorReport({ episodes, currentCrisis, profile, medications, onBack }) {
  const [copied, setCopied] = useState(false);
  const now = new Date().toLocaleString("en-GB",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const erVisits = episodes.filter(e=>e.severity==="emergency").length;
  const avgPain = episodes.length?(episodes.reduce((a,e)=>a+e.pain,0)/episodes.length).toFixed(1):"—";
  const name = profile.name||"Patient";

  const fullReport = `WARRIOR CRISIS REPORT — ${now}

PATIENT INFORMATION
Name: ${profile.name||"—"}
Date of Birth: ${profile.dob||"—"}
Genotype: ${profile.genotype||"—"}
Blood Group: ${profile.blood||"—"}
Haematologist: ${profile.doctor||"—"}
Emergency Contact: ${profile.emergency||"—"}

${currentCrisis?`CURRENT CRISIS
Date/Time: ${now}
Pain Score: ${currentCrisis.pain}/10
Location: ${currentCrisis.location}
Symptoms: ${currentCrisis.symptoms?.join(", ")||"Pain only"}
Verdict: ${currentCrisis.verdict}

`:""}CRISIS HISTORY (Last 6 Months)
Total Episodes: ${episodes.length}
ER Visits: ${erVisits}
Average Pain: ${avgPain}/10
Last Episode: ${episodes[0]?.date||"None recorded"}

CURRENT MEDICATIONS
${medications.map(m=>`${m.name} ${m.dose} — ${m.frequency}`).join("\n")||"None listed"}

FOR MEDICAL STAFF
${currentCrisis?.doctor_note||"Patient presenting with sickle cell vaso-occlusive crisis. Please assess urgently and provide IV fluids and pain management."}

Generated by WARRIOR · Sickle Cell Crisis AI · Powered by Gemma 4
All data stored locally on device. No cloud transmission.`;

  const copy = () => { navigator.clipboard?.writeText(fullReport); setCopied(true); setTimeout(()=>setCopied(false),2500); };

  return (
    <div className="fi" style={{padding:"22px 20px 32px"}}>
      <BackBtn onBack={onBack}/>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:28,color:C.text,marginBottom:4}}>Doctor Report</div>
      <div style={{color:C.textSub,fontSize:14,marginBottom:24}}>{now}</div>

      <Card style={{marginBottom:12}}>
        <SLabel>Patient Information</SLabel>
        {[["Name",profile.name||"—"],["Genotype",profile.genotype||"—"],["Blood Group",profile.blood||"—"],["Doctor",profile.doctor||"—"],["Emergency",profile.emergency||"—"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:4}}>
            <span style={{color:C.textMuted,fontSize:13}}>{k}</span>
            <span style={{color:C.text,fontSize:13,fontWeight:500,textAlign:"right",flex:1,marginLeft:12}}>{v}</span>
          </div>
        ))}
      </Card>

      {currentCrisis && (
        <Card style={{marginBottom:12,border:`1.5px solid ${SEV[currentCrisis.severity]?.border||C.border}`,background:SEV[currentCrisis.severity]?.bg||C.card}}>
          <SLabel color={SEV[currentCrisis.severity]?.color}>This Crisis</SLabel>
          {[["Pain",`${currentCrisis.pain}/10`],["Location",currentCrisis.location],["Symptoms",(currentCrisis.symptoms||[]).join(", ")||"Pain only"],["Verdict",currentCrisis.verdict]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:4}}>
              <span style={{color:C.textMuted,fontSize:13}}>{k}</span>
              <span style={{color:C.text,fontSize:13,fontWeight:600,textAlign:"right",flex:1,marginLeft:12}}>{v}</span>
            </div>
          ))}
        </Card>
      )}

      <Card style={{marginBottom:12}}>
        <SLabel>Crisis History (6 Months)</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[{l:"Episodes",v:episodes.length},{l:"ER Visits",v:erVisits},{l:"Avg Pain",v:avgPain}].map(s=>(
            <div key={s.l} style={{textAlign:"center",background:C.surface,borderRadius:12,padding:"12px 8px"}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:26,color:C.brand,marginBottom:2}}>{s.v}</div>
              <div style={{color:C.textMuted,fontSize:11}}>{s.l}</div>
            </div>
          ))}
        </div>
        {episodes.slice(0,3).map(ep=>(
          <div key={ep.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{color:C.textSub,fontSize:13}}>{ep.date} · Pain {ep.pain}/10</span>
            <span style={{background:SEV[ep.severity]?.light,color:SEV[ep.severity]?.color,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{ep.verdict}</span>
          </div>
        ))}
      </Card>

      <Card style={{marginBottom:12}}>
        <SLabel>Current Medications</SLabel>
        {medications.length>0?medications.map((m,i)=>(
          <div key={i} style={{color:C.text,fontSize:14,marginBottom:i<medications.length-1?8:0,display:"flex",gap:8}}>
            <span style={{color:C.brand}}>•</span>{m.name} {m.dose} — {m.frequency}
          </div>
        )):<div style={{color:C.textMuted,fontSize:14}}>No medications listed</div>}
      </Card>

      <Card style={{marginBottom:18}}>
        <SLabel>For Medical Staff</SLabel>
        <div style={{background:C.surface,borderRadius:12,padding:14,color:C.textSub,fontSize:13,lineHeight:1.7,fontStyle:"italic"}}>
          {currentCrisis?.doctor_note||"Patient presenting with sickle cell vaso-occlusive crisis. Please assess urgently."}
        </div>
      </Card>

      <div style={{textAlign:"center",color:C.textMuted,fontSize:12,marginBottom:18,lineHeight:1.6}}>
        Powered by <strong style={{color:C.brand}}>WARRIOR</strong> · Gemma 4 AI<br/>All data stored locally · No cloud transmission
      </div>

      <button onClick={copy} style={{width:"100%",background:copied?C.safe:C.brand,border:"none",borderRadius:16,padding:"18px",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.2s",marginBottom:8}}>
        {copied?"✓ Report Copied!":"📋 Copy Full Report"}
      </button>
      <div style={{textAlign:"center",color:C.textMuted,fontSize:12}}>Paste into WhatsApp, SMS, or email to your doctor</div>
    </div>
  );
}

// ── Profile Screen ────────────────────────────────────────────
function ProfileScreen({ profile, setProfile, medications, setMedications, onBack }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [addingMed, setAddingMed] = useState(false);
  const [newMed, setNewMed] = useState({name:"",dose:"",frequency:"Once daily",time:"08:00"});

  const save = () => { setProfile(draft); setEditing(false); };
  const cancel = () => { setDraft(profile); setEditing(false); };
  const deleteMed = (id) => setMedications(prev=>prev.filter(m=>m.id!==id));
  const toggleMed = (id) => setMedications(prev=>prev.map(m=>m.id===id?{...m,enabled:!m.enabled}:m));
  const addMed = () => {
    if (!newMed.name) return;
    setMedications(prev=>[...prev,{...newMed,id:Date.now(),enabled:true}]);
    setNewMed({name:"",dose:"",frequency:"Once daily",time:"08:00"});
    setAddingMed(false);
  };

  const GENOTYPES = ["SS","SC","Sβ0","Sβ+","AS (Carrier)","Other"];
  const BLOOD_GROUPS = ["A+","A−","B+","B−","AB+","AB−","O+","O−"];
  const FREQ = ["Once daily","Twice daily","Three times daily","Every 8 hours","As needed"];

  return (
    <div className="fi" style={{padding:"22px 20px 32px"}}>
      <BackBtn onBack={onBack}/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:30,color:C.text}}>My Profile</div>
        {!editing
          ? <button onClick={()=>setEditing(true)} style={{background:C.brand,border:"none",borderRadius:12,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Edit</button>
          : <div style={{display:"flex",gap:8}}>
              <button onClick={cancel} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 14px",color:C.textSub,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Cancel</button>
              <button onClick={save} style={{background:C.safe,border:"none",borderRadius:12,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Save</button>
            </div>
        }
      </div>

      {!editing ? (
        <Card style={{marginBottom:16}}>
          <SLabel>Personal Information</SLabel>
          {[["Full Name",profile.name||"Not set"],["Date of Birth",profile.dob||"Not set"],["Genotype",profile.genotype||"Not set"],["Blood Group",profile.blood||"Not set"],["Haematologist",profile.doctor||"Not set"],["Emergency Contact",profile.emergency||"Not set"]].map(([k,v])=>(
            <div key={k} style={{marginBottom:14}}>
              <div style={{fontSize:11,color:C.textMuted,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>{k}</div>
              <div style={{color:v==="Not set"?C.textMuted:C.text,fontSize:15,fontWeight:500,fontStyle:v==="Not set"?"italic":"normal"}}>{v}</div>
            </div>
          ))}
        </Card>
      ) : (
        <Card style={{marginBottom:16}}>
          <SLabel>Edit Personal Information</SLabel>
          <Input label="Full Name" value={draft.name} onChange={v=>setDraft(d=>({...d,name:v}))} placeholder="Your full name"/>
          <Input label="Date of Birth" value={draft.dob} onChange={v=>setDraft(d=>({...d,dob:v}))} placeholder="e.g. 14 March 1995"/>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.textMuted,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Genotype</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {GENOTYPES.map(g=>(
                <button key={g} onClick={()=>setDraft(d=>({...d,genotype:g}))} style={{background:draft.genotype===g?C.brand:C.surface,border:`1px solid ${draft.genotype===g?C.brand:C.border}`,borderRadius:10,padding:"10px 6px",color:draft.genotype===g?"#fff":C.text,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.textMuted,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Blood Group</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
              {BLOOD_GROUPS.map(g=>(
                <button key={g} onClick={()=>setDraft(d=>({...d,blood:g}))} style={{background:draft.blood===g?C.brand:C.surface,border:`1px solid ${draft.blood===g?C.brand:C.border}`,borderRadius:10,padding:"10px 6px",color:draft.blood===g?"#fff":C.text,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{g}</button>
              ))}
            </div>
          </div>
          <Input label="Haematologist" value={draft.doctor} onChange={v=>setDraft(d=>({...d,doctor:v}))} placeholder="Doctor name & hospital"/>
          <Input label="Emergency Contact" value={draft.emergency} onChange={v=>setDraft(d=>({...d,emergency:v}))} placeholder="Name — phone number"/>
        </Card>
      )}

      {/* Medications */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:20,color:C.text}}>My Medications</div>
        <button onClick={()=>setAddingMed(true)} style={{background:C.brand,border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>+ Add</button>
      </div>

      {addingMed && (
        <Card style={{marginBottom:12,border:`1.5px solid ${C.brand}`}}>
          <SLabel color={C.brand}>New Medication</SLabel>
          <Input label="Medication Name" value={newMed.name} onChange={v=>setNewMed(d=>({...d,name:v}))} placeholder="e.g. Hydroxyurea"/>
          <Input label="Dose" value={newMed.dose} onChange={v=>setNewMed(d=>({...d,dose:v}))} placeholder="e.g. 500mg"/>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.textMuted,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Frequency</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {FREQ.map(f=>(
                <button key={f} onClick={()=>setNewMed(d=>({...d,frequency:f}))} style={{background:newMed.frequency===f?C.brand:C.surface,border:`1px solid ${newMed.frequency===f?C.brand:C.border}`,borderRadius:20,padding:"7px 12px",color:newMed.frequency===f?"#fff":C.text,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.textMuted,marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Reminder Time</div>
            <input type="time" value={newMed.time} onChange={e=>setNewMed(d=>({...d,time:e.target.value}))}
              style={{border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",fontSize:15,color:C.text,background:C.card,fontFamily:"'Outfit',sans-serif",outline:"none",width:"100%"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>setAddingMed(false)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px",color:C.textSub,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Cancel</button>
            <button onClick={addMed} style={{background:C.brand,border:"none",borderRadius:12,padding:"13px",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Save Med</button>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {medications.length===0 && <div style={{color:C.textMuted,fontSize:14,textAlign:"center",padding:20}}>No medications added yet</div>}
        {medications.map(med=>(
          <div key={med.id} style={{background:C.card,border:`1px solid ${med.enabled?C.border:"#EDE5DF"}`,borderRadius:18,padding:"16px 18px",opacity:med.enabled?1:0.55,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:600,color:C.text,fontSize:15,marginBottom:3}}>{med.name} <span style={{color:C.textMuted,fontWeight:400}}>{med.dose}</span></div>
                <div style={{color:C.textSub,fontSize:13}}>{med.frequency} · ⏰ {med.time}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button onClick={()=>toggleMed(med.id)} style={{...btn,fontSize:22}}>{med.enabled?"🔔":"🔕"}</button>
                <button onClick={()=>deleteMed(med.id)} style={{...btn,fontSize:18,color:C.emergency}}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]       = useState("home");
  const [activeNav, setActiveNav] = useState("home");
  const [step, setStep]           = useState(1);
  const [pain, setPain]           = useState(5);
  const [location, setLocation]   = useState("");
  const [symptoms, setSymptoms]   = useState([]);
  const [result, setResult]       = useState(null);
  const [episodes, setEpisodes]   = useState(DEMO_HISTORY);
  const [currentCrisis, setCurrentCrisis] = useState(null);
  const [profile, setProfile]     = useState(DEFAULT_PROFILE);
  const [medications, setMedications] = useState(DEFAULT_MEDS);
  const [todayEnc] = useState(ENCOURAGEMENTS[Math.floor(Math.random()*ENCOURAGEMENTS.length)]);

  const painColor = pain<=3?C.safe:pain<=6?C.warning:C.emergency;
  const goTo = (s) => { setScreen(s); setActiveNav(s); };

  const startAssess = () => {
    setStep(1); setPain(5); setLocation(""); setSymptoms([]); setResult(null);
    setScreen("assess"); setActiveNav("assess");
  };

  const doAssess = async () => {
    setScreen("loading");
    try { const r = await callGemma4(pain, location, symptoms); setResult(r); setScreen("result"); }
    catch { setScreen("assess"); }
  };

  const logEp = () => {
    if (!result) return;
    const labels = symptoms.map(id=>SYMPTOMS.find(s=>s.id===id)?.label).filter(Boolean);
    const ep = { id:Date.now(), date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}), pain, location, severity:result.severity, verdict:result.verdict, symptoms:labels, doctor_note:result.doctor_note };
    setEpisodes(prev=>[ep,...prev]);
    setCurrentCrisis(ep);
    goTo("home");
  };

  const toggleSym = (id) => setSymptoms(prev=>prev.includes(id)?prev.filter(s=>s!==id):[...prev,id]);

  const todayReminders = medications.filter(m=>m.enabled);

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        button{font-family:'Outfit',sans-serif;transition:transform 0.1s;}
        button:active{transform:scale(0.97);}
        input{font-family:'Outfit',sans-serif;}
        input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:6px;outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;}
        ::-webkit-scrollbar{display:none;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fi{animation:fadeIn 0.3s ease;}
      `}</style>

      <div style={{paddingBottom:82}}>

        {/* ── HOME ── */}
        {screen==="home" && (
          <div className="fi">
            {/* Header */}
            <div style={{padding:"22px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:24,color:C.brand,fontWeight:700,letterSpacing:"-0.5px"}}>WARRIOR</div>
                <div style={{fontSize:10,color:C.textMuted,letterSpacing:1.5,textTransform:"uppercase"}}>Sickle Cell Crisis AI</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,background:C.safeBg,border:`1px solid ${C.safeBorder}`,borderRadius:20,padding:"5px 12px"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:C.safe}}/>
                <span style={{fontSize:11,color:C.safe,fontWeight:600}}>Offline · Private</span>
              </div>
            </div>

            {/* Greeting */}
            <div style={{padding:"22px 20px 0"}}>
              <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:32,color:C.text,lineHeight:1.2,marginBottom:6}}>
                {profile.name ? `Hello, ${profile.name.split(" ")[0]} 👋` : "How are you feeling today?"}
              </div>
              <div style={{fontSize:14,color:C.textSub}}>Gemma 4 is ready. No internet required.</div>
            </div>

            {/* Encouragement Card */}
            <div style={{padding:"18px 20px 0"}}>
              <div style={{background:`linear-gradient(135deg,${C.brand},${C.brandLight})`,borderRadius:20,padding:"20px 22px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:-10,top:-10,fontSize:60,opacity:0.12}}>🛡️</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Warrior's Word for Today</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:16,color:"#fff",lineHeight:1.7,fontStyle:"italic",marginBottom:10}}>"{todayEnc.message}"</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>— {todayEnc.author}</div>
              </div>
            </div>

            {/* Crisis CTA */}
            <div style={{padding:"14px 20px 0"}}>
              <button onClick={startAssess} style={{width:"100%",background:"#1C1412",border:"none",borderRadius:22,padding:"24px 22px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}>
                <div style={{fontSize:36,marginBottom:12}}>🚨</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:28,color:"#fff",marginBottom:5,lineHeight:1.2}}>I'm in crisis</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,0.6)"}}>Get an instant Gemma 4 assessment</div>
                <div style={{position:"absolute",right:22,top:"50%",transform:"translateY(-50%)",width:48,height:48,borderRadius:"50%",background:C.brand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>→</div>
              </button>
            </div>

            {/* Today's Reminders */}
            {todayReminders.length>0 && (
              <div style={{padding:"14px 20px 0"}}>
                <div style={{fontSize:11,color:C.textMuted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Today's Reminders</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {todayReminders.map(med=>(
                    <div key={med.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                      <span style={{fontSize:20}}>💊</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,color:C.text,fontSize:14}}>{med.name} {med.dose}</div>
                        <div style={{color:C.textMuted,fontSize:12}}>{med.frequency}</div>
                      </div>
                      <div style={{background:C.safeBg,border:`1px solid ${C.safeBorder}`,borderRadius:20,padding:"4px 12px",fontSize:13,color:C.safe,fontWeight:600}}>⏰ {med.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{padding:"14px 20px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {icon:"📋",title:"Crisis History",  sub:`${episodes.length} episodes`,    action:()=>goTo("history")},
                {icon:"📄",title:"Doctor Report",   sub:"Share with your doctor",          action:()=>goTo("report")},
              ].map((item,i)=>(
                <button key={i} onClick={item.action} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 16px",cursor:"pointer",textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{fontSize:28,marginBottom:10}}>{item.icon}</div>
                  <div style={{fontWeight:600,color:C.text,fontSize:14,marginBottom:3}}>{item.title}</div>
                  <div style={{color:C.textMuted,fontSize:12}}>{item.sub}</div>
                </button>
              ))}
            </div>

            {/* Last episode */}
            {episodes[0] && (
              <div style={{padding:"14px 20px 0"}}>
                <div style={{fontSize:11,color:C.textMuted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Last episode</div>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:600,color:C.text,fontSize:15,marginBottom:4}}>{episodes[0].date}</div>
                      <div style={{color:C.textSub,fontSize:13}}>Pain {episodes[0].pain}/10 · {episodes[0].location}</div>
                    </div>
                    <div style={{background:SEV[episodes[0].severity]?.light,color:SEV[episodes[0].severity]?.color,fontSize:11,fontWeight:700,padding:"5px 11px",borderRadius:20}}>
                      {SEV[episodes[0].severity]?.icon} {episodes[0].verdict}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{padding:"14px 20px 28px"}}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"13px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16}}>⚡</span>
                <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}><strong style={{color:C.text}}>Powered by Gemma 4</strong> via Ollama. No data ever leaves this device.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ASSESS ── */}
        {screen==="assess" && (
          <div className="fi" style={{padding:"22px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28}}>
              <button onClick={()=>goTo("home")} style={{...btn,fontSize:22,color:C.textSub}}>←</button>
              <div style={{flex:1,display:"flex",gap:6}}>
                {[1,2,3].map(i=><div key={i} style={{flex:1,height:4,borderRadius:4,background:i<=step?C.brand:C.border,transition:"background 0.3s"}}/>)}
              </div>
              <div style={{color:C.textMuted,fontSize:13,fontWeight:500}}>Step {step}/3</div>
            </div>

            {step===1 && (
              <div className="fi">
                <div style={{fontFamily:"'Fraunces',serif",fontSize:30,color:C.text,marginBottom:6}}>How bad is the pain?</div>
                <div style={{color:C.textSub,fontSize:15,marginBottom:28}}>Be honest — this shapes your assessment.</div>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:28,textAlign:"center",marginBottom:22,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:96,fontWeight:700,color:painColor,lineHeight:1,marginBottom:8,transition:"color 0.2s"}}>{pain}</div>
                  <div style={{color:C.textMuted,fontSize:14,marginBottom:26}}>
                    {pain<=2?"Mild — barely noticeable":pain<=4?"Mild — uncomfortable":pain<=6?"Moderate — affecting daily life":pain<=8?"Severe — very hard to function":"Extreme — unbearable"}
                  </div>
                  <input type="range" min={1} max={10} value={pain} onChange={e=>setPain(Number(e.target.value))}
                    style={{background:`linear-gradient(to right,${painColor} ${(pain-1)/9*100}%,${C.border} 0)`,marginBottom:10}}/>
                  <div style={{display:"flex",justifyContent:"space-between",color:C.textMuted,fontSize:12}}><span>1 · Mild</span><span>10 · Unbearable</span></div>
                </div>
                <button onClick={()=>setStep(2)} style={{width:"100%",background:C.brand,border:"none",borderRadius:16,padding:"18px",color:"#fff",fontSize:16,fontWeight:600,cursor:"pointer",boxShadow:`0 6px 20px ${C.brand}44`}}>Continue →</button>
              </div>
            )}

            {step===2 && (
              <div className="fi">
                <div style={{fontFamily:"'Fraunces',serif",fontSize:30,color:C.text,marginBottom:6}}>Where is the pain?</div>
                <div style={{color:C.textSub,fontSize:15,marginBottom:24}}>Select the main area.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
                  {LOCATIONS.map(loc=>(
                    <button key={loc} onClick={()=>setLocation(loc)} style={{background:location===loc?C.brand:C.card,border:`1.5px solid ${location===loc?C.brand:C.border}`,borderRadius:14,padding:"14px 8px",color:location===loc?"#fff":C.text,fontSize:13,fontWeight:location===loc?600:400,cursor:"pointer",transition:"all 0.15s"}}>
                      {loc}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setStep(3)} disabled={!location} style={{width:"100%",background:location?C.brand:C.border,border:"none",borderRadius:16,padding:"18px",color:location?"#fff":C.textMuted,fontSize:16,fontWeight:600,cursor:location?"pointer":"not-allowed"}}>Continue →</button>
              </div>
            )}

            {step===3 && (
              <div className="fi">
                <div style={{fontFamily:"'Fraunces',serif",fontSize:30,color:C.text,marginBottom:6}}>Any other symptoms?</div>
                <div style={{color:C.textSub,fontSize:15,marginBottom:16}}>Select all that apply right now.</div>
                <div style={{background:C.emergencyBg,border:"1px solid #FECACA",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.emergency,fontWeight:500}}>
                  🚨 Red = potential emergency. Select if present.
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                  {SYMPTOMS.map(sym=>{
                    const sel=symptoms.includes(sym.id);
                    return (
                      <button key={sym.id} onClick={()=>toggleSym(sym.id)} style={{background:sel?(sym.critical?C.emergencyBg:"#FFF5F5"):C.card,border:`1.5px solid ${sel?(sym.critical?C.emergency:C.brand):C.border}`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}>
                        <span style={{fontSize:20}}>{sym.icon}</span>
                        <span style={{flex:1,color:sel?C.text:C.textSub,fontSize:14,fontWeight:sel?600:400}}>{sym.label}</span>
                        {sym.critical && <span style={{fontSize:10,color:C.emergency,background:C.emergencyLight,padding:"3px 8px",borderRadius:20,fontWeight:700,flexShrink:0}}>CRITICAL</span>}
                        {sel && <span style={{color:sym.critical?C.emergency:C.brand,fontSize:16,fontWeight:700}}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <button onClick={doAssess} style={{width:"100%",background:C.brand,border:"none",borderRadius:16,padding:"18px",color:"#fff",fontSize:16,fontWeight:600,cursor:"pointer",boxShadow:`0 6px 20px ${C.brand}44`}}>
                  Assess my crisis →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── LOADING ── */}
        {screen==="loading" && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",padding:40,textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:"50%",border:`4px solid ${C.border}`,borderTopColor:C.brand,animation:"spin 1s linear infinite",marginBottom:28}}/>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:26,color:C.text,marginBottom:10}}>Analysing your crisis...</div>
            <div style={{color:C.textSub,fontSize:14,lineHeight:1.7}}>Gemma 4 is running on your device.<br/>No data is being sent anywhere.</div>
          </div>
        )}

        {/* ── RESULT ── */}
        {screen==="result" && result && (
          <ResultScreen result={result} pain={pain} location={location} selectedSymptoms={symptoms}
            onLog={logEp} onHome={()=>goTo("home")}
            onReport={()=>{ setCurrentCrisis({pain,location,symptoms:symptoms.map(id=>SYMPTOMS.find(s=>s.id===id)?.label).filter(Boolean),severity:result.severity,verdict:result.verdict,doctor_note:result.doctor_note}); goTo("report"); }}
          />
        )}

        {/* ── HISTORY ── */}
        {screen==="history" && (
          <div className="fi" style={{padding:"22px 20px 28px"}}>
            <BackBtn onBack={()=>goTo("home")}/>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:32,color:C.text,marginBottom:4}}>Episode History</div>
            <div style={{color:C.textSub,fontSize:15,marginBottom:24}}>Your recorded crisis episodes</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
              {[{label:"Total",value:episodes.length},{label:"ER Visits",value:episodes.filter(e=>e.severity==="emergency").length},{label:"Avg Pain",value:episodes.length?(episodes.reduce((a,e)=>a+e.pain,0)/episodes.length).toFixed(1):"-"}].map(s=>(
                <div key={s.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 10px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:30,color:C.brand,marginBottom:4}}>{s.value}</div>
                  <div style={{color:C.textMuted,fontSize:12}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
              {episodes.map(ep=>{
                const sev=SEV[ep.severity]||SEV.emergency;
                return (
                  <div key={ep.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{fontWeight:600,color:C.text,fontSize:15}}>{ep.date}</div>
                      <div style={{background:sev.light,color:sev.color,fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>{sev.icon} {ep.verdict}</div>
                    </div>
                    <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                      <span style={{color:C.textSub,fontSize:13}}>Pain: <strong style={{color:C.text}}>{ep.pain}/10</strong></span>
                      <span style={{color:C.textSub,fontSize:13}}>📍 {ep.location}</span>
                    </div>
                    {ep.symptoms?.length>0 && <div style={{color:C.textMuted,fontSize:12,marginTop:6}}>{ep.symptoms.join(" · ")}</div>}
                  </div>
                );
              })}
            </div>
            <button onClick={()=>goTo("report")} style={{width:"100%",background:C.card,border:`1.5px solid ${C.brand}`,borderRadius:16,padding:"16px",color:C.brand,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              📄 View & Copy Doctor Report
            </button>
          </div>
        )}

        {/* ── REPORT ── */}
        {screen==="report" && <DoctorReport episodes={episodes} currentCrisis={currentCrisis} profile={profile} medications={medications} onBack={()=>goTo("home")}/>}

        {/* ── PROFILE ── */}
        {screen==="profile" && <ProfileScreen profile={profile} setProfile={setProfile} medications={medications} setMedications={setMedications} onBack={()=>goTo("home")}/>}

      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 18px",zIndex:100}}>
        {[
          {id:"home",   icon:"🏠", label:"Home"},
          {id:"assess", icon:"🚨", label:"Assess", action:startAssess},
          {id:"history",icon:"📋", label:"History"},
          {id:"profile",icon:"👤", label:"Profile"},
        ].map(tab=>(
          <button key={tab.id} onClick={tab.action||(()=>goTo(tab.id))} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0"}}>
            <span style={{fontSize:22}}>{tab.icon}</span>
            <span style={{fontSize:11,color:activeNav===tab.id?C.brand:C.textMuted,fontWeight:activeNav===tab.id?700:400,fontFamily:"'Outfit',sans-serif"}}>{tab.label}</span>
            {activeNav===tab.id && <div style={{width:4,height:4,borderRadius:"50%",background:C.brand}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
