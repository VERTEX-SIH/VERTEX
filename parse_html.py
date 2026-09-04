import sys
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("BeautifulSoup not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "beautifulsoup4"])
    from bs4 import BeautifulSoup

with open('stitch_design.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

body = soup.body
if body:
    print('Body structure:')
    for child in body.find_all(recursive=False):
        if child.name:
            print(f'<{child.name} class=\"{child.get("class")}\" id=\"{child.get("id")}\">')
            if child.name == 'div':
                for grandchild in child.find_all(recursive=False):
                    if grandchild.name:
                        print(f'  <{grandchild.name} class=\"{grandchild.get("class")}\">')
