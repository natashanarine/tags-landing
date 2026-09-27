# tags — landing page

Static site (HTML + CSS + JS, no build step). Open `index.html` or run `python3 -m http.server` in this folder.

## Swapping images

Every image lives in `assets/`. Replace a file with your own (keep the same name), or change the `src` in `index.html` — each spot is marked with a `<!-- SWAP -->` comment.

| File | Where it shows | Best size |
| --- | --- | --- |
| `hero-before.*` / `hero-after.*` | Hero laptop wipe (product photo → you) | 16:10, ~1600×1000 |
| `live-before.*` / `live-after.*` | "live try on" laptop wipe | 16:10 |
| `feed-1..3.*` | "outfit feed" phone (auto-scrolls) | 4:5 |
| `scan.*` | "scan now, try later" phone | 9:19.5, ~900×1950 |
| `demo.mp4` + `demo-poster.*` | "see it live" section | 16:10 |

Images are cropped with `object-fit: cover`, so close-enough ratios are fine. If you change a file extension (e.g. `.svg` → `.jpg`), update the `src` too. The feed images appear twice in the markup for the seamless loop, so update both copies.
