SELECT
  priority_segment,
  COUNT(*) AS account_count,
  SUM(estimated_opportunity_size) AS estimated_opportunity_size,
  SUM(estimated_annual_downtime_cost) AS estimated_annual_downtime_cost,
  ROUND(AVG(priority_score), 1) AS average_priority_score,
  ROUND(AVG(lifecycle_risk_score), 1) AS average_lifecycle_risk_score,
  ROUND(AVG(data_readiness_score), 1) AS average_data_readiness_score
FROM scored_accounts
GROUP BY priority_segment
ORDER BY estimated_opportunity_size DESC, account_count DESC;
