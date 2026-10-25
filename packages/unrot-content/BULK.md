# Bulk cards

The hand-written cards in `parts/` are the bundled catalog (`cards.json`, a few hundred). Bulk cards are the long tail: thousands gathered by script from public-domain and CC0 sources, published to UploadThing as `unrot-cards.json` (with images), downloaded by the app when it asks on launch. They never go in the app bundle.

## Layout

```
bulk/<source>.json       an array of cards from one script (quotes.json, met.json, nasa.json…)
bulk/images/<id>.jpg     the card's picture, when it has one
bulk/scripts/<source>.mjs the script that made it (Node 22, no deps; python3 + Pillow for images)
build-full.mjs           validates parts/ + bulk/ and writes cards-full.json
upload.mjs               publishes cards-full.json (as unrot-cards.json) and bulk/images/ to UploadThing
```

## Card shape

Same as `README.md`, plus:

- `id`: `<source>-<n>` (e.g. `quotes-00417`, `met-00031`). Stable: the app stores likes and saves by id.
- `tier`: `2`. The app ranks tier-1 (hand-written) cards first when scores are close.
- `image`: `"<id>.jpg"`, a file in `bulk/images/`. JPEG, longest side 640 px, under 60 KB (`quality=70`). The free storage is 2 GB and the food photos already take 180 MB, so keep these small.
- `credit`: who made the picture and its licence, in one short line: "The Met, public domain (CC0)".
- `more` (the go-deeper panel) is **verbatim from the source, not written by us**: for a quote, the passage around it in the book (the sentence before and after, up to 110 words); for a picture, the museum's or NASA's own description, trimmed to 110 words. If the source has nothing usable, leave `more` out; the app then shows the source line alone.

## Rules that stay

- `text` is at most 32 words. A quote is a verbatim excerpt (trim to the sharpest part, join cuts with " … ", never reword). `em` is 1 to 8 words copied exactly from `text`.
- Every quote is checked word for word against the Project Gutenberg text of the work before it goes in. A quote that can't be found there is dropped, not kept.
- Facts come with their source and a link. No invented numbers, no paraphrase presented as a quote.
- Only public domain or CC0 material. Record the licence in `credit` (pictures) or `source` (text). CC BY-SA text (Wikipedia, Wikiquote prose) is **not** used for `text` or `more`; Wikiquote may only point at which lines to look for in Gutenberg.
- Topics are the twelve in `README.md`. Tags: 1 to 5 lowercase words.
- The slop filter in `build.mjs` does not apply to verbatim text (quotes, passages, descriptions), only to anything we write (titles).
