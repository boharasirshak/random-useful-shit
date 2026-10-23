# Draws the Unrot logo: a sprout growing out of an open book. Run: python3 assets/tools/unrot-logo.py
import math, os
from PIL import Image, ImageDraw

S = 2048  # draw big, then shrink for smooth edges
OUT = os.path.join(os.path.dirname(__file__), 'unrot.png')
CREAM, LIME, LEAF2 = (245, 241, 232), (155, 225, 93), (123, 216, 143)

img = Image.new('RGB', (S, S))
d = ImageDraw.Draw(img)
top, bot = (22, 48, 34), (7, 18, 12)
for y in range(S):
    t = y / S
    d.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bot)))

def P(x, y): return (x * S, y * S)

def leaf(base, tip, width, color):
    (x0, y0), (x1, y1) = base, tip
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    nx, ny = -dy / n, dx / n
    side = lambda sgn: [P(x0 + dx * t + sgn * nx * width * math.sin(math.pi * t) ** 1.1,
                          y0 + dy * t + sgn * ny * width * math.sin(math.pi * t) ** 1.1) for t in [i / 60 for i in range(61)]]
    d.polygon(side(1) + side(-1)[::-1], fill=color)

def page(sgn):
    # One page of the open book: curved top edge, straight-ish bottom, meeting at the spine.
    pts = []
    for i in range(41):
        t = i / 40
        pts.append(P(0.5 + sgn * (0.015 + 0.31 * t), 0.665 - 0.05 * math.sin(math.pi * t) + 0.025 * t))
    for i in range(40, -1, -1):
        t = i / 40
        pts.append(P(0.5 + sgn * (0.015 + 0.31 * t), 0.76 - 0.03 * math.sin(math.pi * t) + 0.025 * t))
    d.polygon(pts, fill=CREAM)

page(-1); page(1)
# Page lines
for k in range(3):
    for sgn in (-1, 1):
        y = 0.695 + k * 0.022
        d.line([P(0.5 + sgn * 0.07, y + 0.004), P(0.5 + sgn * 0.27, y - 0.012 + 0.02)], fill=(200, 194, 180), width=int(S * 0.006))
# Stem: a gentle S from the spine up
# Stem: a gentle S from the spine up, drawn as overlapping dots so it stays smooth.
r = S * 0.017
for i in range(401):
    t = i / 400
    x, y = P(0.5 + 0.025 * math.sin(math.pi * t * 1.2), 0.67 - 0.27 * t)
    d.ellipse([x - r, y - r, x + r, y + r], fill=LIME)
leaf((0.505, 0.47), (0.27, 0.33), 0.075, LEAF2)
leaf((0.515, 0.42), (0.76, 0.22), 0.095, LIME)

img.resize((512, 512), Image.LANCZOS).save(OUT, optimize=True)
print('wrote', OUT)
