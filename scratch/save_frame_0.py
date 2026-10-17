import cv2

cap = cv2.VideoCapture("public/hero/hero.mp4")
ret, frame = cv2.VideoCapture("public/hero/hero.mp4").read()
cv2.imwrite("scratch/frame_0_raw.png", frame)
print("Saved scratch/frame_0_raw.png")
