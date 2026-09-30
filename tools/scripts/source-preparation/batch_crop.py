#!/usr/bin/env python3
"""
Batch crop images using two fixed references (lesson_image_ref.png, lesson_thumbnail_ref.png).
- Main crop: applied to ALL images.
- Thumbnail crop: applied to the FIRST image only.
No resizing – output is full‑resolution PNG.
References must be in the same folder as this script.
"""

import cv2
import numpy as np
import os
import argparse
from pathlib import Path

# ------------------------------------------------------------
# Helper: locate reference in target and return the crop
# ------------------------------------------------------------
def crop_to_reference(target_path, reference_path):
    """
    Find the region in 'target' that best matches 'reference' (feature matching).
    Return the cropped image (numpy array) or None on failure.
    """
    ref = cv2.imread(reference_path, cv2.IMREAD_COLOR)
    target = cv2.imread(target_path, cv2.IMREAD_COLOR)

    if ref is None or target is None:
        print(f"⚠️ Cannot read {target_path} or {reference_path}")
        return None

    ref_gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    target_gray = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)

    # ORB feature detector – increased nfeatures for better matching
    orb = cv2.ORB_create(nfeatures=3000)
    kp1, des1 = orb.detectAndCompute(ref_gray, None)
    kp2, des2 = orb.detectAndCompute(target_gray, None)

    if des1 is None or des2 is None or len(kp1) < 10 or len(kp2) < 10:
        print(f"❌ Not enough features in {target_path}")
        return None

    # FLANN matcher
    FLANN_INDEX_LSH = 6
    index_params = dict(algorithm=FLANN_INDEX_LSH,
                        table_number=12, key_size=20, multi_probe_level=2)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(des1, des2, k=2)

    # Keep good matches using ratio test
    good_matches = []
    for pair in matches:
        if len(pair) == 2:
            m, n = pair
            if m.distance < 0.7 * n.distance:
                good_matches.append(m)

    if len(good_matches) < 4:
        print(f"❌ Too few good matches in {target_path}")
        return None

    # Extract matched keypoints
    src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    # Find homography (perspective transform)
    H, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    if H is None:
        print(f"❌ Homography failed in {target_path}")
        return None

    # Warp the four corners of the reference to locate the crop region in the target
    h_ref, w_ref = ref.shape[:2]
    pts = np.float32([[0, 0], [0, h_ref-1], [w_ref-1, h_ref-1], [w_ref-1, 0]]).reshape(-1, 1, 2)
    dst_pts = cv2.perspectiveTransform(pts, H)

    # Get bounding box of the warped corners
    x, y, w, h = cv2.boundingRect(dst_pts)

    # Clamp to image boundaries
    x = max(0, x)
    y = max(0, y)
    w = min(w, target.shape[1] - x)
    h = min(h, target.shape[0] - y)

    if w <= 0 or h <= 0:
        print(f"❌ Invalid crop region in {target_path}")
        return None

    # Crop and return
    return target[y:y+h, x:x+w]


# ------------------------------------------------------------
# Process a single image
# ------------------------------------------------------------
def process_image(target_path, main_ref, thumb_ref, output_folder, index):
    """
    - index 0 → first image → produce both main and thumbnail crops.
    - index > 0 → only main crop.
    """
    base_name = Path(target_path).stem

    # ---- 1. Main crop (always) ----
    main_crop = crop_to_reference(target_path, main_ref)
    if main_crop is not None:
        out_main = os.path.join(output_folder, f"{base_name}_main.png")
        cv2.imwrite(out_main, main_crop)
        print(f"✅ Main crop ({main_crop.shape[1]}×{main_crop.shape[0]}) -> {out_main}")
    else:
        print(f"⚠️ Main crop failed for {target_path}")

    # ---- 2. Thumbnail crop (only first image) ----
    if index == 0:
        thumb_crop = crop_to_reference(target_path, thumb_ref)
        if thumb_crop is not None:
            out_thumb = os.path.join(output_folder, f"{base_name}_thumb.png")
            cv2.imwrite(out_thumb, thumb_crop)
            print(f"✅ Thumb crop ({thumb_crop.shape[1]}×{thumb_crop.shape[0]}) -> {out_thumb}")
        else:
            print(f"⚠️ Thumb crop failed for {target_path}")


# ------------------------------------------------------------
# Batch processing
# ------------------------------------------------------------
def batch_process(input_folder, main_ref, thumb_ref, output_folder):
    # Create output folder
    os.makedirs(output_folder, exist_ok=True)

    # Supported image extensions
    extensions = (".jpg", ".jpeg", ".png", ".bmp", ".tiff")

    # List images, but skip the reference files themselves (if they are in the folder)
    image_files = [f for f in os.listdir(input_folder)
                   if f.lower().endswith(extensions)
                   and f not in [Path(main_ref).name, Path(thumb_ref).name]]
    image_files.sort()

    if not image_files:
        print("ℹ️ No images found.")
        return

    print(f"📂 Found {len(image_files)} images in '{input_folder}'.")
    print(f"   Main reference:  {main_ref}")
    print(f"   Thumb reference: {thumb_ref}")
    print(f"   Output folder:   {output_folder}")

    for idx, fname in enumerate(image_files):
        target_path = os.path.join(input_folder, fname)
        process_image(target_path, main_ref, thumb_ref, output_folder, idx)

    print(f"\n🎉 All done!")


# ------------------------------------------------------------
# Command-line interface
# ------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Crop images using fixed references (lesson_image_ref.png, lesson_thumbnail_ref.png)."
    )
    parser.add_argument("--input-dir", required=True,
                        help="Folder containing the original images (e.g., ./lesson5).")
    parser.add_argument("--main-ref", default=None,
                        help="Path to main reference (default: <script_folder>/lesson_image_ref.png).")
    parser.add_argument("--thumb-ref", default=None,
                        help="Path to thumbnail reference (default: <script_folder>/lesson_thumbnail_ref.png).")
    parser.add_argument("--output-dir", default=None,
                        help="Output folder (default: input_dir/cropped).")

    args = parser.parse_args()

    # Determine script directory (where the references likely are)
    script_dir = Path(__file__).parent

    # Set default reference paths if not provided
    if args.main_ref is None:
        main_ref = str(script_dir / "lesson_image_ref.png")
    else:
        main_ref = args.main_ref

    if args.thumb_ref is None:
        thumb_ref = str(script_dir / "lesson_thumbnail_ref.png")
    else:
        thumb_ref = args.thumb_ref

    # Check that reference files exist
    if not os.path.isfile(main_ref):
        print(f"❌ Main reference not found: {main_ref}")
        print("   Please place 'lesson_image_ref.png' in the script folder or provide --main-ref.")
        exit(1)

    if not os.path.isfile(thumb_ref):
        print(f"❌ Thumbnail reference not found: {thumb_ref}")
        print("   Please place 'lesson_thumbnail_ref.png' in the script folder or provide --thumb-ref.")
        exit(1)

    # Set output folder
    output_dir = args.output_dir if args.output_dir else os.path.join(args.input_dir, "cropped")

    batch_process(args.input_dir, main_ref, thumb_ref, output_dir)