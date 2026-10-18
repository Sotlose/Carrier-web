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

Settings → Pages → Deploy from a branch → main → /(root). `.nojekyll` serves the distribution as ordinary static files. The website is public; Android signing keys, SDKs and local development reports are not part of this repository. The downloads/ folder contains only the explicitly published signed APK and its checksum.

## Android download

The site also offers the original signed Android APK59 (0.1.0-origin), 6,059,004 bytes, under downloads/. It is distinct from browser build60 and has not been rebuilt or re-signed. SHA-256: 266cd31d86f1d6f559949a832cf389e14d819152abbed9b0bec1a66ccddda7ba. Browser and Android progress are stored separately.
