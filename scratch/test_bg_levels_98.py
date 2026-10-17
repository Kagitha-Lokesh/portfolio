import cv2
import numpy as np

img = cv2.imread("scratch/test_rimax_98.png")
# Check background at x < 250 and x > 620
bg_left = img[:, :250]
bg_right = img[:, 620:]
bg_top = img[:50, :]

print("bg_left min:", np.min(bg_left), "mean:", np.mean(bg_left))
print("bg_right min:", np.min(bg_right), "mean:", np.mean(bg_right))
print("bg_top min:", np.min(bg_top), "mean:", np.mean(bg_top))
