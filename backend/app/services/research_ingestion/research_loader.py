"""
Research Manifest File Loader
=============================
Handles dual-format ingestion (CSV + XLSX) of national drilling activity datasets.
Ensures deterministic parsing, cross-format reconciliation, and source verification.
"""

import os
import glob
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import pandas as pd
import openpyxl


class ResearchManifestLoader:
    """
    Locates, parses, compares, and reconciles CSV and XLSX research manifest datasets.
    """

    CANONICAL_CSV_FILENAME = "nwis_india_hydrocarbon_drilling_activity_master.csv"
    REFERENCE_XLSX_FILENAME = "nwis_india_hydrocarbon_drilling_activity_master.xlsx"

    def __init__(self, base_search_dir: Optional[str] = None):
        self.base_search_dir = base_search_dir or self._find_project_root()
        self.research_dir = self._find_research_dir()

    def _find_project_root(self) -> str:
        # Search upwards from current file to find directory containing researchFiles
        curr = Path(__file__).resolve().parent
        for _ in range(5):
            if (curr / "researchFiles").is_dir() or (curr / "data").is_dir():
                return str(curr)
            curr = curr.parent
        return os.getcwd()

    def _find_research_dir(self) -> str:
        candidates = [
            Path(self.base_search_dir) / "researchFiles",
            Path(os.getcwd()) / "researchFiles",
            Path(os.getcwd()).parent / "researchFiles",
            Path("c:/Users/heart/Desktop/nwis/researchFiles")
        ]
        for p in candidates:
            if p.is_dir():
                return str(p.resolve())
        # Fallback to relative path
        return "researchFiles"

    def locate_research_files(self) -> Dict[str, Optional[str]]:
        """
        Locate all expected research files in researchFiles directory.
        """
        csv_path = None
        xlsx_path = None
        markdown_files = []

        if os.path.exists(self.research_dir):
            for fname in os.listdir(self.research_dir):
                full = os.path.join(self.research_dir, fname)
                if fname.endswith(".csv"):
                    csv_path = full
                elif fname.endswith(".xlsx"):
                    xlsx_path = full
                elif fname.endswith(".md"):
                    markdown_files.append(full)

        return {
            "csv_path": csv_path,
            "xlsx_path": xlsx_path,
            "markdown_files": markdown_files,
            "research_dir": self.research_dir
        }

    def load_raw_csv(self, csv_path: Optional[str] = None) -> List[Dict[str, Any]]:
        target_path = csv_path or self.locate_research_files()["csv_path"]
        if not target_path or not os.path.exists(target_path):
            raise FileNotFoundError(f"Canonical CSV research file not found at: {target_path}")

        # Read CSV with UTF-8 encoding
        df = pd.read_csv(target_path, encoding="utf-8")
        # Fill NaN with None / empty string
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")

    def load_raw_xlsx(self, xlsx_path: Optional[str] = None) -> List[Dict[str, Any]]:
        target_path = xlsx_path or self.locate_research_files()["xlsx_path"]
        if not target_path or not os.path.exists(target_path):
            raise FileNotFoundError(f"Reference XLSX research file not found at: {target_path}")

        df = pd.read_excel(target_path)
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")

    def compare_and_reconcile(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
        """
        Loads both CSV and XLSX, evaluates cell-by-cell equality,
        and returns: (canonical_records, discrepancies, audit_meta).
        """
        files = self.locate_research_files()
        csv_records = self.load_raw_csv(files["csv_path"])
        xlsx_records = self.load_raw_xlsx(files["xlsx_path"]) if files["xlsx_path"] else []

        discrepancies = []
        if len(csv_records) != len(xlsx_records):
            discrepancies.append({
                "type": "ROW_COUNT_MISMATCH",
                "csv_rows": len(csv_records),
                "xlsx_rows": len(xlsx_records)
            })

        # Cell by cell check for overlapping records
        for i in range(min(len(csv_records), len(xlsx_records))):
            r_csv = csv_records[i]
            r_xlsx = xlsx_records[i]
            area_id = r_csv.get("area_id") or f"row_{i}"

            for key in r_csv.keys():
                if key in r_xlsx:
                    val_c = str(r_csv[key] or "").strip()
                    val_x = str(r_xlsx[key] or "").strip()
                    # Handle float string normalization like 18.0 vs 18
                    if val_c.endswith(".0") and not val_x.endswith(".0"):
                        if val_c[:-2] == val_x:
                            continue
                    if val_x.endswith(".0") and not val_c.endswith(".0"):
                        if val_x[:-2] == val_c:
                            continue
                    if val_c != val_x:
                        discrepancies.append({
                            "type": "CELL_VALUE_MISMATCH",
                            "row_index": i,
                            "area_id": area_id,
                            "column": key,
                            "csv_value": val_c,
                            "xlsx_value": val_x
                        })

        audit_meta = {
            "canonical_file": self.CANONICAL_CSV_FILENAME,
            "reference_file": self.REFERENCE_XLSX_FILENAME,
            "csv_rows": len(csv_records),
            "xlsx_rows": len(xlsx_records),
            "columns_count": len(csv_records[0].keys()) if csv_records else 0,
            "columns": list(csv_records[0].keys()) if csv_records else [],
            "total_discrepancies": len(discrepancies),
            "reconciliation_status": "MATCH" if len(discrepancies) == 0 else "DISCREPANCIES_DETECTED"
        }

        # CSV is treated as canonical structured format
        return csv_records, discrepancies, audit_meta


research_loader = ResearchManifestLoader()
