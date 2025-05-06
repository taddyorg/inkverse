const cache: Record<string, unknown> = {};

function getSimpleCache(key: string): unknown {
    return cache[key];
}

function setSimpleCache(key: string, value: unknown): void {
    cache[key] = value;
}

export { getSimpleCache, setSimpleCache };