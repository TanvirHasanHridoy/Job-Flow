# 🚀 JobFlow AI (Job Master)

<p align="center">
  <img src="public/images/New banner.png" alt="JobFlow AI Dashboard Preview" width="100%" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <strong>An elite AI-powered CV and Cover Letter tailoring platform designed to beat ATS scanners and maximize job application success.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2.9-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
  <a href="https://deepseek.com"><img src="https://img.shields.io/badge/DeepSeek_AI-Chat%20%2F%20Reasoner-blue?style=for-the-badge&logo=deepseek&logoColor=white" alt="DeepSeek" /></a>
  <a href="https://prisma.io"><img src="https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" /></a>
</p>

---

## 🌟 Key Features

*   **🎯 ATS-Optimized Tailoring:** The DeepSeek-powered engine analyzes target job descriptions and aligns user experience bullets with exact keywords and semantic variations.
*   **🇩🇪 DACH Market Ready (DIN 5008):** Generates compliant German *Lebenslauf* and business *Anschreiben* matching the strict visual dimensions and formal guidelines of German markets, alongside standard UK/US International Resumes.
*   **📊 Deterministic Skill Gap Analysis:** Provides immediate feedback on exact skill matches, adjacent/transferable skills, and critical gaps, computing a programmatic, audit-ready Match Score.
*   **⚙️ Customization Control:** Adjust achievement bullet layouts (STAR formula sentences, short highlights, or standard roles), target lengths (Strict 1-page vs. standard 2-page), focus modes, and cover letter lengths.
*   **📋 Kanban Application Tracker:** Track applications through their lifecycle: `Tailored` ➔ `Applied` ➔ `Interviewing` ➔ `Offer` ➔ `Rejected`.
*   **📄 High-Quality Exporters:** Built-in templates render directly to native vector PDFs using `@react-pdf/renderer` and `html2pdf.js` for perfect UTF-8 text compliance.

---

## 📸 Output Templates Preview

<p align="center">
  <img src="public/images/templates_preview.png" alt="JobFlow AI Templates Preview" width="100%" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

---

## 🧠 Architectural & Algorithmic Deep Dive

### 1. ATS Compatibility Strategy

Modern Applicant Tracking Systems (ATS) automatically parse files for ranking. If a document cannot be processed cleanly, the candidate is filtered out. JobFlow AI implements four core paradigms:

*   **A. Programmatic Vector Text Layering:** Resumes are compiled directly as native text streams (using `@react-pdf/renderer` rather than browser rasterization or `window.print()` print dialog overrides). The resulting PDF contains real selectable characters, ensuring ATS parsers can read every word.
*   **B. Standard Unicode character sets:** Standard web fonts with unified character maps (Inter, Arial, Calibri, Georgia) are enforced. This guarantees that exported character bytes map directly to UTF-8 indices, preventing text corruption during system ingestion.
*   **C. DOM Reading Order Hierarchy:** Scanners read left-to-right. Multi-column templates render as separate vertical subtrees in the DOM tree, ensuring that Column A (e.g., sidebar) is written out entirely before Column B (experience list) begins. This keeps chronological data from merging text fragments across columns.
*   **D. DIN 5008 Compliance:** Visual coordinates of the Anschreiben (sender details, recipient block, date alignment, subject headers) conform to standard DIN 5008 layout guidelines, making them highly recognizable to DACH-region specialized engines.

---

### 2. The Deterministic Match Score Engine

To avoid LLM scoring hallucinations and inconsistencies, the AI engine is restricted from outputting percentages directly. Instead, semantic classification is performed by the LLM, and final scoring calculations are handled deterministically in TypeScript.

```mermaid
graph TD
    A[User Profile Vault] --> D(DeepSeek Semantic Alignment Engine)
    B[Job Description] --> D
    C[Custom Focus Notes] --> D
    D --> E[exactMatches Array]
    D --> F[adjacentMatches Array]
    D --> G[missingSkills Array]
    E & F & G --> H[TypeScript Backend Calculator]
    H --> I[Predictable Match Score %]
```

#### The Formula:
$$\text{Match Score} = \text{round}\left( \frac{w_e \cdot |E| + w_a \cdot |A|}{w_e \cdot |E| + w_a \cdot |A| + w_m \cdot |M|} \times 100 \right)$$

Where:
*   $E$ = Set of Exact matches (`exactMatches`), default weight $w_e = 1.0$
*   $A$ = Set of Adjacent matches (`adjacentMatches`), default weight $w_a = 0.5$
*   $M$ = Set of Missing skills (`missingSkills`), penalty weight $w_m = 1.0$

This delivers consistent, audit-ready calculations that do not fluctuate between LLM invocations.

---

### 3. Dual-Strategy Tailoring Modes

*   **`TACTICAL_PIVOT` (Honest Justification):** Best when major skill gaps exist. The CV remains 100% factual. The Cover Letter addresses the gaps directly using constructive logic, explaining how adjacent expertise, fast learning speeds, and core experiences offset the missing technical credentials.
*   **`AGGRESSIVE_BRIDGING` (Terminology Optimization):** Maximizes keyword overlap for candidates who have relevant experience. It scans the candidate's actual history and rephrases genuine accomplishments using the exact active verbs and terminology from the job listing.

---

## 🗄️ Database Schema Layout

We use **Prisma ORM** interacting with a **PostgreSQL** instance on **Supabase**. Here is the entity structure:

| Model | Description | Key Fields & Types | Relations |
| :--- | :--- | :--- | :--- |
| **`UserProfile`** | Core user profile: contact, signature, base64 photo data, work history, and DACH fields (nationality, birthplace, DOB). | `id` (UUID), `userId` (String, unique), `fullName` (String), `workExperience` (JSON String), `skills` (JSON String) | None |
| **`JobApplication`** | Tracked job post metadata, status, target language, match score, and gap analyses. | `id` (UUID), `userId` (String), `company` (String), `role` (String), `status` (String), `matchScore` (Int), `gapAnalysis` (JSON String) | One-to-Many: `GeneratedDocument`, `ApplicationStatusHistory`, `TailorDiagnosticLog` |
| **`GeneratedDocument`** | Stored tailored document outputs (CV, COVER_LETTER) formatted in structured JSON schemas. | `id` (UUID), `applicationId` (String), `type` (String), `content` (JSON String) | Many-to-One: `JobApplication` |
| **`ApplicationStatusHistory`** | Kanban state change logs for analytical charting. | `id` (UUID), `applicationId` (String), `fromStatus` (String), `toStatus` (String) | Many-to-One: `JobApplication` |
| **`TailorDiagnosticLog`** | Diagnostic tracking that stores system prompts, LLM payloads, profile snapshots, and chosen tailoring strategy. | `id` (UUID), `applicationId` (String), `matchStrategyUsed` (String), `systemPromptSent` (String), `rawLlmResponse` (String) | Many-to-One: `JobApplication` |
| **`UserToken`** | Rate limiting / usage manager giving active users a monthly allowance (Defaults to 60 tokens). | `id` (UUID), `userId` (String, unique), `tokens` (Int) | None |

---

## 🛠️ Installation & Local Setup

### Prerequisites
*   Node.js (v18+)
*   npm / pnpm / yarn
*   Supabase Account & Database
*   DeepSeek API Key

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/job-master.git
cd job-master
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# Supabase Auth Settings
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# AI Configuration
DEEPSEEK_API_KEY="your-deepseek-api-key-here"
DEEPSEEK_MODEL="deepseek-chat" # Option: "deepseek-chat" (V3/fast) or "deepseek-reasoner" (R1/reasoning)
```

### 3. Generate Database Client & Apply Migrations
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📐 CV Writing Best Practices

*   **Separate Job Entries for Promotions:** When promoted within the same company, treat each role as a separate entry to illustrate career progression and growth.
*   **Mark Internships:** Explicitly append `(Internship)` (or `(Praktikum)` in German) adjacent to the job title.
*   **Show, Don't Tell Soft Skills:** Never list soft skills as standalone text items. Weave them into your career summary and achievements (e.g. *"Coordinated cross-functional engineering teams to deliver..."*).
*   **Omit Generic Hobbies:** Only include hobbies if they directly manifest useful traits or relate to your core industry (e.g., teaching code workshops, organizing tech meetups).
*   **4-Part STAR Bullet Formula:**
    $$\text{Achievement Bullet} = \text{Action Verb} + \text{Measurable Metric} + \text{Tech Stack/Tool} + \text{Business Impact}$$
    *Example:* "Built a highly responsive customer onboarding pipeline handling 40,000 monthly active users using React and WebSockets, reducing drop-off rates by 18%."

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
