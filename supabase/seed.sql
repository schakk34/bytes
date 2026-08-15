insert into public.venues (name, slug, address_line_1, city, region, postal_code, website_url, events_url, contact_email, contact_phone, description, cuisine, dietary_accommodations)
values
  ('Carmine''s Times Square', 'carmines-times-square', '200 West 44th Street', 'New York', 'NY', '10036', 'https://carminesnyc.com/locations/times-square', 'https://carminesnyc.com/parties/times-square', 'parties44@carminesnyc.com', '917-512-7128', 'Family-style Italian dining with private and semi-private event spaces.', array['Italian'], array['Food allergies accommodated with advance notice']),
  ('Dos Caminos Times Square', 'dos-caminos-times-square', '1567 Broadway', 'New York', 'NY', '10036', 'https://www.doscaminos.com/location/dos-caminos-times-square/', 'https://www.doscaminos.com/private-events-venue/times-square/', null, '212-918-1330', 'Two-level Mexican restaurant with a private cellar room and flexible event layouts.', array['Mexican'], array['Vegetarian options']),
  ('Tony''s Di Napoli Times Square', 'tonys-di-napoli-times-square', '147 West 43rd Street', 'New York', 'NY', '10036', 'https://www.tonysnyc.com/', 'https://www.tonysnyc.com/parties', null, '212-221-0100', 'Family-style Italian restaurant with private rooms for corporate gatherings.', array['Italian'], array['Dietary requests need confirmation']),
  ('Prospect', 'prospect-san-francisco', '300 Spear Street', 'San Francisco', 'CA', '94105', 'https://www.prospectsf.com/', 'https://www.prospectsf.com/private-events/', 'events@prospectsf.com', '415-247-7770', 'Contemporary California restaurant with private and semi-private dining rooms.', array['California', 'New American'], array['Vegetarian options', 'Dietary requests accommodated']),
  ('International Smoke San Francisco', 'international-smoke-san-francisco', '301 Mission Street', 'San Francisco', 'CA', '94105', 'https://internationalsmoke.com/', 'https://internationalsmoke.com/private-dining', 'events@minagroup.net', '415-730-4591', 'Globally inspired wood-fired dining adjacent to Salesforce Tower.', array['International', 'Barbecue'], array['Dietary requests need confirmation']),
  ('Waterbar', 'waterbar-san-francisco', '399 The Embarcadero', 'San Francisco', 'CA', '94105', 'https://www.waterbarsf.com/', 'https://www.waterbarsf.com/private-dining/', 'info@waterbarsf.com', '415-284-9922', 'Waterfront seafood restaurant with Bay Bridge views and multiple private spaces.', array['Seafood'], array['Dietary requests need confirmation']),
  ('Hilton Hawaiian Village Waikiki Beach Resort', 'hilton-hawaiian-village', '2005 Kalia Road', 'Honolulu', 'HI', '96815', 'https://www.hilton.com/en/hotels/hnlhvhh-hilton-hawaiian-village-waikiki-beach-resort/', 'https://www.hilton.com/en/hotels/hnlhvhh-hilton-hawaiian-village-waikiki-beach-resort/events/', null, '808-949-4321', 'Oceanfront resort with large indoor and outdoor catered event venues.', array['Catering', 'Hawaiian'], array['Dietary requests need confirmation']),
  ('Prince Waikiki', 'prince-waikiki', '100 Holomoana Street', 'Honolulu', 'HI', '96815', 'https://www.princewaikiki.com/', 'https://www.princewaikiki.com/gather/spaces/', 'events@princewaikiki.com', '808-952-4789', 'Harborfront hotel with reception-ready decks, ballrooms, and restaurant spaces.', array['Catering', 'Hawaiian'], array['Dietary requests need confirmation'])
on conflict (slug) do update set
  name = excluded.name,
  address_line_1 = excluded.address_line_1,
  events_url = excluded.events_url,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  description = excluded.description,
  cuisine = excluded.cuisine,
  dietary_accommodations = excluded.dietary_accommodations,
  updated_at = now();

insert into public.sources (url, title, publisher, source_kind, checked_at)
values
  ('https://carminesnyc.com/parties/times-square', 'Carmine''s Times Square private events', 'Carmine''s', 'venue', now()),
  ('https://www.doscaminos.com/private-events-venue/times-square/', 'Dos Caminos Times Square private events', 'Dos Caminos', 'venue', now()),
  ('https://www.tonysnyc.com/parties', 'Tony''s Di Napoli parties', 'Tony''s Di Napoli', 'venue', now()),
  ('https://www.prospectsf.com/private-events/', 'Prospect private events', 'Prospect', 'venue', now()),
  ('https://internationalsmoke.com/private-dining', 'International Smoke private dining', 'International Smoke', 'venue', now()),
  ('https://www.waterbarsf.com/private-dining/', 'Waterbar private dining and events', 'Waterbar', 'venue', now()),
  ('https://www.hilton.com/en/hotels/hnlhvhh-hilton-hawaiian-village-waikiki-beach-resort/events/', 'Hilton Hawaiian Village events', 'Hilton', 'hotel', now()),
  ('https://www.princewaikiki.com/gather/spaces/', 'Prince Waikiki event spaces', 'Prince Waikiki', 'hotel', now())
on conflict (url) do update set checked_at = now();

insert into public.spaces (venue_id, name, privacy, seated_capacity, reception_capacity, notes)
values
  ((select id from public.venues where slug='carmines-times-square'), 'Sinatra Room', 'private', 230, 275, 'Private upstairs event room with two bars and AV.'),
  ((select id from public.venues where slug='carmines-times-square'), 'Tetrazzini Space', 'semi_private', 58, 50, 'Semi-private space with flexible table configurations.'),
  ((select id from public.venues where slug='dos-caminos-times-square'), 'Private Room', 'private', 50, 50, 'Published private room capacity is 50 seated.'),
  ((select id from public.venues where slug='dos-caminos-times-square'), 'Main Cellar Dining', 'semi_private', 190, 190, 'Flexible cellar dining space.'),
  ((select id from public.venues where slug='tonys-di-napoli-times-square'), 'Times Square Party Room', 'private', 50, 60, 'Private-room capacity should be reconfirmed for the requested layout.'),
  ((select id from public.venues where slug='prospect-san-francisco'), 'Candace Room', 'private', 50, 65, 'Private dining room with pre-dinner reception area and full bar.'),
  ((select id from public.venues where slug='prospect-san-francisco'), 'Semi Private Space', 'semi_private', 30, 40, 'Floor-to-ceiling windows and city views.'),
  ((select id from public.venues where slug='international-smoke-san-francisco'), 'Full Buyout', 'buyout', 210, 300, 'Full restaurant buyout; smaller group space details require inquiry.'),
  ((select id from public.venues where slug='waterbar-san-francisco'), 'Bridge Tower Room', 'private', 60, 75, 'Private terrace and Bay Bridge views.'),
  ((select id from public.venues where slug='waterbar-san-francisco'), 'Looking Glass', 'private', 24, 50, 'Indoor/outdoor private space overlooking the main bar.'),
  ((select id from public.venues where slug='hilton-hawaiian-village'), 'Great Lawn', 'private', 1600, 2000, 'Private oceanfront lawn; appropriate for catered receptions.'),
  ((select id from public.venues where slug='hilton-hawaiian-village'), 'Village Green', 'private', 100, 150, 'Below the requested 200 reception capacity.'),
  ((select id from public.venues where slug='prince-waikiki'), 'Muliwai Deck', 'private', 200, 300, 'Protected outdoor poolside venue.'),
  ((select id from public.venues where slug='prince-waikiki'), 'Piinaio Ballroom', 'private', 460, 920, 'Ballroom can divide into two spaces; each half seats 218 and receives 460.'),
  ((select id from public.venues where slug='prince-waikiki'), 'Pre-Function Space', 'private', 140, 300, 'Ballroom-adjacent cocktail space.')
on conflict (venue_id, name) do update set
  privacy=excluded.privacy,
  seated_capacity=excluded.seated_capacity,
  reception_capacity=excluded.reception_capacity,
  notes=excluded.notes;

insert into public.facts (venue_id, space_id, source_id, field_name, value, trust, verified_at)
select s.venue_id, s.id, src.id, 'capacity', jsonb_build_object('seated', s.seated_capacity, 'reception', s.reception_capacity),
  case when v.slug='tonys-di-napoli-times-square' then 'likely'::public.trust_level else 'verified'::public.trust_level end,
  now()
from public.spaces s
join public.venues v on v.id=s.venue_id
join public.sources src on src.url=v.events_url
where not exists (
  select 1 from public.facts f where f.space_id=s.id and f.field_name='capacity'
);
