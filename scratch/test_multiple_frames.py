import cv2
import numpy as np
from PIL import Image

cap = cv2.VideoCapture("public/hero/hero.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)

# Test on 4 different timestamps
timestamps = [1.0, 3.0, 5.0, 7.0]

for t in timestamps:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ret, frame = cap.read()
    if not ret:
        continue
    
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb.shape
    rgba = np.dstack([rgb, np.full((h, w), 255, dtype=np.uint8)])
    
    threshold = 246
    
    # Horizontal scan from left and right
    for y in range(h):
        # from left
        for x in range(w):
            r, g, b = rgba[y, x, :3]
            if r >= threshold and g >= threshold and b >= threshold:
                rgba[y, x, 3] = 0
            else:
                break
        # from right
        for x in range(w - 1, -1, -1):
            r, g, b = rgba[y, x, :3]
            if r >= threshold and g >= threshold and b >= threshold:
                rgba[y, x, 3] = 0
            else:
                break
                
    # Vertical scan from top and bottom
    for x in range(w):
        # from top
        for y in range(h):
            if rgba[y, x, 3] == 0:
                continue
            r, g, b = rgba[y, x, :3]
            if r >= threshold and g >= threshold and b >= threshold:
                rgba[y, x, 3] = 0
            else:
                break
        # from bottom
        for y in range(h - 1, -1, -1):
            if rgba[y, x, 3] == 0:
                continue
            r, g, b = rgba[y, x, :3]
            if r >= threshold and g >= threshold and b >= threshold:
                rgba[y, x, 3] = 0
            else:
                break
                
    # Composite over #f4f2ee with ghost text "LOKESH"
    comp = Image.new("RGBA", (1200, 1000), "#f4f2ee")
    
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(comp)
    try:
        font = ImageFont.truetype("src/fonts/InterTight-Variable.woff2", 170)
    except:
        font = ImageFont.load_default()
    
    # Draw stroke text "LOKESH"
    # Text stroke rgba(13, 13, 13, 0.12)
    draw.text((120, 360), "LOKESH", fill=None, outline=(13, 13, 13, 30), stroke_width=2, font=font)
    
    # Resize rgba to 544x680 and paste
    person_img = Image.fromarray(rgba).resize((544, 680), Image.Resampling.BILINEAR)
    comp.paste(person_img, (328, 160), person_img)
    
    out_path = f"scratch/test_rayscan_t{int(t)}.png"
    comp.save(out_path)
    print(f"Saved {out_path}")

cap.release()
