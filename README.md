# Remedy Safety Journal v0.1.0

Remedy Safety Journal is a prototype browser extension plus companion web app that helps users:

- save supplement and food-based remedy ideas found online
- compare those remedies against a personal medication profile
- track what they try
- log whether the result was better, no change, or worse

This version is an early proof of concept.

---

## What this prototype does

- Web app for entering:
  - prescription medications
  - OTC medications
  - current supplements
  - health flags
- Browser extension for:
  - saving remedy pages from X and YouTube
  - sending saved remedy content to the local backend
- Basic remedy parsing using a small known remedy list
- Basic rule-based risk checks
- Remedy status tracking
- Trial logging
- Observation logging

---

## Current prototype limitations

This build is intentionally simple and has many limitations.

### Data/storage limitations
- Data is stored **in memory only**
- Restarting the server clears:
  - profile data
  - saved remedies
  - trial logs
  - observations
- No database is included yet

### Authentication/security limitations
- No real authentication
- No user accounts or multi-user separation
- No encryption at rest
- Not production hardened

### Clinical/safety limitations
- Risk logic is **illustrative only**
- The risk engine uses a very small internal rules table
- Evidence is not comprehensive
- Results are **not medical advice**
- This is **not** a diagnosis, treatment, or prescribing tool
- The app can miss important interactions
- The app can oversimplify real-world risk

### Parsing/extraction limitations
- Remedy extraction is basic keyword matching
- The extension does **not** fully parse X or YouTube content automatically
- Users may need to manually paste relevant text into snippet/notes
- Only a small starter set of remedy keywords is recognized

### Platform limitations
- Prototype targets local development only
- Backend endpoint assumes local server at:
  - `http://localhost:3000`
- Browser extension support was built for Chrome-compatible browsers
- Edge may work, but this is still a prototype setup
- Offline behavior is limited and basic

### UX limitations
- No polished onboarding
- No medication timeline/history UI yet
- No export feature yet
- No reminder feature
- No symptom tagging beyond basic note entry
- No robust re-check flow after profile changes

---

## Known recognized remedies in this prototype

The starter parser currently looks for these terms:

- berberine
- cinnamon
- magnesium
- melatonin
- turmeric
- ginger
- apple cider vinegar
- ashwagandha
- l-theanine
- valerian

If a remedy is not recognized, it may still save the source page, but risk checking may not be useful.

---

## Current rule categories in this prototype

The starter risk engine currently includes limited logic for:

- blood sugar lowering
- sedation/drowsiness
- bleeding risk
- blood pressure lowering
- absorption/timing issue

These rules are incomplete and only meant to demonstrate the flow.

---

## Prerequisites

Install the following on Windows:

- Node.js LTS
- npm

Check installation in PowerShell:

node -v
npm -v

# remedy-safety-journal/
  server.js
  package.json
  public/
    index.html
    app.js
    styles.css
  extension/
    manifest.json
    background.js
    popup.html
    popup.js