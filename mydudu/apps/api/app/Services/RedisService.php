<?php

namespace App\Services;

class RedisService
{
    /**
     * Get the Redis key for a given identifier.
     *
     * @param string $keyName
     * @param array $params
     * @return string
     * @throws \InvalidArgumentException
     */
    public static function getKey(string $keyName, array $params = []): string
    {
        $keys = config('redis_keys.keys');

        if (!isset($keys[$keyName])) {
            throw new \InvalidArgumentException("Redis key '{$keyName}' is not defined.");
        }

        $key = $keys[$keyName];

        foreach ($params as $placeholder => $value) {
            $key = str_replace('{' . $placeholder . '}', $value, $key);
        }

        return $key;
    }

    /**
     * Get the TTL for a given key type.
     *
     * @param string $keyName
     * @return int|null
     */
    public static function getTtl(string $keyName): ?int
    {
        $ttls = config('redis_keys.ttl');
        return $ttls[$keyName] ?? null;
    }
}
