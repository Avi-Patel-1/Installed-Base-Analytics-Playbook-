# Scoring Model

Each account receives seven explainable scores from 0 to 100. Higher scores indicate stronger need, fit, or readiness.

## Lifecycle Risk

Inputs:

- Asset lifecycle stage
- Support risk
- Safety system age
- Estimated annual downtime cost

Labels:

- 78-100: Critical
- 58-77: High
- 36-57: Moderate
- 0-35: Low

## Installed-Base Complexity

Inputs:

- Production line count
- Drive and motor count
- Sensor count
- Mixed platform indicators

Labels:

- 72-100: Complex
- 48-71: Scaled
- 28-47: Focused
- 0-27: Simple

## Modernization Fit

Inputs:

- Modernization interest
- Lifecycle risk
- Strategic fit
- Downtime exposure

Labels:

- 76-100: Strong
- 56-75: Good
- 36-55: Emerging
- 0-35: Limited

## Service Urgency

Inputs:

- Support risk
- Downtime exposure
- Service history signal
- Buying trigger strength

Labels:

- 76-100: Immediate
- 56-75: Near term
- 36-55: Monitor
- 0-35: Low

## Data Readiness

Inputs:

- Data availability
- Installed-base confidence
- Sensor count
- HMI/SCADA context

Labels:

- 76-100: Ready
- 56-75: Developing
- 36-55: Needs discovery
- 0-35: Early

## Sales Readiness

Inputs:

- Modernization interest
- Strategic fit
- Service relationship
- Buying trigger strength
- Competitive context

## Technical Consulting Priority

Weighted inputs:

- Lifecycle risk
- Installed-base complexity
- Modernization fit
- Service urgency
- Data readiness
- Sales readiness
- Opportunity value

Priority labels:

- 78-100: Tier 1
- 62-77: Tier 2
- 44-61: Tier 3
- 0-43: Monitor

Each score includes the triggered facts and improvement levers used to explain why the account landed where it did.
