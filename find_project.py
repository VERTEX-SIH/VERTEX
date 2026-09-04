import json
import re
with open(r'C:\Users\aadhi\.gemini\antigravity\brain\bfa083ac-d1c6-480a-bca1-55ddeee878d9\.system_generated\steps\321\output.txt', 'r', encoding='utf-8') as f:
    content = f.read()
    print("Is VERTEX GIS Console in output?", "VERTEX GIS Console" in content)
    
    try:
        data = json.loads(content)
        for proj in data.get('projects', []):
            print(f"Project Name: {proj.get('name')}, Title: {proj.get('title')}")
    except Exception as e:
        print("Not json:", e)
        # Regex search for anything resembling "projects/XXXX"
        titles = re.findall(r'"title"\s*:\s*"([^"]*)"', content)
        print("Titles:", titles)
        names = re.findall(r'"name"\s*:\s*"projects/(\d+)"', content)
        print("Project IDs:", names)
