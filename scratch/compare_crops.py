from PIL import Image

img_user = Image.open('C:/Users/kagit/.gemini/antigravity-ide/brain/82bfcf5e-f20a-4ae1-b7e9-c2ea460725e7/.user_uploaded/media_1792266560231.png')
img_perfect = Image.open('scratch/perfect_blend_crop.png')

# Let's resize user image to match scale if needed
# img_user is 1024x576, hero center is around x=512, y=260
# Let's crop user around center (width 400, height 350)
user_crop = img_user.crop((350, 100, 680, 430))
user_crop.save('scratch/user_complaint_crop.png')

# In perfect_blend_crop (920x740), center is x=460, y=370
# Let's crop around center (width 400, height 350)
perfect_crop = img_perfect.crop((300, 100, 630, 430))
perfect_crop.save('scratch/perfect_reference_crop.png')

print('Saved comparison crops.')
