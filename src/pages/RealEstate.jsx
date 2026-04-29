import React, { useState } from 'react'

// ── All the phase data lives here (unchanged) ────────────────────────────────
const PHASES = [
  {
    id: 'p1', label: 'Lead',
    title: 'Phase 1 — Lead intake & follow-up',
    sub: 'Cold call → qualify → tag → Lofty → follow-up sequence. No lead slips through without a category, a next contact date, and a purpose.',
    steps: [
      { id:'p1s1', num:'1', title:'Prospecting call — Mojo', obj:'Cold call canceled and expired leads. Qualify, assign bucket, earn the follow-up.',
        checklist:['Work canceled and expired lists from Mojo — 9am–12pm block only','Qualify on the call — timeline, motivation, pain point, their why, cost of inaction','Assign bucket mentally before hanging up — Hot / Warm / Nurture / Cold','Agree on next contact date — get their consent to follow up','Immediately after call: Actions → Send to CRM HQ in Mojo'],
        extra: <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:10}}>
          <div style={{fontSize:11,padding:'6px 10px',borderRadius:6,background:'#2a0a0a',border:'0.5px solid #7a1a1a',color:'#f7a0a0'}}>🔴 Hot — moving in 0–90 days, motivated, clear why</div>
          <div style={{fontSize:11,padding:'6px 10px',borderRadius:6,background:'#2a1a04',border:'0.5px solid #5a3a08',color:'#d4a054'}}>🟠 Warm — 3–6 months, interested but timing not right yet</div>
          <div style={{fontSize:11,padding:'6px 10px',borderRadius:6,background:'#0c1e36',border:'0.5px solid #1a4a7a',color:'#6a9fd4'}}>🔵 Nurture — 6–12 months, open but no urgency</div>
          <div style={{fontSize:11,padding:'6px 10px',borderRadius:6,background:'#222220',border:'0.5px solid #444440',color:'#888780'}}>⚪ Cold — 12+ months or vague / no motivation</div>
        </div>,
        code:'A successful call ends with the lead in Lofty, notes filled, category assigned, and a next contact date set before you dial again.' },
      { id:'p1s2', num:'2', title:'Lead intake — Mojo to Lofty', obj:'Tag, note, and push to Lofty before the next dial.',
        checklist:['Actions → Send to CRM HQ in Mojo','Confirm or update contact info in CRM HQ','Fill lead profile — timeline, motivation, pain point, their why, cost of inaction, next step, next contact date','Assign correct group in Mojo — Hot Lead / Warm / Nurture / Cold','Click Save — Lofty syncs in ~10 minutes, welcome email fires automatically','If appointment set — send Gmail template: video, date, time, location, prep instructions'],
        resources:['Seller Profile Worksheet','Public Records Pull Guide','MLS History Checklist'],
        code:"If a lead is not tagged and dated, it isn't being managed." },
      { id:'p1s3', num:'3', title:'Hot lead follow-up — Week 1', obj:'Day 1, 3, and 7 — email + text sequence. Manual and personal.',
        checklist:['Day 1: Pause dialing — record 30–60 second personalized recap video','Day 1: Send recap email referencing their specific goal, include video','Day 1: Text — "Great talking earlier. Sent you a recap video."','Day 3: Send home valuation tool walkthrough + video email','Day 3: Text pointing to valuation tool','Day 7: Send Seller\'s Guide + walkthrough video email','Day 7: Text — "Just sent the Seller Guide, take a look when you have time."'],
        code:'Every touch references something specific from their intake notes. No generic check-ins.' },
      { id:'p1s4', num:'4', title:'Hot lead follow-up — Weeks 2, 3, 4', obj:'Build toward the alignment call and appointment.',
        checklist:['Week 2: Call attempt mid-week — voicemail if no answer','Week 2: Text — "How are you feeling after looking through the guide?"','Week 3: Send Loom video email — positioning talk (first 10–14 days on market matter most)','Week 4: Re-entry call — "Are we setting an appointment or confirming one?"',"Week 4: If ready → set appointment right now. \"I've got Thursday at 6 or 7 — which works?\"","Week 4: If not selling → disqualify, move to Nurture, no wasted cycles"],
        code:'Empowerment is the ultimate close — clarity wins over pressure.' },
      { id:'p1s5', num:'5', title:'Pipeline management by category', obj:"Warm, Nurture, and Cold leads don't fall through the cracks.",
        checklist:['Friday review: Every lead has a category','Friday review: Every lead has a next contact date','Friday review: Review next 7 days of follow-ups','Any leads that changed timeline? Update bucket in Mojo + Lofty','Low-energy minimum: Follow up with 3 hot leads + 10 calls + log everything'],
        code:'Consistency protects the pipeline.' },
    ],
    summary:'Lead has a category, a dated next contact, and is enrolled in the correct follow-up sequence. Appointment set → move to Phase 2.',
  },
  {
    id:'p2', label:'Pre-appt',
    title:'Phase 2 — Pre-appointment nurture',
    sub:'Begins the moment an appointment is set. Research, prep, and nurture before stepping into the home. Enter fully prepped on motivation, objections, and price context.',
    steps:[
      {id:'p2s1',num:'1',title:'Research & profile the seller',obj:'Gather complete context before preparing anything',checklist:['Pull public records — verify ownership, purchase date, mortgage info','Review MLS history — past listings, price changes, days on market','Complete Seller Profile Worksheet — timeline, motivation, objections','Analyze market data — active, pending, and sold comps'],resources:['Seller Profile Worksheet','Public Records Pull Guide','MLS History Checklist','Neighborhood Snapshot Template'],code:'Focus on connection data points — emotional drivers matter more than square footage.'},
      {id:'p2s2',num:'2',title:'Prepare materials & assets',obj:'Personalize presentation to mirror their goals and property',checklist:['Customize Pre-Listing Package (PLP) with property and pricing notes','Print Home Sellers Guide','Add Seller Listing Documents Overview to folder','Prepare sample Listing Flyer and Open House Flyer','Load digital versions to tablet or laptop'],resources:['Pre-Listing Package (PLP)','Home Sellers Guide','Listing Flyer','Open House Flyer'],code:'Design = trust. Every visual reinforces your professional identity.'},
      {id:'p2s3',num:'3',title:'CMA & pricing preparation',obj:'Build a data-driven pricing strategy aligned with market reality',checklist:['Complete CMA using updated comparables','Run Net Sheet for target price and estimate net proceeds','Create Pricing Strategy Explainer Page (visual)','Double-check recent neighborhood activity'],resources:['CMA Template','Net Sheet Calculator Guide','Pricing Strategy Explainer Page'],code:'Communicate market reality with confidence — never defend price, explain it.'},
      {id:'p2s4',num:'4',title:'Pre-appointment communication & confirmation',obj:'Lock in the appointment and start light rapport through value-based touches',checklist:['Confirm date, time, and address — all decision makers present','Send confirmation text / email template','Set reminder in CRM + tag lead as Appointment Scheduled','Send short value message to pre-frame the appointment'],resources:['Pre-Appointment Email Template','Text Confirmation Template','CRM Tagging Guide'],code:"Presence over pressure — make the seller feel they're already working with you."},
      {id:'p2s5',num:'5',title:'Mindset & visualization',obj:'Enter centered, confident, and emotionally aligned',checklist:['Review Mindset & Visualization Mini-SOP','Visualize rapport and successful close','Confirm appearance, energy, and all materials are ready'],resources:['Mindset & Visualization Mini-SOP','Equipment & Material Checklist'],code:"You can't fake certainty — carry clarity and calm into every doorstep."},
      {id:'p2s6',num:'6',title:'Prepare leave-behind folder',obj:'Assemble the folder that sells you after you leave',checklist:['Insert "What Happens Next" cover sheet + QR code linked to Thank-You Video','Add Mission Statement / About Beyond Horizons page','Include Preferred Partners Sheet','Include What Buyers Look For + Seller Photoshoot Checklist','Review entire folder for branding consistency'],resources:['What Happens Next Cover Sheet','Mission Statement Page','Preferred Partners Sheet','Seller Photoshoot Checklist'],code:"Never pitch it — let the folder sell you after you leave."},
    ],
    summary:'CMA done. PLP customized. Appointment confirmed with all decision makers. Leave-behind folder assembled. You walk in knowing their motivation, their pain point, and their why.',
  },
  {
    id:'p3',label:'Appointment',
    title:'Phase 3 — Appointment walkthrough',
    sub:'Trust and conversion phase. Emotion → Trust → Logic → Decision. Target: 45–60 minutes.',
    steps:[
      {id:'p3s1',num:'1',title:'Arrival + presence',obj:'Establish warmth and authority the moment you walk in',checklist:['Arrive 5–10 minutes early — center your energy before entry','Thank the seller for inviting you in — offer to remove shoes if appropriate','Compliment something specific about the home or décor','Request to start with a tour — do not skip straight to the sit-down','Keep tone calm, professional, and grateful — no sales energy'],code:'Presence anchors trust before presentation begins. Energy speaks louder than words.'},
      {id:'p3s2',num:'2',title:'Seller-led walkthrough & discovery',obj:'Gather intel while building rapport through curiosity and observation',checklist:["Let the seller lead the tour — walk beside them, not ahead",'Ask about updates, favorite features, and future plans','Note emotional anchors — "What will be hardest to leave behind?"','Compliment authentically as you go','Close the tour with gratitude and transition smoothly to the sit-down'],code:'Emotion first, logic later — connection precedes conversion.'},
      {id:'p3s3',num:'3',title:'Transition to strategy session',obj:'Guide from tour to conversation without breaking rapport',checklist:['Bridge gracefully — "Thanks for the tour, let\'s go over the plan together."','Seat where eye contact is easy and posture shows leadership','Open PLP folder casually — keep iPad ready for visuals','Outline agenda — how we work, strategy, and fit'],code:'Smooth transitions keep control without pressure. Leadership by ease.'},
      {id:'p3s4',num:'4',title:'Introduction + social proof',obj:'Reintroduce Beyond Horizons through proof, not pitch',checklist:['Briefly summarize who Beyond Horizons is and how we approach listings','Hand off reviews / testimonials page for them to skim','Explain team structure — TC, media, legal support','Highlight collaboration and availability'],code:'Credibility is earned through transparency and real stories, not scripts.'},
      {id:'p3s5',num:'5',title:'Easy exit + flexible fee',obj:'Remove risk and create choice — disarm defense mechanisms',checklist:['Explain Easy Exit — cancel any time before contract without penalty','Clarify fine print on hard cost reimbursement','Show Flexible Fee Options visually — walk through each scenario','Frame as control and fairness, not a discount'],code:'Freedom creates trust. Transparency turns skepticism into respect.'},
      {id:'p3s6',num:'6',title:'Communication + performance proof',obj:'Show accountability and results through data and consistency',checklist:['Present Communication Guarantee — 48-hr showing feedback, weekly strategy calls, daily callbacks 1–2pm','Share DOM comparison — Beyond Horizons 9 days avg vs market 34 days','Explain List-to-Sale Ratio — 99.8% vs Illinois avg 91% (on $400K home = $28K more)','Reinforce weekly update cadence and transparency throughout'],code:'Predictability reduces anxiety. Proof cements trust.'},
      {id:'p3s7',num:'7',title:'CMA + pricing conversation',obj:'Align emotion and logic — create clarity and confidence in price',checklist:['Open CMA visuals on iPad or print','Compare 3 Active / 3 Pending / 3 Sold','Discuss timing leverage and offer control','Review Net Sheet and decide on price band together'],code:'Data creates logic alignment. Empathy creates emotional buy-in.'},
      {id:'p3s8',num:'8',title:'Marketing + roadmap',obj:'Demonstrate the system without information overload',checklist:['Review Listing Roadmap visual','Touch on Full-Service Plan — what happens behind the scenes','Show exposure map + social examples','Briefly highlight flyers and digital campaigns'],code:'Simplicity sells. Focus on clarity and confidence, not volume.'},
      {id:'p3s9',num:'9',title:'The close — "ready when you are"',obj:'Invite alignment and secure commitment organically',checklist:['Recap their goals and the shared plan built together','Offer two paths — sign now or reflect overnight','If ready → Seller Disclosures then Listing Agreement','If waiting → schedule a specific follow-up call before you leave'],resources:['Listing Agreement Packet','Seller Disclosure Forms','Follow-Up Template'],code:'Empowerment is the ultimate close — clarity wins over pressure.'},
      {id:'p3s35',num:'3.5',title:'Post-appointment follow-up',obj:'Keep momentum without pressure if seller needs time',special:true,checklist:['Send thank-you text or email same day — reference something specific from the conversation','Confirm the agreed follow-up call date and time','Leave-behind folder stays with the seller — let it work for you','Log all notes in CRM — motivation, objections, price discussion, next step','Update Lofty stage to Appointment Completed — set next contact date'],code:"The appointment isn't over until the CRM is updated and the next step is locked in."},
    ],
    summary:'Seller signs → move to Phase 4. Or seller needs time → confirmed follow-up call scheduled, CRM updated, leave-behind folder with them. Either outcome is a win if the next step is locked.',
  },
  {
    id:'p4',label:'Launch',
    title:'Phase 4 — Listing prep & launch',
    sub:'Begins the moment the listing agreement is signed. Transforms alignment into action — preparation, visual excellence, and a clean market launch.',
    steps:[
      {id:'p4s1',num:'1',title:'Contract wrap-up, disclosures & kickoff',obj:'Every signature done — set timeline and momentum immediately',checklist:['Confirm all listing docs signed — listing agreement, addenda','Confirm all seller disclosures signed — RPD, Radon, Lead, Agency, Wire Fraud, ABA','Align on prep timeline — photo window, staging touch-ups, target go-live week','Send Launch Kickoff Email + text — photo prep checklist, dates, weekly update cadence','Capture showing instructions — notice window, pet plan, off-limits areas','Establish key handling — your key + lockbox plan'],resources:['Launch Kickoff Email Template','Photo Prep Checklist','Weekly Update Cadence Sheet'],code:'Clarity kills anxiety. Give dates and set expectations immediately.'},
      {id:'p4s2',num:'2',title:'File setup & compliance (internal)',obj:'Organize the file and get Skyslope / CRM ready before any public activity',checklist:['Scan & upload fully executed docs to Drive — client folder structure','Create Skyslope transaction file and attach signed documents (listing side)','Create CRM tasks & dates — disclosures due, photo day, go-live target, open house','Draft MLS shell — DO NOT publish — pre-load remarks, features, schools, taxes','Confirm lockbox plan & code — install if appropriate pre-photo'],resources:['New Listing → Contract System Guide','Skyslope New Listing Steps'],code:'Backend order = front-end confidence. Sellers feel it even if they don\'t see it.'},
      {id:'p4s3',num:'3',title:'Staging strategy & seller prep',obj:'Simple, achievable prep plan that optimizes photos and showings',checklist:['Walk the home (in person or video) — prioritize only high-impact tweaks','Send Photo Prep Checklist same day you set the photo date','Offer a day-before virtual or in-person final pass (15–20 min)','Provide Preferred Partners as needed — cleaners, handyman, landscaper'],resources:['Photo Prep Checklist','Preferred Partners Sheet','Showing Instructions Template'],code:'"Design consult" tone, not criticism. Presence over perfection.'},
      {id:'p4s4',num:'4',title:'Media day coordination',obj:'Capture assets that sell the story and support pricing strategy',checklist:['Book photographer within 2–3 business days — confirm deliverables and turnaround','Provide shot list — exteriors (front/twilight), interiors, key features, community shots','Confirm weather/light, trash day, and access — reschedule if needed','If used — order video tour, 3D tour, and floorplan','Send same-day "we\'re set" text to seller — remind of final tidy checklist'],code:"Great media is leverage. Don't compromise on inputs."},
      {id:'p4s5',num:'5',title:'Marketing asset build',obj:'Create a cohesive, high-end package before syndication',checklist:['Write property description — long/short version, hooks, feature bullets','Complete MLS draft with final media — QA for data and compliance','Print listing flyer + open house flyer — print and digital versions','Create social set — grid / story / reel cover + ad audience plan','Build property page / URL — upload assets including YouTube for SEO'],resources:['Flyer Templates','Social Templates'],code:"Show, don't tell — your system becomes the sales pitch."},
      {id:'p4s6',num:'6',title:'Ramp-up & pre-marketing',obj:'Build demand before showings through compliant pre-marketing',checklist:['Confirm MLS rules — Coming Soon, signage, public ads, showing start date','If allowed — activate Coming Soon with clear go-live and first-showing date','Agent-to-agent email blast — social teasers — targeted ads with date-stamped plan','Circle-prospect neighbors — invite preview / open house','Install sign / riders and brochure box or QR poster'],code:'Play offense. Build a line at the door.'},
      {id:'p4s7',num:'7',title:'Go-live execution — launch day',obj:'Publish perfectly once — amplify everywhere for the first 72 hours',checklist:['Refresh CMA within 24 hrs of go-live — sanity-check pricing','Publish MLS — verify syndication (Zillow / Realtor / etc.) same day','Trigger "Just Listed" email + social + ads — send live links to seller','Enable ShowingTime and test notifications','Lock open house plan for first weekend if appropriate'],resources:['Go-Live QA Checklist','Just Listed Pack','ShowingTime Setup Guide'],code:'Launch is a performance. The first 72 hours matter most.'},
      {id:'p4s8',num:'8',title:'First 72-hour rhythm',obj:'Track demand and hand off cleanly into Phase 5',checklist:['Daily check — showings, feedback, listing views on Zillow / Realtor','Micro-update seller within 24 hrs of launch — text or voice note','Finalize open house logistics and reminders','Log everything in CRM for the Friday report','Prep Week 1 report — email or Loom'],code:'Consistency beats intensity. Presence is the product.'},
    ],
    summary:'Listing live, syndication verified, ShowingTime active, first weekend plan set, seller notified, Week 1 report queued. Hand off into Phase 5.',
  },
  {
    id:'p5',label:'Live',
    title:'Phase 5 — Live listing management',
    sub:'Performance and communication phase. Monitor activity, track feedback, manage pricing. Ends when an offer is received and accepted.',
    steps:[
      {id:'p5s1',num:'1',title:'Continuous marketing cycle',obj:'Keep exposure high through proactive, consistent promotion',checklist:['Duplicate and customize marketing templates for the property','Launch paid ad campaigns — Facebook + Google','Schedule "Just Listed" email blast','Post "Just Listed" social content across Instagram / Facebook / LinkedIn','Refresh creative weekly if listing exceeds 14 days on market'],code:'Momentum is built through consistency — not chance. Every impression compounds trust.'},
      {id:'p5s2',num:'2',title:'Showings & feedback loop',obj:'Capture activity, convert feedback into insights, communicate daily',checklist:["Monitor showing requests daily — Lofty / ShowingTime","Contact every buyer's agent for feedback — call or text","Log feedback in CRM or Feedback Tracker","Compile notes into AI prompt for polished summary","Email formatted feedback summary to seller before end of day"],aiPrompt:'AI Feedback Prompt: "Create a short, professional seller feedback summary from these showing comments. Group by theme (price, layout, condition, sentiment). Keep tone calm and data-driven. End with one proactive statement about next steps."',code:'Silence kills confidence — report before they ask.'},
      {id:'p5s3',num:'3',title:'Weekly seller report — Monday rhythm',obj:'Anchor trust through a predictable update cadence every Monday',checklist:['Gather showing count and activity summary','Pull Zillow / Realtor view data','Identify new comparable listings or pendings','Summarize feedback themes','Write brief analysis and recommendations','Send email + optional Loom recap to seller'],code:'Structure creates calm. Predictability is how you prove control.'},
      {id:'p5s4',num:'4',title:'Price review protocol',obj:'Re-evaluate pricing after two weeks or 10 showings without offers',checklist:['Review showing volume and feedback themes','Re-run CMA and competition snapshot','Draft visual comparing days on market vs price band','Schedule pricing conversation with seller','Frame language — "to better reflect the market\'s expectations"','Log discussion and update CRM notes'],code:"We don't chase buyers — we align with reality."},
      {id:'p5s5',num:'5',title:'Open house cycle',obj:'Re-energize interest through intentional open houses',checklist:['Schedule first open house within first or second weekend','Confirm seller prep checklist completed','Promote event 3–5 days prior — social + agent network','Host and capture leads via digital sign-in','Follow up with attendees within 24 hours','Deliver summary to seller — same day if possible'],code:'Every open house is a stage — the seller should feel like the star.'},
      {id:'p5s6',num:'6',title:'Offer intake & negotiation prep',obj:'Control pacing, clarity, and emotions through a structured offer review',checklist:['Confirm written offer in hand — never mention until received','Schedule formal review call / Zoom — same day if possible','Complete Offer Summary Sheet — one-page highlight PDF','Send summary 5–10 min before the call only','Present bottom-up — terms → deposit → timeline → price → net sheet','Ask: "Given your goals, does moving forward feel right?"'],code:'Control the pace, control the power. Facts first, feelings follow.'},
      {id:'p5s65',num:'6.5',title:'Multiple offer analysis matrix',obj:'Turn complexity into clarity through visual comparison and AI evaluation',special:true,checklist:['Collect all offers before review — set a deadline','Use Offer Comparison Dashboard — Price · Deposit · Loan Type · Closing Date · Contingencies','Upload all offers to Drive folder linked to CRM record','Use AI prompt to rank by net profit and risk level','Present top 3 options via screen share or PDF','Guide seller decision using motivation + data','Notify all agents professionally and archive responses'],aiPrompt:'AI Offer Prompt: "Analyze these offers and rank by net profit and risk level."',code:'Clarity builds confidence. When data leads, emotion follows.'},
      {id:'p5s7',num:'7',title:'Offer acceptance & transition to contract-to-close',obj:'Finalize negotiation and ensure seamless handoff to TC',checklist:['Verify all signatures and contingency dates in executed contract','Email acceptance confirmation to all parties','Send fully executed copy to TC — they upload all documents into Skyslope','Update CRM stage to Under Contract','Schedule Phase 6 kickoff tasks'],code:'Professionalism is how we close the loop on trust.'},
    ],
    summary:'Offer accepted, TC notified, all signatures verified, CRM updated to Under Contract, Phase 6 kickoff tasks queued.',
  },
  {
    id:'p6',label:'Close',
    title:'Phase 6 — Under contract → close',
    sub:'Begins the moment a listing goes under contract. Ends when funded, recorded, and archived. TC leads document flow — agent leads client communication.',
    steps:[
      {id:'p6s1',num:'1',title:'Contract intake & handoff',obj:'Open the file, align the team, stabilize expectations within 24 hours',checklist:['[TC] Send "Congrats / Next Steps" email to sellers — key dates + executed contract attached','[TC] Send all-party introduction — agents, attorneys, title, lender','[TC] Verify full execution and submit to compliance via Skyslope','[Agent] Provide One-Sheet + special conditions — HOA, survey, possession notes','[TC] Create contract timeline and sync to CRM'],code:'Clarity creates confidence. Control the thread — no detail gets lost.'},
      {id:'p6s2',num:'2',title:'Funds & milestones live',obj:'Confirm earnest money and lock in critical deadlines',checklist:['[TC] Confirm EMD received — upload receipt','[TC] Publish "Dates That Drive the Deal" timeline for all parties','[Agent] Cross-check deadlines and set calendar reminders','[TC] Sync milestones to calendar and CRM'],code:'Dates are promises — protect them.'},
      {id:'p6s3',num:'3',title:'Inspection & repairs',obj:'Guide the seller through inspection with calm, clarity, and confidence',checklist:['[TC] Send Inspection FAQ + schedule confirmation','[Agent] Summarize inspection findings in plain English before discussing solutions','[Agent] Negotiate repairs or credits — protect seller perception and leverage','[TC] Draft repair amendment for e-sign and upload to Skyslope'],code:'Facts calm emotions. Anchor sellers to solutions, not problems.'},
      {id:'p6s4',num:'4',title:'Appraisal & financing',obj:'Protect property value and monitor loan progress — no surprises',checklist:['[TC] Confirm appraisal ordered and scheduled','[Agent] Deliver Appraiser Packet with comps and upgrade sheet','[TC] Track loan milestones until clear to close','[Agent] Keep seller informed during appraisal-to-commitment gap'],code:'Anticipate before they ask. Speed builds trust.'},
      {id:'p6s5',num:'5',title:'Title / attorney pipeline',obj:'Process legal and title deliverables early to prevent bottlenecks',checklist:['[TC] Open title order and confirm attorney connections on both sides','[TC] Request payoff statement, HOA docs, and prelim settlement','[Agent] Review prelim statement for accuracy','[TC] Upload confirmations and maintain communication with attorneys'],code:'The quietest deals are the ones prepared ahead of time.'},
      {id:'p6s6',num:'6',title:'Weekly rhythm + micro-signals',obj:'Maintain client confidence through consistent cadence',checklist:['[TC] Send weekly Monday status updates','[Agent] Send micro-updates for major events — appraisal ordered, inspection complete, etc.','[TC] Update contract timeline with new confirmations','[Agent] Personal check-in every 7–10 days — voice over text'],code:'Silence creates doubt. Predictable rhythm builds trust.'},
      {id:'p6s7',num:'7',title:'Pre-closing orchestration',obj:'Make closing seamless through proactive reminders and document control',checklist:['[TC] Send Utilities + "Broom Clean" Reminder Email','[Agent] Generate and send CDA to title for broker payment','[TC] Confirm final settlement draft accuracy','[Agent] Call title company day before closing — confirm time, wire, and attendance'],code:'The day before closing defines how the client remembers you.'},
      {id:'p6s8',num:'8',title:'Closing day & post-close',obj:'Confirm funding — close the experience with gratitude and professionalism',checklist:['[TC] Confirm closing funded + upload signed settlement / broker check','[Agent] Close out MLS listing','[Agent] Send thank-you email, review request, and client gift','[TC] Send all-party thank-you email and archive the file'],code:'End with ceremony and certainty. A smooth closing cements trust and seeds future referrals.'},
    ],
    summary:'Closing funded, MLS closed out, thank-you sent, review requested, client gift delivered, file archived. Transaction complete.',
  },
]

const PHASE_COLORS = {
  p1:{bg:'#1a1a18',border:'#333330',text:'#888780'},
  p2:{bg:'#0c1e36',border:'#1a4a7a',text:'#6a9fd4'},
  p3:{bg:'#042820',border:'#0a5040',text:'#5ac4a0'},
  p4:{bg:'#2a1a04',border:'#5a3a08',text:'#d4a054'},
  p5:{bg:'#0f2a04',border:'#2a5a08',text:'#84c454'},
  p6:{bg:'#2a1204',border:'#5a2808',text:'#d47854'},
}

// ── Step component ────────────────────────────────────────────────────────────
function Step({ step, phaseId }) {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState({})
  const pc = PHASE_COLORS[phaseId]
  const doneCount = Object.values(checked).filter(Boolean).length
  const total = step.checklist?.length || 0

  return (
    <div style={{ border: `0.5px solid ${step.special ? '#5a3a08' : '#2a2a28'}`, borderRadius: 10, background: '#1a1a18', overflow: 'hidden', marginBottom: 8 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: pc.bg, border: `0.5px solid ${pc.border}`, color: pc.text }}>{step.num}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: step.special ? '#d4a054' : '#f5f3ee', marginBottom: 2 }}>{step.title}</div>
          <div style={{ fontSize: 11, color: '#666663', lineHeight: 1.4 }}>{step.obj}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {total > 0 && <div style={{ fontSize: 10, color: doneCount === total && total > 0 ? '#84c454' : '#555', fontFamily: "'DM Mono'" }}>{doneCount}/{total}</div>}
          <div style={{ fontSize: 12, color: '#555', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {step.checklist?.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#555552', marginBottom: 8 }}>Checklist</div>
              {step.checklist.map((item, i) => (
                <div key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: checked[i] ? '#444440' : '#a8a6a0', lineHeight: 1.5, cursor: 'pointer', textDecoration: checked[i] ? 'line-through' : 'none', marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `0.5px solid ${checked[i] ? '#185FA5' : '#444440'}`, background: checked[i] ? '#378ADD' : '#222220', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                    {checked[i] && <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><polyline points="1,3 3.5,5.5 8,1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </>
          )}
          {step.extra}
          {step.aiPrompt && <div style={{ background: '#0c1e36', border: '0.5px solid #1a4a7a', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#6a9fd4', lineHeight: 1.6, fontStyle: 'italic', marginTop: 10 }}>{step.aiPrompt}</div>}
          {step.resources?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#555552', marginBottom: 8 }}>Resources</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {step.resources.map(r => <span key={r} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #333330', background: '#222220', color: '#888780' }}>{r}</span>)}
              </div>
            </div>
          )}
          {step.code && <div style={{ fontSize: 11, color: '#555552', borderLeft: '2px solid #333330', paddingLeft: 10, fontStyle: 'italic', lineHeight: 1.6, marginTop: 12 }}>{step.code}</div>}
        </div>
      )}
    </div>
  )
}

// ── Seller Process page ───────────────────────────────────────────────────────
function SellerProcess({ onBack }) {
  const [activePhase, setActivePhase] = useState('p1')
  const phase = PHASES.find(p => p.id === activePhase)
  const pc = PHASE_COLORS[activePhase]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888', flexShrink: 0 }}>‹</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Seller Process</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>Six-phase system from first call to close</div>
        </div>
      </div>

      {/* Phase nav */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
        {PHASES.map(p => {
          const c = PHASE_COLORS[p.id]
          const isActive = activePhase === p.id
          return (
            <div key={p.id} onClick={() => setActivePhase(p.id)}
              style={{ flexShrink: 0, padding: '7px 14px', fontSize: 12, fontWeight: 500, borderRadius: 20, border: `0.5px solid ${isActive ? c.border : '#333330'}`, background: isActive ? c.bg : '#1a1a18', color: isActive ? c.text : '#888780', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {p.label}
            </div>
          )
        })}
      </div>

      {/* Phase header */}
      <div style={{ borderRadius: 12, padding: '14px 16px', marginBottom: 16, background: pc.bg, border: `0.5px solid ${pc.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f3ee', marginBottom: 4 }}>{phase.title}</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: pc.text }}>{phase.sub}</div>
      </div>

      {/* Steps */}
      {phase.steps.map((step, i) => (
        <React.Fragment key={step.id}>
          <Step step={step} phaseId={activePhase} />
          {i < phase.steps.length - 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 18, color: '#333', fontSize: 12 }}>↓</div>
          )}
        </React.Fragment>
      ))}

      {/* Summary */}
      <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, border: '0.5px solid #333330', background: '#222220' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888780', marginBottom: 4 }}>Phase complete when:</div>
        <div style={{ fontSize: 11, color: '#666663', lineHeight: 1.6 }}>{phase.summary}</div>
      </div>
    </div>
  )
}

// ── Sellers hub ───────────────────────────────────────────────────────────────
function SellersHub({ onBack }) {
  const [view, setView] = useState(null) // null | 'process'

  if (view === 'process') return <SellerProcess onBack={() => setView(null)} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888', flexShrink: 0 }}>‹</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Sellers</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>Tools & systems for your seller clients</div>
        </div>
      </div>

      <div onClick={() => setView('process')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: '#161618', border: '1px solid #242428', borderRadius: 16, cursor: 'pointer', marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#042820', border: '1px solid #0a5040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📋</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#e8e6e1', marginBottom: 4 }}>Seller Process</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>6-phase system · Lead through close</div>
        </div>
        <div style={{ fontSize: 20, color: '#333' }}>›</div>
      </div>

      {/* Placeholder for future tools */}
      <div style={{ padding: '14px 20px', background: '#0f0f11', border: '1px dashed #242428', borderRadius: 14, textAlign: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#333' }}>More seller tools coming soon</div>
      </div>
    </div>
  )
}

// ── Root Real Estate page ─────────────────────────────────────────────────────
export default function RealEstate() {
  const [view, setView] = useState(null) // null | 'sellers' | 'buyers'

  if (view === 'sellers') return <SellersHub onBack={() => setView(null)} />
  if (view === 'buyers') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div onClick={() => setView(null)} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888', flexShrink: 0 }}>‹</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Buyers</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>Tools & systems for your buyer clients</div>
        </div>
      </div>
      <div style={{ padding: '40px 20px', background: '#0f0f11', border: '1px dashed #242428', borderRadius: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
        <div style={{ fontSize: 14, color: '#555' }}>Buyer tools coming soon</div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 2 }}>Real Estate</div>
        <div style={{ fontSize: 12, color: '#555' }}>Beyond Horizons systems & tools</div>
      </div>

      {/* Sellers card */}
      <div onClick={() => setView('sellers')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', background: '#161618', border: '1px solid #242428', borderRadius: 16, cursor: 'pointer', marginBottom: 12 }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: '#0c1e36', border: '1px solid #1a4a7a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🏡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#e8e6e1', marginBottom: 4 }}>Sellers</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>Process, scripts & tools for listing clients</div>
        </div>
        <div style={{ fontSize: 22, color: '#333' }}>›</div>
      </div>

      {/* Buyers card */}
      <div onClick={() => setView('buyers')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', background: '#161618', border: '1px solid #242428', borderRadius: 16, cursor: 'pointer', marginBottom: 12 }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: '#2a1204', border: '1px solid #5a2808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🔑</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#e8e6e1', marginBottom: 4 }}>Buyers</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>Process & tools for buyer clients</div>
        </div>
        <div style={{ fontSize: 22, color: '#333' }}>›</div>
      </div>
    </div>
  )
}
