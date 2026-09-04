import re

with open('stitch_anomaly_screen.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove head
html = re.sub(r'<head>.*?</head>', '<head>[HEAD]</head>', html, flags=re.DOTALL)
# Remove svgs
html = re.sub(r'<svg.*?</svg>', '[SVG]', html, flags=re.DOTALL)
# Remove script tags
html = re.sub(r'<script.*?</script>', '', html, flags=re.DOTALL)

print(html[:3000])
