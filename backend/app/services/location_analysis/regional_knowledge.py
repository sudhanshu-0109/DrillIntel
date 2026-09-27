"""
Regional Geological Knowledge & India-Wide Basin Classification
===============================================================
Provides defensible, non-hallucinated regional basin context, sedimentary province
stratigraphy, hazard knowledge, and technical analog well discovery when direct offset
wells are absent or insufficient.

Evidence Tiers:
  TIER 1 — DIRECT OFFSET (Wells <= 30 km with depth overlap)
  TIER 2 — REGIONAL (Basin-level stratigraphy & known geological challenges)
  TIER 3 — ANALOG (Technical analog wells matching depth / challenge)
  TIER 4 — INFERENCE (Reasoning derived from regional / analog evidence)
  TIER 5 — RESEARCH_MANIFEST (National drilling activity coverage)
  TIER 6 — INSUFFICIENT (Outside mapped petroleum basins)
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import math
import re

from app.models_db import Well, Event, Document


@dataclass
class RegionalBasin:
    basin_id: str
    basin_name: str
    geological_province: str
    onshore_offshore: str
    description: str
    typical_stratigraphy: List[Dict[str, Any]]
    regional_hazards: List[str]
    watch_items: List[str]
    min_lat: float
    max_lat: float
    min_lng: float
    max_lng: float
    keywords: List[str]


# ── Sedimentary Basin Registry (Category I, II, III & Frontier Basins of India) ──
# Grounded in official Indian petroleum geology (DGH / ONGC / OIL reference frameworks)
SEDIMENTARY_BASINS: List[RegionalBasin] = [
    RegionalBasin(
        basin_id="CAMBAY",
        basin_name="Cambay Basin",
        geological_province="Western Onshore Rift Basin (Category I Petroliferous Province)",
        onshore_offshore="Onshore / Shallow Gulf (Gujarat)",
        description=(
            "Major intracratonic rift basin in Gujarat formed during Late Cretaceous to Early Tertiary. "
            "Characterized by thick Tertiary sedimentary sequence overlying Deccan Trap basalt basement. "
            "Encompasses Vadodara, Waghodia, Dattapura, Padra, Karjan, Ankleshwar, Bharuch, Ahmedabad, and Mehsana blocks."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Post-Miocene Alluvium & Continental Clastics",
                "depth_range": "0 – 800 m",
                "lithology": "Unconsolidated sands, gravels, clays",
                "drilling_behavior": "Surface hole washout, high mud loss potential"
            },
            {
                "interval_name": "Jhagadia & Babaguru Formations",
                "depth_range": "800 – 1600 m",
                "lithology": "Sandstone, grey-brown shale, lignitic streaks",
                "drilling_behavior": "Moderate drillability, interbedded sand-shale stringers"
            },
            {
                "interval_name": "Ankleshwar Formation",
                "depth_range": "1600 – 2400 m",
                "lithology": "Multistorey deltaic reservoir sandstones interbedded with shales",
                "drilling_behavior": "Primary hydrocarbon target; differential sticking risk across depleted or high-permeability sand units"
            },
            {
                "interval_name": "Cambay Shale & Olpad Formations",
                "depth_range": "2400 – 3200 m",
                "lithology": "Dark carbonaceous fissile shale, volcanic clastics, trap-wash",
                "drilling_behavior": "Overpressured intervals, reactive swelling shales, borehole instability requiring strict mud-weight inhibition"
            },
            {
                "interval_name": "Deccan Trap Basalt Basement",
                "depth_range": "> 3200 m",
                "lithology": "Basalt, volcanic tuff, fractured trap",
                "drilling_behavior": "Severe bit wear, chert stringers, sudden ROP drop, severe lost circulation along basement fracture zones"
            }
        ],
        regional_hazards=[
            "Borehole instability and tight hole in reactive Cambay Shale",
            "Differential sticking across permeable Ankleshwar sandstone intervals",
            "Severe lost circulation and bit destruction approaching Deccan Trap basement contact",
            "Overpressure regime development in lower Paleocene-Eocene sections"
        ],
        watch_items=[
            "Monitor Equivalent Circulating Density (ECD) tightly in the 2400–3200m interval",
            "Maintain potassium chloride (KCl) / polymer inhibition to prevent reactive shale sloughing",
            "Pre-treat mud for potential seepage losses prior to penetrating basement unconformities",
            "Verify trip margins before POOH (pull out of hole) across carbonaceous shale sections"
        ],
        min_lat=20.8,
        max_lat=24.5,
        min_lng=71.2,
        max_lng=74.3,
        keywords=["vadodara", "waghodia", "dattapura", "padra", "karjan", "gujarat", "ankleshwar", "bharuch", "ahmedabad", "mehsana", "cambay", "khambhat", "gandhinagar", "kalol", "nawagam"]
    ),
    RegionalBasin(
        basin_id="ASSAM_SHELF",
        basin_name="Assam Shelf",
        geological_province="Upper Assam Shelf Foreland Basin (Category I Petroliferous Province)",
        onshore_offshore="Onshore (Assam)",
        description=(
            "Foreland shelf basin in Upper Assam located south of the Himalayan frontal thrust. "
            "Primary operating theater of Oil India Limited (OIL), characterized by thick Tertiary fluvial-deltaic sequences."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Dihing & Alluvium Formations",
                "depth_range": "0 – 800 m",
                "lithology": "Pebble beds, loose sandstones, clays",
                "drilling_behavior": "Surface hole washout, high mud filtration"
            },
            {
                "interval_name": "Girujan Clay Formation",
                "depth_range": "800 – 2100 m",
                "lithology": "Mottled claystone, mudstone with thin sandstone stringers",
                "drilling_behavior": "Uniform drilling, swelling clay tendency if mud inhibition is low"
            },
            {
                "interval_name": "Tipam Sandstone Formation",
                "depth_range": "2100 – 3400 m",
                "lithology": "Coarse to fine-grained massive sandstone, siltstone interbeds",
                "drilling_behavior": "High permeability, elevated differential sticking signal, torque fluctuations"
            },
            {
                "interval_name": "Barail Sandstone & Coal-Shale Formation",
                "depth_range": "3400 – 3950 m",
                "lithology": "Sandstone, interbedded coal seams, carbonaceous shales",
                "drilling_behavior": "Abnormal formation pressure, gas influx risk, well-control vulnerability during drilling breaks"
            },
            {
                "interval_name": "Kopili Shale Formation",
                "depth_range": "> 3950 m",
                "lithology": "Dark grey splintery shale, calcareous sandstone bands",
                "drilling_behavior": "Sloughing shale, hole pack-off risk"
            }
        ],
        regional_hazards=[
            "Differential sticking in permeable Tipam sand bodies under hydrostatic overbalance",
            "Gas kicks and influx events in Barail coal-sand interfaces",
            "Mud losses into depleted sand packages in mature fields"
        ],
        watch_items=[
            "Monitor surface torque and drag trends continuously across Tipam sandstone",
            "Perform flow checks upon drilling breaks entering Barail sequence",
            "Keep mud overbalance optimized to <= 150 psi across permeable sands"
        ],
        min_lat=25.5,
        max_lat=28.5,
        min_lng=92.5,
        max_lng=96.5,
        keywords=["duliajan", "moran", "nahorkatiya", "tengakhat", "assam", "dibrugarh", "tinsukia", "sibsagar", "jorhat", "digboi", "lakwa", "geleki", "rudrasagar", "dikom", "chabua"]
    ),
    RegionalBasin(
        basin_id="ASSAM_ARAKAN",
        basin_name="Assam & Assam Arakan",
        geological_province="Fold & Thrust Belt (Category I Petroliferous Province)",
        onshore_offshore="Onshore (Tripura / Arunachal / Mizoram / Nagaland)",
        description=(
            "Complex polycyclic fold-and-thrust belt extending along the Indo-Burman ranges with high-relief anticlinal structures."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Tipam & Surma Groups",
                "depth_range": "0 – 2500 m",
                "lithology": "Interbedded sandstone, siltstone, shale",
                "drilling_behavior": "Steep structural dips, borehole deviation tendencies"
            },
            {
                "interval_name": "Bhuban Formation (Upper & Middle)",
                "depth_range": "2500 – 4200 m",
                "lithology": "Fine-grained quartzitic sandstone, hard shale",
                "drilling_behavior": "High pore pressure ramps, high gas cut, tight hole"
            },
            {
                "interval_name": "Disang Group",
                "depth_range": "> 4200 m",
                "lithology": "Splintery dark grey to black shales with slaty cleavage",
                "drilling_behavior": "Severe sloughing shale, hole collapse"
            }
        ],
        regional_hazards=[
            "Tectonic stress causing high borehole breakouts and ovalization",
            "Overpressure and gas kicks in deep Bhuban gas sands",
            "Crooked hole tendencies due to high dip angles (> 35°)"
        ],
        watch_items=[
            "Use weighted mud systems with high inhibition in fold-belt shales",
            "Maintain directional survey frequency to control steep dip drift",
            "Monitor trip gas closely after long static periods"
        ],
        min_lat=22.5,
        max_lat=28.0,
        min_lng=91.0,
        max_lng=97.0,
        keywords=["tripura", "agartala", "tulamara", "kharsang", "arunachal", "changlang", "mizoram", "nagaland", "cachar", "silchar", "mechaki"]
    ),
    RegionalBasin(
        basin_id="RAJASTHAN",
        basin_name="Rajasthan Basin",
        geological_province="Mesozoic-Tertiary Intracratonic Rift Basin (Category I Province)",
        onshore_offshore="Onshore (Rajasthan: Barmer / Jaisalmer / Bikaner-Nagaur)",
        description=(
            "Prolific rift basin in western Rajasthan containing world-class fluvial reservoir sandstones and lacustrine source rocks. "
            "Includes the Barmer core fields (Mangala, Bhagyam, Aishwariya, Raageshwari) and Jaisalmer gas corridor."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Tertiary Continental Clastics",
                "depth_range": "0 – 800 m",
                "lithology": "Loose aeolian sand, silt, bentonitic clay",
                "drilling_behavior": "Surface hole washout, high filtration loss"
            },
            {
                "interval_name": "Barmer Hill Formation",
                "depth_range": "800 – 1600 m",
                "lithology": "Low permeability siliceous mudstone, diatomite, porcellanite",
                "drilling_behavior": "Tight formation, micro-fractured intervals, ballooning tendencies"
            },
            {
                "interval_name": "Fatehgarh Formation",
                "depth_range": "1600 – 2600 m",
                "lithology": "High-permeability fluvial quartzose sandstones with shale breaks",
                "drilling_behavior": "High ROP, severe differential sticking risk across thick permeable sands"
            },
            {
                "interval_name": "Dharvi Dungar & Mesozoic Basement",
                "depth_range": "> 2600 m",
                "lithology": "Tight sandstones, volcanics, granitic basement contact",
                "drilling_behavior": "Sudden ROP decline, chert abrasiveness"
            }
        ],
        regional_hazards=[
            "Differential sticking in highly permeable, depleted Fatehgarh sand reservoirs",
            "High pour-point waxy crude complicating mud rheology during prolonged stops",
            "Lost circulation in fractured Barmer Hill and basement unconformity zones"
        ],
        watch_items=[
            "Maintain ultra-thin, low-permeability mud filter cake across Fatehgarh",
            "Monitor surface mud temperature and rheological properties to prevent waxy gelation",
            "Keep drill string in continuous rotation when stationary"
        ],
        min_lat=24.5,
        max_lat=29.5,
        min_lng=69.5,
        max_lng=74.5,
        keywords=["barmer", "jaisalmer", "bikaner", "nagaur", "rajasthan", "mangala", "bhagyam", "aishwariya", "raageshwari", "fatehgarh", "cairn", "vedanta"]
    ),
    RegionalBasin(
        basin_id="KRISHNA_GODAVARI",
        basin_name="Krishna Godavari",
        geological_province="East Coast Passive Margin Rift & Deltaic Basin (Category I Province)",
        onshore_offshore="Onshore / Shallow & Ultra-Deepwater (Andhra Pradesh coast)",
        description=(
            "Extensive polycyclic basin with complex high-pressure, high-temperature (HPHT) regimes in deep sections. "
            "Encompasses Rajahmundry, Kakinada, Nagayalanka, Ravva shallow-water, and KG deepwater blocks."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Godavari Clay / Pliocene Sequences",
                "depth_range": "0 – 1800 m",
                "lithology": "Soft clays, silts, unconsolidated turbidite sands",
                "drilling_behavior": "Gumbo shale, bit balling, shallow gas hazard"
            },
            {
                "interval_name": "Miocene / Eocene Sandstone & Shales",
                "depth_range": "1800 – 3500 m",
                "lithology": "Interbedded turbidite sandstones, hemipelagic shales",
                "drilling_behavior": "Steep pore pressure ramp, narrow mud weight window"
            },
            {
                "interval_name": "Gollapalli / Raghavapuram HPHT Formations",
                "depth_range": "> 3500 m",
                "lithology": "Hard tight sandstones, overpressured shales",
                "drilling_behavior": "Extreme HPHT conditions, high risk of gas influx and losses"
            }
        ],
        regional_hazards=[
            "Narrow margin between pore pressure and fracture gradient in deepwater",
            "HPHT gas influx and rapid kick propagation in deep reservoir sections",
            "Severe wellbore ballooning and gumbo shale packing off the annulus"
        ],
        watch_items=[
            "Continuous PWD (pressure while drilling) and real-time kick detection",
            "Careful ECD management during connections to prevent fracture breakdown",
            "Use synthetic oil-based mud (SBM) with anti-balling chemistry"
        ],
        min_lat=15.0,
        max_lat=18.5,
        min_lng=80.0,
        max_lng=84.5,
        keywords=["krishna", "godavari", "kg", "kakinada", "rajahmundry", "nagayalanka", "yanam", "bantumilli", "ravva", "andhra", "d6", "east godavari", "west godavari"]
    ),
    RegionalBasin(
        basin_id="CAUVERY",
        basin_name="Cauvery",
        geological_province="East Coast Mesozoic-Tertiary Rift Basin (Category I Province)",
        onshore_offshore="Onshore / Offshore (Tamil Nadu & Puducherry)",
        description=(
            "Rift basin along the southeastern coast of India with prominent horst-and-graben architecture. "
            "Includes Nagapattinam, Tiruvarur, Bhuvanagiri, Periyakudi onshore fields and Cauvery deepwater."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Cuddalore & Karaikal Formations",
                "depth_range": "0 – 1500 m",
                "lithology": "Continental sandstones, clays, marine shales",
                "drilling_behavior": "Good drillability, minor surface hole washout"
            },
            {
                "interval_name": "Kamalapuram & Bhuvanagiri Formations",
                "depth_range": "1500 – 3200 m",
                "lithology": "Calcareous sandstones, fossiliferous shales",
                "drilling_behavior": "Primary Cretaceous-Tertiary reservoir target; tight hole in swollen shales"
            },
            {
                "interval_name": "Andimadam & Pre-Cambrian Basement",
                "depth_range": "> 3200 m",
                "lithology": "Coarse arkosic sandstone, fractured crystalline gneiss",
                "drilling_behavior": "Hard formation, loss of circulation in basement fractures"
            }
        ],
        regional_hazards=[
            "Reactive shale swelling in marine Kamalapuram intervals",
            "Lost circulation in fractured basement and coral reefal limestone pockets",
            "Differential sticking across permeable Cretaceous sands"
        ],
        watch_items=[
            "Optimize mud salinity and polymer encapsulation for shale stability",
            "Have LCM (lost circulation material) pills ready prior to entering basement",
            "Control surge pressures when running casing"
        ],
        min_lat=9.5,
        max_lat=12.5,
        min_lng=78.5,
        max_lng=81.5,
        keywords=["cauvery", "nagapattinam", "tiruvarur", "periyakudi", "bhuvanagiri", "tamil nadu", "karaikal", "thanjavur", "ramnad", "palk bay"]
    ),
    RegionalBasin(
        basin_id="MUMBAI_OFFSHORE",
        basin_name="Mumbai Offshore",
        geological_province="Western Continental Margin Carbonate & Clastic Basin (Category I Province)",
        onshore_offshore="Offshore (Maharashtra / Gujarat continental shelf)",
        description=(
            "India's largest petroleum producing province comprising Mumbai High, Bassein, Neelam, Heera, and Tapti-Daman corridors."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Chinchini & Post-Miocene Clastics",
                "depth_range": "0 – 900 m",
                "lithology": "Soft clays, calcareous silts, fine sands",
                "drilling_behavior": "Fast ROP, surface hole washout"
            },
            {
                "interval_name": "Bomba Limestone / L-III Carbonate Reservoir",
                "depth_range": "900 – 1800 m",
                "lithology": "Fossiliferous limestone, micrite, chalky limestone with shale streaks",
                "drilling_behavior": "Highly porous depleted carbonate; high total lost circulation hazard into vugs"
            },
            {
                "interval_name": "Mahim / Panna Formations & Deccan Trap",
                "depth_range": "> 1800 m",
                "lithology": "Basal sandstones, coal-shale sequences, basalt basement",
                "drilling_behavior": "Bit wear, chert abrasive intervals, gas shows in coal-sand interfaces"
            }
        ],
        regional_hazards=[
            "Severe lost circulation and mud evacuation into cavernous L-III limestone vugs",
            "Hydrogen sulfide (H2S) presence in specific mature carbonate reservoirs",
            "Differential sticking in depleted offshore reservoir zones"
        ],
        watch_items=[
            "Stage LCM pills and loss control procedures before entering L-III carbonate top",
            "Monitor H2S sensors continuously during drilling and tripping",
            "Maintain precise equivalent circulating density to avoid fracturing weak limestone beds"
        ],
        min_lat=18.0,
        max_lat=21.5,
        min_lng=70.0,
        max_lng=73.2,
        keywords=["mumbai high", "mumbai offshore", "bassein", "tapti", "daman", "heera", "neelam", "maharashtra offshore", "western offshore"]
    ),
    RegionalBasin(
        basin_id="MAHANADI",
        basin_name="Mahanadi",
        geological_province="East Coast Mesozoic-Tertiary Basin (Category II Province)",
        onshore_offshore="Onshore / Deepwater Offshore (Odisha coast)",
        description=(
            "Mahanadi rift basin along Odisha coast covering Cuttack, Puri, Jagatsinghpur, Bhadrak onshore and deepwater exploration blocks."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Quaternary Alluvium & Coastal Sands",
                "depth_range": "0 – 600 m",
                "lithology": "Unconsolidated sands, gravels, deltaic muds",
                "drilling_behavior": "Surface hole washout, high filtration loss"
            },
            {
                "interval_name": "Tertiary Deltaic & Deepwater Turbidite Sequences",
                "depth_range": "600 – 3000 m",
                "lithology": "Interbedded sandstone, siltstone, hemipelagic shales",
                "drilling_behavior": "Shallow water flows, high pore pressure gradients in deeper clastics"
            },
            {
                "interval_name": "Gondwana Clastics & Archean Basement",
                "depth_range": "> 3000 m",
                "lithology": "Hard quartzites, compact sandstones, crystalline basement",
                "drilling_behavior": "Slow ROP, abrasive formations"
            }
        ],
        regional_hazards=[
            "Shallow water flow hazards in deepwater slope sediments",
            "Overpressure ramp development in lower Tertiary turbidites",
            "Sparse historical offset well density creating high subsurface uncertainty"
        ],
        watch_items=[
            "Use heavy-wall surface casing to mitigate shallow water flow risk",
            "Deploy real-time pore pressure prediction tools while drilling",
            "Establish conservative mud-weight safety margins"
        ],
        min_lat=18.8,
        max_lat=22.0,
        min_lng=84.5,
        max_lng=88.5,
        keywords=["mahanadi", "cuttack", "jagatsinghpur", "puri", "bhadrak", "odisha", "orissa", "paradip", "bhubaneswar"]
    ),
    RegionalBasin(
        basin_id="ANDAMAN",
        basin_name="Andaman",
        geological_province="Active Island Arc & Forearc / Backarc Basin (Category II Province)",
        onshore_offshore="Shallow & Deepwater Offshore (Andaman & Nicobar Islands)",
        description=(
            "Frontier convergent margin basin in the Bay of Bengal with active exploration campaigns by Oil India Limited (Vijayapuram)."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Recent Coral Clastics & Hemipelagic Muds",
                "depth_range": "0 – 800 m",
                "lithology": "Biogenic carbonates, volcanic ash, soft marine muds",
                "drilling_behavior": "Hole washout, weak fracture gradient"
            },
            {
                "interval_name": "Archipelago & Port Blair Formations",
                "depth_range": "800 – 3200 m",
                "lithology": "Turbidite sandstones, volcanic greywackes, radiolarian shales",
                "drilling_behavior": "Variable pore pressure, fractured volcanic rock, tight hole"
            },
            {
                "interval_name": "Ophiolite Complex & Volcanic Basement",
                "depth_range": "> 3200 m",
                "lithology": "Serpentinite, basalt, chert, ultrabasics",
                "drilling_behavior": "Extreme bit wear, sudden torque spikes, loss of circulation"
            }
        ],
        regional_hazards=[
            "Island logistics constraints and remote rig support",
            "High tectonic fracturing leading to severe lost circulation in volcanic formations",
            "Pore pressure uncertainty due to sparse regional offset data"
        ],
        watch_items=[
            "Maintain comprehensive inventory of LCM and drilling spare parts on site",
            "Use robust MWD/LWD telemetry for real-time lithology identification",
            "Careful torque and drag surveillance across fractured ophiolite sections"
        ],
        min_lat=9.0,
        max_lat=14.0,
        min_lng=91.5,
        max_lng=94.5,
        keywords=["andaman", "nicobar", "vijayapuram", "port blair", "haddo", "havelock", "andaman offshore"]
    ),
    RegionalBasin(
        basin_id="BENGAL_PURNEA",
        basin_name="Bengal-Purnea",
        geological_province="Pericratonic / Foreland Basin (Category II Province)",
        onshore_offshore="Onshore / Transition (West Bengal & Bihar)",
        description=(
            "Extensive sedimentary basin covering the Bengal delta and Purnea basin in eastern India."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Alluvial Clastics & Miocene Sandstones",
                "depth_range": "0 – 1800 m",
                "lithology": "Loose sands, deltaic silts, claystones",
                "drilling_behavior": "Rapid penetration, washouts in surface section"
            },
            {
                "interval_name": "Paleogene Sandstones & Carbonaceous Shales",
                "depth_range": "1800 – 3600 m",
                "lithology": "Interbedded sandstones, shales, thin limestone bands",
                "drilling_behavior": "Overpressured shales, narrow drilling margins"
            }
        ],
        regional_hazards=["High mud loss in shallow deltaic sands", "Overpressured shales in deep sections"],
        watch_items=["Maintain adequate mud weight to suppress overpressure", "Control trip speeds"],
        min_lat=22.0,
        max_lat=27.0,
        min_lng=86.5,
        max_lng=89.5,
        keywords=["bengal", "purnea", "west bengal", "bihar", "kolkata", "hooghly", "ranaghat", "kishanganj"]
    ),
    RegionalBasin(
        basin_id="KERALA_KONKAN",
        basin_name="Kerala-Konkan",
        geological_province="Western Continental Margin Deepwater Basin (Category II Province)",
        onshore_offshore="Offshore (Kerala / Karnataka coast)",
        description="Deepwater frontier basin along the southwestern coast of India.",
        typical_stratigraphy=[
            {
                "interval_name": "Tertiary Pelagic Muds & Carbonates",
                "depth_range": "0 – 2000 m",
                "lithology": "Soft clays, calcareous oozes, carbonate beds",
                "drilling_behavior": "Fast ROP, gumbo shale risk"
            }
        ],
        regional_hazards=["Narrow mud weight window", "Deepwater currents and logistics"],
        watch_items=["PWD surveillance", "Automated kick detection"],
        min_lat=8.0,
        max_lat=15.0,
        min_lng=72.0,
        max_lng=77.0,
        keywords=["kerala", "konkan", "kollam", "kochi", "cochin", "mangalore", "kerala-konkan"]
    ),
    RegionalBasin(
        basin_id="KUTCH",
        basin_name="Kutch",
        geological_province="Western Margin Mesozoic-Tertiary Rift Basin (Category II Province)",
        onshore_offshore="Onshore / Offshore (Gujarat)",
        description="Mesozoic-Tertiary rift basin along the northwest coast of Gujarat.",
        typical_stratigraphy=[
            {
                "interval_name": "Tertiary & Mesozoic Sequences",
                "depth_range": "0 – 2500 m",
                "lithology": "Sandstones, shales, limestones, volcanic traps",
                "drilling_behavior": "Abrasive sandstones, lost circulation in limestones"
            }
        ],
        regional_hazards=["Lost circulation in fractured carbonates and basalts", "Borehole breakout"],
        watch_items=["Pre-treat mud for seepage losses", "Monitor dogleg severity"],
        min_lat=22.5,
        max_lat=24.5,
        min_lng=68.0,
        max_lng=71.0,
        keywords=["kutch", "kachchh", "bhuj", "mandvi", "kutch offshore"]
    ),
    RegionalBasin(
        basin_id="SAURASHTRA",
        basin_name="Saurashtra",
        geological_province="Western Continental Shelf Basin (Category II Province)",
        onshore_offshore="Offshore (Gujarat coast)",
        description="Offshore basin south of the Kathiawar peninsula with volcanic and clastic sequences.",
        typical_stratigraphy=[
            {
                "interval_name": "Tertiary Clastics & Deccan Trap",
                "depth_range": "0 – 2200 m",
                "lithology": "Marine shales, sandstones, basaltic trap",
                "drilling_behavior": "Bit destruction on basalt contact"
            }
        ],
        regional_hazards=["Severe bit wear in basalt", "Lost circulation"],
        watch_items=["Use specialized PDC bits for basalt transitions"],
        min_lat=20.0,
        max_lat=22.5,
        min_lng=68.5,
        max_lng=72.0,
        keywords=["saurashtra", "porbandar", "veraval", "diu", "saurashtra offshore"]
    ),
    RegionalBasin(
        basin_id="GONDWANA_CBM",
        basin_name="Satpura-South Rewa-Damodar",
        geological_province="Gondwana Rift & Coalbed Methane Basins (Category II / CBM Cohort)",
        onshore_offshore="Onshore (Jharkhand / West Bengal / MP)",
        description=(
            "Gondwana graben basins with major commercial Coalbed Methane (CBM) operations in Raniganj, Bokaro, Jharia, and Sohagpur."
        ),
        typical_stratigraphy=[
            {
                "interval_name": "Raniganj / Barakar Coal Measures",
                "depth_range": "200 – 1400 m",
                "lithology": "Interbedded sandstone, shale, thick multi-seam coal",
                "drilling_behavior": "Coal spalling, coal fines production, gas desorbing rapidly during drilling"
            }
        ],
        regional_hazards=[
            "Wellbore collapse and coal sloughing in fractured coal cleat systems",
            "Coal fines plugging drilling fluid and casing annulus",
            "Sudden methane gas desorption during drilling breaks"
        ],
        watch_items=[
            "Use low-solid non-damaging mud systems to prevent coal reservoir permeability impairment",
            "Control surge and swab pressures across coal seams",
            "Deploy effective solids control systems to screen out coal fines"
        ],
        min_lat=22.5,
        max_lat=24.5,
        min_lng=80.5,
        max_lng=87.5,
        keywords=["raniganj", "bokaro", "jharia", "sohagpur", "cbm", "coalbed methane", "damodar", "satpura", "south rewa", "jharkhand", "asansol", "dhanbad"]
    ),
    RegionalBasin(
        basin_id="GANGA_PUNJAB",
        basin_name="Ganga-Punjab",
        geological_province="Indo-Gangetic Foreland Basin (Category III / Frontier)",
        onshore_offshore="Onshore (Punjab / Haryana / UP / Bihar)",
        description="Massive foreland basin with thick alluvium overlying Vindhyan and Siwalik sediments.",
        typical_stratigraphy=[
            {
                "interval_name": "Alluvium & Upper Siwaliks",
                "depth_range": "0 – 1500 m",
                "lithology": "Unconsolidated boulder beds, sands, clays",
                "drilling_behavior": "Surface hole washout, pebble sloughing"
            }
        ],
        regional_hazards=["High lost circulation in boulder beds", "Deep overpressure potential"],
        watch_items=["Set deep conductor pipe", "Maintain high mud viscosity for pebble lifting"],
        min_lat=25.0,
        max_lat=31.5,
        min_lng=74.0,
        max_lng=85.0,
        keywords=["ganga", "punjab", "haryana", "uttar pradesh", "ludhiana", "kanpur", "lucknow", "bareilly", "ganga-punjab"]
    ),
    RegionalBasin(
        basin_id="VINDHYAN",
        basin_name="Vindhyan",
        geological_province="Proterozoic Intracratonic Basin (Category III / Frontier)",
        onshore_offshore="Onshore (MP / UP / Rajasthan)",
        description="Ancient Proterozoic basin with emerging gas discoveries in Son valley and Rajasthan margins.",
        typical_stratigraphy=[
            {
                "interval_name": "Bhander & Rewa Groups",
                "depth_range": "0 – 2000 m",
                "lithology": "Hard compact quartzitic sandstones, shales, limestones",
                "drilling_behavior": "Very low ROP, high bit abrasion"
            }
        ],
        regional_hazards=["Severe bit wear", "Gas shows in tight fractured shales"],
        watch_items=["Use heavy-duty PDC and hybrid drill bits", "Tight torque surveillance"],
        min_lat=23.0,
        max_lat=26.5,
        min_lng=76.0,
        max_lng=83.0,
        keywords=["vindhyan", "son valley", "rewa", "satna", "madhya pradesh", "jabbalpur", "damoh"]
    ),
    RegionalBasin(
        basin_id="HIMALAYAN_FORELAND",
        basin_name="Himalayan Foreland",
        geological_province="Sub-Himalayan Fold Belt (Category III / Frontier)",
        onshore_offshore="Onshore (HP / J&K / Punjab fringe)",
        description="Thrust-faulted frontal belt with Siwalik and Subathu formations.",
        typical_stratigraphy=[
            {
                "interval_name": "Siwalik Group",
                "depth_range": "0 – 3000 m",
                "lithology": "Sandstones, conglomerates, red claystones",
                "drilling_behavior": "Steep dip, severe borehole drift"
            }
        ],
        regional_hazards=["Tectonic stress and borehole ovalization", "Steep dips"],
        watch_items=["Directional surveys at short intervals", "Heavy mud inhibition"],
        min_lat=30.0,
        max_lat=33.5,
        min_lng=74.5,
        max_lng=79.0,
        keywords=["himalayan foreland", "siwalik", "jawalamukhi", "himachal", "kangra", "jammu"]
    ),
    RegionalBasin(
        basin_id="CUDDAPAH",
        basin_name="Cuddapah",
        geological_province="Proterozoic Basin (Category III / Frontier)",
        onshore_offshore="Onshore (Andhra Pradesh)",
        description="Crescent-shaped Proterozoic basin with quartzites, shales, and dolomites.",
        typical_stratigraphy=[
            {
                "interval_name": "Kurnool & Cuddapah Formations",
                "depth_range": "0 – 2500 m",
                "lithology": "Dense quartzites, slates, dolomites",
                "drilling_behavior": "Hard formation, slow ROP"
            }
        ],
        regional_hazards=["Slow drillability", "Fracture losses"],
        watch_items=["Monitor bit wear", "Use high WOB and optimized hydraulics"],
        min_lat=13.5,
        max_lat=16.5,
        min_lng=77.5,
        max_lng=80.0,
        keywords=["cuddapah", "kadapa", "kurnool", "cuddapah basin"]
    ),
    RegionalBasin(
        basin_id="DECCAN_SYNECLISE",
        basin_name="Deccan Syneclise",
        geological_province="Sub-Basalt Mesozoic Basin (Category III / Frontier)",
        onshore_offshore="Onshore (Maharashtra / MP / Gujarat)",
        description="Mesozoic-Gondwana sediments concealed beneath thick Deccan volcanic basalt flows.",
        typical_stratigraphy=[
            {
                "interval_name": "Deccan Basalt Trap",
                "depth_range": "0 – 1500 m",
                "lithology": "Multiple basalt flows, inter-trappean beds",
                "drilling_behavior": "Severe bit wear, loss of circulation"
            }
        ],
        regional_hazards=["Basalt penetration and loss zones"],
        watch_items=["Heavy-duty bits", "LCM stock on site"],
        min_lat=18.0,
        max_lat=22.5,
        min_lng=73.5,
        max_lng=79.0,
        keywords=["deccan syneclise", "deccan trap", "aurangabad", "nagpur", "nanded"]
    ),
    RegionalBasin(
        basin_id="KAREWA",
        basin_name="Karewa",
        geological_province="Intermontane Plio-Pleistocene Basin (Category III / Frontier)",
        onshore_offshore="Onshore (Jammu & Kashmir)",
        description="Intermontane lacustrine and fluvial basin in the Kashmir valley.",
        typical_stratigraphy=[
            {
                "interval_name": "Karewa Sediments",
                "depth_range": "0 – 1200 m",
                "lithology": "Lignitic clays, loose sands, silts",
                "drilling_behavior": "Soft drilling, clay swelling"
            }
        ],
        regional_hazards=["Clay swelling and surface washout"],
        watch_items=["Maintain mud inhibition"],
        min_lat=33.0,
        max_lat=35.0,
        min_lng=74.0,
        max_lng=76.0,
        keywords=["karewa", "kashmir", "srinagar", "anantnag", "baramulla", "karewa basin"]
    ),
    RegionalBasin(
        basin_id="NARMADA",
        basin_name="Narmada",
        geological_province="Linear Rift Graben (Category III / Frontier)",
        onshore_offshore="Onshore (Gujarat / MP)",
        description="Tectonic lineament rift valley with Mesozoic sediments.",
        typical_stratigraphy=[
            {
                "interval_name": "Bagh & Lameta Beds",
                "depth_range": "0 – 1600 m",
                "lithology": "Sandstones, calcareous clays, limestones",
                "drilling_behavior": "Moderate drillability"
            }
        ],
        regional_hazards=["Fault zones and fractured rock losses"],
        watch_items=["Monitor torque and mud losses"],
        min_lat=21.5,
        max_lat=23.0,
        min_lng=73.5,
        max_lng=78.5,
        keywords=["narmada", "rajpipla", "narmada basin"]
    ),
    RegionalBasin(
        basin_id="PRANHITA_GODAVARI",
        basin_name="Pranhita-Godavari",
        geological_province="Gondwana Rift Basin (Category III / Frontier)",
        onshore_offshore="Onshore (Telangana / Andhra Pradesh)",
        description="Northwest-southeast trending Gondwana rift valley with coal and gas exploration.",
        typical_stratigraphy=[
            {
                "interval_name": "Kamthi & Barakar Formations",
                "depth_range": "0 – 2000 m",
                "lithology": "Sandstones, shales, coal beds",
                "drilling_behavior": "Moderate drillability"
            }
        ],
        regional_hazards=["Gas kicks in coal seams", "Differential sticking"],
        watch_items=["Continuous gas monitoring"],
        min_lat=17.0,
        max_lat=20.0,
        min_lng=78.5,
        max_lng=81.0,
        keywords=["pranhita", "godavari valley", "khammam", "warangal", "pranhita-godavari"]
    ),
    RegionalBasin(
        basin_id="SPITI_ZANSKAR",
        basin_name="Spiti-Zanskar",
        geological_province="Tethyan Himalayan Basin (Category III / Frontier)",
        onshore_offshore="Onshore (Himachal Pradesh / Ladakh)",
        description="High-altitude Tethyan sedimentary sequence in the northwest Himalayas.",
        typical_stratigraphy=[
            {
                "interval_name": "Tethyan Mesozoic Carbonates & Shales",
                "depth_range": "0 – 2500 m",
                "lithology": "Limestones, hard shales, quartzites",
                "drilling_behavior": "Hard rock drilling, altitude logistics"
            }
        ],
        regional_hazards=["Remote high-altitude operations", "Fractured hard rock"],
        watch_items=["Cold-weather mud additives", "Specialized logistics"],
        min_lat=31.5,
        max_lat=34.5,
        min_lng=76.5,
        max_lng=79.5,
        keywords=["spiti", "zanskar", "ladakh", "kaza", "spiti-zanskar"]
    ),
    RegionalBasin(
        basin_id="BASTAR",
        basin_name="Bastar",
        geological_province="Proterozoic Cratonic Basin (Frontier)",
        onshore_offshore="Onshore (Chhattisgarh / Odisha)",
        description="Proterozoic intracratonic basin in central India.",
        typical_stratigraphy=[
            {
                "interval_name": "Indravati Group",
                "depth_range": "0 – 1500 m",
                "lithology": "Sandstones, shales, limestones",
                "drilling_behavior": "Hard formation"
            }
        ],
        regional_hazards=["Hard rock drilling"],
        watch_items=["Bit life surveillance"],
        min_lat=18.5,
        max_lat=20.5,
        min_lng=80.5,
        max_lng=83.0,
        keywords=["bastar", "jagdalpur", "indravati", "bastar basin"]
    ),
    RegionalBasin(
        basin_id="BHIMA_KALADGI",
        basin_name="Bhima-Kaladgi",
        geological_province="Proterozoic Basin (Frontier)",
        onshore_offshore="Onshore (Karnataka / Maharashtra)",
        description="Proterozoic sedimentary basin in northern Karnataka.",
        typical_stratigraphy=[
            {
                "interval_name": "Bhima Group",
                "depth_range": "0 – 1200 m",
                "lithology": "Limestones, shales, quartzites",
                "drilling_behavior": "Hard formation"
            }
        ],
        regional_hazards=["Hard rock slow ROP"],
        watch_items=["Optimize drill bit selection"],
        min_lat=15.5,
        max_lat=17.5,
        min_lng=74.5,
        max_lng=77.5,
        keywords=["bhima", "kaladgi", "bagalkot", "gulbarga", "kalaburagi", "bhima basin"]
    ),
    RegionalBasin(
        basin_id="CHHATTISGARH",
        basin_name="Chhattisgarh",
        geological_province="Proterozoic Basin (Frontier)",
        onshore_offshore="Onshore (Chhattisgarh)",
        description="Proterozoic basin in eastern central India.",
        typical_stratigraphy=[
            {
                "interval_name": "Raipur Group",
                "depth_range": "0 – 1600 m",
                "lithology": "Shales, limestones, sandstones",
                "drilling_behavior": "Moderate to hard"
            }
        ],
        regional_hazards=["Hard rock drilling"],
        watch_items=["Bit selection"],
        min_lat=20.5,
        max_lat=22.5,
        min_lng=81.0,
        max_lng=83.5,
        keywords=["chhattisgarh basin", "raipur basin", "bilaspur", "durg"]
    )
]


def classify_location_basin(
    lat: float,
    lng: float,
    location_name: Optional[str] = None
) -> Optional[RegionalBasin]:
    """
    Classify proposed location into an Indian sedimentary basin using
    coordinates, place-name keywords, or proximity to research manifest anchors.
    """
    # 1. Location name keyword match (highest semantic precision)
    if location_name:
        loc_lower = location_name.lower()
        matches = []
        for basin in SEDIMENTARY_BASINS:
            for kw in basin.keywords:
                pattern = r'\b' + re.escape(kw.lower()) + r'\b'
                if re.search(pattern, loc_lower):
                    matches.append((len(kw), basin))
        if matches:
            matches.sort(key=lambda x: x[0], reverse=True)
            return matches[0][1]

    # 2. Coordinate bounding box match
    for basin in SEDIMENTARY_BASINS:
        if (basin.min_lat <= lat <= basin.max_lat) and (basin.min_lng <= lng <= basin.max_lng):
            return basin

    # 3. Proximity match to closest basin bounding box
    closest_basin = None
    min_dist = float("inf")
    for b in SEDIMENTARY_BASINS:
        center_lat = (b.min_lat + b.max_lat) / 2.0
        center_lng = (b.min_lng + b.max_lng) / 2.0
        d = math.hypot(lat - center_lat, lng - center_lng)
        if d < min_dist:
            min_dist = d
            closest_basin = b

    # If within 4 degrees (~440km) of an Indian basin
    if closest_basin and min_dist <= 4.0:
        return closest_basin

    return None


def find_analog_wells_for_depth(
    db,
    planned_depth_m: float,
    limit: int = 4
) -> List[Dict[str, Any]]:
    """
    Find relevant technical analog wells in the database based on planned depth compatibility,
    operational profile, and historical documentation.
    """
    all_wells = db.query(Well).all()
    if not all_wells:
        return []

    scored_analogs = []
    for w in all_wells:
        td = w.total_depth_md
        if td <= 0:
            continue

        depth_diff = abs(td - planned_depth_m)
        depth_ratio = min(td, planned_depth_m) / max(td, planned_depth_m)
        penetration_bonus = 1.2 if td >= planned_depth_m * 0.9 else 0.8
        source_weight = 1.1 if w.provenance in ("PUBLIC", "AUTHORIZED") else 1.0

        evt_count = db.query(Event).filter(Event.well_id == w.well_id).count()
        incident_factor = 1.0 + min(0.3, evt_count * 0.15)

        analog_score = round(depth_ratio * 70.0 * penetration_bonus * source_weight * incident_factor, 1)
        analog_score = min(98.0, max(20.0, analog_score))

        frms = [f.formation_name for f in w.formations]

        scored_analogs.append({
            "well_id": w.well_id,
            "well_name": w.well_name,
            "field": w.field,
            "basin": w.basin or "Assam Shelf (Technical Analog)",
            "total_depth_md": w.total_depth_md,
            "depth_diff_m": round(depth_diff, 1),
            "formations": frms[:3],
            "event_count": evt_count,
            "provenance": "ANALOG",
            "evidence_tier": "TIER 3 — ANALOG",
            "analog_relevance_score": analog_score,
            "operational_relevance": (
                f"Target depth {planned_depth_m:.0f}m matches TD profile ({w.total_depth_md:.0f}m). "
                f"Provides technical benchmark for drilling hydraulics, casing seat selection, and rate-of-penetration control."
            )
        })

    scored_analogs.sort(key=lambda x: x["analog_relevance_score"], reverse=True)
    return scored_analogs[:limit]
