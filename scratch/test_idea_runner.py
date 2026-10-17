import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    errors = []
    page.on('pageerror', lambda err: errors.append(f'PAGE ERROR: {err}'))
    page.on('console', lambda msg: errors.append(f'CONSOLE: {msg.text}'))
    
    html_path = os.path.abspath('scratch/test_idea.html').replace('\\', '/')
    page.goto(f'file:///{html_path}')
    page.wait_for_timeout(2000)
    for err in errors:
        print(err)
    browser.close()
