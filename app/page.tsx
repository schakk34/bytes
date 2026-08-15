"use client";

import { useMemo, useState } from "react";

type Trust = "Verified" | "Likely" | "Needs a call";
type Venue = {
  id: number;
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
  rooms: { name: string; capacity: string }[];
  contact: string;
  phone: string;
  tone: string;
};

const venues: Venue[] = [
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
  const [saved, setSaved] = useState<number[]>([]);
  const [compare, setCompare] = useState<number[]>([]);
  const [active, setActive] = useState<Venue | null>(null);
  const [listening, setListening] = useState(false);
  const [searched, setSearched] = useState(true);

  const compared = useMemo(() => venues.filter((venue) => compare.includes(venue.id)), [compare]);

  function toggleCompare(id: number) {
    setCompare((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current,
    );
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

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="Nowadays private dining home"><span>N</span>Nowadays</a>
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
            <button className="search" onClick={() => { setSearched(false); window.setTimeout(() => setSearched(true), 450); }}>Find venues <span>→</span></button>
          </div>
        </div>
        <div className="presets"><span>Try a sample search</span>{presets.map((preset) => <button key={preset.label} onClick={() => { setAddress(preset.address); setPeople(preset.people); setMinutes(preset.minutes); setMode(preset.mode); }}>{preset.label}</button>)}</div>
      </section>

      <section className="results" id="results">
        <div className="shell">
          <div className="results-head">
            <div><div className="eyebrow"><span /> Curated for your brief</div><h2>{venues.length} places worth considering</h2><p>For {people} guests · within {minutes} min by {mode.toLowerCase()} from {address}</p></div>
            <button className="filter">Tune results <span>☷</span></button>
          </div>

          <div className={`venue-list ${searched ? "" : "loading"}`}>
            {venues.map((venue, index) => (
              <article className="venue-card" key={venue.id}>
                <div className={`venue-art ${venue.tone}`}><span>0{index + 1}</span><div className="room-shape"><i /><b /><em /></div><button className={saved.includes(venue.id) ? "saved" : ""} onClick={() => setSaved((items) => items.includes(venue.id) ? items.filter((id) => id !== venue.id) : [...items, venue.id])} aria-label="Save venue">{saved.includes(venue.id) ? "♥" : "♡"}</button></div>
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
                  <div className="card-actions"><button onClick={() => setActive(venue)}>View details <span>→</span></button><label><input type="checkbox" checked={compare.includes(venue.id)} onChange={() => toggleCompare(venue.id)} /> Add to compare</label></div>
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

      <footer className="shell"><a className="brand" href="#top"><span>N</span>Nowadays</a><p>Private dining intelligence for remarkable gatherings.</p><span>Research, not reservations.</span></footer>

      {compare.length > 0 && <div className="compare-bar" id="shortlist"><div><small>COMPARING {compare.length} OF 3</small><div className="compare-names">{compared.map((venue) => <span key={venue.id}>{venue.name}<button onClick={() => toggleCompare(venue.id)}>×</button></span>)}</div></div><button className="compare-button" onClick={() => setActive(compared[0])}>Compare venues →</button></div>}

      {active && <div className="modal-backdrop" onClick={() => setActive(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setActive(null)}>×</button><div className={`modal-art ${active.tone}`}><p>{active.neighborhood}</p><h2>{active.name}</h2><span>{active.score}% overall fit</span></div><div className="modal-body"><p className="why">{active.note}</p><h3>Private spaces</h3>{active.rooms.map((room) => <div className="room" key={room.name}><b>{room.name}</b><span>{room.capacity}</span><i className="dot good" /> Verified</div>)}<h3>Planner notes</h3><div className="detail-grid"><p><small>COMMUTE</small><b>{active.commute} by {active.mode.toLowerCase()}</b></p><p><small>PRICE SIGNAL</small><b>{active.price}</b><span>{active.priceTrust}</span></p><p><small>EMAIL</small><b>{active.contact}</b></p><p><small>PHONE</small><b>{active.phone}</b></p></div><button className="primary" onClick={() => setSaved((items) => items.includes(active.id) ? items : [...items, active.id])}>Add to shortlist</button></div></section></div>}
    </main>
  );
}
