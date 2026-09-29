"""
ResQ-GIS Risk Engine
Implements the Dual-Layer Risk Architecture:
Type A: Historical / Recurrent Susceptibility (0-100)
Type B: Current / Activated Dynamic Risk (0-100)
"""

from typing import Dict, Any, Tuple
import math

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class RiskEngine:
    @staticmethod
    def calculate_landslide_risk(weather: Dict[str, Any], slope_deg: float, historical_events_count: int) -> Tuple[int, int, str]:
        """
        Calculates baseline susceptibility and activated dynamic risk.
        Returns: (historical_score, current_score, explanation)
        """
        # Baseline susceptibility: Slope + Geomorphic elevation + Historical recurrence
        historical_score = min(98, int(slope_deg * 1.8 + historical_events_count * 7 + (20 if weather['elevation_m'] > 800 else 5)))

        # Dynamic activation: 24h rainfall + 3d cumulative + Soil Moisture + Slope trigger
        rain_trigger = (weather['rainfall_24h_mm'] / 100.0) * 35.0 + (weather['rainfall_3d_mm'] / 250.0) * 35.0
        moisture_trigger = (weather['soil_moisture_percent'] / 100.0) * 15.0
        slope_factor = (slope_deg / 45.0) * 15.0
        current_score = min(99, int(rain_trigger + moisture_trigger + slope_factor))

        explanation = (
            f"Slope angle is {slope_deg}° at {weather['elevation_m']}m elevation. "
            f"24h precipitation ({weather['rainfall_24h_mm']}mm) and 3-day sum ({weather['rainfall_3d_mm']}mm) "
            f"drives soil saturation to {weather['soil_moisture_percent']}%. "
            f"{historical_events_count} verified historical landslide records in this mountain tract."
        )
        return historical_score, current_score, explanation

    @staticmethod
    def calculate_flood_risk(weather: Dict[str, Any], slope_deg: float, historical_events_count: int) -> Tuple[int, int, str]:
        is_low_elev = weather['elevation_m'] < 35
        is_flat = slope_deg < 2.0
        historical_score = min(96, int((45 if is_low_elev else 15) + (35 if is_flat else 10) + historical_events_count * 6))

        rain_trigger = (weather['rainfall_24h_mm'] / 80.0) * 40.0 + (weather['rainfall_7d_mm'] / 200.0) * 30.0
        saturation_trigger = (weather['soil_moisture_percent'] / 100.0) * 20.0
        elev_inversion = 10 if weather['elevation_m'] < 30 else 0
        current_score = min(98, int(rain_trigger + saturation_trigger + elev_inversion))

        explanation = (
            f"Low hydraulic gradient ({slope_deg}°) at {weather['elevation_m']}m elevation. "
            f"Accumulated 7-day rainfall of {weather['rainfall_7d_mm']}mm exceeds drainage conveyance capacity. "
            f"Soil moisture at {weather['soil_moisture_percent']}%, causing elevated surface runoff accumulation."
        )
        return historical_score, current_score, explanation

risk_engine = RiskEngine()
