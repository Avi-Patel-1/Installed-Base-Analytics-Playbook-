WITH mapped AS (
  SELECT
    account_id,
    account_name,
    industry_segment,
    region,
    plant_type,
    production_lines,
    drive_motor_count,
    sensor_count,
    safety_system_age,
    asset_lifecycle_stage,
    support_risk,
    modernization_interest,
    estimated_annual_downtime_cost,
    service_history,
    strategic_fit,
    estimated_opportunity_size,
    likely_buying_trigger,
    recommended_next_action,
    installed_base_confidence,
    competitor_presence,
    data_availability,
    CASE asset_lifecycle_stage
      WHEN 'Current' THEN 12
      WHEN 'Mature' THEN 42
      WHEN 'Limited support' THEN 72
      WHEN 'Obsolete' THEN 92
      ELSE 30
    END AS lifecycle_stage_score,
    CASE support_risk
      WHEN 'Low' THEN 15
      WHEN 'Moderate' THEN 42
      WHEN 'High' THEN 72
      WHEN 'Critical' THEN 92
      ELSE 30
    END AS support_risk_score,
    CASE modernization_interest
      WHEN 'Low' THEN 18
      WHEN 'Moderate' THEN 50
      WHEN 'Active' THEN 75
      WHEN 'Budgeted' THEN 90
      ELSE 30
    END AS interest_score,
    CASE strategic_fit
      WHEN 'Low' THEN 18
      WHEN 'Medium' THEN 48
      WHEN 'High' THEN 72
      WHEN 'Strategic' THEN 92
      ELSE 30
    END AS strategic_fit_score,
    CASE data_availability
      WHEN 'Sparse' THEN 18
      WHEN 'Partial' THEN 45
      WHEN 'Usable' THEN 70
      WHEN 'Rich' THEN 88
      ELSE 30
    END AS data_availability_score,
    CASE installed_base_confidence
      WHEN 'Low' THEN 30
      WHEN 'Medium' THEN 62
      WHEN 'High' THEN 88
      ELSE 45
    END AS confidence_score
  FROM accounts
),
normalized AS (
  SELECT
    *,
    min(100, max(0, ((estimated_annual_downtime_cost - 250000.0) / (2200000.0 - 250000.0)) * 100.0)) AS downtime_pressure,
    min(100, max(0, ((estimated_annual_downtime_cost - 250000.0) / (2000000.0 - 250000.0)) * 100.0)) AS modernization_downtime_pressure,
    min(100, max(0, ((estimated_opportunity_size - 180000.0) / (1500000.0 - 180000.0)) * 100.0)) AS opportunity_value_score,
    min(100, max(0, ((production_lines - 3.0) / (18.0 - 3.0)) * 100.0)) AS line_score,
    min(100, max(0, ((drive_motor_count - 40.0) / (310.0 - 40.0)) * 100.0)) AS drive_score,
    min(100, max(0, ((sensor_count - 120.0) / (1500.0 - 120.0)) * 100.0)) AS sensor_score,
    min(100, max(0, ((sensor_count - 120.0) / (1400.0 - 120.0)) * 100.0)) AS readiness_sensor_score,
    CASE
      WHEN safety_system_age >= 18 THEN 90
      WHEN safety_system_age >= 12 THEN 68
      WHEN safety_system_age >= 8 THEN 45
      ELSE 18
    END AS safety_pressure,
    CASE
      WHEN lower(service_history) LIKE '%emergency%' OR lower(service_history) LIKE '%active%' OR lower(service_history) LIKE '%retainer%' OR lower(service_history) LIKE '%quarterly%' OR lower(service_history) LIKE '%monthly%' OR lower(service_history) LIKE '%support%' OR lower(service_history) LIKE '%service%' OR lower(service_history) LIKE '%pilot%' OR lower(service_history) LIKE '%commissioning%' THEN 74
      WHEN lower(service_history) LIKE '%no active%' OR lower(service_history) LIKE '%no recent%' OR lower(service_history) LIKE '%infrequent%' THEN 28
      ELSE 48
    END AS service_signal,
    CASE
      WHEN lower(likely_buying_trigger) LIKE '%launch%' OR lower(likely_buying_trigger) LIKE '%audit%' OR lower(likely_buying_trigger) LIKE '%inspection%' OR lower(likely_buying_trigger) LIKE '%outage%' OR lower(likely_buying_trigger) LIKE '%funding%' OR lower(likely_buying_trigger) LIKE '%season%' OR lower(likely_buying_trigger) LIKE '%ramp%' OR lower(likely_buying_trigger) LIKE '%refresh%' OR lower(likely_buying_trigger) LIKE '%window%' OR lower(likely_buying_trigger) LIKE '%readiness%' THEN 82
      ELSE 50
    END AS trigger_signal,
    CASE
      WHEN lower(service_history) LIKE '%active%' OR lower(service_history) LIKE '%contract%' OR lower(service_history) LIKE '%retainer%' OR lower(service_history) LIKE '%quarterly%' OR lower(service_history) LIKE '%monthly%' OR lower(service_history) LIKE '%pilot%' OR lower(service_history) LIKE '%support%' OR lower(service_history) LIKE '%service%' THEN 75
      ELSE 38
    END AS service_relationship,
    CASE
      WHEN lower(competitor_presence) LIKE '%none known%' THEN 0
      ELSE 10
    END AS competitor_penalty,
    CASE
      WHEN lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%budget%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%funding%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%launch%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%audit%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%inspection%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%outage%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%refresh%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%ramp%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%program%' OR lower(modernization_interest || ' ' || likely_buying_trigger) LIKE '%readiness%' THEN 82
      ELSE 52
    END AS trigger_strength
  FROM mapped
),
component_scores AS (
  SELECT
    *,
    round((lifecycle_stage_score * 0.38) + (support_risk_score * 0.32) + (safety_pressure * 0.18) + (downtime_pressure * 0.12)) AS lifecycle_risk_score,
    round(min(100, max(0, (line_score * 0.34) + (drive_score * 0.28) + (sensor_score * 0.26)))) AS installed_base_complexity_score,
    round((interest_score * 0.32) + (((lifecycle_stage_score * 0.38) + (support_risk_score * 0.32) + (safety_pressure * 0.18) + (downtime_pressure * 0.12)) * 0.28) + (strategic_fit_score * 0.22) + (modernization_downtime_pressure * 0.18)) AS modernization_fit_score,
    round((support_risk_score * 0.34) + (downtime_pressure * 0.28) + (service_signal * 0.20) + (trigger_signal * 0.18)) AS service_urgency_score,
    round((data_availability_score * 0.44) + (confidence_score * 0.26) + (readiness_sensor_score * 0.20) + (CASE WHEN data_availability IN ('Usable', 'Rich') THEN 78 ELSE 44 END * 0.10)) AS data_readiness_score,
    round(min(100, max(0, (interest_score * 0.32) + (strategic_fit_score * 0.26) + (service_relationship * 0.22) + (trigger_strength * 0.20) - competitor_penalty))) AS sales_readiness_score
  FROM normalized
),
priority_scores AS (
  SELECT
    *,
    round((lifecycle_risk_score * 0.18) + (installed_base_complexity_score * 0.14) + (modernization_fit_score * 0.22) + (service_urgency_score * 0.18) + (data_readiness_score * 0.10) + (sales_readiness_score * 0.12) + (opportunity_value_score * 0.06)) AS priority_score,
    round((confidence_score * 0.65) + (data_readiness_score * 0.35)) AS blended_confidence_score
  FROM component_scores
),
classified AS (
  SELECT
    *,
    CASE
      WHEN priority_score >= 78 THEN 'Tier 1'
      WHEN priority_score >= 62 THEN 'Tier 2'
      WHEN priority_score >= 44 THEN 'Tier 3'
      ELSE 'Monitor'
    END AS priority_label,
    CASE
      WHEN lifecycle_risk_score >= 78 THEN 'Critical'
      WHEN lifecycle_risk_score >= 58 THEN 'High'
      WHEN lifecycle_risk_score >= 36 THEN 'Moderate'
      ELSE 'Low'
    END AS lifecycle_risk_label,
    CASE
      WHEN installed_base_complexity_score >= 72 THEN 'Complex'
      WHEN installed_base_complexity_score >= 48 THEN 'Scaled'
      WHEN installed_base_complexity_score >= 28 THEN 'Focused'
      ELSE 'Simple'
    END AS installed_base_complexity_label,
    CASE
      WHEN modernization_fit_score >= 76 THEN 'Strong'
      WHEN modernization_fit_score >= 56 THEN 'Good'
      WHEN modernization_fit_score >= 36 THEN 'Emerging'
      ELSE 'Limited'
    END AS modernization_fit_label,
    CASE
      WHEN service_urgency_score >= 76 THEN 'Immediate'
      WHEN service_urgency_score >= 56 THEN 'Near term'
      WHEN service_urgency_score >= 36 THEN 'Monitor'
      ELSE 'Low'
    END AS service_urgency_label,
    CASE
      WHEN data_readiness_score >= 76 THEN 'Ready'
      WHEN data_readiness_score >= 56 THEN 'Developing'
      WHEN data_readiness_score >= 36 THEN 'Needs discovery'
      ELSE 'Early'
    END AS data_readiness_label,
    CASE
      WHEN sales_readiness_score >= 76 THEN 'Ready'
      WHEN sales_readiness_score >= 56 THEN 'Developing'
      WHEN sales_readiness_score >= 36 THEN 'Needs discovery'
      ELSE 'Early'
    END AS sales_readiness_label,
    CASE
      WHEN blended_confidence_score >= 74 THEN 'High'
      WHEN blended_confidence_score >= 50 THEN 'Medium'
      ELSE 'Low'
    END AS confidence_level
  FROM priority_scores
)
SELECT
  row_number() OVER (ORDER BY priority_score DESC, estimated_opportunity_size DESC, account_name ASC) AS rank,
  account_id,
  account_name,
  industry_segment,
  region,
  plant_type,
  estimated_opportunity_size,
  estimated_annual_downtime_cost,
  CAST(priority_score AS INTEGER) AS priority_score,
  priority_label,
  CAST(lifecycle_risk_score AS INTEGER) AS lifecycle_risk_score,
  lifecycle_risk_label,
  CAST(installed_base_complexity_score AS INTEGER) AS installed_base_complexity_score,
  installed_base_complexity_label,
  CAST(modernization_fit_score AS INTEGER) AS modernization_fit_score,
  modernization_fit_label,
  CAST(service_urgency_score AS INTEGER) AS service_urgency_score,
  service_urgency_label,
  CAST(data_readiness_score AS INTEGER) AS data_readiness_score,
  data_readiness_label,
  CAST(sales_readiness_score AS INTEGER) AS sales_readiness_score,
  sales_readiness_label,
  confidence_level,
  CASE
    WHEN priority_score < 36 AND sales_readiness_score < 45 THEN 'Low priority'
    WHEN strategic_fit = 'Strategic' AND estimated_opportunity_size >= 800000 AND (installed_base_complexity_score >= 58 OR data_readiness_score >= 72) THEN 'Strategic enterprise account'
    WHEN priority_score >= 72 AND sales_readiness_score >= 66 AND service_urgency_score >= 58 AND installed_base_confidence <> 'Low' THEN 'Quick win'
    WHEN lifecycle_risk_score >= 76 AND service_urgency_score >= 58 THEN 'Service-risk account'
    WHEN data_readiness_score >= 76 AND modernization_fit_score >= 58 THEN 'Data-readiness candidate'
    WHEN lifecycle_risk_score >= 58 OR modernization_fit_score >= 66 THEN 'Modernization candidate'
    ELSE 'Education/nurture account'
  END AS priority_segment,
  CASE
    WHEN priority_score < 36 AND sales_readiness_score < 45 THEN 'Low near-term readiness and limited value signal make immediate pursuit less attractive.'
    WHEN strategic_fit = 'Strategic' AND estimated_opportunity_size >= 800000 AND (installed_base_complexity_score >= 58 OR data_readiness_score >= 72) THEN 'Large opportunity value and strategic fit justify a roadmap-level conversation.'
    WHEN priority_score >= 72 AND sales_readiness_score >= 66 AND service_urgency_score >= 58 AND installed_base_confidence <> 'Low' THEN 'Strong readiness, visible urgency, and service context support a short-cycle next step.'
    WHEN lifecycle_risk_score >= 76 AND service_urgency_score >= 58 THEN 'Support exposure and reliability risk are the clearest path into the account.'
    WHEN data_readiness_score >= 76 AND modernization_fit_score >= 58 THEN 'Instrumentation and data availability support a performance pilot or monitoring discussion.'
    WHEN lifecycle_risk_score >= 58 OR modernization_fit_score >= 66 THEN 'Lifecycle, uptime, or modernization indicators point to a phased upgrade discussion.'
    ELSE 'There are useful signals, but more evidence is needed before pursuing a proposal.'
  END AS segment_reason,
  CASE
    WHEN safety_system_age >= 14 AND support_risk IN ('High', 'Critical') THEN 'Safety lifecycle review'
    WHEN drive_motor_count >= 180 AND support_risk IN ('High', 'Critical') THEN 'Drive health and predictive maintenance'
    WHEN data_availability = 'Rich' AND modernization_interest IN ('Active', 'Budgeted') THEN 'Analytics and edge monitoring'
    WHEN asset_lifecycle_stage IN ('Limited support', 'Obsolete') THEN 'Controls modernization discovery'
    WHEN sensor_count >= 900 THEN 'Analytics and edge monitoring'
    WHEN support_risk IN ('High', 'Critical') THEN 'Short-cycle service opportunity'
    ELSE 'Assessment workshop'
  END AS opportunity_type,
  CASE
    WHEN priority_score >= 72 THEN recommended_next_action
    WHEN data_availability IN ('Sparse', 'Partial') THEN 'Confirm evidence quality and account timing'
    WHEN lifecycle_risk_score >= 58 THEN 'Run installed-base lifecycle assessment'
    ELSE 'Build discovery plan and validate business trigger'
  END AS next_best_action
FROM classified
ORDER BY priority_score DESC, estimated_opportunity_size DESC, account_name ASC;
