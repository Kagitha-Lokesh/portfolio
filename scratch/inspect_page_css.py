import urllib.request
import re

for port in [3000, 3005]:
    url = f"http://localhost:{port}"
    print(f"=== PORT {port} ===")
    content = urllib.request.urlopen(url).read().decode("utf-8")
    matches = re.findall(r'href="([^"]+css[^"]*)"', content)
    print("CSS links found:", matches)
    for link in matches:
        full_url = url + link if link.startswith("/") else link
        try:
            css = urllib.request.urlopen(full_url).read().decode("utf-8")
            print(f"URL: {link} - size {len(css)} bytes")
            print("Contains --paper:", "--paper" in css)
        except Exception as e:
            print("Error fetching:", full_url, e)
