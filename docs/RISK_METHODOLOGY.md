# ResQ-GIS — Dual-Layer Risk Methodology

A foundational requirement of ResQ-GIS is the rigorous distinction between:
1. **Type A: Historical / Recurrent Susceptibility (Baseline)**
2. **Type B: Current Activated Dynamic Risk (Real-time Activation)**

---

## 1. Dual-Layer Formulation

### Type A: Historical Susceptibility ($S_{\text{hist}}$)
Represents the structural, geomorphic, lithological, and climatological predisposition of a region to experience a hazard, irrespective of whether an active hazard is currently occurring.

$$S_{\text{hist}} = w_{\text{slope}} \cdot f(\theta) + w_{\text{relief}} \cdot f(z) + w_{\text{rec}} \cdot N_{\text{events}} + w_{\text{fault}} \cdot D_{\text{tectonic}}$$

- **Landslides**: Evaluated from terrain slope angle ($\theta$), elevation ($z$), and verified past failure recurrence ($N_{\text{events}}$). A steep mountain slope in Munnar or Wayanad with $\theta > 34^\circ$ retains **HIGH** baseline susceptibility ($S_{\text{hist}} \ge 85$) even during dry summer spells.
- **Floods**: Evaluated from low hydraulic gradient ($\theta < 1.0^\circ$), low topographic elevation ($z < 15\text{m}$), and flood basin convergence (e.g. Chennai low-lying basin or Barpeta/Brahmaputra flood plains).

### Type B: Current Activated Dynamic Risk ($R_{\text{current}}$)
Evaluates whether current, short-term hydro-meteorological, atmospheric, or seismic triggers have pushed the physical system past its critical failure threshold.

$$R_{\text{current}} = w_{24} \cdot \frac{P_{24}}{T_{24}} + w_{3\text{d}} \cdot \frac{P_{3\text{d}}}{T_{3\text{d}}} + w_{\text{soil}} \cdot S_{\text{moisture}} + w_{\text{slope}} \cdot \frac{\theta}{45^\circ}$$

Where:
- $P_{24}$ = 24-hour rainfall from Open-Meteo API [mm]
- $P_{3\text{d}}, P_{7\text{d}}$ = Cumulative 3-day and 7-day antecedent rainfall [mm]
- $S_{\text{moisture}}$ = Upper soil column moisture saturation [%]
- $T_{24}, T_{3\text{d}}$ = Calibrated threshold constants ($T_{24} = 100\text{mm}$, $T_{3\text{d}} = 250\text{mm}$ for Western Ghats / Himalayas)

---

## 2. Severity Classification Thresholds

| Risk Level | Score Range | Color Code | Operational Meaning | Recommended Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **RED** | 75 – 100 | `#ef4444` | **VERY HIGH / IMMEDIATE ATTENTION** | Mandatory evacuation to designated shelters; halt traffic on mountain ghat passes; deploy SDRF/NDRF. |
| **ORANGE** | 55 – 74 | `#f97316` | **HIGH / ACTIVE WARNING** | Preposition de-watering pumps, monitor retaining walls/piezometers; pre-alert rescue squads. |
| **YELLOW** | 35 – 54 | `#eab308` | **MODERATE / ADVISORY** | Monitor stream gauges, clear urban culverts, advise fishermen against deep-sea travel. |
| **GREEN** | 0 – 34 | `#22c55e` | **LOW / NORMAL VIGILANCE** | Routine weather tracking; infrastructure maintenance. |
