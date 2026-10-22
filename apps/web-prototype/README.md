# web-prototype

The original calorie tracker: static HTML + plain JS, data in the browser's localStorage. Kept as the reference implementation and backup.

## Requirements

- Any modern browser. CDN libraries (DaisyUI, Tailwind browser build, Chart.js, Lucide) need a network connection on first load.
- Node.js, only to run the model checks.

## Run

```sh
open index.html          # project hub; links to the calorie calculator
```

There's no build step. Opening the files straight from disk works. To test on a phone on the same network, serve the folder:

```sh
python3 -m http.server 8000   # then visit http://<your-computer-ip>:8000
```

## Test

```sh
node calorie-calculator/check.js
```

This checks the weight model: eating at maintenance holds weight, a deficit shows an early water drop and then a plateau, and the trend smoothing works.

## Layout

```
index.html                 Hub page with a card per tool
calorie-calculator/
  index.html               App shell: Food / Body / Progress
  script.js                Menu data (FOODS, ORDERS), meal builder, logging UI, charts
  model.js                 Energy/weight model (pure, no DOM)
  check.js                 Node sanity checks for model.js
  img/                     Menu photos (+ CREDITS.md)
```

## Notes

- Data lives in localStorage under the key `calorie-calc`. Each browser has its own copy, so nothing syncs.
- Calorie sources and dates are commented at the top of `script.js`.
- Missing Panda photos fall back to a placeholder. Save them as `calorie-calculator/img/panda-<slug>.jpg` (see `script.js` for the names).
