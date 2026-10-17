import cv2
import numpy as np

cap = cv2.VideoCapture("public/hero/hero.mp4")
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

for thresh in [246, 248, 250, 252]:
    breach_count = 0
    bg_cleared_count = 0
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    for f_idx in range(frame_count):
        ret, frame = cap.read()
        if not ret: break
        
        # Check if left edge at x=100 is cleared (all >= thresh)
        if np.all(frame[:, :100] >= thresh):
            bg_cleared_count += 1
            
        # Check if left scan ever breaches into shirt center x >= 375
        for y in range(250, 450):
            for x in range(frame.shape[1] // 2):
                if np.all(frame[y, x] >= thresh):
                    if x >= 375:
                        breach_count += 1
                        break
                else:
                    break
                    
    print(f"thresh={thresh}: bg_cleared={bg_cleared_count}/{frame_count}, breaches={breach_count}")

cap.release()
