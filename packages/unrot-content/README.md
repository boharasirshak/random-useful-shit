# unrot-content

The cards for Unrot, the scrolling tool in `apps/mobile`. One JSON file per topic in `parts/`, merged into `cards.json`, which the app bundles, `apps/server` serves, and `upload.mjs` publishes (the app checks on launch and asks before downloading; Unrot → You turns that off).

## Requirements

Node.js 22+. No installs.

## Run / Test

```sh
node build.mjs      # checks every card, then writes cards.json with a content hash as its version
node upload.mjs     # publishes cards.json to UploadThing (UPLOADTHING_TOKEN in the root .env); the app offers it on launch
```

The build fails on a bad id, topic, type, missing field, over-long text, or a thread with missing parts. Run it after every edit to `parts/` and commit `cards.json` with it.

## Bulk cards

Thousands more, gathered by script from public-domain sources, with pictures: see `BULK.md`. They are never bundled; `build-full.mjs` + `upload.mjs` publish them and the app offers the download on launch.

## Card rules

- **Quotes** come only from works in the US public domain (published before 1930), and translations only from public-domain translations. Every quote is checked word for word against the Project Gutenberg text before it goes in. A quote that can't be checked becomes an idea card.
- **Idea cards** put a book's idea in our own words and credit the author and book. Modern, copyrighted books only ever appear this way.
- **Facts** are well established, checked against a reliable page, which goes in `source` and `link`. Viral myths only appear as debunks.
- `em` is the key phrase the app highlights: 2 to 7 words copied exactly from `text`, the part that carries the punch.
- **Short**: `text` is about 25 words, 30 at most; a quote is trimmed to its sharpest part (fragments joined with " … ", never reworded). `title` (ideas, facts, questions) is 2 to 6 words. `more` (the "go deeper" panel) is 40 to 90 words; for a question, its first sentence is the answer.
- **Plain voice**: write like a well-read friend texting you something interesting. No em dashes, no exclamation marks, no "It's not X, it's Y", no "Here's the thing", no delve/profound/fascinating/journey, no moral at the end. `build.mjs` rejects the worst of these.
- A thread is 6 to 8 cards that build on each other. The app shows part 2 only after part 1.

## Layout

```
parts/<topic>.json   Cards for one topic (stoicism, philosophy, eastern, science, space, nature, mind, learning, math, history, words, money)
build.mjs            Validator + merger
cards.json           Generated. The catalog: { version, cards }
```
