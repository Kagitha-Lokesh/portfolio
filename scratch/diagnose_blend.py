from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    tests = [
        ('1_set_canvas_parent_bg', 'document.querySelector("canvas").parentElement.style.backgroundColor = "#f4f2ee";'),
        ('2_set_content_container_bg', 'document.querySelector(".content-container").style.backgroundColor = "#f4f2ee";'),
        ('3_remove_z10_content_container', 'document.querySelector(".content-container").classList.remove("z-10");'),
        ('4_set_hero_isolation_isolate', 'document.getElementById("hero").style.isolation = "isolate";'),
        ('5_remove_overflow_hidden_hero', 'document.getElementById("hero").style.overflow = "visible";'),
        ('6_remove_relative_parents', '''
            let el = document.querySelector("canvas").parentElement;
            while (el && el.id !== "hero") {
                el.style.position = "static";
                el = el.parentElement;
            }
        '''),
    ]

    for name, code in tests:
        page.evaluate(f'''() => {{
            {code}
        }}''')
        page.wait_for_timeout(500)
        shot_path = f'scratch/test_{name}.png'
        page.screenshot(path=shot_path)
        arr = np.array(Image.open(shot_path))
        pixel = arr[200, 800, :3]
        print(f'{name}: pixel={pixel}')

    browser.close()
