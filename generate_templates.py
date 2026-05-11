from pathlib import Path
import json
from PIL import Image
import re


project_root = Path(__file__).parent
originals_dir = project_root / "templates" / "originals"
full_dir = project_root / "templates" / "full"
thumb_dir = project_root / "templates" / "thumbs"
json_file = project_root / "templates" / "templates.json"

full_dir.mkdir(parents=True, exist_ok=True)
thumb_dir.mkdir(parents=True, exist_ok=True)

allowed_exts = {".png", ".jpg", ".jpeg", ".webp"}

def natural_key(p):
    return [
        int(text) if text.isdigit() else text.lower()
        for text in re.split(r'(\d+)', p.stem)
    ]

files = sorted(
    [p for p in originals_dir.iterdir() if p.is_file() and p.suffix.lower() in allowed_exts],
    key=natural_key
)

templates = []

for file in files:
    full_path = full_dir / file.name
    thumb_path = thumb_dir / file.name

    if full_path.exists() and thumb_path.exists():
        print(f"Skipping {file.name} (already processed)")
        templates.append({
            "id": file.stem,
            "thumb": f"templates/thumbs/{file.name}",
            "full": f"templates/full/{file.name}"
        })
        continue

    with Image.open(file) as img:
        img = img.convert("RGBA") if img.mode in ("P", "RGBA", "LA") else img.convert("RGB")

        # Generate compressed full image
        full_img = img.copy()
        full_img.thumbnail((1600, 1600))
        if file.suffix.lower() in {".jpg", ".jpeg"}:
            full_img.save(full_path, quality=82, optimize=True)
        else:
            full_img.save(full_path, optimize=True)

        # Generate thumbnail
        thumb_img = img.copy()
        thumb_img.thumbnail((400, 400))
        if file.suffix.lower() in {".jpg", ".jpeg"}:
            thumb_img.save(thumb_path, quality=72, optimize=True)
        else:
            thumb_img.save(thumb_path, optimize=True)

    templates.append({
        "id": file.stem,
        "thumb": f"templates/thumbs/{file.name}",
        "full": f"templates/full/{file.name}"
    })

json_file.write_text(json.dumps(templates, indent=2), encoding="utf-8")
print(f"Generated {len(templates)} templates.")