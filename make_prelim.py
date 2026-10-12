import json
import re

with open('debug_pages.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

divisions_map = {
    1: "North Kolkata",
    2: "Central Kolkata",
    3: "South Kolkata",
    4: "East Kolkata & Salt Lake",
    5: "Naktala & Haridevpur",
    6: "Behala & Barisha"
}

all_pandals = []

for page_data in pages:
    p_num = page_data['page_num']
    division = divisions_map[p_num]
    links = page_data['links']
    text = page_data['text']
    
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    current_metro = ""
    current_metro_nearest = ""
    
    idx = 0
    link_idx = 0
    
    while idx < len(lines):
        line = lines[idx]
        
        # Check for metro station header
        if "Metro station" in line:
            current_metro = line.split("Metro station")[0].strip()
            match = re.search(r'nearest\s+(~?[\d\.]+\s*km)', line)
            current_metro_nearest = match.group(1) if match else ""
            idx += 1
            continue
        elif "Location to verify" in line:
            current_metro = "Location to verify"
            current_metro_nearest = ""
            idx += 1
            continue
            
        # Skip headers / boilerplate
        if (line.startswith("pradiptasantra14@") or
            "Kolkata Durga Puja" in line or
            "Page " in line or
            "50+ PANDALS" in line or
            "AREA-WISE" in line or
            line in ["NORTH KOLKATA", "CENTRAL KOLKATA", "SOUTH KOLKATA", "EAST KOLKATA & SALT LAKE", "NAKTALA & HARIDEVPUR", "BEHALA & BARISHA"] or
            "Distances are approximate" in line or
            line in ["Pandal / note", "Walk", "Maps"] or
            line.startswith("Quality note:")):
            idx += 1
            continue
            
        pandal_line = None
        dist_line = None
        
        if idx + 2 < len(lines) and lines[idx + 2] == "Open Maps":
            pandal_line = lines[idx]
            dist_line = lines[idx + 1]
            idx += 3
        elif idx + 1 < len(lines) and lines[idx + 1] == "Open Maps":
            pandal_line = lines[idx]
            dist_line = ""
            idx += 2
        elif idx + 3 < len(lines) and lines[idx + 3] == "Open Maps":
            pandal_line = lines[idx] + " " + lines[idx + 1]
            dist_line = lines[idx + 2]
            idx += 4
        else:
            idx += 1
            continue
            
        # Parse pandal name and note
        # Name and note are often separated by " — " or " – "
        name = pandal_line
        note = ""
        for sep in [" — ", " – ", " - "]:
            if sep in pandal_line:
                parts = pandal_line.split(sep, 1)
                name = parts[0].strip()
                note = parts[1].strip()
                break
                
        link = links[link_idx] if link_idx < len(links) else ""
        link_idx += 1
        
        all_pandals.append({
            'id': f"pandal-{len(all_pandals)+1:02d}",
            'source_page': p_num,
            'area_division': division,
            'nearest_metro': current_metro,
            'metro_nearest_dist': current_metro_nearest,
            'name': name,
            'note': note,
            'estimated_walking_distance_raw': dist_line,
            'google_maps_search_url': link
        })

with open('pandals_prelim.json', 'w', encoding='utf-8') as f:
    json.dump(all_pandals, f, indent=2, ensure_ascii=False)

print(f"Successfully processed {len(all_pandals)} pandals into pandals_prelim.json")
