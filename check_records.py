import json

with open('pandals_prelim.json', 'r', encoding='utf-8') as f:
    pandals = json.load(f)

for p in pandals:
    print(f"[{p['id']}] P{p['source_page']} | {p['area_division']} | {p['nearest_metro']} | {p['name']} | Dist: '{p['estimated_walking_distance_raw']}' | Note: '{p['note']}'")
