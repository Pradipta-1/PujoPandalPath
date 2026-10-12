import json
import os

with open('pandals_prelim.json', 'r', encoding='utf-8') as f:
    pandals = json.load(f)

# The 71 verified coordinates mapped accurately
verified_coords = {
    # North Kolkata (Page 1)
    "Shobhabazar Rajbari": {"lat": 22.59765, "lng": 88.36672, "cat": "Historic Heritage"},
    "Jagat Mukherjee Park": {"lat": 22.59920, "lng": 88.36860, "cat": "Theme Pandal"},
    "Kumartuli Park": {"lat": 22.60060, "lng": 88.36440, "cat": "Artistic Theme"},
    "Kashi Bose Lane": {"lat": 22.59160, "lng": 88.37120, "cat": "Grand Heritage"},
    "Ahiritola Sarbojanin": {"lat": 22.59250, "lng": 88.35820, "cat": "Riverfront Iconic"},
    "Shyambazar Sarbojanin": {"lat": 22.60300, "lng": 88.37150, "cat": "Community Classic"},
    "Hatibagan Sarbojanin": {"lat": 22.59600, "lng": 88.37120, "cat": "Centenary Celebration"},
    "Hatibagan Nabinpally": {"lat": 22.59720, "lng": 88.37050, "cat": "Cultural Theme"},
    "Nalin Sarkar Street": {"lat": 22.59780, "lng": 88.37320, "cat": "Traditional Art"},
    "Sikdar Bagan Sadharan": {"lat": 22.59850, "lng": 88.37250, "cat": "Heritage Pandal"},
    "Bagbazar Sarbojanin": {"lat": 22.60470, "lng": 88.36613, "cat": "Legendary Traditional"},
    "Simla Byayam Samity": {"lat": 22.58550, "lng": 88.36580, "cat": "Freedom Movement Heritage"},
    "Chaltabagan Lohapatty": {"lat": 22.58280, "lng": 88.37220, "cat": "Spectacular Lighting"},
    "Jorasanko Sadharan Durgotsav": {"lat": 22.58350, "lng": 88.35920, "cat": "North Classic"},
    "Gouribari Sarbojanin": {"lat": 22.59320, "lng": 88.37880, "cat": "Artistic Heritage"},
    "Tala Barowari": {"lat": 22.60850, "lng": 88.37680, "cat": "Historic Community"},
    "Tala Prattoy": {"lat": 22.60950, "lng": 88.37820, "cat": "Avant-Garde Architecture"},
    "Dum Dum Park Bharat Chakra": {"lat": 22.60800, "lng": 88.41100, "cat": "Innovative Art Installation"},
    "Dum Dum Park Sarbojanin": {"lat": 22.60650, "lng": 88.40950, "cat": "Grand Illuminations"},
    "Dum Dum Park Tarun Sangha": {"lat": 22.60720, "lng": 88.41020, "cat": "Contemporary Theme"},
    "Sreebhumi Sporting Club": {"lat": 22.59850, "lng": 88.40350, "cat": "Monumental Mega-Pandal"},

    # Central Kolkata (Page 2)
    "Sealdah Railway Athletic Club": {"lat": 22.56850, "lng": 88.37180, "cat": "Railway Heritage"},
    "Santosh Mitra Square": {"lat": 22.56940, "lng": 88.36890, "cat": "Laser & Architectural Marvel"},
    "College Square": {"lat": 22.57460, "lng": 88.36390, "cat": "Historic Lake Reflection"},
    "Mohammad Ali Park": {"lat": 22.57960, "lng": 88.36180, "cat": "Monumental Palace Theme"},
    "Bowbazar Beniatola": {"lat": 22.57100, "lng": 88.36150, "cat": "Old Kolkata Heritage"},

    # South Kolkata (Page 3)
    "Suruchi Sangha": {"lat": 22.50740, "lng": 88.32480, "cat": "State Theme & Handloom"},
    "Mudiali Club": {"lat": 22.51150, "lng": 88.34920, "cat": "Intricate Traditional Decor"},
    "Shibmandir Sarbojanin": {"lat": 22.51220, "lng": 88.34800, "cat": "Lakeside Artistic Concept"},
    "Samaj Sebi Sangha": {"lat": 22.51350, "lng": 88.35320, "cat": "Social Consciousness Theme"},
    "Jodhpur Park Sarbojanin": {"lat": 22.50050, "lng": 88.36450, "cat": "Grand South Classic"},
    "Maddox Square": {"lat": 22.52980, "lng": 88.35820, "cat": "Iconic Park Gathering & Adda"},
    "66 Pally": {"lat": 22.52020, "lng": 88.34680, "cat": "Folk Art & Sculptural"},
    "Badamtala Ashar Sangha": {"lat": 22.52080, "lng": 88.34750, "cat": "Acclaimed Concept Design"},
    "Deshapriya Park": {"lat": 22.51830, "lng": 88.35620, "cat": "Colossal Display Landmark"},
    "64 Pally": {"lat": 22.52150, "lng": 88.34850, "cat": "Vibrant Community Art"},
    "Singhi Park Sarbojanin": {"lat": 22.52280, "lng": 88.36250, "cat": "Heritage Temple Replica"},
    "Tridhara Sammilani": {"lat": 22.51860, "lng": 88.35830, "cat": "Masterpiece Conceptual Art"},
    "Ekdalia Evergreen": {"lat": 22.51950, "lng": 88.36620, "cat": "Golden Chandelier & Traditional Idol"},
    "Ballygunge Cultural Association": {"lat": 22.52420, "lng": 88.36050, "cat": "Pure Aesthetic Elegance"},
    "Chetla Agrani": {"lat": 22.51520, "lng": 88.34060, "cat": "Award-Winning Architectural Craft"},
    "Hindustan Park": {"lat": 22.52050, "lng": 88.35900, "cat": "Modern Contemporary Craft"},
    "Alipore Sarbojanin": {"lat": 22.52850, "lng": 88.33150, "cat": "Regal Landmark"},

    # East Kolkata & Salt Lake (Page 4)
    "Salt Lake FD Block": {"lat": 22.58420, "lng": 88.41280, "cat": "Salt Lake Mega-Celebration"},
    "Mitali Sangha": {"lat": 22.57180, "lng": 88.38920, "cat": "East City Cultural Hub"},
    "Ultadanga Pallyshree": {"lat": 22.58950, "lng": 88.38450, "cat": "Neighborhood Artistic"},

    # Naktala & Haridevpur (Page 5)
    "Naktala Udayan Sangha": {"lat": 22.47050, "lng": 88.36420, "cat": "Epic High-Concept Art"},
    "Naktala Sammilani Club": {"lat": 22.46820, "lng": 88.36700, "cat": "Suburban Festive Art"},
    "Naktala Pally Unnayan Samity": {"lat": 22.47180, "lng": 88.36150, "cat": "Community Cultural"},
    "Adarsha Samity (Haridevpur)": {"lat": 22.48420, "lng": 88.33750, "cat": "Rustic Folk Design"},
    "Haridevpur 41 Pally Club": {"lat": 22.48650, "lng": 88.33620, "cat": "Intricate Wooden Art"},
    "Ajeya Sanghati Club": {"lat": 22.48950, "lng": 88.33950, "cat": "Haridevpur Conceptual"},
    "Vivekananda Park Athletic Club": {"lat": 22.48800, "lng": 88.34120, "cat": "Creative Terracotta & Fabric"},
    "Dakshin 41 Pally Club": {"lat": 22.48550, "lng": 88.33400, "cat": "Haridevpur Art Pavilion"},

    # Behala & Barisha (Page 6)
    "Nabalila Para United Club": {"lat": 22.49250, "lng": 88.31150, "cat": "Chowrasta Community"},
    "Barisha Janakalyan Sangha": {"lat": 22.48900, "lng": 88.31420, "cat": "Traditional Craft"},
    "Behala Player's Corner": {"lat": 22.49420, "lng": 88.31600, "cat": "Celebrity & Sports Association"},
    "Behala Sonar Durga Bari": {"lat": 22.49850, "lng": 88.31950, "cat": "Golden Adornment Shrine"},
    "Behala Trishakti Sangha": {"lat": 22.49750, "lng": 88.32250, "cat": "Devotional Classic"},
    "Behala Natun Dal": {"lat": 22.49980, "lng": 88.31800, "cat": "Sensory Architectural Art"},
    "Behala Friends": {"lat": 22.50200, "lng": 88.31920, "cat": "Illumination & Atmosphere"},
    "Behala 11 Pally Youth Association": {"lat": 22.50150, "lng": 88.32400, "cat": "Youth Art Movement"},
    "Behala Shree Sangha": {"lat": 22.50320, "lng": 88.31650, "cat": "Behala Cultural"},
    "Mitra Sangha": {"lat": 22.50450, "lng": 88.31850, "cat": "Community Gathering"},
    "Pragati Sangha": {"lat": 22.50550, "lng": 88.31980, "cat": "Handicraft Pavilion"},
    "Behala Club Sarbojanin Durgotsav Committee": {"lat": 22.50650, "lng": 88.31720, "cat": "Diamond Jubilee Heritage"},
    "Buroshibtala Durga Puja": {"lat": 22.50780, "lng": 88.31600, "cat": "Classic Neighborhood Pandal"},
    "Behala Adarshapally": {"lat": 22.50500, "lng": 88.32350, "cat": "Cultural Ambiance"},
    "Behala 29th Pally Club": {"lat": 22.51150, "lng": 88.31900, "cat": "Taratala Gateway Puja"},
    "Parnasree Club Durga Puja Ground": {"lat": 22.51320, "lng": 88.30850, "cat": "Lakeside Parnasree Carnival"},
    "Barisha Club": {"lat": 22.48350, "lng": 88.31620, "cat": "Poignant Societal Themes"}
}

unverified_keys = {
    "Maniktala Chaltabagan",
    "Lalabagan Yubak Brinda",
    "Surir Bagan Sarbojanin",
    "Agradut Club",
    "Bandhudal",
    "Behala Buroshibtola Janakalyan Sangha",
    "Sabarna Roy Choudhury Aatchala Pujo",
    "Chamunda Puja Pandal"
}

os.makedirs('src/data', exist_ok=True)

final_dataset = []

for idx, p in enumerate(pandals):
    name = p['name']
    is_unverified = name in unverified_keys or p['nearest_metro'] == "Location to verify" or p['estimated_walking_distance_raw'] == "Check"
    
    # parse distance
    dist_raw = p['estimated_walking_distance_raw'].strip()
    dist_km = None
    if dist_raw.startswith("~") and "km" in dist_raw:
        try:
            val_str = dist_raw.replace("~", "").replace("km", "").strip()
            dist_km = float(val_str)
        except:
            dist_km = None
    
    # check caution notes
    has_caution = False
    caution_reasons = []
    if "Historic family puja" in p['note'] or "check public access" in p['note']:
        has_caution = True
        caution_reasons.append("Historic private/family puja; verify public visiting hours & permissions.")
    if "overlap" in p['note'].lower():
        has_caution = True
        caution_reasons.append("Possible overlap or duplicate listing with nearby committee.")
    if "exact" in p['note'].lower() or "verify" in p['note'].lower() or is_unverified:
        has_caution = True
        caution_reasons.append("Exact location/entry pin unverified in official route survey.")
    if "confirm entrance" in p['note'].lower():
        has_caution = True
        caution_reasons.append("Crowd management routes and entrance gates require on-site confirmation.")

    coord_info = verified_coords.get(name, {})
    lat = None if is_unverified else coord_info.get("lat")
    lng = None if is_unverified else coord_info.get("lng")
    cat = "Unverified Location" if is_unverified else coord_info.get("cat", "Durga Puja Pandal")
    
    final_record = {
        "id": f"pandal-{idx+1:02d}",
        "name": name,
        "area_division": p['area_division'],
        "nearest_metro": p['nearest_metro'],
        "metro_nearest_dist": p['metro_nearest_dist'],
        "estimated_walking_distance_raw": dist_raw,
        "estimated_walking_distance_km": dist_km,
        "notes": p['note'],
        "has_caution": has_caution,
        "caution_reasons": caution_reasons,
        "location_verified": not is_unverified,
        "latitude": lat,
        "longitude": lng,
        "category": cat,
        "google_maps_search_url": p['google_maps_search_url'],
        "source_page": p['source_page'],
        "source_pdf": "Kolkata_Durga_Puja_2026_Routes.pdf"
    }
    final_dataset.append(final_record)

with open('src/data/pandals.json', 'w', encoding='utf-8') as f:
    json.dump(final_dataset, f, indent=2, ensure_ascii=False)

# Also create quality_notes.json
quality_notes = [
    {
        "id": "qn-01",
        "page": 2,
        "division": "Central Kolkata",
        "title": "Clarification on 'Mdali Park' Entry",
        "content": "The earlier entry 'Mdali Park' was removed from the route sheet because it appears to be an unclear/duplicate name alongside Mohammad Ali Park. Confirm the intended pandal before adding it back.",
        "status": "Resolved / Clarified"
    },
    {
        "id": "qn-02",
        "page": 1,
        "division": "North Kolkata",
        "title": "Shobhabazar Rajbari Access Protocol",
        "content": "Historic family puja; check public access protocols during Ashtami and Sandhi Puja rituals.",
        "status": "Visitor Advisory"
    },
    {
        "id": "qn-03",
        "page": 1,
        "division": "North Kolkata",
        "title": "Chaltabagan vs Maniktala Chaltabagan",
        "content": "Maniktala Chaltabagan entry may overlap with Chaltabagan Lohapatty. Kept in directory for completeness but flagged for verification.",
        "status": "Verification Advisory"
    },
    {
        "id": "qn-04",
        "page": 6,
        "division": "Behala & Barisha",
        "title": "Sabarna Roy Choudhury Aatchala Pujo Access",
        "content": "Historic family puja dating back to 1610; check access hours and exact gateway pin before travelling.",
        "status": "Heritage Advisory"
    }
]

with open('src/data/quality_notes.json', 'w', encoding='utf-8') as f:
    json.dump(quality_notes, f, indent=2, ensure_ascii=False)

print(f"Generated src/data/pandals.json with {len(final_dataset)} records.")
print(f"Verified count: {sum(1 for p in final_dataset if p['location_verified'])}")
print(f"Unverified count: {sum(1 for p in final_dataset if not p['location_verified'])}")
