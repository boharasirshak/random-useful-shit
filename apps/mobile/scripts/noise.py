# Makes the ambient noise loops in assets/sounds/: white, pink and brown noise, 30 s each, seamless, as AAC.
# Stdlib only, plus macOS afconvert. Run: python3 scripts/noise.py
import math
import os
import random
import struct
import subprocess
import wave

RATE, SECS, PEAK = 22050, 30, 0.4
N = RATE * SECS
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')
random.seed(7)


def white():
    return [random.uniform(-1, 1) for _ in range(N)]


def brown():  # leaky integrator of white noise: deep rumble
    x, out = 0.0, []
    for _ in range(N):
        x = x * 0.995 + random.uniform(-1, 1) * 0.05
        out.append(x)
    return out


def pink():  # Voss-McCartney: 16 white rows updated at halving rates
    rows = [random.uniform(-1, 1) for _ in range(16)]
    out = []
    for i in range(N):
        k = (i & -i).bit_length() - 1 if i else 0  # lowest set bit → which row refreshes
        if k < 16:
            rows[k] = random.uniform(-1, 1)
        out.append(sum(rows) / 16)
    return out


def loop(samples):  # normalise, then crossfade the last half second into the first so the loop point is silent
    peak = max(abs(s) for s in samples)
    samples = [s / peak * PEAK for s in samples]
    fade = RATE // 2
    for i in range(fade):
        t = i / fade
        samples[i] = samples[i] * t + samples[N - fade + i] * (1 - t)
    return samples[: N - fade]


def write(name, samples):
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(OUT, f'{name}.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(s * 32767)) for s in samples))
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', wav, os.path.join(OUT, f'{name}.m4a')], check=True)
    os.remove(wav)
    print(name, os.path.getsize(os.path.join(OUT, f'{name}.m4a')) // 1024, 'KB')


for name, fn in [('white', white), ('pink', pink), ('brown', brown)]:
    write(name, loop(fn()))
