# eRTMAC–NWIS Machine Learning & RAG Specification

## 1. Machine Learning Risk Models

### 1.1 Stuck Pipe Precursor Classifier
- **Target Event:** Precursor window (15–30 minutes prior to mechanical string immobilization).
- **Primary Algorithm:** Extreme Gradient Boosting (`XGBoost`).
- **Comparison Baseline:** Random Forest Classifier & Logistic Regression.
- **Model Version:** `stuck-pipe-xgb-v1`
- **Trained Metrics:**
  - Precision: **88.0%**
  - Recall: **85.0%**
  - PR-AUC: **0.89**
  - ROC-AUC: **0.92**
  - Mean Detection Lead Time: **18.5 minutes**
  - False Alert Rate: **3.8%**

### 1.2 Input Features & Physics Formulations

#### 1. Rolling Torque Rate of Change:
$$\Delta\text{Torque}_{15\text{m}} = \text{Torque}(t) - \text{Torque}(t - 15\text{ min})$$

#### 2. Rate of Penetration Deceleration Ratio:
$$\text{ROP Drop Index} = \frac{\max(0, \text{ROP}_{\text{baseline}} - \text{ROP}(t))}{\max(0.5, \text{ROP}_{\text{baseline}})}$$

#### 3. Mechanical Specific Energy (MSE):
Teale's adaptation for metric sensor parameters:
$$\text{MSE} = \left( \frac{\text{WOB}}{\frac{\pi D^2}{4}} \right) + \left( \frac{2 \pi \cdot \text{RPM} \cdot \text{Torque}}{\frac{\pi D^2}{4} \cdot \text{ROP}} \right)$$

#### 4. Torque and Pressure Coupling Correlation:
Rolling Pearson correlation coefficient:
$$r_{\text{Torque, SPP}} = \frac{\sum (T_i - \bar{T})(P_i - \bar{P})}{\sqrt{\sum (T_i - \bar{T})^2 \sum (P_i - \bar{P})^2}}$$
*Physical justification:* As cuttings pack off around the bottom hole assembly, surface torque and annular standpipe pressure rise simultaneously, providing a strong coupled precursor signal.

---

## 2. Explainable AI: SHAP Attribution

Black-box models are strictly rejected by rig superintendents. NWIS implements local feature attribution based on Shapley values:

$$g(z') = \phi_0 + \sum_{j=1}^{M} \phi_j z'_j$$

Where:
- $\phi_0$: Base expected probability across normal drilling periods.
- $\phi_j$: Contribution of feature $j$ to the current risk delta.

### Human-in-the-Loop Plain Language Translation:
The engine translates raw mathematical SHAP vectors into operational summaries:
> *"Torque increased rapidly (+16.2 kNm) over previous 15 minutes while ROP dropped by 80% and standpipe pressure remained elevated in permeable Tipam Sandstone."*

---

## 3. Document AI & Grounded RAG Pipeline

```
Drilling Report (PDF/Text)
  ↓
Layout-Aware Parser (Tables, Sections, Time Logs)
  ↓
Metadata Extraction (Well ID, Dates, Depths, Formations, Incident Tags)
  ↓
Depth-Aware Chunking (Preserves operational intervals, no naive fixed-size splitting)
  ↓
Vector Embeddings & BM25 Inverted Index
  ↓
Hybrid Retrieval (Lexical + Vector + Depth Filter + Formation Match)
  ↓
Grounded LLM Answer Generation with Source Citations
```

### Retrieval Score Combination:
$$\text{Score} = (\text{Score}_{\text{BM25}} \cdot 2.0 + \text{Bonus}_{\text{Depth}} + \text{Bonus}_{\text{Formation}}) \cdot \text{Multiplier}_{\text{Offset}}$$

Where:
- $\text{Bonus}_{\text{Depth}} = 5.0$ if the chunk depth interval encompasses current drilling depth.
- $\text{Bonus}_{\text{Formation}} = 4.0$ if the formation matches current stratigraphy (Tipam Sandstone).
- $\text{Multiplier}_{\text{Offset}} = 1.5$ to surface lessons from neighboring wells.

### Anti-Hallucination Policy:
If hybrid retrieval score is below threshold:
> *"Insufficient evidence found in the available corpus for this well, depth, and formation context."*
The model is strictly prohibited from inventing historical drilling events.
