import os

with open("scratch/step428_full.tsx", "r", encoding="utf-8") as f:
    content = f.read()

with open("src/components/hero/Hero.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Restored exact step428_full.tsx into Hero.tsx")
