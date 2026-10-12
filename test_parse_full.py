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
    
    # We will iterate through lines and parse entries
    idx = 0
    page_pandals = []
    
    while idx < len(lines):
        line = lines[idx]
        
        # Check for metro station header
        if "Metro station" in line:
            # e.g. "Shobhabazar–Sutanuti Metro station   nearest ~0.3 km"
            current_metro = line.split("Metro station")[0].strip()
            # check nearest distance
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
            
        # If we encounter an entry:
        # An entry in this table consists of:
        # Pandal / note
        # distance (e.g. ~0.3 km or Check)
        # Open Maps
        # Sometimes pandal note wraps or is single line
        # Let's check if idx+1 or idx+2 is distance / Open Maps
        if idx + 2 < len(lines) and lines[idx + 2] == "Open Maps":
            pandal_line = lines[idx]
            dist_line = lines[idx + 1]
            idx += 3
            page_pandals.append((pandal_line, dist_line))
            continue
        elif idx + 1 < len(lines) and lines[idx + 1] == "Open Maps":
            # Maybe distance was missing or on same line?
            pandal_line = lines[idx]
            dist_line = ""
            idx += 2
            page_pandals.append((pandal_line, dist_line))
            continue
        elif idx + 3 < len(lines) and lines[idx + 3] == "Open Maps":
            # Multi-line pandal name/note
            pandal_line = lines[idx] + " " + lines[idx + 1]
            dist_line = lines[idx + 2]
            idx += 4
            page_pandals.append((pandal_line, dist_line))
            continue
        else:
            # print unhandled line
            # print(f"P{p_num} unhandled line: {line}")
            idx += 1

    print(f"Page {p_num} ({division}): found {len(page_pandals)} entries, links: {len(links)}")
    if len(page_pandals) != len(links):
        print(f"  MISMATCH on page {p_num}!")
        for i, (p, d) in enumerate(page_pandals):
            print(f"    {i+1}: {p} | {d}")
    else:
        for i, (p, d) in enumerate(page_pandals):
            all_pandals.append({
                'page': p_num,
                'division': division,
                'metro': current_metro, # will refine with exact block tracking
                'raw_entry': p,
                'distance_raw': d,
                'link': links[i]
            })

print(f"Total extracted: {len(all_pandals)}")
