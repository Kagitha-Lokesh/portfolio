from PIL import Image

img = Image.open('scratch/frame_check_hero.png')
# in 768x960, chest is x: 300..500, y: 200..450
chest = img.crop((300, 200, 500, 450))
chest.save('scratch/hero_raw_chest.png')
print('Saved scratch/hero_raw_chest.png')
