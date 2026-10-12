with open('extracted_pdf_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('=== PAGE ')
total = 0
for p in pages[1:]:
    p_num = p.split('\n')[0].strip()
    c = p.count('Open Maps')
    print(f"Page {p_num}: {c} 'Open Maps'")
    total += c

print(f"Total across all pages: {total}")
