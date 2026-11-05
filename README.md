# AniCafe Menu

A live cafe menu built with TypeScript, Astro, and Firebase Firestore.

[Open the menu](https://animusic-ensembles.github.io/anicafe-menu/)

## Getting started

Install Node.js and npm, then run:

```sh
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase web app configuration, then run `npm run dev`. The Firebase project must allow this app to read the `menu` collection.

## Build

```sh
npm run build
npm run preview
```

Pushes to `main` deploy to GitHub Pages using Firebase configuration stored in repository secrets. The site path is set in `astro.config.ts`.

## Menu data

Each document in `menu` has a `categoryName` and an `items` array:

```json
{
  "categoryName": "Food",
  "items": [{ "itemName": "Cake", "priceCents": 250, "stock": "high", "flags": ["NF"] }]
}
```

Categories appear in ascending `position`; categories without one come last, in name order. Items appear in the order of the `items` array. Stock is `high`, `low`, or `none`. Legacy dollar amounts in `price` are supported. Flags and legend labels live in `src/flags.ts`; unknown flags are ignored and `*` adds the pork marker.

## Themes

Each term has a folder in `src/terms/` with everything specific to it: a `Term.astro` component with the content shown above the menu, such as the title banner, its `theme.css`, and any fonts or images it uses. The `Term` import in `src/pages/index.astro` picks which term is built and deployed. The rest of the page, including the menu status and legend, is shared in that page.

To start a new term, copy `src/terms/S26` to a new folder, edit its `Term.astro` and theme, and point the `Term` import at it. Assets are referenced relatively and bundled with the term, so only the fonts and images the selected term references are deployed. Layout styles live in `src/style.css`; longer menus scroll.

Category names become CSS slugs (`Hot Drinks` → `hot-drinks`). Set `--hot-drinks-color` to customize that header; otherwise colors cycle through `--drinks-color`, `--food-color`, and `--specialty-color`.

To add a dietary flag, add a symbol to `public/icons.svg`, its matching ID and label to `src/flags.ts`, and its color to `src/style.css`. The menu and legend share these definitions.
