# ambient

Free background tracks for the app's ambient-sound feature: `tracks.json` is the catalogue, `out/<id>.m4a` the files (AAC 96 kbps, made with `afconvert -f m4af -d aac -b 96000 src/<id>.<ext> out/<id>.m4a`), `CREDITS.md` what the app shows.
Only CC0 or CC BY tracks, 2 to 6 minutes, no vocals, no sudden loud parts; `src/` and `out/` are gitignored, so re-download from each track's `page` to rebuild.
To add a track: confirm the licence on its page, drop the original in `src/`, convert as above, check its loudness sits with its kind (lofi about -14 to -18 dBFS RMS, ambient -17 to -25, nature -22 to -32; drop it rather than guess), then add a row to `tracks.json` and a line to `CREDITS.md`.
