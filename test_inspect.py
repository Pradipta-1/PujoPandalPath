import json
import re

with open('debug_pages.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

for p in pages:
    print(f"Page {p['page_num']}: {len(p['links'])} links")
    lines = [l.strip() for l in p['text'].split('\n') if l.strip()]
    print(f"  Line count: {len(lines)}")
