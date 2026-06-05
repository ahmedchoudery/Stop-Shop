# -*- coding: utf-8 -*-
"""
Professional Hero Image Processing - v3
=========================================
PHILOSOPHY:
  - Zero sharpening. Zero over-processing. Zero visible edits.
  - The goal is for the image to look like it was shot on a
    high-end camera with perfect lighting -- not like it was edited.

TECHNIQUES:
  1. Watermark removal via CLONE STAMP (not inpaint which blurs)
     - Copies matching floor texture from a clean region on same image
     - Seamless blend with cv2.seamlessClone for invisible join
  2. Noise/grain removal via Bilateral Filter
     - Edge-preserving: keeps sharp edges (lapels, eyes, bag seams)
       while smoothing flat surfaces (red wall, white trousers, floor)
     - Does NOT sharpen. Does NOT add halos.
  3. JPEG re-encoding at quality=99 with chroma preservation
     - Removes compression artifacts (JPEG banding on red wall)
     - Saves at near-lossless quality
  4. Zero crop. Zero resize. Zero composition change.
"""

import cv2
import numpy as np
import os

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public")


def remove_watermark_clone_stamp(img):
    """
    Clone stamp: copies a matching patch of clean floor from the left side
    and blends it seamlessly over the watermark area on the right.
    No blur. No smear. Invisible result.
    """
    h, w = img.shape[:2]

    # --- Define the watermark region (bottom-right corner) ---
    # Pink/bright smear on the concrete floor, far right edge
    wm_x1 = w - 160
    wm_y1 = h - 110
    wm_x2 = w
    wm_y2 = h
    wm_w = wm_x2 - wm_x1
    wm_h = wm_y2 - wm_y1

    # --- Source patch: clean floor from same vertical position, left side ---
    # The floor is same texture -- we take a patch from left of the frame
    src_x1 = 60
    src_y1 = wm_y1
    src_x2 = src_x1 + wm_w
    src_y2 = wm_y2

    # Extract the clean source patch
    src_patch = img[src_y1:src_y2, src_x1:src_x2].copy()

    # Destination center point for seamlessClone
    center_x = wm_x1 + wm_w // 2
    center_y = wm_y1 + wm_h // 2
    center = (center_x, center_y)

    # Create a full white mask (blend entire source patch)
    mask = 255 * np.ones(src_patch.shape, src_patch.dtype)

    # Seamless clone: Poisson blending -- photorealistic, invisible seams
    result = cv2.seamlessClone(src_patch, img, mask, center, cv2.MIXED_CLONE)

    print("  Watermark removed via clone stamp (seamless blend)")
    return result


def bilateral_denoise(img):
    """
    Bilateral filter: removes noise and JPEG compression artifacts
    while perfectly preserving all edges and natural texture.
    - sigmaColor=40: only averages pixels with similar color (preserves edges)
    - sigmaSpace=40: averages over a 9px neighbourhood
    - Applied twice at low strength for best quality
    """
    # Two gentle passes -- gentler than one aggressive pass
    result = cv2.bilateralFilter(img, d=9, sigmaColor=35, sigmaSpace=35)
    result = cv2.bilateralFilter(result, d=5, sigmaColor=20, sigmaSpace=20)
    print("  Bilateral denoising applied (two-pass, edge-preserving)")
    return result


def save_high_quality(img, path):
    """Save as JPEG at quality=99 with no chroma subsampling."""
    encode_params = [
        cv2.IMWRITE_JPEG_QUALITY, 99,
        cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444
    ]
    cv2.imwrite(path, img, encode_params)


# ──────────────────────────────────────────────
# MAIN PROCESSING
# ──────────────────────────────────────────────
IMAGES = [
    ("Hero-Desktop.jpeg", True),   # True = needs watermark removal
    ("Hero-Mobile.jpeg",  False),
    ("Hero-Tablet.jpeg",  False),
]

for filename, needs_wm_removal in IMAGES:
    path = os.path.join(PUBLIC_DIR, filename)
    print("\nProcessing {}...".format(filename))

    img = cv2.imread(path)
    h, w = img.shape[:2]
    print("  Size: {}x{}px".format(w, h))

    # Step 1: Watermark removal (desktop only)
    if needs_wm_removal:
        img = remove_watermark_clone_stamp(img)

    # Step 2: Bilateral noise reduction (all images)
    img = bilateral_denoise(img)

    # Step 3: Verify no size change
    assert img.shape[1] == w and img.shape[0] == h, "SIZE CHANGED!"
    print("  Size unchanged: {}x{}px OK".format(w, h))

    # Step 4: Save at maximum quality
    save_high_quality(img, path)
    print("  Saved at quality=99: {}".format(filename))

print("\nAll done. Natural. Clean. Professional.")
