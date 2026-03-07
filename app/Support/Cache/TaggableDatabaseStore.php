<?php

namespace App\Support\Cache;

use Illuminate\Cache\DatabaseStore;
use Illuminate\Cache\TaggableStore;
use Illuminate\Contracts\Cache\LockProvider;

class TaggableDatabaseStore extends TaggableStore implements LockProvider
{
    protected DatabaseStore $store;

    public function __construct(DatabaseStore $store)
    {
        $this->store = $store;
    }

    public function get($key)
    {
        return $this->store->get($key);
    }

    public function many(array $keys)
    {
        return $this->store->many($keys);
    }

    public function put($key, $value, $seconds)
    {
        return $this->store->put($key, $value, $seconds);
    }

    public function putMany(array $values, $seconds)
    {
        return $this->store->putMany($values, $seconds);
    }

    public function increment($key, $value = 1)
    {
        return $this->store->increment($key, $value);
    }

    public function decrement($key, $value = 1)
    {
        return $this->store->decrement($key, $value);
    }

    public function forever($key, $value)
    {
        return $this->store->forever($key, $value);
    }

    public function forget($key)
    {
        return $this->store->forget($key);
    }

    public function flush()
    {
        return $this->store->flush();
    }

    public function getPrefix()
    {
        return $this->store->getPrefix();
    }

    public function lock($name, $seconds = 0, $owner = null)
    {
        return $this->store->lock($name, $seconds, $owner);
    }

    public function restoreLock($name, $owner)
    {
        return $this->store->restoreLock($name, $owner);
    }
}
