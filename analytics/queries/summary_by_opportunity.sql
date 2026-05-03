SELECT
  opportunity_type,
  COUNT(*) AS account_count,
  SUM(estimated_opportunity_size) AS estimated_opportunity_size,
  ROUND(AVG(priority_score), 1) AS average_priority_score,
  GROUP_CONCAT(account_id, ', ') AS account_ids
FROM scored_accounts
GROUP BY opportunity_type
ORDER BY estimated_opportunity_size DESC, account_count DESC;
