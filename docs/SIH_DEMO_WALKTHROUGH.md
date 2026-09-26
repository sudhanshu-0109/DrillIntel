# eRTMAC–NWIS SIH26121 Demonstration Script & Walkthrough

This document outlines the step-by-step presentation narrative for the Smart India Hackathon (SIH26121) evaluation.

---

### Step 1: Login & Role Selection
1. Open the application at `http://localhost:3000` (or `http://localhost:5173`).
2. The sign-in page displays clear Oil India Limited branding and a quick-select persona switcher.
3. Click **"Drilling Engineer (driller_piter)"** and click **"Enter Drilling Command Center"**.

---

### Step 2: Operational Command Center
1. The dashboard opens with a greeting: **"Good morning, Piter"**.
2. Point out the top bar:
   - Active Well Selector: **`NWIS-ASSAM-003` (Duliajan Field)**.
   - Current Bit Depth: **`3280.0 m`**.
   - Current Formation: **`Tipam Sandstone`**.
   - Connection Status: **`CONNECTED` (1Hz Telemetry)**.
   - Provenance Badge: **`SYNTHETIC / DEMO`** (strictly complying with NDR confidentiality rules).
3. Review KPI cards: Current Depth, Formation, Offset Wells, Active Risk, and Historical Cases.

---

### Step 3: Geospatial Offset Map
1. Click **"Offset Map"** in the left sidebar rail.
2. The interactive map displays the Upper Assam exploration block centered on `NWIS-ASSAM-003`.
3. Adjust the **Radius Slider** (e.g. 15 km) to show candidate wells dynamically filtering.
4. Highlight `NWIS-ASSAM-001` (3.4 km East):
   - Explain why it is ranked highest: Not distance alone! It has an **85.3% Relevance Score** due to exact formation match in Tipam Sandstone, 600m depth overlap, and a documented historical stuck-pipe incident.

---

### Step 4: Subsurface Formation Correlation
1. Click **"Formation Correlation"** on the sidebar or click **"Compare Formation Correlation"** from the offset card.
2. The interface aligns the active well stratigraphy alongside `NWIS-ASSAM-001`.
3. Notice the depth track:
   - Active well bit depth is at **3280m** in Tipam Sandstone.
   - Offset well `NWIS-ASSAM-001` has a documented **Stuck Pipe** incident between **3262m and 3275m**!
4. Click on the problem interval or click **"Source: DDR-0032 (Page 14)"**.
5. The Context Drawer slides open from the right, revealing the exact transcript:
   - **Diagnosis:** Permeability-induced differential sticking during connection.
   - **Mitigation:** Spotted 12 m³ Pipe-Free chemical soak pill, freed string after 48 hrs NPT.

---

### Step 5: Live Telemetry Replay & Parameter Progression
1. Navigate to **"Live Operations"** (`/live`) or look at the center panel of Command Center.
2. Click **"Start Stream"** in the top simulator bar.
3. Watch the parameters advance:
   - Surface Torque begins ramping up (**18 kNm → 34 kNm**).
   - ROP drops by 80% (**14 m/hr → 2.4 m/hr**).
   - Standpipe pressure fluctuates and hookload indicates overpull.
4. Calculated rolling features update: $\Delta\text{Torque} = +16.2\text{ kNm}$, $\text{ROP Drop Index} = 0.81$, $\text{MSE} = 560\text{ MPa}$.

---

### Step 6: Explainable ML Risk & SHAP Attribution
1. Open **"Risk Analytics"** (`/risk`).
2. The calibrated XGBoost model elevates Stuck Pipe risk to **87% (`HIGH RISK`)**.
3. Point out the **SHAP attribution bars**:
   - `delta_torque_15m` (+0.45)
   - `rop_drop_ratio` (+0.26)
   - `formation_permeability` (+0.12)
4. Read the plain-language physical explanation generated for the drilling engineer:
   > *"Torque increased rapidly (+16.2 kNm) over previous 15 minutes while ROP dropped by 80% in permeable Tipam Sandstone at depth 3280m."*

---

### Step 7: Grounded AI Assistant (RAG)
1. Open **"AI Assistant"** (`/assistant`).
2. Click one of the pre-set queries or type:
   > *"Show previous stuck pipe incidents near the current depth in Tipam Sandstone."*
3. Show the response structure:
   - Top section: **Grounded Decision-Support Interpretation**.
   - Bottom section: **Retrieved Offset Evidence Chips**.
   - Click the citation chip to open `DDR-0032` Page 14 directly.
   - Emphasize: **Zero hallucinations**; if evidence is missing, the system explicitly reports *"Insufficient evidence"*.

---

### Step 8: Engineer Alert Acknowledgement & Audit Trail
1. Open **"Decision Alerts"** (`/alerts`) or click the glowing critical alert in the top bar.
2. The alert card synthesizes:
   - **WHAT:** Stuck Pipe Hazard
   - **WHERE:** Depth 3280m in Tipam Sandstone
   - **WHEN:** Active real-time timestamp
   - **WHY:** Rapid torque rise & ROP drop
   - **MODEL:** `stuck-pipe-xgb-v1`
   - **HISTORICAL EVIDENCE:** `NWIS-ASSAM-001` (3265m)
   - **SOURCE:** `DDR-0032` Page 14
3. Enter engineer note: *"Notified driller to pull off bottom, spotted chemical soak pill, verified string rotation."*
4. Click **"Acknowledge & Record Audit Trail"**.
5. Navigate to **"Admin & Governance"** (`/admin`) to show the newly logged, immutable audit entry with timestamp, user ID, and notes!

---

### Summary for Evaluators:
eRTMAC-NWIS is **not a chatbot** and **not an autonomous rig controller**. It is an **evidence-first decision-support platform** that connects the driller's current bit position with the institutional memory of nearby wells.
