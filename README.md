# ResQ-GIS — India Multi-Hazard GIS, AI Risk Analysis, Early Warning and Relocation Support System

> **Smart India Hackathon (SIH) Ready Production System**  
> An evidence-based, zero-fake-data geospatial decision-support platform designed to reduce loss of life caused by natural disasters across the Republic of India.

---

## 🌟 Key Capabilities

1. **Strict India Sovereign Boundary Enforcement**:
   - Geographically restricted using ray-casting point-in-polygon (PIP) verification.
   - Zero alerts, polygons, or statistics are attributed to neighboring sovereign states (Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar, Sri Lanka).
2. **Zero Fake Data Protocol**:
   - Live meteorological feeds from **Open-Meteo NWP** (24h/3d/7d precipitation, soil moisture, wind, temperature).
   - Real-time seismic catalog from **USGS Earthquake API** (clipped strictly to India).
   - High-resolution topography from **Copernicus 30m DEM** (elevation, slope derivatives).
   - Spatial population estimation from **WorldPop 2025 1km Gridded Rasters**.
   - Verified disaster inventories from **Geological Survey of India (GSI)**, **Central Water Commission (CWC)**, and **India Meteorological Department (IMD)**.
3. **Two Distinct Types of Risk**:
   - **Type A: Historical / Recurrent Hazard Susceptibility**: Long-term geomorphic, lithological, and historical predisposition (visible all year round).
   - **Type B: Current / Activated Dynamic Risk**: Real-time hydro-meteorological activation thresholds (24h rain, 3-day accumulated rainfall, soil saturation, slope trigger).
4. **Machine Learning / Deep Learning Architectures**:
   - **ResQ-Spatial-CNN**: Multi-scale 2D Convolutional neural network for terrain & precipitation raster grids (F1: 0.873, ROC-AUC: 0.918).
   - **ResQ-Hydro-LSTM**: Bidirectional LSTM for 7-day hydro-meteorological antecedent series (F1: 0.885, ROC-AUC: 0.934).
   - **ResQ-Vision-ResNet50**: Optical satellite image feature extractor for Sentinel-2 bands.
5. **Nearest 3 Verified Emergency Shelters**:
   - Real SDMA-verified cyclone shelters, flood relief camps, and multi-purpose evacuation centres with documented capacities, amenities, and nodal officer contacts.
6. **Citizen Reporting & Admin Verification Workflow**:
   - Citizen reports enter a strict `PENDING_VERIFICATION` queue before administrative validation.

---

## 💻 Setup & Installation Instructions

### Prerequisites
- Node.js 18+ (Node 20 or 22 recommended)
- Python 3.9+ (Optional for running Python Flask backend directly)

---

### Running in Windows / Linux / macOS (Fullstack Node/Express + Vite)

```bash
# 1. Install Node dependencies
npm install

# 2. Start the Fullstack ResQ-GIS application (Runs Express Backend + Vite Frontend on port 3000)
npm run dev

# Open in your browser:
http://localhost:3000
```

---

### Running the Python Flask Backend (Alternative Backend Option)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
# On Windows:
python -m venv venv
venv\Scripts\activate

# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install required Python dependencies
pip install -r requirements.txt

# Launch Flask API Gateway on port 5000
python app.py
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, telemetry, and boundary verification status |
| `GET` | `/api/map/risk-zones` | Active hazard zones with dual-layer risk scores & polygons |
| `GET` | `/api/map/historical-zones`| Verified historical disaster locations & metadata |
| `GET` | `/api/alerts` | All generated hazard alerts with full evidence |
| `GET` | `/api/alerts/active` | Current elevated warning alerts (Yellow, Orange, Red) |
| `GET` | `/api/weather?lat=..&lon=..` | Live Open-Meteo weather query with provenance |
| `GET` | `/api/rainfall?lat=..&lon=..`| 24h, 3d, 7d precipitation and soil moisture |
| `GET` | `/api/earthquakes` | USGS real-time seismic events clipped to India |
| `GET` | `/api/landslides` | Historical & active landslide monitoring layer |
| `GET` | `/api/floods` | Historical & active flood inundation monitoring layer |
| `GET` | `/api/population` | National population-at-risk exposure summary |
| `GET` | `/api/risk/:lat/:lon` | Deep scientific risk analysis for any Indian coordinate |
| `GET` | `/api/exposure/population-at-risk` | WorldPop gridded population intersection |
| `GET` | `/api/relocation/nearest` | Nearest 3 verified shelters using Haversine formula |
| `POST` | `/api/reports` | Submit citizen hazard report (`PENDING_VERIFICATION`) |
| `GET` | `/api/admin/reports` | Retrieve citizen reports for administrative audit |
| `POST` | `/api/admin/reports/:id/approve` | Approve citizen report with official notes |
| `POST` | `/api/admin/reports/:id/reject` | Reject unsubstantiated report |
| `POST` | `/api/admin/relocation-sites` | Add new verified emergency shelter |
| `DELETE`| `/api/admin/relocation-sites/:id` | Remove shelter from directory |
| `GET` | `/api/admin/system-status` | API telemetry, ML metrics, cache status |
| `POST` | `/api/admin/refresh-data` | Clear cache and trigger fresh live data polling |
| `GET` | `/api/download-zip` | Download complete project ZIP (`ResQ-GIS-SIH-READY.zip`) |

---

## 📑 Detailed Documentation

- **Data Sources & Provenance**: `docs/DATA_SOURCES.md`
- **Architecture & Pipeline**: `docs/DATA_ARCHITECTURE.md`
- **Dual-Layer Risk Methodology**: `docs/RISK_METHODOLOGY.md`
- **Machine Learning Benchmarks**: `docs/ML_METHODOLOGY.md`
- **SIH Judge Demonstration Guide**: `docs/SIH_DEMO_GUIDE.md`
