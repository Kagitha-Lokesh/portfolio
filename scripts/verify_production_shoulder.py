import cv2
import numpy as np
from playwright.sync_api import sync_playwright

def main():
    print("--> Starting Production Shoulder Verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(1000)
        
        # 1. Verify DOM architecture
        info = page.evaluate("""() => {
            const canvas = document.querySelector('#hero canvas');
            const video = document.querySelector('#hero video');
            const ghostWrap = document.querySelector('#hero [aria-hidden="true"]');
            return {
                hasCanvas: !!canvas,
                videoTagExists: !!video,
                videoMixBlendMode: video ? window.getComputedStyle(video).mixBlendMode : null,
                videoOpacity: video ? window.getComputedStyle(video).opacity : null,
                ghostMask: ghostWrap ? window.getComputedStyle(ghostWrap).maskImage || window.getComputedStyle(ghostWrap).webkitMaskImage : null,
            };
        }""")
        print("DOM Architecture:", info)
        assert not info["hasCanvas"], "Canvas should be completely removed!"
        assert info["videoMixBlendMode"] == "multiply", "Video must have mix-blend-mode: multiply!"
        assert float(info["videoOpacity"]) > 0.9, "Video must be visible!"
        
        # 2. Capture full hero screenshot
        page.screenshot(path="scratch/final_production_hero.png")
        print("--> Saved scratch/final_production_hero.png")
        
        # 3. Capture 10 frames during live playback to verify shoulder stability
        shoulder_crops = []
        for i in range(10):
            page.wait_for_timeout(150)
            shot_file = f"scratch/prod_playback_frame_{i}.png"
            page.screenshot(path=shot_file)
            frame = cv2.imread(shot_file)
            # Crop left shoulder (viewer's right, x: 990..1120, y: 200..380)
            sh = frame[200:380, 990:1120]
            shoulder_crops.append(sh)
            
        # Stitch 10 shoulder frames side-by-side
        combined_shoulders = np.hstack(shoulder_crops)
        cv2.imwrite("scratch/final_production_10_shoulders.png", combined_shoulders)
        print("--> Saved scratch/final_production_10_shoulders.png")
        
        # 4. Measure pixel background consistency
        img = cv2.imread("scratch/final_production_hero.png")
        page_bg = img[50, 50]  # Outside
        vid_bg_tl = img[200, 720]  # Top-left of video box
        vid_bg_tr = img[200, 1200] # Top-right of video box
        vid_bg_ml = img[450, 720]  # Mid-left of video box
        vid_bg_mr = img[450, 1200] # Mid-right of video box
        
        print(f"Page background: {page_bg} (RGB: {page_bg[::-1]})")
        print(f"Video TL: {vid_bg_tl}, TR: {vid_bg_tr}, ML: {vid_bg_ml}, MR: {vid_bg_mr}")
        
        diff_tl = np.max(np.abs(vid_bg_tl.astype(int) - page_bg.astype(int)))
        diff_tr = np.max(np.abs(vid_bg_tr.astype(int) - page_bg.astype(int)))
        diff_ml = np.max(np.abs(vid_bg_ml.astype(int) - page_bg.astype(int)))
        diff_mr = np.max(np.abs(vid_bg_mr.astype(int) - page_bg.astype(int)))
        
        print(f"Max background differences: TL={diff_tl}, TR={diff_tr}, ML={diff_ml}, MR={diff_mr}")
        assert max(diff_tl, diff_tr, diff_ml, diff_mr) == 0, "Video background must match page background with 0 difference!"
        
        # Crop hero region (500, 60, 1420, 800)
        hero_crop = img[60:800, 500:1420]
        cv2.imwrite("scratch/final_production_hero_crop.png", hero_crop)
        print("--> Saved scratch/final_production_hero_crop.png")
        
        # 5. Measure shoulder variance across the 10 frames
        # Compare frame i with frame i-1
        diffs = []
        for i in range(1, 10):
            d = np.mean(np.abs(shoulder_crops[i].astype(float) - shoulder_crops[i-1].astype(float)))
            diffs.append(d)
        print("Shoulder mean pixel delta between adjacent frames (smooth natural motion):", [round(x, 2) for x in diffs])
        # Smooth subtle motion typically produces deltas < 4.0; jitter/glitch spikes to > 20.0
        assert all(d < 6.0 for d in diffs), f"Shoulder movement should be smooth without glitches! Diffs: {diffs}"
        
        browser.close()
    print("--> ALL PRODUCTION VERIFICATION CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    main()
