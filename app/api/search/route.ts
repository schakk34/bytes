import { NextRequest, NextResponse } from "next/server";
import { rankCandidate } from "../../../lib/ranking";

type TrustLevel = "verified" | "likely" | "unverified";
type DbFact = { field_name:string; trust:TrustLevel; verified_at:string|null; expires_at:string|null };
type DbSpace = { id:string; name:string; privacy:string; seated_capacity:number|null; reception_capacity:number|null; notes:string|null; facts:DbFact[] };
type DbVenue = {
  id:string; name:string; slug:string; address_line_1:string; city:string; region:string; postal_code:string|null;
  events_url:string|null; contact_email:string|null; contact_phone:string|null; description:string|null;
  cuisine:string[]|null; dietary_accommodations:string[]|null; spaces:DbSpace[];
};

const venueMedia:Record<string,{imageUrl:string;menuUrl:string}> = {
  "carmines-times-square": { imageUrl:"https://carminesnyc.com/assets/uploads/general/carmines-og-parties-times-square.jpg", menuUrl:"https://carminesnyc.com/assets/uploads/general/C44_SE_PPP_Dinner_Menus_24-25.pdf" },
  "dos-caminos-times-square": { imageUrl:"https://images.getbento.com/accounts/27875890eb880b0b8cf591e23d0d38c2/media/images/3120Dos_Caminos_Time_Square_2000x900.jpg?w=1200&fit=crop&auto=compress,format&cs=origin&h=600", menuUrl:"https://www.doscaminos.com/location/dos-caminos-times-square/" },
  "tonys-di-napoli-times-square": { imageUrl:"https://images.squarespace-cdn.com/content/v1/5fbe10dbc6d9645836108177/35d254b0-4489-475a-babb-0edf4aba2fb1/Banquet+Room+Times+Square.png?format=1000w", menuUrl:"https://www.tonysnyc.com/menu" },
  "prospect-san-francisco": { imageUrl:"https://images.getbento.com/accounts/9de65a672aac6b11bbe8d7ae65dbf367/media/images/8225Salad9115.jpg?w=1200&fit=crop&auto=compress,format&cs=origin&h=600", menuUrl:"https://www.prospectsf.com/menus/" },
  "international-smoke-san-francisco": { imageUrl:"https://theminagroup.com/wp-content/uploads/2025/01/private-events-michael-03-1024x576.png", menuUrl:"https://internationalsmoke.com/menus" },
  "waterbar-san-francisco": { imageUrl:"https://images.getbento.com/accounts/57c286fa6cfbd8712bc882c30a596d49/media/images/89641Waterbar_0709_copy-2.jpg?w=1200&fit=crop&auto=compress,format&cs=origin&h=600", menuUrl:"https://www.waterbarsf.com/private-dining/" },
  "hilton-hawaiian-village": { imageUrl:"https://assets.hiltonstatic.com/images/c_fill%2Cw_940%2Ch_626%2Cq_80%2Cf_auto%2Cg_auto/v1657891476/dx/wp/hnlhvhh-hilton-hawaiian-village-waikiki-beach-resort/media-library/HHV_Garden_event_09__1_/HHV_Garden_event_09__1_.jpg?_i=AA", menuUrl:"https://www.hilton.com/en/hotels/hnlhvhh-hilton-hawaiian-village-waikiki-beach-resort/events/" },
  "prince-waikiki": { imageUrl:"https://www.princewaikiki.com/content/uploads/2024/06/@elizahodgson-@stephenwright_5-scaled.jpg", menuUrl:"https://www.princewaikiki.com/content/uploads/2026/02/2026-Banquet-Menu-02.27.2026.pdf" },
};

const trustLabel:Record<TrustLevel,"Verified"|"Likely"|"Needs a call"> = {
  verified:"Verified",
  likely:"Likely",
  unverified:"Needs a call",
};

function capacityTrustFor(space:DbSpace):TrustLevel {
  const now = Date.now();
  const currentCapacityFacts = (space.facts ?? [])
    .filter((fact) => fact.field_name === "capacity" && (!fact.expires_at || Date.parse(fact.expires_at) > now))
    .sort((a,b) => Date.parse(b.verified_at ?? "1970-01-01") - Date.parse(a.verified_at ?? "1970-01-01"));
  return currentCapacityFacts[0]?.trust ?? "unverified";
}

async function route(origin:string, destination:string, mode:"walking"|"driving", apiKey:string) {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "X-Goog-Api-Key":apiKey, "X-Goog-FieldMask":"routes.duration,routes.distanceMeters" },
    body:JSON.stringify({ origin:{address:origin}, destination:{address:destination}, travelMode:mode === "walking" ? "WALK" : "DRIVE" }),
  });
  if (!response.ok) throw new Error(`Routes API returned ${response.status}`);
  const data = await response.json() as { routes?:{duration:string;distanceMeters:number}[] };
  const result = data.routes?.[0];
  if (!result) return null;
  return { minutes:Math.max(1, Math.ceil(Number.parseInt(result.duration, 10) / 60)), meters:result.distanceMeters };
}

export async function POST(request:NextRequest) {
  const body = await request.json() as { address?:string; headcount?:number; maxCommuteMinutes?:number; mode?:"walking"|"driving"; eventStyle?:"seated"|"reception"|"either" };
  const address = body.address?.trim();
  const headcount = Number(body.headcount);
  const maxCommuteMinutes = Number(body.maxCommuteMinutes);
  const mode = body.mode === "driving" ? "driving" : "walking";
  const eventStyle = body.eventStyle ?? "seated";
  if (!address || !headcount || !maxCommuteMinutes) return NextResponse.json({error:"Address, headcount, and commute limit are required."},{status:400});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!supabaseUrl || !supabaseKey || !mapsKey) return NextResponse.json({error:"Search services are not configured."},{status:503});

  const venuesResponse = await fetch(`${supabaseUrl}/rest/v1/venues?select=*,spaces(*,facts(field_name,trust,verified_at,expires_at))&active=eq.true`, { headers:{apikey:supabaseKey}, cache:"no-store" });
  if (!venuesResponse.ok) return NextResponse.json({error:"Venue research is temporarily unavailable."},{status:502});
  const venues = await venuesResponse.json() as DbVenue[];

  const enriched = await Promise.all(venues.map(async (venue) => {
    const fullAddress = `${venue.address_line_1}, ${venue.city}, ${venue.region} ${venue.postal_code ?? ""}`;
    const commute = await route(address, fullAddress, mode, mapsKey).catch(() => null);
    if (!commute) return null;
    const eligibleSpaces = venue.spaces.filter((space) => {
      const capacity = eventStyle === "reception" ? space.reception_capacity : eventStyle === "seated" ? space.seated_capacity : Math.max(space.seated_capacity ?? 0, space.reception_capacity ?? 0);
      return (capacity ?? 0) >= headcount;
    });
    if (!eligibleSpaces.length || commute.minutes > maxCommuteMinutes) return null;
    const best = eligibleSpaces.sort((a,b) => {
      const capA = eventStyle === "reception" ? a.reception_capacity : a.seated_capacity;
      const capB = eventStyle === "reception" ? b.reception_capacity : b.seated_capacity;
      return (capA ?? 9999) - (capB ?? 9999);
    })[0];
    const capacityTrust = capacityTrustFor(best);
    const ranking = rankCandidate({
      seatedCapacity:best.seated_capacity, receptionCapacity:best.reception_capacity, commuteMinutes:commute.minutes,
      capacityTrust, priceTrust:"unverified", dietaryCount:venue.dietary_accommodations?.length ?? 0,
      hasDirectContact:Boolean(venue.contact_email || venue.contact_phone),
    }, {headcount,maxCommuteMinutes,eventStyle});
    const media = venueMedia[venue.slug];
    return {
      id:venue.id, name:venue.name, address:fullAddress, neighborhood:venue.city, score:ranking.score,
      commute:`${commute.minutes} min`, distanceMeters:commute.meters, mode:mode === "walking" ? "Walk" : "Drive",
      capacity:eventStyle === "reception" ? best.reception_capacity : best.seated_capacity,
      price:"Pricing on request", priceTrust:"Needs a call", trust:trustLabel[capacityTrust],
      note:`${best.name} fits ${headcount} guests and is ${commute.minutes} minutes away by ${mode === "walking" ? "foot" : "car"}.`,
      tags:[...(venue.cuisine ?? []), ...(venue.dietary_accommodations ?? []).slice(0,1)],
      rooms:venue.spaces.map((space) => ({name:space.name,capacity:`${space.seated_capacity ?? "—"} seated · ${space.reception_capacity ?? "—"} reception`,trust:trustLabel[capacityTrustFor(space)]})),
      contact:venue.contact_email ?? "Email via venue inquiry", phone:venue.contact_phone ?? "Not published", tone:venue.region === "HI" ? "green" : venue.region === "CA" ? "wine" : "umber",
      sourceUrl:venue.events_url, sourceLabel:"Official venue source", reasons:ranking.reasons,
      imageUrl:media?.imageUrl, menuUrl:media?.menuUrl,
    };
  }));

  return NextResponse.json({results:enriched.filter(Boolean).sort((a,b) => (b?.score ?? 0)-(a?.score ?? 0)), researchedVenueCount:venues.length});
}
