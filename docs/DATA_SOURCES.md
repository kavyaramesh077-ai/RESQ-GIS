# ResQ-GIS — Real Scientific & Geospatial Data Sources (Zero Fake Data)

ResQ-GIS strictly adheres to the **Zero Fake Data** protocol. Every figure, risk score, alert, polygon, and population exposure metric displayed across the platform originates from verified public scientific services, live REST endpoints, or peer-reviewed geospatial inventories.

---

## 1. Live Operational Meteorological Feeds

### Open-Meteo Numerical Weather Prediction (NWP) API
- **Agency / Provider**: Open-Meteo GmbH / European Centre for Medium-Range Weather Forecasts (ECMWF) & NOAA GFS.
- **Access Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Variables Queried**:
  - Instantaneous Precipitation (`precipitation`, `rain`) [Unit: mm]
  - 24-Hour Accumulated Rainfall (`precipitation_sum[0]`) [Unit: mm]
  - 3-Day & 7-Day Cumulative Inflow (`precipitation_sum[0..6]`) [Unit: mm]
  - Surface Soil Moisture Saturation (0–7 cm depth) [Unit: % / m³/m³]
  - 2-Metre Air Temperature (`temperature_2m`) [Unit: °C]
  - 10-Metre Wind Speed & Gusts (`wind_speed_10m`) [Unit: km/h]
- **Spatial Resolution**: 0.1° (~11 km) global grid, interpolated locally.
- **Update Cadence**: Every 60 minutes with 15-minute server-side caching.
- **Provenance Citation**: WMO-calibrated ECMWF IFS & Global Forecast System.

---

## 2. Real-Time Seismic Data

### USGS Real-Time Earthquake Hazards Program
- **Agency / Provider**: United States Geological Survey (USGS) & National Earthquake Information Center (NEIC).
- **Access Endpoint**: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`
- **Variables Queried**: Event ID, Hypocentre Depth [km], Magnitude [Mw/mb], Event Timestamp [UTC], Epicentre Latitude/Longitude.
- **India Spatial Clipping**: Queries a bounding box (6.5°N–37.5°N, 68.0°E–97.5°E) and applies ray-casting point-in-polygon checks against India sovereign boundary coordinates. All events in neighboring sovereign countries are discarded.
- **Update Cadence**: Real-time streaming / polled on demand.

---

## 3. High-Resolution Digital Elevation & Topography

### Copernicus GLO-30 Digital Elevation Model
- **Agency / Provider**: European Space Agency (ESA) / Copernicus Earth Observation Programme.
- **Resolution**: 30-metre spatial resolution (1 arc-second).
- **Derivatives Computed**:
  - Surface Elevation ($z$) [Unit: Metres above mean sea level]
  - Topographic Slope Gradient ($\theta = \arctan \sqrt{(\partial z/\partial x)^2 + (\partial z/\partial y)^2}$) [Unit: Degrees]
- **Application**: Differentiating steep escarpment shear risks in Western Ghats & Himalayas from low-gradient coastal catchment drainage bottlenecks.

---

## 4. Gridded Population Exposure

### WorldPop 2025 High-Resolution Population Density Grids
- **Agency / Provider**: WorldPop Research Group, University of Southampton / School of Geography and Environmental Science.
- **Dataset**: India 1km / 30 arc-second unconstrained spatial population count and density raster.
- **Resolution**: 1 km² grid cells calibrated with 2024/2025 demographic projections.
- **Calculation Method**: Geometric intersection of spatial hazard impact footprint buffer with raster cells. Zonal breakdown into Red (>=75 score), Orange (55–74 score), and Yellow (35–54 score) population cohorts.

---

## 5. Verified Historical Multi-Hazard Inventories

### Geological Survey of India (GSI) National Landslide Inventory
- Historical catastrophic debris flows and rotational rockslides across Western Ghats (Kerala, Karnataka, Maharashtra) and Himalayas (Uttarakhand, Himachal Pradesh, Sikkim, Assam).
- Records include Wayanad Chooralmala (2024), Pettimudi Munnar (2020), Malin (2014), Joshimath (2023).

### Central Water Commission (CWC) & Dartmouth Flood Observatory
- Major historical flood records: Chennai Deluge (2015, 2023 Michaung), Kerala Synchronous Catchment Inundations (2018), Lower Brahmaputra Wave IV (2023), Yamuna Delhi High Flood Level (2023).

### India Meteorological Department (IMD) Cyclone e-Atlas
- Historical cyclonic tracks across North Indian Ocean, Bay of Bengal, and Arabian Sea: Cyclones Fani (2019), Amphan (2020), Tauktae (2021), Biparjoy (2023), Michaung (2023).

---

## 6. Verified Emergency Shelters & Evacuation Infrastructure
- Sourced directly from State Disaster Management Authorities (OSDMA, APSDMA, TNSDMA, KSDMA, ASDMA, USDMA, GSDMA).
- Includes structural ratings (aerodynamic wind resistance, elevated flood plinth height), documented shelter capacities, nodal officer contacts, and verified geocoded coordinates.
