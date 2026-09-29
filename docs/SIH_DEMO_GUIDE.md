# ResQ-GIS — Smart India Hackathon (SIH) Evaluation Walkthrough Guide

This walkthrough guide is structured specifically for a 5-to-10 minute live presentation before Smart India Hackathon judges.

---

## Recommended Live Demo Flow (Step-by-Step)

### Step 1: System Introduction (Home Page)
- **Action**: Open the application at `/`.
- **Key Talking Points**:
  - ResQ-GIS is an India-only Multi-Hazard Decision Support, AI Risk Analysis, and Relocation System.
  - Zero Fake Data protocol: Driven by real public scientific endpoints (Open-Meteo, USGS, Copernicus DEM, WorldPop, GSI, CWC, IMD).
  - Sovereign Boundary Filtering: Uses ray-casting point-in-polygon checks so neighboring countries receive zero alerts or risk tags.

### Step 2: Executive Overview (Dashboard Page)
- **Action**: Click **Dashboard** in the sidebar.
- **Key Talking Points**:
  - High-level multi-hazard summary: Real-time count of active alerts (Red, Orange, Yellow).
  - Highlights the **Two Types of Risk**: Permanent Historical Susceptibility vs. Real-Time Activated Dynamic Risk.
  - Total exposed population calculated using WorldPop 1km gridded density models.

### Step 3: Spatial Exploration (GIS Map Page)
- **Action**: Click **GIS Map**.
- **Key Talking Points**:
  - Live cursor telemetry showing continuous latitude and longitude over India.
  - Interactive layer toggle: Switch between Landslide, Flood, Cyclone, and Earthquake layers.
  - Click on a risk zone (e.g. Wayanad or Chennai): Notice the popup displays actual 24h rainfall, slope, elevation, and historical records.
  - Click **"Analyze This Location with AI"** to transition directly into the deep analysis suite.

### Step 4: Explainable Inference (AI Risk Analyzer Page)
- **Action**: Click **AI Risk Analyzer** (or use the one-click button from the map).
- **Key Talking Points**:
  - Select or enter custom Indian coordinates (e.g. Munnar, Wayanad, Chennai, Guwahati, Joshimath).
  - Select hazard (Landslide / Flood / Cyclone / Earthquake) and click **"Run AI Multi-Hazard Analysis"**.
  - Show the judge the complete evidence breakdown:
    - **Current Conditions**: Live 24h rain, 3-day rain, 7-day rain, soil moisture, elevation, slope.
    - **Model Output**: ResQ-Spatial-CNN score, ResQ-Hydro-LSTM score, ensemble confidence.
    - **WHY this location is at risk**: Mathematically grounded natural language explanation derived directly from physical features.
    - **Recommended Action**: Actionable emergency civil defense advice.
    - **Full Provenance**: Data source, URL, timestamp, resolution.

### Step 5: Historical Recurrence (Historical Hazards Page)
- **Action**: Click **Historical Hazards**.
- **Key Talking Points**:
  - Displays real historical records from GSI, CWC, and IMD (e.g. 2024 Wayanad, 2020 Pettimudi, 2015 Chennai, 2023 Biparjoy, 2001 Bhuj).
  - Filterable by hazard, state, and severity.

### Step 6: Population Exposure (Population at Risk Page)
- **Action**: Click **Population at Risk**.
- **Key Talking Points**:
  - Shows why simple district-level census data fails during disaster response.
  - ResQ-GIS intersects the spatial polygon of the hazard with WorldPop 1km gridded population raster cells to compute Red, Orange, and Yellow exposed cohorts.

### Step 7: Emergency Relocation (Relocation & Shelters Page)
- **Action**: Click **Relocation & Shelters**.
- **Key Talking Points**:
  - Select or enter any disaster zone in India.
  - System executes Haversine great-circle distance calculations against verified SDMA shelters.
  - Returns the **nearest 3 verified shelters** with documented capacity, current occupancy, amenities, and nodal officer contacts.

### Step 8: Citizen Hazard Reporting & Admin Verification
- **Action**: Click **Report a Hazard** -> fill a report -> view status marked as **PENDING VERIFICATION**.
- **Action**: Click **Admin Panel** -> review the pending citizen report -> click **Approve** with official administrative notes.
- **Key Talking Points**: Citizen reports never pollute official GIS data without administrative verification, maintaining operational integrity.
