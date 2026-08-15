"use client";

import { useMemo, useState } from "react";

type Trust = "Verified" | "Likely" | "Needs a call";
type Venue = {
  id: number | string;
  name: string;
  address: string;
  neighborhood: string;
  score: number;
  commute: string;
  mode: "Walk" | "Drive";
  capacity: number;
  price: string;
  priceTrust: Trust;
  trust: Trust;
  note: string;
  tags: string[];
  rooms: { name: string; capacity: string; trust?: Trust }[];
  contact: string;
  phone: string;
  tone: string;
  sourceUrl?: string;
  sourceLabel?: string;
  imageUrl?: string;
  menuUrl?: string;
};

const demoVenues: Venue[] = [
  {
    id: 1,
    name: "The Terrace Room",
    address: "18 W 40th St, New York, NY",
    neighborhood: "Bryant Park",
    score: 94,
    commute: "12 min",
    mode: "Walk",
    capacity: 72,
    price: "$12k minimum",
    priceTrust: "Likely",
    trust: "Verified",
    note: "Best overall fit — a right-sized private room, short walk, and strong menu flexibility.",
    tags: ["Seasonal American", "AV included", "Vegan menu"],
    rooms: [
      { name: "Terrace Salon", capacity: "56 seated · 72 reception" },
      { name: "Library", capacity: "24 seated" },
    ],
    contact: "events@terraceroom.example",
    phone: "+1 212 555 0148",
    tone: "umber",
  },
  {
    id: 2,
    name: "Juniper & Ash",
    address: "11 W 32nd St, New York, NY",
    neighborhood: "NoMad",
    score: 89,
    commute: "14 min",
    mode: "Drive",
    capacity: 60,
    price: "$$$ · est. $185 pp",
    priceTrust: "Likely",
    trust: "Likely",
    note: "A polished, intimate option with an exact capacity match and responsive events team.",
    tags: ["New American", "Gluten-aware", "Full bar"],
    rooms: [
      { name: "Ash Room", capacity: "50 seated · 60 reception" },
      { name: "Chef's Gallery", capacity: "18 seated" },
    ],
    contact: "private@juniperash.example",
    phone: "+1 212 555 0181",
    tone: "green",
  },
  {
    id: 3,
    name: "Maison Rue",
    address: "44 W 53rd St, New York, NY",
    neighborhood: "Midtown",
    score: 83,
    commute: "9 min",
    mode: "Drive",
    capacity: 90,
    price: "$18k minimum",
    priceTrust: "Needs a call",
    trust: "Verified",
    note: "The fastest commute and most elevated setting, with a higher estimated spend.",
    tags: ["French", "Sommelier", "Wheelchair accessible"],
    rooms: [
      { name: "Salon Privé", capacity: "64 seated · 90 reception" },
      { name: "Wine Room", capacity: "20 seated" },
    ],
    contact: "celebrate@maisonrue.example",
    phone: "+1 212 555 0126",
    tone: "wine",
  },
];

const presets = [
  { label: "Times Square · 50", address: "Times Square, New York, NY", people: 50, minutes: 20, mode: "Walk" },
  { label: "Salesforce Tower · 30", address: "415 Mission St, San Francisco, CA 94105", people: 30, minutes: 15, mode: "Drive" },
  { label: "Waikiki · 200 reception", address: "Hilton Hawaiian Village Waikiki Beach Resort", people: 200, minutes: 15, mode: "Walk" },
];

export default function Home() {
  const [address, setAddress] = useState("Times Square, New York, NY");
  const [people, setPeople] = useState(50);
  const [minutes, setMinutes] = useState(20);
  const [mode, setMode] = useState("Walk");
  const [query, setQuery] = useState("A polished private dinner with great vegetarian options");
  const [venues, setVenues] = useState<Venue[]>(demoVenues);
  const [saved, setSaved] = useState<(number|string)[]>([]);
  const [compare, setCompare] = useState<(number|string)[]>([]);
  const [active, setActive] = useState<Venue | null>(null);
  const [listening, setListening] = useState(false);
  const [searched, setSearched] = useState(true);
  const [searchError, setSearchError] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [outreach, setOutreach] = useState<Venue | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [plannerName, setPlannerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [budget, setBudget] = useState("");
  const [draftText, setDraftText] = useState("");
  const [copied, setCopied] = useState(false);

  const compared = useMemo(() => venues.filter((venue) => compare.includes(venue.id)), [compare]);

  function toggleCompare(id: number|string) {
    setCompare((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current,
    );
  }

  async function searchVenues() {
    setSearched(false);
    setSearchError("");
    try {
      const response = await fetch("/api/search", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({address,headcount:people,maxCommuteMinutes:minutes,mode:mode === "Drive" ? "driving" : "walking",eventStyle:query.toLowerCase().includes("reception") || people >= 150 ? "reception" : "seated"}) });
      const data = await response.json() as {results?:Venue[];error?:string};
      if (!response.ok) throw new Error(data.error ?? "Search failed");
      setVenues(data.results ?? []);
      setIsLive(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
    } finally { setSearched(true); }
  }

  function startVoice() {
    const SpeechRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: (event: { results: { 0: { 0: { transcript: string } } }[] }) => void; onend: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setQuery("Voice input isn’t available here — type your event brief instead.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => setQuery(event.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  function buildDraft(venue: Venue) {
    const reception = query.toLowerCase().includes("reception") || people >= 150;
    const occasion = reception ? "reception-style event" : "private dinner";
    const dateLine = eventDate || "Date to be confirmed";
    const timeLine = eventTime || "Timing to be confirmed";
    const room = venue.rooms[0]?.name ?? "your best-fit private space";
    const signature = plannerName ? `${plannerName}${companyName ? `\n${companyName}` : ""}` : "[Your name]";
    return `Hello ${venue.name} events team,\n\nI'm planning a ${occasion} for ${people} guests and would love to explore hosting it at ${venue.name}. Based on our research, ${room} may be a strong fit.\n\nEVENT SNAPSHOT\n• Date: ${dateLine}\n• Time: ${timeLine}\n• Guest count: ${people}\n• Format: ${reception ? "Happy hour / reception" : "Seated private dining"}\n• Event brief: ${query}\n${budget ? `• Target budget: ${budget}\n` : ""}\nCould you please confirm:\n\n1. Availability and the best private or semi-private space for this group\n2. Seated and reception capacity for the proposed layout\n3. Current food-and-beverage minimum, per-person packages, room fees, service charges, and taxes\n4. Group menus and accommodations for vegetarian, vegan, gluten-free, and allergy-related needs\n5. Whether the space is fully private and what AV is included or available\n6. Deposit, cancellation terms, and the next step to place a courtesy hold\n\nIf possible, please also share a current event packet, sample menus, and photos or floor plans of the recommended room.\n\nThank you,\n${signature}`;
  }

  function openOutreach(venue: Venue) {
    setOutreach(venue);
    setActive(null);
    setDraftText(buildDraft(venue));
    setCopied(false);
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(draftText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function openEmail() {
    if (!outreach) return;
    const recipient = outreach.contact.includes("@") ? outreach.contact : "";
    const subject = `Private event inquiry — ${people} guests at ${outreach.name}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draftText)}`;
  }

  function downloadBrief() {
    if (!outreach) return;
    const blob = new Blob([`bytes outreach kit\n${outreach.name}\n${outreach.address}\n\n${draftText}\n\nResearch source: ${outreach.sourceUrl ?? "Not available"}`], {type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${outreach.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-outreach.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="bytes private dining home"><span>b</span>bytes</a>
        <div className="nav-links"><a href="#results">Discover</a><a href="#shortlist">Shortlist <b>{saved.length}</b></a><button className="avatar" aria-label="Open profile">SC</button></div>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span /> Private dining, thoughtfully found</div>
        <h1>Your next remarkable<br /><em>table, found.</em></h1>
        <p className="hero-copy">Tell us what the occasion calls for. We’ll find and rank private spaces that fit the room, the route, and the mood.</p>

        <div className="planner-card">
          <label htmlFor="brief">What are you planning?</label>
          <div className="brief-row">
            <textarea id="brief" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button className={`voice ${listening ? "listening" : ""}`} onClick={startVoice} aria-label="Describe your event by voice">{listening ? "•••" : "⌁"}</button>
          </div>
          <div className="fields">
            <label><small>LOCATION</small><span className="field-icon">⌖</span><input value={address} onChange={(event) => setAddress(event.target.value)} /></label>
            <label><small>GUESTS</small><span className="field-icon">♙</span><input type="number" value={people} onChange={(event) => setPeople(Number(event.target.value))} /></label>
            <label><small>MAX COMMUTE</small><span className="field-icon">◷</span><input type="number" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /><i>min</i></label>
            <label><small>TRAVEL BY</small><span className="field-icon">↟</span><select value={mode} onChange={(event) => setMode(event.target.value)}><option>Walk</option><option>Drive</option></select></label>
            <button className="search" onClick={searchVenues}>Find venues <span>→</span></button>
          </div>
        </div>
        <div className="presets"><span>Try a sample search</span>{presets.map((preset) => <button key={preset.label} onClick={() => { setAddress(preset.address); setPeople(preset.people); setMinutes(preset.minutes); setMode(preset.mode); }}>{preset.label}</button>)}</div>
      </section>

      <section className="results" id="results">
        <div className="shell">
          <div className="results-head">
            <div><div className="eyebrow"><span /> {isLive ? "Live researched results" : "Preview results"}</div><h2>{venues.length} places worth considering</h2><p>For {people} guests · within {minutes} min by {mode.toLowerCase()} from {address}</p>{searchError && <p className="search-error">{searchError}</p>}</div>
            <button className="filter">Tune results <span>☷</span></button>
          </div>

          <div className={`venue-list ${searched ? "" : "loading"}`}>
            {venues.map((venue, index) => (
              <article className="venue-card" key={venue.id}>
                <div className={`venue-art ${venue.tone} ${venue.imageUrl ? "has-photo" : ""}`} style={venue.imageUrl ? {backgroundImage:`linear-gradient(180deg, rgba(20,20,16,.08), rgba(20,20,16,.28)), url("${venue.imageUrl}")`} : undefined}><span>0{index + 1}</span>{!venue.imageUrl && <div className="room-shape"><i /><b /><em /></div>}<button className={saved.includes(venue.id) ? "saved" : ""} onClick={() => setSaved((items) => items.includes(venue.id) ? items.filter((id) => id !== venue.id) : [...items, venue.id])} aria-label="Save venue">{saved.includes(venue.id) ? "♥" : "♡"}</button></div>
                <div className="venue-content">
                  <div className="venue-title"><div><p>{venue.neighborhood} · {venue.address}</p><h3>{venue.name}</h3></div><div className="score"><b>{venue.score}</b><span>FIT SCORE</span></div></div>
                  <p className="why">{venue.note}</p>
                  <div className="signals">
                    <div><small>CAPACITY</small><strong><i className="dot good" /> Up to {venue.capacity}</strong><span>{venue.rooms.length} private spaces</span></div>
                    <div><small>COMMUTE</small><strong><i className="dot good" /> {venue.commute} {venue.mode.toLowerCase()}</strong><span>Within your limit</span></div>
                    <div><small>PRICE</small><strong><i className={`dot ${venue.priceTrust === "Needs a call" ? "warn" : "likely"}`} /> {venue.price}</strong><span>{venue.priceTrust}</span></div>
                    <div><small>TRUST</small><strong><i className={`dot ${venue.trust === "Verified" ? "good" : "likely"}`} /> {venue.trust}</strong><span>Sources reviewed</span></div>
                  </div>
                  <div className="tags">{venue.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="card-actions"><button onClick={() => setActive(venue)}>View details <span>→</span></button><button className="inquiry-link" onClick={() => openOutreach(venue)}>Draft inquiry ✦</button>{venue.menuUrl && <a href={venue.menuUrl} target="_blank" rel="noreferrer">Menu ↗</a>}<label><input type="checkbox" checked={compare.includes(venue.id)} onChange={() => toggleCompare(venue.id)} /> Compare</label></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="principle shell">
        <div className="eyebrow"><span /> Confidence, built in</div>
        <h2>Every recommendation<br />shows its <em>work.</em></h2>
        <p>Capacity, pricing, and policies change. We label every detail by confidence, so you always know what’s confirmed—and what needs a call.</p>
        <div className="trust-key"><span><i className="dot good" /><b>Verified</b> confirmed by venue source</span><span><i className="dot likely" /><b>Likely</b> supported by recent research</span><span><i className="dot warn" /><b>Needs a call</b> worth confirming</span></div>
      </section>

      <footer className="shell"><a className="brand" href="#top"><span>b</span>bytes</a><p>Private dining intelligence for remarkable gatherings.</p><span>Research, not reservations.</span></footer>

      {compare.length > 0 && <div className="compare-bar" id="shortlist"><div><small>SHORTLISTED {compare.length} OF 3</small><div className="compare-names">{compared.map((venue) => <span key={venue.id}>{venue.name}<button onClick={() => toggleCompare(venue.id)}>×</button></span>)}</div></div><button className="compare-button" onClick={() => openOutreach(compared[0])}>Build outreach kit ✦</button></div>}

      {active && <div className="modal-backdrop" onClick={() => setActive(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setActive(null)}>×</button><div className={`modal-art ${active.tone} ${active.imageUrl ? "has-photo" : ""}`} style={active.imageUrl ? {backgroundImage:`linear-gradient(180deg, rgba(20,20,16,.2), rgba(20,20,16,.68)), url("${active.imageUrl}")`} : undefined}><p>{active.neighborhood}</p><h2>{active.name}</h2><span>{active.score}% overall fit</span></div><div className="modal-body"><p className="why">{active.note}</p><h3>Private spaces</h3>{active.rooms.map((room) => <div className="room" key={room.name}><b>{room.name}</b><span>{room.capacity}</span><i className={`dot ${room.trust === "Verified" ? "good" : room.trust === "Likely" ? "likely" : "warn"}`} /> {room.trust ?? active.trust}</div>)}<h3>Planner notes</h3><div className="detail-grid"><p><small>COMMUTE</small><b>{active.commute} by {active.mode.toLowerCase()}</b></p><p><small>PRICE SIGNAL</small><b>{active.price}</b><span>{active.priceTrust}</span></p><p><small>EMAIL</small><b>{active.contact}</b></p><p><small>PHONE</small><b>{active.phone}</b></p></div><div className="source-actions">{active.menuUrl && <a className="source-link menu-link" href={active.menuUrl} target="_blank" rel="noreferrer">Open menu ↗</a>}{active.sourceUrl && <a className="source-link" href={active.sourceUrl} target="_blank" rel="noreferrer">Official venue source ↗</a>}</div><div className="modal-cta"><button className="secondary" onClick={() => setSaved((items) => items.includes(active.id) ? items : [...items, active.id])}>Shortlist</button><button className="primary" onClick={() => openOutreach(active)}>Create outreach kit ✦</button></div></div></section></div>}

      {outreach && <div className="modal-backdrop outreach-backdrop" onClick={() => setOutreach(null)}><section className="outreach-modal" onClick={(event) => event.stopPropagation()}><button className="outreach-close" onClick={() => setOutreach(null)}>×</button><header><div className="eyebrow"><span /> Ready for outreach</div><h2>Turn interest into<br /><em>an answer.</em></h2><p>bytes has drafted the questions that usually create planning back-and-forth. Review, personalize, and send from your own inbox.</p></header><div className="outreach-workspace"><aside><small>VENUE</small><h3>{outreach.name}</h3><p>{outreach.address}</p><div className="outreach-fact"><span>Best-fit signal</span><b>{outreach.score}% fit · {outreach.commute} {outreach.mode.toLowerCase()}</b></div><div className="outreach-fact"><span>Pricing status</span><b>{outreach.priceTrust}</b></div><h4>Personalize</h4><label>Event date<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label><label>Start time<input type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} /></label><label>Your name<input value={plannerName} onChange={(event) => setPlannerName(event.target.value)} placeholder="Shreya" /></label><label>Company<input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Company or client" /></label><label>Target budget<input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Optional" /></label><button className="refresh-draft" onClick={() => setDraftText(buildDraft(outreach))}>Refresh draft with details ↻</button></aside><div className="draft-panel"><div className="draft-head"><div><small>TO</small><b>{outreach.contact}</b></div><span>Draft only · nothing sent</span></div><label>SUBJECT<input value={`Private event inquiry — ${people} guests at ${outreach.name}`} readOnly /></label><label>MESSAGE<textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} /></label><div className="draft-actions"><button className="secondary" onClick={downloadBrief}>Download brief ↓</button><button className="secondary" onClick={copyDraft}>{copied ? "Copied ✓" : "Copy draft"}</button><button className="primary" onClick={openEmail}>Open in email →</button></div></div></div></section></div>}
    </main>
  );
}
