PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS downtime_pain_points;
DROP TABLE IF EXISTS scored_accounts;
DROP TABLE IF EXISTS accounts;

CREATE TABLE accounts (
  account_id TEXT PRIMARY KEY,
  account_name TEXT NOT NULL,
  industry_segment TEXT NOT NULL,
  region TEXT NOT NULL,
  plant_type TEXT NOT NULL,
  production_lines INTEGER NOT NULL,
  installed_plc_family TEXT NOT NULL,
  installed_hmi_scada_system TEXT NOT NULL,
  drive_motor_count INTEGER NOT NULL,
  sensor_count INTEGER NOT NULL,
  safety_system_age INTEGER NOT NULL,
  asset_lifecycle_stage TEXT NOT NULL,
  support_risk TEXT NOT NULL,
  modernization_interest TEXT NOT NULL,
  estimated_annual_downtime_cost INTEGER NOT NULL,
  service_history TEXT NOT NULL,
  decision_maker_persona TEXT NOT NULL,
  strategic_fit TEXT NOT NULL,
  estimated_opportunity_size INTEGER NOT NULL,
  likely_buying_trigger TEXT NOT NULL,
  recommended_next_action TEXT NOT NULL,
  last_engagement_date TEXT NOT NULL,
  installed_base_confidence TEXT NOT NULL,
  competitor_presence TEXT NOT NULL,
  data_availability TEXT NOT NULL,
  urgency_notes TEXT NOT NULL
);

CREATE TABLE downtime_pain_points (
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  pain_point TEXT NOT NULL,
  PRIMARY KEY (account_id, pain_point)
);

CREATE TABLE scored_accounts (
  rank INTEGER PRIMARY KEY,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  industry_segment TEXT NOT NULL,
  region TEXT NOT NULL,
  plant_type TEXT NOT NULL,
  estimated_opportunity_size INTEGER NOT NULL,
  estimated_annual_downtime_cost INTEGER NOT NULL,
  priority_score INTEGER NOT NULL,
  priority_label TEXT NOT NULL,
  lifecycle_risk_score INTEGER NOT NULL,
  lifecycle_risk_label TEXT NOT NULL,
  installed_base_complexity_score INTEGER NOT NULL,
  installed_base_complexity_label TEXT NOT NULL,
  modernization_fit_score INTEGER NOT NULL,
  modernization_fit_label TEXT NOT NULL,
  service_urgency_score INTEGER NOT NULL,
  service_urgency_label TEXT NOT NULL,
  data_readiness_score INTEGER NOT NULL,
  data_readiness_label TEXT NOT NULL,
  sales_readiness_score INTEGER NOT NULL,
  sales_readiness_label TEXT NOT NULL,
  confidence_level TEXT NOT NULL,
  priority_segment TEXT NOT NULL,
  segment_reason TEXT NOT NULL,
  opportunity_type TEXT NOT NULL,
  next_best_action TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);
