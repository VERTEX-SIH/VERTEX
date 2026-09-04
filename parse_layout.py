import sys
from bs4 import BeautifulSoup

def print_tree(element, indent=0):
    if not hasattr(element, 'name') or not element.name:
        return
    classes = element.get('class', [])
    class_str = ".".join(classes) if isinstance(classes, list) else classes
    id_str = f"#{element.get('id')}" if element.get('id') else ""
    
    # We only care about major structural elements (div, nav, header, aside, main, section)
    if element.name in ['div', 'nav', 'header', 'aside', 'main', 'section'] or indent <= 1:
        print(f"{'  ' * indent}<{element.name}{id_str} class='{class_str}'>")
        
        # Don't go too deep, just top level structure
        if indent < 4:
            for child in element.find_all(recursive=False):
                print_tree(child, indent + 1)

with open('stitch_anomaly_screen.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

body = soup.body
if body:
    print('Body structure:')
    print_tree(body)
