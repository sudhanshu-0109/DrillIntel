"""
Research Source Provenance & Versioning Registry
================================================
Preserves documentary citations, publication sources, and version snapshots
for all ingested India-wide research manifest datasets.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


class ResearchSourceRegistry:
    """
    Maintains verified institutional citations and version lineage.
    """

    CURRENT_VERSION = "2026-09"
    CANONICAL_SOURCE_FILE = "nwis_india_hydrocarbon_drilling_activity_master.csv"

    # Known institutional sources
    INSTITUTIONAL_CITATIONS = [
        {
            "publisher": "Directorate General of Hydrocarbons (DGH India)",
            "document": "Indian Petroleum & Natural Gas Statistics / Annual Hydrocarbon Report 2024-25",
            "url": "https://dghindia.gov.in/assets/downloads/ar/2024-25/annual_report24-25.pdf",
            "provenance_tier": "RESEARCH_MANIFEST"
        },
        {
            "publisher": "Oil India Limited (OIL)",
            "document": "Annual Report & Financial Results FY2024-25 / FY2025-26 Drilling Updates",
            "url": "https://www.oil-india.com/files/financial_results_documents/OIL_India_Annual_Report_2024_25.pdf",
            "provenance_tier": "RESEARCH_MANIFEST"
        },
        {
            "publisher": "Vedanta Limited / Cairn Oil & Gas",
            "document": "Integrated Report & Annual Accounts FY2025-26",
            "url": "https://www.vedantalimited.com/uploads/investor-overview/annual-report/2026/integrated-report-and-annual-accounts.pdf",
            "provenance_tier": "RESEARCH_MANIFEST"
        },
        {
            "publisher": "Oil and Natural Gas Corporation (ONGC)",
            "document": "Western Region / Ahmedabad / Mehsana Operational Progress Disclosure",
            "url": "https://nsearchives.nseindia.com/corporate/ONGC_21052025221710_PR21052025.pdf",
            "provenance_tier": "RESEARCH_MANIFEST"
        }
    ]

    def get_source_metadata(self) -> Dict[str, Any]:
        return {
            "snapshot_version": self.CURRENT_VERSION,
            "canonical_file": self.CANONICAL_SOURCE_FILE,
            "provenance_class": "RESEARCH_MANIFEST",
            "institutional_citations": self.INSTITUTIONAL_CITATIONS,
            "active_since": "2026-09-01T00:00:00Z"
        }

    def parse_urls(self, url_string: Optional[str]) -> List[str]:
        if not url_string:
            return []
        parts = str(url_string).split(";")
        return [p.strip() for p in parts if p.strip()]


research_sources = ResearchSourceRegistry()
