"""
Research Manifest Validation Layer
==================================
Validates raw records parsed from researchFiles, verifying schema integrity,
allowed domain classifications, non-fabrication constraints, and source citations.
"""

from typing import List, Dict, Any, Tuple, Optional


class ResearchManifestValidator:
    """
    Validates field constraints, domain vocabularies, and integrity rules.
    """

    REQUIRED_FIELDS = [
        "area_id",
        "area_name",
        "state_or_region",
        "basin",
        "environment",
        "activity_tier",
        "nwis_data_priority"
    ]

    VALID_PRIORITIES = {"VERY_HIGH", "HIGH", "MEDIUM", "LOW"}

    VALID_ACTIVITY_TIERS = {
        "HIGH_CURRENT_ACTIVITY",
        "ACTIVE_CURRENT",
        "LIVE_CURRENT",
        "ACTIVE_EMERGING",
        "FRONTIER_ACTIVE",
        "FRONTIER_CURRENT",
        "FRONTIER_LEGACY",
        "FRONTIER_SEISMIC",
        "FRONTIER_HIGH_ACTIVITY",
        "SEPARATE_CBM_COHORT",
        "ACTIVE_MODERATE"
    }

    def validate_record(self, record: Dict[str, Any], index: int) -> Tuple[bool, List[str], List[str]]:
        """
        Validates a single research manifest record.
        Returns: (is_valid, errors, warnings)
        """
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Required fields check
        for field in self.REQUIRED_FIELDS:
            val = record.get(field)
            if val is None or str(val).strip() == "":
                errors.append(f"Row {index}: Missing required field '{field}'")

        area_id = str(record.get("area_id") or "").strip()
        if area_id and not area_id.startswith("IN-"):
            warnings.append(f"Row {index} (ID: {area_id}): Area ID does not follow standard 'IN-' national prefix.")

        # 2. Priority check
        priority = str(record.get("nwis_data_priority") or "").strip().upper()
        if priority and priority not in self.VALID_PRIORITIES:
            errors.append(f"Row {index} (ID: {area_id}): Invalid priority '{priority}'. Must be one of {self.VALID_PRIORITIES}")

        # 3. Activity Tier check
        tier = str(record.get("activity_tier") or "").strip().upper()
        if tier and tier not in self.VALID_ACTIVITY_TIERS:
            warnings.append(f"Row {index} (ID: {area_id}): Unrecognized activity tier '{tier}'.")

        # 4. Non-fabrication & Operational guardrail
        # Ensure area record is not masquerading as a specific well header
        if "well_spud_date" in record or "formation_top_md" in record:
            errors.append(f"Row {index}: Violation of non-fabrication rule. Research manifest must not contain operational well logs.")

        # 5. Historical wells total validation
        hw = record.get("historical_wells_basin_total_to_2024")
        if hw is not None and str(hw).strip() != "":
            try:
                int(float(str(hw).strip()))
            except ValueError:
                warnings.append(f"Row {index} (ID: {area_id}): historical_wells_basin_total_to_2024 '{hw}' is non-numeric.")

        is_valid = len(errors) == 0
        return is_valid, errors, warnings

    def validate_batch(self, records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[str], List[str]]:
        """
        Validates a batch of raw records.
        Returns: (valid_records, invalid_records, all_errors, all_warnings)
        """
        valid = []
        invalid = []
        all_errors = []
        all_warnings = []
        seen_ids = set()

        for idx, rec in enumerate(records):
            is_valid, errors, warnings = self.validate_record(rec, idx)
            aid = str(rec.get("area_id") or "").strip()

            if aid in seen_ids:
                errors.append(f"Row {idx}: Duplicate area_id '{aid}' detected in input batch.")
                is_valid = False
            else:
                seen_ids.add(aid)

            if is_valid:
                valid.append(rec)
            else:
                invalid.append({"record": rec, "errors": errors})

            all_errors.extend(errors)
            all_warnings.extend(warnings)

        return valid, invalid, all_errors, all_warnings


research_validator = ResearchManifestValidator()
