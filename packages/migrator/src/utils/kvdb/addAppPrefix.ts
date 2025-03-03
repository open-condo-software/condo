import IORedis from 'ioredis'

import { getAppPrefixedKey } from '@/utils/kvdb/keyPrefix'
import { getLogger } from '@/utils/logging'

type AddAppPrefixOptions = {
    connectionString: string
    keyPrefix: string
    scanSize?: number
    logEvery?: number
}

export async function addAppPrefix ({
    connectionString,
    keyPrefix,
    scanSize = 1_000,
    logEvery = 1_000_000,
}: AddAppPrefixOptions
): Promise<void> {
    const logger = getLogger()
    const client = new IORedis(connectionString)

    const size = await client.dbsize()

    logger.info(`Database size: ${size} keys`)

    let cursor = '0'
    let migrated = 0
    let lastLoggedAt = 0

    // NOTE: cursor is updated and break condition is defined
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [updatedCursor, keyBatch] = await client.scan(cursor, 'MATCH', '*', 'COUNT', scanSize)
        cursor = updatedCursor

        let tx = client.multi()

        for (const key of keyBatch) {
            if (!key || key.startsWith(keyPrefix) || key.startsWith(`{${keyPrefix}`)) {
                // NOTE: skip already modified keys (make script re-executable)
                continue
            }

            const newKey = getAppPrefixedKey(key, keyPrefix)
            tx = tx.renamenx(key, newKey)
            migrated++
        }

        await tx.exec()

        if (migrated - lastLoggedAt > logEvery) {
            logger.updateLine(`${migrated} keys renamed`)
            lastLoggedAt = migrated
        }

        if (cursor === '0') {
            logger.updateLine(`${migrated} keys renamed`)
            break
        }
    }

    await client.quit()
}