import json
import re

with open('debug_pages.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

for p in pages:
    page_num = p['page_num']
    lines = [l.strip() for l in p['text'].split('\n') if l.strip()]
    print(f"\n================ PAGE {page_num} ================")
    current_division = ""
    current_metro = ""
    i = 0
    while i < len(lines):
        line = lines[i]
        if line in ["NORTH KOLKATA", "CENTRAL KOLKATA", "SOUTH KOLKATA", "EAST KOLKATA & SALT LAKE", "NAKTALA & HARIDEVPUR", "BEHALA & BARISHA"]:
            current_division = line
            print(f"DIVISION: {current_division}")
            i += 1
            continue
        if "Metro station" in line or "Location to verify" in line:
            current_metro = line
            print(f"  METRO SECTION: {current_metro}")
            i += 1
            continue
        if line in ["Pandal / note", "Walk", "Maps", "Open Maps"]:
            i += 1
            continue
        if line.startswith("pradiptasantra14@") or "Kolkata Durga Puja" in line or "50+ PANDALS" in line or "AREA-WISE" in line or "Distances are approximate" in line or "Page " in line:
            i += 1
            continue
        print(f"    LINE [{i}]: {line}")
        i += 1
