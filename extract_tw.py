import re
with open('stitch_anomaly_screen.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'<script id="tailwind-config">(.*?)</script>', html, re.DOTALL)
if match:
    with open('stitch_tailwind.js', 'w', encoding='utf-8') as f:
        f.write(match.group(1))
    print('Saved stitch_tailwind.js')
else:
    print('Not found')
