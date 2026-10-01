from pathlib import Path
from PIL import Image, ImageOps

# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent

INPUT_DIR = ROOT / "assets" / "backgrounds" / "zodiac-originals"
OUTPUT_DIR = ROOT / "assets" / "backgrounds" / "zodiac"

WIDTH = 1536
HEIGHT = 2304

WEBP_QUALITY = 88

SIGNS = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
]

SUPPORTED_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
]


def find_source(sign):
    for extension in SUPPORTED_EXTENSIONS:
        path = INPUT_DIR / f"{sign}{extension}"

        if path.exists():
            return path

    return None


def process_image(source, destination):
    with Image.open(source) as image:

        # Respect orientation metadata from phones/tablets.
        image = ImageOps.exif_transpose(image)

        # WebP background does not need an alpha channel.
        if image.mode != "RGB":
            if "A" in image.getbands():
                background = Image.new(
                    "RGB",
                    image.size,
                    (255, 250, 244)
                )

                background.paste(
                    image,
                    mask=image.getchannel("A")
                )

                image = background
            else:
                image = image.convert("RGB")

        # Crop to LinguaLog's common portrait ratio without stretching.
        image = ImageOps.fit(
            image,
            (WIDTH, HEIGHT),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5)
        )

        image.save(
            destination,
            "WEBP",
            quality=WEBP_QUALITY,
            method=6
        )


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print()
    print("LinguaLog Zodiac Image Processor")
    print("=" * 40)
    print(f"Output size: {WIDTH} x {HEIGHT}")
    print(f"WebP quality: {WEBP_QUALITY}")
    print()

    converted = 0
    missing = []

    for sign in SIGNS:
        source = find_source(sign)

        if source is None:
            print(f"⚠ Missing: {sign}")
            missing.append(sign)
            continue

        destination = (
            OUTPUT_DIR /
            f"zodiac-{sign}.webp"
        )

        process_image(
            source,
            destination
        )

        size_mb = (
            destination.stat().st_size /
            1024 /
            1024
        )

        print(
            f"✓ {sign.capitalize():12} "
            f"→ {destination.name} "
            f"({size_mb:.2f} MB)"
        )

        converted += 1

    print()
    print("=" * 40)
    print(f"Converted: {converted}/{len(SIGNS)}")

    if missing:
        print(
            "Missing:",
            ", ".join(missing)
        )
    else:
        print("✓ All zodiac backgrounds are ready.")

    print()
    print(f"Output folder:")
    print(OUTPUT_DIR)


if __name__ == "__main__":
    main()
