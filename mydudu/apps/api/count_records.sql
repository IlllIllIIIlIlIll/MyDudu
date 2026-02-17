-- Check what data exists after the migration
SELECT 
  'children' as table_name, 
  COUNT(*) as count 
FROM children
UNION ALL
SELECT 'parents', COUNT(*) FROM parents
UNION ALL  
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'devices', COUNT(*) FROM devices;
