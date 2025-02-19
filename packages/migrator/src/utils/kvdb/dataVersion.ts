import IORedis from 'ioredis'

type SetDataVersionOptions = {
    connectionString: string
    keyPrefix: string
    version: number
}

export const DV_KEY = 'data_version'
const SET_MAX_SCRIPT = `
    local current = redis.call("GET", KEYS[1])
    if not current or tonumber(current) == nil or tonumber(ARGV[1]) > tonumber(current) then
        redis.call("SET", KEYS[1], ARGV[1])
    end
    return redis.call("GET", KEYS[1])
`

export async function updateDataVersion ({
    connectionString,
    keyPrefix,
    version,
}: SetDataVersionOptions): Promise<number> {
    const prefix = keyPrefix.endsWith(':') ? keyPrefix : `${keyPrefix}:`

    const client = new IORedis(connectionString, { keyPrefix: prefix })
    const value: string = await client.eval(SET_MAX_SCRIPT, 1, DV_KEY, version)
    await client.quit()

    return parseInt(value)
}