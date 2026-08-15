const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Supabase server configuration is missing");

async function upsert(table, rows, conflict) {
  const response = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`${table}: ${response.status} ${await response.text()}`);
  return response.json();
}

const venueRows = [
  { name:"Carmine's Times Square", slug:"carmines-times-square", address_line_1:"200 West 44th Street", city:"New York", region:"NY", postal_code:"10036", website_url:"https://carminesnyc.com/locations/times-square", events_url:"https://carminesnyc.com/parties/times-square", contact_email:"parties44@carminesnyc.com", contact_phone:"917-512-7128", description:"Family-style Italian dining with private and semi-private event spaces.", cuisine:["Italian"], dietary_accommodations:["Food allergies accommodated with advance notice"] },
  { name:"Dos Caminos Times Square", slug:"dos-caminos-times-square", address_line_1:"1567 Broadway", city:"New York", region:"NY", postal_code:"10036", website_url:"https://www.doscaminos.com/location/dos-caminos-times-square/", events_url:"https://www.doscaminos.com/private-events-venue/times-square/", contact_phone:"212-918-1330", description:"Two-level Mexican restaurant with a private cellar room and flexible event layouts.", cuisine:["Mexican"], dietary_accommodations:["Vegetarian options"] },
  { name:"Tony's Di Napoli Times Square", slug:"tonys-di-napoli-times-square", address_line_1:"147 West 43rd Street", city:"New York", region:"NY", postal_code:"10036", website_url:"https://www.tonysnyc.com/", events_url:"https://www.tonysnyc.com/parties", contact_phone:"212-221-0100", description:"Family-style Italian restaurant with private rooms for corporate gatherings.", cuisine:["Italian"], dietary_accommodations:["Dietary requests need confirmation"] },
  { name:"Prospect", slug:"prospect-san-francisco", address_line_1:"300 Spear Street", city:"San Francisco", region:"CA", postal_code:"94105", website_url:"https://www.prospectsf.com/", events_url:"https://www.prospectsf.com/private-events/", contact_email:"events@prospectsf.com", contact_phone:"415-247-7770", description:"Contemporary California restaurant with private and semi-private dining rooms.", cuisine:["California","New American"], dietary_accommodations:["Vegetarian options","Dietary requests accommodated"] },
  { name:"International Smoke San Francisco", slug:"international-smoke-san-francisco", address_line_1:"301 Mission Street", city:"San Francisco", region:"CA", postal_code:"94105", website_url:"https://internationalsmoke.com/", events_url:"https://internationalsmoke.com/private-dining", contact_email:"events@minagroup.net", contact_phone:"415-730-4591", description:"Globally inspired wood-fired dining adjacent to Salesforce Tower.", cuisine:["International","Barbecue"], dietary_accommodations:["Dietary requests need confirmation"] },
  { name:"Waterbar", slug:"waterbar-san-francisco", address_line_1:"399 The Embarcadero", city:"San Francisco", region:"CA", postal_code:"94105", website_url:"https://www.waterbarsf.com/", events_url:"https://www.waterbarsf.com/private-dining/", contact_email:"info@waterbarsf.com", contact_phone:"415-284-9922", description:"Waterfront seafood restaurant with Bay Bridge views and multiple private spaces.", cuisine:["Seafood"], dietary_accommodations:["Dietary requests need confirmation"] },
  { name:"Hilton Hawaiian Village Waikiki Beach Resort", slug:"hilton-hawaiian-village", address_line_1:"2005 Kalia Road", city:"Honolulu", region:"HI", postal_code:"96815", website_url:"https://www.hilton.com/en/hotels/hnlhvhh-hilton-hawaiian-village-waikiki-beach-resort/", events_url:"https://www.hilton.com/en/hotels/hnlhvhh-hilton-hawaiian-village-waikiki-beach-resort/events/", contact_phone:"808-949-4321", description:"Oceanfront resort with large indoor and outdoor catered event venues.", cuisine:["Catering","Hawaiian"], dietary_accommodations:["Dietary requests need confirmation"] },
  { name:"Prince Waikiki", slug:"prince-waikiki", address_line_1:"100 Holomoana Street", city:"Honolulu", region:"HI", postal_code:"96815", website_url:"https://www.princewaikiki.com/", events_url:"https://www.princewaikiki.com/gather/spaces/", contact_email:"events@princewaikiki.com", contact_phone:"808-952-4789", description:"Harborfront hotel with reception-ready decks, ballrooms, and restaurant spaces.", cuisine:["Catering","Hawaiian"], dietary_accommodations:["Dietary requests need confirmation"] },
].map((venue) => ({ contact_email:null, contact_phone:null, website_url:null, events_url:null, description:null, cuisine:[], dietary_accommodations:[], ...venue }));

const venues = await upsert("venues", venueRows, "slug");

const bySlug = Object.fromEntries(venues.map((venue) => [venue.slug, venue.id]));
const spaces = [
  ["carmines-times-square","Sinatra Room","private",230,275,"Private upstairs room with two bars and AV."],
  ["carmines-times-square","Tetrazzini Space","semi_private",58,50,"Flexible semi-private space."],
  ["dos-caminos-times-square","Private Room","private",50,50,"Published private room capacity."],
  ["dos-caminos-times-square","Main Cellar Dining","semi_private",190,190,"Flexible cellar dining space."],
  ["tonys-di-napoli-times-square","Times Square Party Room","private",50,60,"Capacity should be reconfirmed for the requested layout."],
  ["prospect-san-francisco","Candace Room","private",50,65,"Private room with reception area and full bar."],
  ["prospect-san-francisco","Semi Private Space","semi_private",30,40,"Floor-to-ceiling windows and city views."],
  ["international-smoke-san-francisco","Full Buyout","buyout",210,300,"Smaller-group space details require inquiry."],
  ["waterbar-san-francisco","Bridge Tower Room","private",60,75,"Private terrace and Bay Bridge views."],
  ["waterbar-san-francisco","Looking Glass","private",24,50,"Indoor/outdoor private space."],
  ["hilton-hawaiian-village","Great Lawn","private",1600,2000,"Private oceanfront catered event lawn."],
  ["hilton-hawaiian-village","Village Green","private",100,150,"Below the requested 200 reception capacity."],
  ["prince-waikiki","Muliwai Deck","private",200,300,"Protected outdoor poolside venue."],
  ["prince-waikiki","Piinaio Ballroom","private",460,920,"Ballroom can divide into two spaces."],
  ["prince-waikiki","Pre-Function Space","private",140,300,"Ballroom-adjacent cocktail space."],
].map(([slug,name,privacy,seated,reception,notes]) => ({ venue_id:bySlug[slug], name, privacy, seated_capacity:seated, reception_capacity:reception, notes }));

await upsert("spaces", spaces, "venue_id,name");
console.log(`Seeded ${venues.length} researched venues and ${spaces.length} spaces.`);
