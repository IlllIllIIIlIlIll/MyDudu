SELECT 
  (SELECT COUNT(*) FROM children) as children_count,
  (SELECT COUNT(*) FROM parents) as parents_count,
  (SELECT COUNT(*) FROM sessions) as sessions_count,
  (SELECT COUNT(*) FROM users) as users_count;
