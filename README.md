# Project Bhumi - Heat-Water Stress Decision Support System

> **A decision support platform for District Disaster Management Authorities to prioritize emergency heat-and-water resource allocation before extreme events occur.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-3.6+-222?style=flat&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Problem Statement

During extreme summer heatwaves, district administrators face a severe operational bottleneck:

> *"A severe heatwave is expected in 48–72 hours across the district. We have 20 emergency water tankers and 10 cooling/ORS centers. Where do we deploy them first, how many go to each block, and why?"*

Most existing dashboards either show raw weather forecasts or isolated water monitoring maps. None reconcile **heat hazard, chronic water deficit, population exposure, and socio-economic vulnerability** into an actionable, explainable emergency resource allocation model.

**Project Bhumi (HWSI) is not a passive weather viewer — it is an emergency resource allocation decision engine.**

---

## 🎯 Pilot Implementation

Project Bhumi implements a disciplined **pilot-first architecture** covering **56 Community Development (CD) Blocks** across three contrasting agro-climatic zones in West Bengal, India:

1. **Purulia District (20 Blocks):** Drought-prone western hard-rock plateau, high water deficit, fluoride risk, low piped water coverage.
2. **Bankura District (22 Blocks):** Semi-arid transition belt with high agricultural outdoor worker vulnerability.
3. **Howrah District (14 Blocks):** High-density Kolkata-adjacent peri-urban plain with alluvial arsenic contamination.

---

## 🏛️ Conceptual Model: $H \times E \times V$

The engine unifies climate indicators into a single geometric multi-criteria framework:

$$\text{HWSI} = H^{w_h} \times E^{w_e} \times V^{w_v}$$

$$\text{where } x' = 0.05 + 0.95 \times \text{clip}\left(\frac{x - \text{lo}}{\text{hi} - \text{lo}}, 0, 1\right)$$

* **Floor of 0.05:** Prevents zero-value indicators from collapsing the geometric aggregation.
* **Geometric Aggregation:** Guarantees that extreme risk in one component cannot be masked by low values in another.

### Indicators & Lineage Badges

| Component | Meaning | Indicators | Official Source | Type |
|---|---|---|---|---|
| **$H$: Hazard** | Forecast environmental stress (48–72h) | Heat Index (NWS Rothfusz), Consecutive Warm Nights, 30-Day Rainfall Deficit, Cumulative $\text{ET}_0$, Soil Moisture Drying Rate | Open-Meteo API (Centroids) | `LIVE` |
| **$E$: Exposure** | Population in the hazard path | Total Population, Population Density, Outdoor Agricultural Workers share | Census of India 2011 (PCA) | `STATIC` |
| **$V$: Vulnerability** | Systemic inability to absorb shock | Household Tap Coverage (FHTC), Groundwater Extraction Stage, Hospital Beds / 1k, Elderly (65+) & Children (0–6) share, Arsenic/Fluoride flags | JJM, CGWB, NHM, WBPHED | `PERIODIC` / `MOCK` |

---

## ⚙️ Resource Allocation Engine

To eliminate double-counting (exposure already lives in HWSI), Project Bhumi computes resource-specific needs and allocates using **marginal benefit optimization**:

$$\text{Need}_i^r = (H_i^r)^a \times (V_i^r)^b \quad (\text{with } a + b = 1)$$

$$\text{Benefit}_i(u) = \text{Pop}_i \times \text{Need}_i^r \times \left[1 - \exp(-k_r \cdot u)\right]$$

* **Diminishing Returns:** The concave formulation accounts for saturation—sending the 10th tanker to one block yields less benefit than sending the 1st tanker to a critically stressed adjacent block.
* **Greedy Marginal Allocation:** Guarantees optimal integer resource distribution.
* **Benchmark Comparisons:** Every run is automatically compared against two intuitive baselines:
  1. **Highest-HWSI First:** Greedily filling top-ranked blocks with fixed quotas.
  2. **Proportional Allocation:** Distributing units proportional to $\text{Pop} \times \text{Need}$.

---

## 🔬 Mathematical Credibility & Validation

* **AHP (Analytic Hierarchy Process):** Expert comparison matrices are mathematically validated with a target **Consistency Ratio (CR) < 0.10** ($\text{Current CR} = 0.0079$).
* **Monte Carlo Sensitivity Analysis:** 1,000 draws perturbing component weights by $\pm 20\%$ to verify **Top-5 Ranking Stability** (reporting the percentage of runs each top block remains in the top 5).
* **Compounding Scenario Engine:** Early warning decision projection (+0, +1, +2 days) modeling continuous heatwave thermal accumulation, nocturnal recovery deficits, and soil desiccation.
* **Technical Dossier:** Complete mathematical and empirical proof dossier available in [`docs/HWSI_Mathematical_Reliability_and_Verification_Dossier.pdf`](docs/HWSI_Mathematical_Reliability_and_Verification_Dossier.pdf).

---

## 💻 Tech Stack & Architecture

```
Project Bhumi Architecture
├── Backend (FastAPI + In-Memory DataFrames)
│   ├── Data Engine        # Ingests Census, JJM, CGWB, & GeoJSON
│   ├── ETL Transforms     # Rothfusz Heat Index, Warm-Night runs, ET sums
│   ├── HWSI Core Engine   # Floor normalization, AHP weighting, HEV geometric score
│   ├── Optimizer          # Marginal benefit greedy allocator & baselines (<45ms)
│   ├── AWS Cloud Layer    # Amazon Bedrock (Claude 3.5 Sonnet) + Amazon S3 Data Lake
│   └── API Layer          # 8 REST endpoints (/risk-index, /bulletin, /allocate, etc.)
│
├── AWS Cloud Infrastructure (ap-southeast-2)
│   ├── Amazon Bedrock     # Zero-shot bilingual emergency directives (English & Bengali)
│   ├── Amazon S3          # Data lake for run snapshots & West Bengal GeoJSON boundaries
│   └── AWS App Runner     # Containerized serverless deployment target
│
└── Frontend (Next.js 15 App Router + TypeScript)
    ├── MapLibre GL        # Continuous choropleth, hover & click hit-testing
    ├── Layer Switcher     # Lens views (HWSI, Heat Hazard, Water Stress, E, V)
    ├── Explanation Panel  # Accordion view of raw indicators & Bedrock Emergency Dispatch
    ├── Allocation Panel   # Tanker & Cooling unit steppers + Recharts comparison
    └── Credibility Tab    # Live AHP CR, Monte Carlo stability table, data lineage
```

---

## 🚀 Quickstart Guide

### Prerequisites
* Python 3.10+
* Node.js 18+ and `npm`

### 1. Clone the Repository
```bash
git clone https://github.com/my-project-repo/HWSI-Heat-Water-Stress-Decision-Support-System.git
cd HWSI-Heat-Water-Stress-Decision-Support-System
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> The API will be live at `http://localhost:8000`. Interactive docs are available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
> The dashboard will be accessible at `http://localhost:3000`.

---

## 📡 API Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/blocks/risk-index` | `GET` | Fetches HWSI scores, H/E/V values, lens sub-scores, and ranks for all 56 blocks (accepts `extra_days`). |
| `/api/v1/blocks/{id}/explain` | `GET` | Returns full explainability payload: indicator weights, raw values, and plain-language summaries (accepts `extra_days`). |
| `/api/v1/blocks/{id}/bulletin` | `GET` | Generates bilingual emergency dispatch directives (English & Bengali) via Amazon Bedrock (accepts `extra_days`). |
| `/api/v1/allocate` | `POST` | Accepts `{ tankers, cooling_units, extra_days }` and returns Optimizer results vs 2 baselines with rationales (auto-archives to S3). |
| `/api/v1/aws-status` | `GET` | Returns connectivity status for Amazon Bedrock, active foundation model, and Amazon S3 Data Lake. |
| `/api/v1/data-status` | `GET` | Returns source metadata, freshness timestamps, and lineage badges. |
| `/api/v1/validation` | `GET` | Returns AHP Consistency Ratio and Monte Carlo top-5 ranking stability metrics. |
| `/health` | `GET` | System health check and in-memory data integrity status. |

---

## 🗺️ Roadmap

- [x] **P0 (Current MVP):** 56-block pilot, in-memory Pandas engine, AHP weighting, greedy allocator with dual baselines, MapLibre choropleth, and click-to-explain panels.
- [x] **P1:** Live Open-Meteo centroid polling with fallback cache, scenario forecasting slider (+2 days), real ground truth datasets (Census 2011, CGWB, JJM, WBPHED).
- [x] **P2 (AWS Cloud Layer):** Bilingual alert generation (English & Bengali) powered by **Amazon Bedrock (Claude 3.5 Sonnet)**, automated **Amazon S3 Data Lake** snapshot archiving, and App Runner containerization.
- [ ] **Phase 3:** Integration of satellite MODIS Land Surface Temperature (LST) and real-time tanker GPS tracking.

---

## 📄 License & Attribution

Developed under the **Project Bhumi** initiative for environmental resilience and disaster decision support.
Data definitions and conceptual framework adapted from NDMA guidelines, Census of India, CGWB, and Open-Meteo.
