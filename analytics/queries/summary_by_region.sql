SELECT
  region,
  COUNT(*) AS account_count,
  SUM(estimated_opportunity_size) AS estimated_opportunity_size,
  SUM(estimated_annual_downtime_cost) AS estimated_annual_downtime_cost,
  ROUND(AVG(priority_score), 1) AS average_priority_score,
  SUM(CASE WHEN priority_label IN ('Tier 1', 'Tier 2') THEN 1 ELSE 0 END) AS tier_1_2_accounts
FROM scored_accounts
GROUP BY region
ORDER BY estimated_opportunity_size DESC, average_priority_score DESC;
