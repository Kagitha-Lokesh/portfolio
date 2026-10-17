from PIL import Image
import numpy as np

img = Image.open('scratch/perfect_blend_crop.png')
# img size is 920 x 740
# The torso is in the center
torso = img.crop((350, 200, 570, 500))
torso.save('scratch/perfect_torso_zoom.png')

# Let's inspect the pixels where the ghost text K and E should be
# In perfect_blend_crop, let's see what the stroke color of the ghost text is
# Ghost text stroke is rgba(13, 13, 13, 0.12)
# On paper #f4f2ee (244, 242, 238), this looks like:
# 244 * (1 - 0.12) + 13 * 0.12 = 214.68 + 1.56 = 216.24 -> ~[216, 215, 211]
print("Torso crop saved to scratch/perfect_torso_zoom.png")
