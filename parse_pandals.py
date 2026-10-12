import pypdf
import json
import re

reader = pypdf.PdfReader('Kolkata_Durga_Puja_2026_Routes.pdf')

pages_data = []

# Let's inspect the page text structure
with open('extracted_pdf_text.txt', 'r', encoding='utf-8') as f:
    raw_text = f.read()

# We can also parse from pypdf directly
for i, page in enumerate(reader.pages):
    links = []
    if '/Annots' in page:
        for annot in page['/Annots']:
            obj = annot.get_object()
            if '/A' in obj and '/URI' in obj['/A']:
                links.append(obj['/A']['/URI'])
    pages_data.append({
        'page_num': i + 1,
        'links': links,
        'text': page.extract_text() or ''
    })

with open('debug_pages.json', 'w', encoding='utf-8') as f:
    json.dump(pages_data, f, indent=2, ensure_ascii=False)

print("Saved debug_pages.json successfully")
