#!/usr/bin/env python3
"""
scripts/build-hero-assets.py
Processes intro.mp4 into seamless looping hero clips (MP4 + WebM),
portrait-bust.webp, and og.jpg.
Uses ffmpeg and numpy for sample-accurate audio cross-fading and seamless video looping.
"""

import os
import sys
import argparse
import subprocess
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def run_cmd(cmd, description=""):
    if description:
        print(f"--> {description}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error executing command: {cmd}")
        print(res.stderr)
        raise RuntimeError(f"Command failed with code {res.returncode}")
    return res

def main():
    parser = argparse.ArgumentParser(description="Build hero assets from intro.mp4")
    parser.add_argument("--input", default="intro.mp4", help="Path to input video")
    parser.add_argument("--crop-w", type=int, default=864, help="Crop width")
    parser.add_argument("--crop-h", type=int, default=1080, help="Crop height")
    parser.add_argument("--crop-x", type=int, default=430, help="Crop X offset")
    parser.add_argument("--crop-y", type=int, default=0, help="Crop Y offset")
    parser.add_argument("--scale-w", type=int, default=768, help="Scale width")
    parser.add_argument("--scale-h", type=int, default=960, help="Scale height")
    parser.add_argument("--fade-duration", type=float, default=0.5, help="Crossfade duration in seconds")
    parser.add_argument("--clip-duration", type=float, default=10.0, help="Target initial clip duration")
    args = parser.parse_args()

    input_video = os.path.abspath(args.input)
    if not os.path.exists(input_video):
        print(f"Input video not found: {input_video}")
        sys.exit(1)

    os.makedirs("public/hero", exist_ok=True)
    os.makedirs("scratch", exist_ok=True)

    fade_sec = args.fade_duration
    total_sec = args.clip_duration
    vmain_end = total_sec
    vmain_duration = vmain_end - fade_sec  # 9.5s
    xfade_offset = vmain_duration - fade_sec  # 9.0s
    loop_duration = vmain_duration  # 9.5s

    print(f"Processing '{input_video}'...")
    print(f"Loop duration will be: {loop_duration:.2f}s (crossfade: {fade_sec:.2f}s)")

    # 1. Process Video Loop with ffmpeg xfade
    temp_loop_v = os.path.abspath("scratch/temp_loop_video.mp4")
    v_filter = (
        f"[0:v]crop={args.crop_w}:{args.crop_h}:{args.crop_x}:{args.crop_y},"
        f"scale={args.scale_w}:{args.scale_h},"
        f"colorlevels=rimax=0.98:gimax=0.98:bimax=0.98,split=2[v0][v1];"
        f"[v0]trim=start={fade_sec}:end={total_sec},setpts=PTS-STARTPTS[vmain];"
        f"[v1]trim=start=0:end={fade_sec},setpts=PTS-STARTPTS[vhead];"
        f"[vmain][vhead]xfade=transition=fade:duration={fade_sec}:offset={xfade_offset}[vout]"
    )

    v_cmd = (
        f'ffmpeg -y -i "{input_video}" -filter_complex "{v_filter}" '
        f'-map "[vout]" -c:v libx264 -crf 18 -preset fast -an "{temp_loop_v}"'
    )
    run_cmd(v_cmd, "Rendering seamless video loop")

    # 2. Process Audio sample-accurately in numpy
    temp_audio_raw = os.path.abspath("scratch/temp_audio_in.wav")
    run_cmd(f'ffmpeg -y -i "{input_video}" -vn -ar 48000 -ac 2 "{temp_audio_raw}"', "Extracting raw 48kHz audio")

    with wave.open(temp_audio_raw, "rb") as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        raw_bytes = wf.readframes(n_frames)

    audio_samples = np.frombuffer(raw_bytes, dtype=np.int16).reshape(-1, n_channels).astype(np.float32)

    fade_samples = int(framerate * fade_sec)
    total_samples = min(int(framerate * total_sec), len(audio_samples))

    # Slice parts corresponding exactly to the video trim
    # vmain is from fade_sec to total_sec
    main_audio = audio_samples[fade_samples:total_samples]
    # vhead is from 0 to fade_sec
    head_audio = audio_samples[0:fade_samples]

    body_audio = main_audio[:-fade_samples]
    tail_audio = main_audio[-fade_samples:]

    # Equal-power cross-fade for smooth transitions with zero volume dip
    t = np.linspace(0.0, 1.0, fade_samples, endpoint=False).reshape(-1, 1)
    w_out = np.cos(0.5 * np.pi * t)
    w_in = np.sin(0.5 * np.pi * t)
    blended_tail = (w_out * tail_audio) + (w_in * head_audio)

    seamless_audio = np.vstack([body_audio, blended_tail])
    seamless_audio_int16 = np.clip(seamless_audio, -32768, 32767).astype(np.int16)

    temp_loop_a = os.path.abspath("scratch/temp_loop_audio.wav")
    with wave.open(temp_loop_a, "wb") as wf:
        wf.setnchannels(n_channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(framerate)
        wf.writeframes(seamless_audio_int16.tobytes())
    print("--> Seamless audio cross-fade complete (sample-accurate numpy)")

    # 3. Export hero.mp4: H.264 yuv420p (CRF 24, -preset slow), AAC 96k, +faststart
    out_mp4 = os.path.abspath("public/hero/hero.mp4")
    mp4_cmd = (
        f'ffmpeg -y -i "{temp_loop_v}" -i "{temp_loop_a}" '
        f'-c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p '
        f'-c:a aac -b:a 96k -movflags +faststart "{out_mp4}"'
    )
    run_cmd(mp4_cmd, "Exporting public/hero/hero.mp4")

    # 4. Export hero.webm: VP9 (CRF 36), Opus 80k
    out_webm = os.path.abspath("public/hero/hero.webm")
    webm_cmd = (
        f'ffmpeg -y -i "{temp_loop_v}" -i "{temp_loop_a}" '
        f'-c:v libvpx-vp9 -crf 36 -b:v 0 -pix_fmt yuv420p '
        f'-c:a libopus -b:a 80k "{out_webm}"'
    )
    run_cmd(webm_cmd, "Exporting public/hero/hero.webm")

    # 5. Extract portrait still: head-to-shirt crop at 480x600 saved as portrait-bust.webp
    temp_frame = os.path.abspath("scratch/frame_bust.png")
    # Take clear frame around t=2.0s
    bust_cmd = (
        f'ffmpeg -y -ss 2.0 -i "{input_video}" -vframes 1 '
        f'-vf "crop=540:675:592:10,scale=480:600,colorlevels=rimax=0.98:gimax=0.98:bimax=0.98" "{temp_frame}"'
    )
    run_cmd(bust_cmd, "Extracting portrait still")

    img_bust = Image.open(temp_frame)
    img_bust.save("public/portrait-bust.webp", "WEBP", quality=92)
    print("--> Saved public/portrait-bust.webp (480x600)")

    # 6. Generate og.jpg (1200x630)
    og_img = Image.new("RGB", (1200, 630), "#f4f2ee")
    draw = ImageDraw.Draw(og_img)

    # Place portrait on right side of OG card
    # Resize portrait to fit nicely
    bust_og = img_bust.resize((360, 450), Image.Resampling.LANCZOS)
    og_img.paste(bust_og, (760, 90))

    # Draw border around portrait
    draw.rectangle([759, 89, 760 + 360, 90 + 450], outline="#0d0d0d", width=1)

    # Add text on left side
    # We draw stylish minimal typography
    try:
        font_large = ImageFont.truetype("arial.ttf", 64)
        font_sub = ImageFont.truetype("arial.ttf", 32)
        font_mono = ImageFont.truetype("cour.ttf", 22)
    except Exception:
        font_large = font_sub = font_mono = ImageFont.load_default()

    draw.text((90, 160), "LOKESH KAGITHA", fill="#0d0d0d", font=font_large)
    draw.text((92, 245), "Full Stack Developer", fill="#77756f", font=font_sub)
    draw.text((92, 310), "React.js · Node.js · Express · Firebase", fill="#3a3a3a", font=font_mono)
    draw.text((92, 420), "01 / PORTFOLIO 2026", fill="#a9a6a0", font=font_mono)
    draw.text((92, 455), "Andhra Pradesh, India · lokesh-kagitha-portfolio.vercel.app", fill="#77756f", font=font_mono)

    # Hairline decorative frame
    draw.rectangle([30, 30, 1170, 600], outline="#d6d3cd", width=1)

    og_img.save("public/og.jpg", "JPEG", quality=90)
    print("--> Saved public/og.jpg (1200x630)")

    print("\nHero asset generation completed successfully!")

if __name__ == "__main__":
    main()
