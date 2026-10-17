from PIL import Image
import numpy as np

img = Image.open('scratch/edge_rayscan_final.png')
arr = np.array(img)
# 1920x1080
# Let's inspect the row y = 500 across all x from 0 to 1920
# Paper color is [244, 242, 238]
diff = np.abs(arr[500, :, :3].astype(int) - np.array([244, 242, 238]))
is_darker = np.max(diff, axis=1) > 5

indices = np.where(is_darker)[0]
print("Darker pixels on line y=500:", len(indices))
if len(indices) > 0:
    print("Min x:", np.min(indices), "Max x:", np.max(indices))
    # Print contiguous ranges
    ranges = []
    start = indices[0]
    prev = indices[0]
    for idx in indices[1:]:
        if idx > prev + 5:
            ranges.append((start, prev))
            start = idx
        prev = idx
    ranges.append((start, prev))
    for r in ranges:
        print(f"Range x: [{r[0]}..{r[1]}], width={r[1]-r[0]+1}")
