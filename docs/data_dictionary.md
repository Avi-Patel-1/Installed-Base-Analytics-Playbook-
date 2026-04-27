# Data Dictionary

CSV uploads must include these columns.

| Column | Type | Description |
| --- | --- | --- |
| accountId | text | Unique account identifier. |
| accountName | text | Manufacturing account name. |
| industrySegment | text | Industry segment such as Food and beverage, Metals, Life sciences, or Automotive. |
| region | text | Sales or operating region. |
| plantType | text | Plant operating model or production style. |
| productionLines | number | Count of production lines or major operating areas. |
| installedPlcFamily | text | Primary PLC family or mixed control platform. |
| installedHmiScadaSystem | text | Primary HMI, SCADA, DCS, or operator interface system. |
| driveMotorCount | number | Estimated count of drives and motors. |
| sensorCount | number | Estimated count of sensors and instruments. |
| safetySystemAge | number | Approximate safety system age in years. |
| assetLifecycleStage | category | Current, Mature, Limited support, or Obsolete. |
| supportRisk | category | Low, Moderate, High, or Critical. |
| downtimePainPoints | list | Semicolon-separated pain points. |
| modernizationInterest | category | Low, Moderate, Active, or Budgeted. |
| estimatedAnnualDowntimeCost | number | Estimated yearly downtime exposure in dollars. |
| serviceHistory | text | Relevant service relationship or support history. |
| decisionMakerPersona | text | Most likely decision-maker persona. |
| strategicFit | category | Low, Medium, High, or Strategic. |
| estimatedOpportunitySize | number | Estimated opportunity value in dollars. |
| likelyBuyingTrigger | text | Event or condition that could create action. |
| recommendedNextAction | text | Initial next action from account planning. |
| lastEngagementDate | date | Date in YYYY-MM-DD format. |
| installedBaseConfidence | category | Low, Medium, or High. |
| competitorPresence | text | Current supplier or competitor context. |
| dataAvailability | category | Sparse, Partial, Usable, or Rich. |
| urgencyNotes | text | Short note explaining timing or urgency. |

Use `Download sample CSV` in the app to get a valid template.
