# Resize every photo in cache/img/ to a 240px JPEG in out/images/. Transparent cutouts are flattened onto white
# and reported as 'contain' (the app pads them); photos are 'cover'. Prints one JSON line per image: {id, fit}.
# Usage: python3 images.py <src dir> <out dir>
import json, os, sys
from PIL import Image, ImageOps
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for name in sorted(os.listdir(src)):
    id_ = os.path.splitext(name)[0]
    dest = os.path.join(out, id_ + '.jpg')
    try:
        im = Image.open(os.path.join(src, name))
        im = ImageOps.exif_transpose(im)
        alpha = im.mode in ('RGBA', 'LA', 'P') and 'transparency' in im.info or im.mode in ('RGBA', 'LA')
        if alpha:
            im = im.convert('RGBA')
            bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
            bg.alpha_composite(im)
            im = bg
        im = im.convert('RGB')
        im.thumbnail((240, 240), Image.LANCZOS)
        im.save(dest, 'JPEG', quality=78, optimize=True)
        print(json.dumps({'id': id_, 'fit': 'contain' if alpha else 'cover'}))
    except Exception as e:
        print(json.dumps({'id': id_, 'error': str(e)}))
