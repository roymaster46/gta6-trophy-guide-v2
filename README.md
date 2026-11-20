# Leonida Platinum — GTA 6 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hoppererin/gta6-trophy-guide-v2/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hoppererin/gta6-trophy-guide-v2/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5 — built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) ($250, 50 paid places). Every trophy shows its official name, description and grade, with a guide in our own words whose every step cites a numbered source. No Rockstar logo or artwork is used.

## What it does

- **Tracker** — dense 3-column view: trophy checklist (left), selected-trophy guide (centre), sources + next-up sidebar (right). Progress saves in the browser (localStorage), with Export / Import and a Reset.
- **Audit bar** — verified counts under the header: 55/55 official name, description & grade; 1P 2G 6S 46B; 28 PSN-hidden; 55/55 guides cited; 55/55 backed by 2+ sources; 8 sources read 20 Nov 2026; 5 disputes shown both ways; 1 possibly missable, 5 at risk, 7 unconfirmed.
- **Roadmap** — 3 stages to the platinum (~200 hours, difficulty 4/10 per PowerPyx): story first, then the 100% completion checklist, then strangers & cleanup.
- **Missables** — the one possibly missable trophy (Positive Mental Attitude: meditate at the Chapter 1 balcony before the chapter ends), 5 stranger chains at risk, 7 hidden trophies still unconfirmed.
- **Sources** — a source matrix: each of the 8 sources with what it covers, how many of the 55 guides cite it, and when it was read.
- **Spoiler shield** — hides story trophy names and descriptions until they are earned.
- **Filters** — All 55, Story, Missable, Collectibles, Activities, Online (0 — every trophy is single-player), PSN-hidden, Disputed, Not earned, plus search.
- **Counters** — count trophies (250 stunts, 42 shooting-range golds, 18 meditations, 100 WAiNK scans…) get a live counter widget.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `app/` works from any static server with the network off. It fetches one file of its own, `app/data/trophies.json`, and nothing else.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `vendor/makefun-frontend.ts` (copied unchanged).

## Sources (read 20 Nov 2026)

1. PowerPyx — GTA 6 Trophy Guide & Roadmap
2. OutputLog — GTA 6 Trophy List: All 55 Trophies and Achievements
3. KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap
4. eGamers — GTA 6 Trophy List: All 55 Trophies and Achievements
5. Exophase — GTA VI trophies (official list mirror; agrees with PSNProfiles on all 55)
6. GTA-Base — GTA 6 Trophies & Achievements
7. GTAZone — GTA 6 Trophies & Achievements
8. Push Square — GTA 6 Trophy Guide and Roadmap

Guides are written in our own words; sources are cited, never copied. Where sources disagree — the Chapter 1 balcony meditation, the 200-hour vs 300-hour platinum estimate, the five still-unsolved hidden trophies — both versions are shown.

## Honest limits

- The game launched 19 Nov 2026. Five hidden trophies (In The Beginning…, Capital Offense, Bad Luck I Guess, The Truth Is Out There, Ten Pin) have conditions no two sources agree on yet; this guide labels them unconfirmed instead of guessing.
- Whether the Chapter 1 balcony meditation is strictly required for Positive Mental Attitude is still unconfirmed — the guide tells you to do it anyway, since it costs minutes and removes the only known risk.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
