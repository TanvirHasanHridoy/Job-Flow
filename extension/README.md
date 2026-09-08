# JobFlow AI Browser Extension (Manifest V3)

A Chrome & Edge companion extension for **JobFlow AI / Job Master**. It detects and parses job descriptions from LinkedIn, StepStone, Indeed, and Xing (with a universal Schema.org fallback for any job board), lets you customize CV and Cover Letter styling/tone/language, and triggers background AI tailoring with 1-click workspace hand-off.

---

## Features

- **Multi-Portal DOM & Schema.org Extraction**:
  - 💼 **LinkedIn Jobs**: Extracts Role, Company, Location, Workplace type, and Job Description.
  - 🏢 **StepStone (DE & International)**: Extracts Role, Company, Location, and Description.
  - 🔍 **Indeed**: Extracts Title, Company, Location, and Description.
  - 🌐 **Xing**: Extracts Title, Company, Location, and Description.
  - ⚡ **Universal Fallback**: Extracts structured `schema.org/JobPosting` JSON-LD data or heuristic readability content from any other career portal (e.g. Greenhouse, Lever, Workday).
- **Persistent Chrome Side Panel**:
  - Docks natively to the browser window without obscuring page content or closing when you click/scroll.
- **In-Page Floating Quick Badge**:
  - Subtle floating "✨ Tailor for [Role]" badge injected via Shadow DOM on job postings for instant access.
- **Seamless Web Session Detection**:
  - Automatically recognizes your active JobFlow AI web session cookies on `localhost:3000` (or production domain). No re-entering passwords.
- **Full CV / Cover Letter Customization**:
  - **Language**: English (`EN`) or German (`DE` / DACH format).
  - **CV Format Mode**:
    - **Bullet Matrix CV**: 2-column executive layout with STAR impact bullets.
    - **Modern Visual**: Multi-theme corporate/minimalist layout.
    - **ATS Clean**: Single-column maximal ATS readability layout.
  - **Persona Selector**: Tailor against specific personas configured in your profile.
  - **Advanced Directives**: CV Tone, Bullet Style (STAR / Punchy), Cover Letter Length, Match Strategy (Tactical Pivot vs Aggressive Bridging), Custom Notes.
- **ATS Match Score & Quick Actions**:
  - Real-time ATS match rating calculation.
  - Matched keywords & skill gap pills.
  - **1-Click Launch**: Open directly into the JobFlow Interactive Canvas (`/tailor?appId=...`).
  - **Quick Copy**: 1-click "Copy Cover Letter" and "Download Plaintext ATS" for immediate form submission.

---

## How to Install (Chrome, Edge, Brave)

1. Build the extension:
   ```bash
   # From project root:
   npm run build:extension

   # Or inside extension/:
   cd extension
   npm run build
   ```
2. Open your Chromium browser and go to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Toggle **Developer mode** (top right switch) to ON.
4. Click the **Load unpacked** button.
5. Select the `extension/dist` folder inside this repository:
   `d:\Projects\ALL AI RELATED STUFFS\AntiGravity\Job Master\extension\dist`
6. Pin the **JobFlow AI** extension icon to your toolbar!

---

## Usage Flow

1. Make sure JobFlow AI is running locally (`npm run dev` at `http://localhost:3000`) and you are logged in.
2. Browse to any job posting on LinkedIn, StepStone, Indeed, or Xing.
3. Click the extension icon in your toolbar OR click the floating **"✨ Tailor for [Role]"** pill button at the bottom-right of the job page.
4. The **JobFlow AI Side Panel** opens:
   - Verify the parsed Role, Company, and Description (or edit any field).
   - Choose your Language (EN / DE), CV Format (Bullet Matrix, Visual, ATS), and Persona.
5. Click **"✨ Generate Tailored Application"**.
6. When complete:
   - View your ATS Match Score and matched keywords.
   - Click **"Open in JobFlow Canvas"** to fine-tune in the full web workspace.
   - Or click **"Copy Cover Letter"** to paste it directly into your application!

---

## Development

- **Watch / Hot Build**:
  ```bash
  npm run dev:extension
  ```
- **Production Build**:
  ```bash
  npm run build:extension
  ```
