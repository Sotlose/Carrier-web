# Carrier · browser portfolio demo

**Play:** https://sotlose.github.io/Carrier-web/

An experimental music-reactive exploration game. Procedural particle structures, free flight, rhythm-sensitive combat and rebirth. This repository contains the browser distribution and its visitor page.

## Start

Open the site and choose **Открыть демо** for a quick flight, or **Пройти обучение** for the guided introduction. Choose the bundled track, a local audio file, or enter without music. Audio does not start automatically. Local files are processed in the browser, not uploaded.

- Desktop: WASD + mouse; LMB fire/charge; E boost near matter; R rebirth/fusion; Q higher rebirth; C view; Esc release cursor; F fullscreen.
- Touch: left movement area, right look/fire gestures; guided training explains charge and rebirth.
- Save progress is stored locally in this browser. Desktop and touch share the same save format.
- Capturing other applications' audio depends on browser/OS support. A local track or bundled music works without capture permissions.

## Build

Browser build60, based on Android/desktop59 with duplicate fragment registration fixed in the shared source. Experiments remain optional and disabled by default. The current signed Android APK was not replaced.

`index.html`, `portfolio.css`, `portfolio.js`: project presentation. `desktop.html` and `touch.html`: appropriate input adapters over the same simulation. Remaining scripts handle persistence, training and optional experiments. `build-info.json` identifies the distribution.

This is a work in progress, not a claim of a completed1.0 release. Physical iPhone/iPad testing is pending. The website uses Canvas2D, Web Audio and browser-local storage; no backend or analytics is included. The game currently requests Google Fonts with a system-font fallback.

## GitHub Pages

Settings → Pages → Deploy from a branch → main → /(root). `.nojekyll` serves the distribution as ordinary static files. The website is public; Android signing keys, APK files, SDKs and local development reports are not part of this repository.
