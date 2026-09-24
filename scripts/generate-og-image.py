import math
from PIL import Image, ImageDraw, ImageFont

def create_og_image(output_path):
    width = 1200
    height = 630
    
    # 1. Base dark canvas (zinc-950: #09090b)
    img = Image.new("RGBA", (width, height), (9, 9, 11, 255))
    
    # 2. Add subtle radial emerald gradient glow
    glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    
    # Gradient 1: Top-right emerald ambient glow
    for r in range(450, 0, -8):
        alpha = int((1 - (r / 450)) * 45)
        glow_draw.ellipse(
            [(980 - r, 100 - r), (980 + r, 100 + r)],
            fill=(16, 185, 129, alpha)
        )
        
    # Gradient 2: Center-left emerald ambient glow
    for r in range(380, 0, -8):
        alpha = int((1 - (r / 380)) * 32)
        glow_draw.ellipse(
            [(180 - r, 320 - r), (180 + r, 320 + r)],
            fill=(16, 185, 129, alpha)
        )
        
    img = Image.alpha_composite(img, glow_layer)
    
    # 3. Card backdrop (zinc-900 / dark glass effect)
    card_margin_x = 50
    card_margin_y = 42
    card_rect = [card_margin_x, card_margin_y, width - card_margin_x, height - card_margin_y]
    
    card_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    card_draw.rounded_rectangle(
        card_rect,
        radius=24,
        fill=(18, 18, 23, 230),
        outline=(39, 39, 42, 255),
        width=2
    )
    
    # Subtle top edge highlight
    card_draw.line(
        [card_margin_x + 30, card_margin_y, width - card_margin_x - 30, card_margin_y],
        fill=(52, 211, 153, 160),
        width=2
    )
    
    img = Image.alpha_composite(img, card_layer)
    draw = ImageDraw.Draw(img)
    
    # Fonts
    bold_font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
    reg_font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    
    title_font = ImageFont.truetype(bold_font_path, 64)
    subtitle_font = ImageFont.truetype(reg_font_path, 24)
    badge_font = ImageFont.truetype(bold_font_path, 15)
    chip_title_font = ImageFont.truetype(bold_font_path, 18)
    chip_desc_font = ImageFont.truetype(reg_font_path, 14)
    domain_font = ImageFont.truetype(bold_font_path, 18)
    
    # 4. Top Badge: "100% PRIVATE • ON-DEVICE ONLY"
    badge_x = card_margin_x + 48
    badge_y = card_margin_y + 42
    badge_w = 290
    badge_h = 34
    draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
        radius=17,
        fill=(6, 78, 59, 150),
        outline=(16, 185, 129, 220),
        width=1
    )
    # Emerald pulse dot inside badge
    draw.ellipse([badge_x + 15, badge_y + 12, badge_x + 23, badge_y + 20], fill=(16, 185, 129, 255))
    draw.text((badge_x + 32, badge_y + 8), "100% PRIVATE • ON-DEVICE ONLY", font=badge_font, fill=(167, 243, 208, 255))
    
    # 5. Microphone Icon on Left
    icon_cx = 150
    icon_cy = 250
    
    # Waves above microphone
    draw.arc([icon_cx - 24, icon_cy - 80, icon_cx + 24, icon_cy - 52], start=190, end=350, fill=(16, 185, 129, 220), width=4)
    draw.arc([icon_cx - 40, icon_cy - 96, icon_cx + 40, icon_cy - 56], start=190, end=350, fill=(16, 185, 129, 160), width=4)
    draw.arc([icon_cx - 56, icon_cy - 112, icon_cx + 56, icon_cy - 60], start=190, end=350, fill=(16, 185, 129, 110), width=4)
    
    # Mic capsule
    draw.rounded_rectangle([icon_cx - 22, icon_cy - 44, icon_cx + 22, icon_cy + 22], radius=22, outline=(16, 185, 129, 255), width=5, fill=(24, 24, 27, 255))
    draw.line([icon_cx - 22, icon_cy - 8, icon_cx + 22, icon_cy - 8], fill=(16, 185, 129, 255), width=4)
    
    # Mic outer cradle
    draw.arc([icon_cx - 36, icon_cy - 16, icon_cx + 36, icon_cy + 48], start=0, end=180, fill=(16, 185, 129, 255), width=5)
    draw.line([icon_cx, icon_cy + 48, icon_cx, icon_cy + 74], fill=(16, 185, 129, 255), width=5)
    draw.rounded_rectangle([icon_cx - 28, icon_cy + 74, icon_cx + 28, icon_cy + 84], radius=5, outline=(16, 185, 129, 255), width=4, fill=(24, 24, 27, 255))
    
    # 6. Main Titles
    text_x = 245
    title_y = card_margin_y + 102
    
    # Render "VoiceTester"
    draw.text((text_x, title_y), "VoiceTester", font=title_font, fill=(244, 244, 245, 255))
    # Measure length accurately
    bbox = draw.textbbox((text_x, title_y), "VoiceTester", font=title_font)
    dot_x = bbox[2] + 4
    draw.text((dot_x, title_y), ".", font=title_font, fill=(16, 185, 129, 255))
    
    subtitle_y = title_y + 76
    draw.text((text_x, subtitle_y), "Browser-Based Microphone & Audio Diagnostics", font=subtitle_font, fill=(228, 228, 231, 255))
    subtitle_y2 = subtitle_y + 34
    draw.text((text_x, subtitle_y2), "Inspect latency, visual waveforms, check background noise & export audio.", font=subtitle_font, fill=(161, 161, 170, 255))
    
    # 7. Four Feature Cards at Bottom
    features = [
        ("Hardware Check", "Latency, clipping & sample rate"),
        ("Live Visualizer", "Oscilloscope & frequency bar"),
        ("Zero Server Uploads", "Audio never leaves your browser"),
        ("Audio Export", "Export in WAV, MP3, or M4A")
    ]
    
    chip_start_x = card_margin_x + 48
    chip_y = 365
    chip_w = 250
    chip_h = 104
    chip_gap = 20
    
    for idx, (f_title, f_desc) in enumerate(features):
        cx = chip_start_x + idx * (chip_w + chip_gap)
        
        # Background card
        draw.rounded_rectangle(
            [cx, chip_y, cx + chip_w, chip_y + chip_h],
            radius=12,
            fill=(24, 24, 27, 240),
            outline=(39, 39, 42, 255),
            width=1
        )
        
        # Subtle emerald accent pill on top left of each card
        draw.rounded_rectangle(
            [cx + 16, chip_y + 16, cx + 24, chip_y + 24],
            radius=4,
            fill=(16, 185, 129, 255)
        )
        
        # Feature title
        draw.text((cx + 34, chip_y + 13), f_title, font=chip_title_font, fill=(244, 244, 245, 255))
        # Feature description (word-wrap handling if needed)
        draw.text((cx + 16, chip_y + 48), f_desc, font=chip_desc_font, fill=(161, 161, 170, 255))
        
    # 8. Bottom Bar
    bar_y = height - card_margin_y - 42
    # Domain with badge
    draw.ellipse([card_margin_x + 48, bar_y + 5, card_margin_x + 56, bar_y + 13], fill=(16, 185, 129, 255))
    draw.text((card_margin_x + 66, bar_y), "voicetester.100xadi.com", font=domain_font, fill=(52, 211, 153, 255))
    
    # Right label
    free_label = "Free • Open Source • Offline PWA"
    draw.text((width - card_margin_x - 340, bar_y), free_label, font=domain_font, fill=(113, 113, 122, 255))
    
    # Save optimized PNG
    img.convert("RGB").save(output_path, "PNG", optimize=True)
    print(f"Generated refined OG image at {output_path}")

if __name__ == "__main__":
    create_og_image("/home/legion/code/projects/online-voice-tester/public/og-image.png")
