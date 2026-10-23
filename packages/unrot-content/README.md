# unrot-content

The cards for Unrot, the scrolling tool in `apps/mobile`. One JSON file per topic in `parts/`, merged into `cards.json`, which the app bundles and `apps/server` serves.

## Requirements

Node.js 22+. No installs.

## Run / Test

```sh
node build.mjs      # checks every card, then writes cards.json with a content hash as its version
```

The build fails on a bad id, topic, type, missing field, over-long text, or a thread with missing parts. Run it after every edit to `parts/` and commit `cards.json` with it.

## Card rules

- **Quotes** come only from works in the US public domain (published before 1930), and translations only from public-domain translations. Every quote is checked word for word against the Project Gutenberg text before it goes in. A quote that can't be checked becomes an idea card.
- **Idea cards** put a book's idea in our own words and credit the author and book. Modern, copyrighted books only ever appear this way.
- **Facts** are well established, checked against a reliable page, which goes in `source` and `link`. Viral myths only appear as debunks.
- `text` is at most about 60 words. `more` (the "go deeper" panel) is 80 to 160 words in our own words.
- A thread is 6 to 8 cards that build on each other. The app shows part 2 only after part 1.

## Layout

```
parts/<topic>.json   Cards for one topic (stoicism, philosophy, eastern, science, space, nature, mind, learning, math, history, words, money)
build.mjs            Validator + merger
cards.json           Generated. The catalog: { version, cards }
```
