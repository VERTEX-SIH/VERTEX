import urllib.request
import os
import ssl

# Disable SSL verification for corporate network
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

screens = {
    "evidence_stack_event": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTIwYzJlODZiODMwMWI0ZTQwMTNmMjBmMzFmEgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "global_watch_zinc": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTMwN2U4MzMwMzgwMzM4NWVlNTgzMDIzNWUwEgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "anomaly_monitoring": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTJmZTgzZmUwMjMwMWVlN2U1YTI2MTlkOGE5EgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "evidence_stack_zinc": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTMwN2U5NjM4Y2IwMmE5YjMyNjdmMWExMWY5EgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "facility_graph_iocl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTIwYzRiZmM1M2QwOTI1YzdiYmY4M2Q0MTJhEgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "global_watch_panipat": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTIwYzM0MjE4NDYwMWI0ZTQwMTNmMjBmMzFmEgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "gis_layers_query": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTIwYzM4YTMwMDIwODlhZjY1MTdjMmFiZThlEgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "facility_graph_zinc": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTMwN2U2ZDcyMTEwNzNhZTBiM2ZmMTljNWEwEgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
    "gis_layers_zinc": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTMwN2RhYjdlZWYwNTc2MzI0YjRkMmY3OGRhEgsSBxCLiouOjA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMjQyMjM1OTUxNDYxMjEzMjQyMQ&filename=&opi=89354086",
}

out_dir = r"d:\on destop notes\RAMIAH STUFF\VERTEX\stitch_screens"
os.makedirs(out_dir, exist_ok=True)

for name, url in screens.items():
    path = os.path.join(out_dir, f"{name}.html")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as resp:
            html = resp.read().decode('utf-8')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"OK: {name} ({len(html)} bytes)")
    except Exception as e:
        print(f"FAIL: {name} - {e}")
