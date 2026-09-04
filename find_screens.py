import json
with open(r'C:\Users\aadhi\.gemini\antigravity\brain\bfa083ac-d1c6-480a-bca1-55ddeee878d9\.system_generated\steps\329\output.txt', 'r', encoding='utf-8') as f:
    data = json.loads(f.read())
    for screen in data.get('screens', []):
        print(f"Screen Name: {screen.get('name')}, Title: {screen.get('title')}")
