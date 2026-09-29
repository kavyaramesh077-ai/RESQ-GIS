# ResQ-GIS — Data Architecture & Processing Pipeline

```
[ FRONTEND CLIENT ]
   │
   ├── Map View (Leaflet GIS with India-Only Polygon Bounds)
   ├── Dashboard (National Multi-Hazard Exposure & Live Telemetry)
   ├── AI Risk Analyzer (Interactive Lat/Lon Scientific Inference)
   ├── Live Alerts Feed (Automatic Warning System with Provenance)
   ├── Population-at-Risk Engine (WorldPop Zonal Calculations)
   ├── Relocation & Shelter Finder (Haversine Distance Routing)
   ├── Citizen Hazard Reporting (Pending Verification Workflow)
   └── Admin Panel (Verification Console, Site Management, Health Telemetry)
   │
   ▼ (REST JSON /api/*)
[ BACKEND SERVICE ] (Express Node.js / Flask Python Gateway)
   │
   ▼
[ CENTRAL DATA ORCHESTRATOR ]
   │
   ├── 1. India Sovereign Boundary Validation (Ray-Casting PIP Algorithm)
   │      - Strictly drops any feature located in Pakistan, China, Nepal, Bhutan,
   │        Bangladesh, Myanmar, or Sri Lanka.
   │
   ├── 2. Live Public Scientific APIs
   │      ├─ Open-Meteo API (24h/3d/7d Precipitation, Soil Moisture, Wind, Temp)
   │      └─ USGS Earthquake Catalog (Real-time Seismic Events clipped to India)
   │
   ├── 3. Validation, Normalization & In-Memory TTL Caching (15 mins)
   │      - Timestamping & Provenance Metadata Generation
   │      - Multi-source resilience fallback to verified baseline norms
   │
   ├── 4. Spatial Terrain Derivation (Copernicus DEM 30m)
   │      - Surface Elevation & Slope Gradient (Degrees)
   │
   ├── 5. Dual-Layer Risk Engine
   │      ├─ Type A: Historical Susceptibility (Permanent Geomorphic Baseline)
   │      └─ Type B: Current Activated Dynamic Risk (Real-time Trigger Thresholds)
   │
   ├── 6. Machine Learning / Deep Learning Inference
   │      ├─ ResQ-Spatial-CNN (Multi-Scale Spatial 2D Grid Feature Extraction)
   │      ├─ ResQ-Hydro-LSTM (Temporal Sequence Hydro-Meteorological Saturation)
   │      └─ ResQ-Vision-ResNet (Satellite Feature Extractor Architecture)
   │
   └── 7. Zonal Population Exposure & Emergency Shelter Routing
          ├─ WorldPop 1km Gridded Raster Intersection
          └─ Haversine Distance Search for Nearest 3 Verified SDMA Shelters
```
