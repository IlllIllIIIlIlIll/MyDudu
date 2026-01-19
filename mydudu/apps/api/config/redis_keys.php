<?php

return [
    'ttl' => [
        'device_status' => 300,
        'session_buffer' => 600, // 10 minutes
        'retry' => 3600, // 1 hour
        'notif_unread' => 86400, // 24 hours
        'cache_operator_dashboard' => 60, // 1 minute
        'heartbeat_device' => 120, // 2 minutes
        'lock_session' => 30, // 30 seconds
        'cache_education_articles' => 300, // 5 minutes
        'cache_schedule' => 600, // 10 minutes
        'lock_incident_create' => 60, // 1 minute
    ],
    'keys' => [
        'device_status' => 'device:{uuid}:status',
        'session_buffer' => 'session:{uuid}:buffer',
        'queue_upload' => 'queue:upload',
        'retry' => 'retry:{uuid}',
        'user_notif_unread' => 'user:{id}:notif_unread',
        'cache_operator_dashboard' => 'cache:operator_dashboard',
        'heartbeat_device' => 'heartbeat:device:{uuid}',
        'lock_session' => 'lock:session:{uuid}',
        'incident_pending' => 'incident:pending',
        'cache_education_articles' => 'cache:education_articles',
        'cache_schedule' => 'cache:schedule:{posyandu_id}',
        'lock_incident_create' => 'lock:incident:create:{device_id}',
    ],
];
