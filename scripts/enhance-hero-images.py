"""
Professional Hero Image Processing
====================================
1. Desktop: Remove watermark remnant (bottom-right corner) via OpenCV inpainting
2. All 3 images: Professional noise reduction — natural, film-like, not over-sharpened
3. Subtle color grading — richer, not synthetic
4. ZERO crop. ZERO resize. Same dimensions guaranteed.
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance
import os

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

# ──────────────────────────────────────────────
# STEP 1: Remove watermark from Hero-Desktop
# ──────────────────────────────────────────────
def remove_watermark(img_path):
    print("  [1/3] Removing watermark from bottom-right corner...")
    img = cv2.imread(img_path)
    h, w = img.shape[:2]
    original_size = (w, h)

    # Detect the watermark region — bottom-right corner
    # Sample the surrounding floor color to build an accurate mask
    # The watermark area appears as pinkish/bright smear in bottom-right
    roi_x1 = w - 220
    roi_y1 = h - 180
    roi_x2 = w
    roi_y2 = h

    # Create inpainting mask — target the abnormal region
    mask = np.zeros((h, w), dtype=np.uint8)

    # Sample the natural floor color in that region
    floor_sample = img[h-200:h-180, w-300:w-250]  # clean floor area nearby
    avg_floor = np.mean(floor_sample, axis=(0, 1))  # BGR average

    # Build mask: pixels that deviate significantly from natural floor tones
    roi = img[roi_y1:roi_y2, roi_x1:roi_x2].astype(np.float32)
    diff = np.abs(roi - avg_floor)
    total_diff = diff.sum(axis=2)

    # Threshold: anything that differs more than 35 from expected floor color
    watermark_pixels = (total_diff > 35).astype(np.uint8) * 255
    # Dilate slightly to catch edges/blur around the watermark
    kernel = np.ones((7, 7), np.uint8)
    watermark_pixels = cv2.dilate(watermark_pixels, kernel, iterations=2)

    mask[roi_y1:roi_y2, roi_x1:roi_x2] = watermark_pixels

    # OpenCV Telea inpainting — fills masked region from surrounding pixels
    result = cv2.inpaint(img, mask, inpaintRadius=12, flags=cv2.INPAINT_TELEA)

    assert result.shape[1] == w and result.shape[0] == h, "SIZE CHANGED!"
    print(f"  Watermark removed. Size intact: {w}x{h}px")
    return result


# ──────────────────────────────────────────────
# STEP 2: Professional enhancement (all images)
# Natural, noise-free, not over-sharpened
# ──────────────────────────────────────────────
def enhance_natural(cv_img):
    print("  [2/3] Applying professional noise reduction...")

    # Fast Non-Local Means Denoising — best-in-class noise removal
    # h=6: gentle, preserves texture. Not aggressive.
    denoised = cv2.fastNlMeansDenoisingColored(
        cv_img,
        None,
        h=6,           # luminance noise strength (low = natural)
        hColor=6,      # color noise strength
        templateWindowSize=7,
        searchWindowSize=21
    )

    print("  [3/3] Applying natural color & micro-detail enhancement...")
    # Convert to PIL for final color grading
    pil_img = Image.fromarray(cv2.cvtColor(denoised, cv2.COLOR_BGR2RGB))

    # Very subtle enhancements — natural, not synthetic
    pil_img = ImageEnhance.Color(pil_img).enhance(1.12)       # slight vibrancy
    pil_img = ImageEnhance.Contrast(pil_img).enhance(1.08)    # gentle contrast
    pil_img = ImageEnhance.Brightness(pil_img).enhance(1.02)  # barely any lift
    pil_img = ImageEnhance.Sharpness(pil_img).enhance(1.3)    # subtle — not crunchy

    return pil_img


# ──────────────────────────────────────────────
# PROCESS ALL 3 IMAGES
# ──────────────────────────────────────────────
IMAGES = ["Hero-Desktop.jpeg", "Hero-Mobile.jpeg", "Hero-Tablet.jpeg"]

for filename in IMAGES:
    path = os.path.join(PUBLIC_DIR, filename)
    print(f"\nProcessing {filename}...")

    # Load with OpenCV
    cv_img = cv2.imread(path)
    h, w = cv_img.shape[:2]
    print(f"  Original size: {w}x{h}px")

    # Desktop: remove watermark first
    if filename == "Hero-Desktop.jpeg":
        cv_img = remove_watermark(path)

    # Enhance naturally
    result_pil = enhance_natural(cv_img)

    # Verify dimensions
    rw, rh = result_pil.size
    assert rw == w and rh == h, f"SIZE MISMATCH: {w}x{h} -> {rw}x{rh}"
    print(f"  Final size:    {rw}x{rh}px  OK (unchanged)")

    # Save at high quality
    result_pil.save(path, "JPEG", quality=97, optimize=True, subsampling=0)
    print(f"  Saved: {filename}")

print("\nAll done. Professional quality. Zero crop. Zero resize.")
