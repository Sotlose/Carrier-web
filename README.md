# Carrier · playable portfolio

**[Play in English](https://sotlose.github.io/Carrier-web/?lang=en)** · **[Играть по-русски](https://sotlose.github.io/Carrier-web/?lang=ru)**

An experimental music-reactive exploration game by Sotlose: procedural particle structures, free flight, rhythm-sensitive combat and Rebirth. This repository contains the browser distribution and visitor page.

## Play and download · build61

- Browser: quick flight or optional guided training. Choose the built-in track, a local audio file, or enter without music.
- **[Android APK61 · RU / EN](downloads/Carrier-0.1.0-origin-61-SIGNED.apk)** — 0.1.0-origin, com.carrier.mobile, signed with the original app certificate. 6,087,815 bytes. SHA-256: c2fb54f9ab3cab0b178e28d6faa791c2180eba69554aa728e515684e251b846f. [Checksum file](downloads/Carrier-0.1.0-origin-61-SIGNED.apk.sha256).
- **[PC61 · RU / EN](downloads/Carrier-PC-0.1.0-origin-61.zip)** — unzip all files and run START-Carrier.cmd on Windows. Keep the local server window open. No Node.js or Python install needed.

Choose RU or EN on the page, on the game's opening screen, or in Settings. In-game switching is live and preserves progress. Training, skills, story messages, saves, HUD and experimental editors support conversational American English.

APK61 was verified for certificate, package/version, all seven assets, DEX and alignment. Physical Android installation/update and audio capture have not been tested. The previous signed APK59 remains at its original download URL.

## Controls and data

Desktop: WASD + mouse; LMB fire/charge; E boost near matter; R Rebirth/Fusion; Q Higher Rebirth; C view; Esc free cursor; F fullscreen. Touch: left stick for movement, right side for look/fire; training explains the gestures.

Music starts only after user input. Local audio files stay on the device. Audio capture support depends on browser/OS. Progress and preferences use browser-local storage; APK, localhost PC and public website progress are separate. No backend or analytics is included. The game requests Google Fonts with a system fallback.

## Distribution

Browser61 includes the build60 duplicate-fragment fix and build61 RU / American English localization. Experiments are optional and off by default. This is a work in progress, not a completed1.0 release. Physical iPhone/iPad testing is pending.

index.html / portfolio.css / portfolio.js present the project; portfolio-locales.js contains site-only download copy. desktop.html and touch.html use the same simulation with appropriate controls. Shared localization scripts match the signed game's assets; changing the website download label does not modify the game.

GitHub Pages: Deploy from branch → main → /(root). .nojekyll serves static files. Only explicitly published application downloads and checksums are included; no signing keys, credentials, SDKs, unsigned APKs or development reports are published. No open-source license is assigned automatically.
