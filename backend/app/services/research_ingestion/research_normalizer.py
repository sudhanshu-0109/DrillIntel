"""
Research Manifest Normalization Layer
=====================================
Normalizes raw research manifest records into clean NationalActivityArea entities.
Handles text cleaning, unicode dash normalization, basin standardization, and
geocoded anchor coordinate resolution.
"""

import re
import unicodedata
from typing import Dict, Any, Optional, Tuple
from .research_models import NationalActivityArea


# ── Canonical Coordinate Mapping for all 48 Research Manifest Anchors ───────
ANCHOR_COORDINATES: Dict[str, Tuple[float, float]] = {
    # Andaman & Nicobar
    "IN-OIL-AN-01": (11.6670, 92.7400), # Vijayapuram, Andaman
    "IN-AN-01": (11.6670, 92.7400),     # Vijayapuram, Andaman & Nicobar
    "IN-AN-02": (11.2000, 93.1000),     # Andaman deepwater offshore

    # Assam & Northeast
    "IN-AS-05": (27.5600, 95.5800),     # Mechaki, Upper Assam
    "IN-AS-01": (27.3584, 95.3182),     # Duliajan, Assam
    "IN-AS-02": (27.1850, 94.9300),     # Moran, Assam
    "IN-AS-04": (27.6500, 95.2000),     # Kobochapori, North Bank Brahmaputra
    "IN-OIL-NE-01": (27.4800, 94.9200), # Maijan / Mangaldoi, Assam
    "IN-AS-06": (27.4300, 96.0000),     # Kharsang, Arunachal Pradesh
    "IN-TR-01": (23.3200, 91.4500),     # Tulamara, Tripura
    "IN-AS-03": (26.8500, 94.7500),     # Geleki, Assam

    # Gujarat & Western Region
    "IN-CB-01": (23.3500, 72.4000),     # Ahmedabad–Mehsana, Gujarat
    "IN-CB-02": (21.6264, 73.0033),     # Ankleshwar, Gujarat
    "IN-CB-04": (21.7500, 72.8500),     # Jaya/Ambe, Gujarat
    "IN-CB-03": (22.2400, 73.0800),     # Padra / Karjan / Vadodara, Gujarat
    "IN-GJ-01": (23.2000, 69.0000),     # Kutch coast, Gujarat
    "IN-GJ-02": (21.5000, 70.0000),     # Saurashtra coast, Gujarat
    "IN-FR-06": (22.0000, 74.5000),     # Narmada basin, Gujarat / MP

    # Andhra Pradesh & Krishna-Godavari
    "IN-KG-04": (16.5000, 82.5000),     # Kakinada deepwater, Bay of Bengal
    "IN-KG-02": (16.0300, 80.9100),     # Nagayalanka, Andhra Pradesh
    "IN-KG-01": (17.0005, 81.8040),     # Rajahmundry, Andhra Pradesh
    "IN-KG-03": (16.4800, 82.3200),     # Ravva, Andhra Pradesh offshore
    "IN-FR-03": (14.7500, 78.8000),     # Cuddapah basin, Andhra Pradesh
    "IN-FR-05": (18.5000, 79.5000),     # Pranhita-Godavari basin, Telangana / AP

    # Odisha & Mahanadi
    "IN-MN-01": (20.4625, 85.8828),     # Cuttack / Jagatsinghpur, Odisha
    "IN-MN-02": (19.8000, 86.5000),     # Mahanadi offshore, Odisha coast
    "IN-OIL-OR-01": (20.4625, 85.8828), # Cuttack / Jagatsinghpur, Odisha

    # Western Offshore / Mumbai
    "IN-MO-01": (19.4200, 71.3300),     # Mumbai High, Maharashtra offshore
    "IN-MO-02": (20.5000, 72.0000),     # Tapti–Daman, western offshore

    # Rajasthan
    "IN-RJ-01": (25.7521, 71.3967),     # Barmer, Rajasthan
    "IN-RJ-02": (26.9157, 70.9083),     # Jaisalmer, Rajasthan
    "IN-RJ-03": (27.5000, 73.0000),     # Bikaner–Nagaur, Rajasthan

    # Tamil Nadu & Cauvery
    "IN-CAU-01": (10.7656, 79.8424),    # Nagapattinam–Tiruvarur, Tamil Nadu
    "IN-CAU-02": (10.8000, 79.9500),    # Cauvery offshore, Tamil Nadu coast

    # Kerala-Konkan
    "IN-KK-01": (8.8932, 76.6141),      # Kollam, Kerala offshore

    # CBM & Gondwana
    "IN-CBM-02": (23.7500, 86.1500),    # Bokaro/Jharia, Jharkhand
    "IN-CBM-01": (23.6200, 87.1200),    # Raniganj, West Bengal
    "IN-CBM-03": (23.3000, 81.3500),    # Sohagpur, Madhya Pradesh

    # Bengal / Eastern
    "IN-BP-01": (25.7800, 87.4700),     # Purnea / Bengal basin

    # Central & Frontier Basins
    "IN-FR-02": (21.5000, 82.0000),     # Chhattisgarh basin
    "IN-FR-07": (19.2000, 81.6000),     # Bastar basin, Chhattisgarh
    "IN-FR-09": (29.5000, 76.5000),     # Ganga-Punjab basin
    "IN-FR-10": (31.0000, 77.0000),     # Himalayan Foreland basin
    "IN-FR-01": (24.5000, 80.5000),     # Vindhyan basin
    "IN-FR-08": (16.5000, 76.0000),     # Bhima-Kaladgi basin, Karnataka
    "IN-FR-04": (20.0000, 76.0000),     # Deccan Syneclise
    "IN-FR-11": (34.0000, 74.8000),     # Karewa basin, J&K
    "IN-FR-12": (32.5000, 77.8000),     # Spiti–Zanskar basin, HP / Ladakh
}


class ResearchManifestNormalizer:
    """
    Cleans, normalizes, and geocodes raw research records.
    """

    def clean_text(self, text: Optional[Any]) -> str:
        if text is None:
            return ""
        s = str(text)
        # Normalize unicode characters (like replacement character, non-breaking space)
        s = s.replace("\ufffd", "-").replace("\xa0", " ").replace("–", "–").replace("—", "—")
        # Replace consecutive whitespace
        s = re.sub(r"[ \t]+", " ", s)
        return s.strip()

    def normalize_basin_name(self, basin: str) -> str:
        b = self.clean_text(basin)
        # Standardize common variations
        if b in ("Assam Shelf", "Assam & Assam Arakan", "Assam Shelf / Assam & Assam Arakan"):
            return b
        if "Krishna" in b and "Godavari" in b:
            return "Krishna-Godavari"
        if "Mahanadi" in b:
            return "Mahanadi"
        if "Cambay" in b:
            return "Cambay"
        if "Rajasthan" in b:
            return "Rajasthan"
        if "Cauvery" in b:
            return "Cauvery"
        if "Mumbai" in b:
            return "Mumbai Offshore"
        if "Andaman" in b:
            return "Andaman"
        if "Bengal" in b:
            return "Bengal-Purnea"
        return b

    def normalize_record(
        self,
        raw: Dict[str, Any],
        source_file: str = "nwis_india_hydrocarbon_drilling_activity_master.csv",
        research_version: str = "2026-09"
    ) -> NationalActivityArea:
        area_id = self.clean_text(raw.get("area_id"))
        area_name = self.clean_text(raw.get("area_name"))
        state_or_region = self.clean_text(raw.get("state_or_region"))
        basin = self.normalize_basin_name(self.clean_text(raw.get("basin")))
        environment = self.clean_text(raw.get("environment"))
        activity_tier = self.clean_text(raw.get("activity_tier")).upper()
        operators = self.clean_text(raw.get("operators_evidenced")) or None

        # Historical wells total
        hw_raw = raw.get("historical_wells_basin_total_to_2024")
        historical_wells = None
        if hw_raw is not None and str(hw_raw).strip() != "":
            try:
                historical_wells = int(float(str(hw_raw).strip()))
            except (ValueError, TypeError):
                historical_wells = None

        recent_signal = self.clean_text(raw.get("recent_or_current_activity_signal")) or None
        knowledge_themes = self.clean_text(raw.get("key_drilling_knowledge_or_risk_themes")) or None
        evidence_period = self.clean_text(raw.get("activity_evidence_period")) or None
        anchor = self.clean_text(raw.get("map_search_anchor")) or None
        priority = self.clean_text(raw.get("nwis_data_priority")).upper() or "HIGH"
        prov_classes = self.clean_text(raw.get("provenance_classes_to_store")) or "DIRECT;REGIONAL;ANALOG"
        cohort = self.clean_text(raw.get("separate_training_cohort")).upper() or "NO"
        notes = self.clean_text(raw.get("recommended_ingestion_notes")) or None
        urls = self.clean_text(raw.get("source_urls")) or None

        # Specific aliases for regional clusters
        aliases = ""
        if area_id == "IN-CB-03":
            aliases = "vadodara waghodia dattapura"
        elif area_id == "IN-CB-01":
            aliases = "ahmedabad mehsana kalol gandhinagar nawagam"
        elif area_id == "IN-CB-02":
            aliases = "ankleshwar bharuch dahej"
        elif area_id == "IN-KG-01":
            aliases = "rajahmundry east godavari west godavari"
        elif area_id == "IN-KG-02":
            aliases = "kakinada nagayalanka yanam bantumilli"

        # Build normalized name for fast search
        norm_name = f"{area_name} {state_or_region} {basin} {anchor or ''} {aliases} {notes or ''}".lower()
        norm_name = re.sub(r"[^\w\s]", " ", norm_name)
        # Resolve anchor coordinates
        lat, lng = ANCHOR_COORDINATES.get(area_id, (None, None))

        return NationalActivityArea(
            area_id=area_id,
            area_name=area_name,
            normalized_name=norm_name,
            state_or_region=state_or_region,
            basin=basin,
            environment=environment,
            activity_tier=activity_tier,
            operators_evidenced=operators,
            historical_wells_basin_total=historical_wells,
            recent_or_current_activity_signal=recent_signal,
            key_drilling_knowledge_or_risk_themes=knowledge_themes,
            activity_evidence_period=evidence_period,
            map_search_anchor=anchor,
            anchor_latitude=lat,
            anchor_longitude=lng,
            nwis_data_priority=priority,
            provenance_classes_to_store=prov_classes,
            separate_training_cohort=cohort,
            recommended_ingestion_notes=notes,
            source_urls=urls,
            source_file=source_file,
            provenance="RESEARCH_MANIFEST",
            research_version=research_version,
            research_snapshot_date=research_version
        )


research_normalizer = ResearchManifestNormalizer()
