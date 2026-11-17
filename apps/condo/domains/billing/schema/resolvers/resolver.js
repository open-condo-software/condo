const { isDeepStrictEqual } = require('node:util')

const { GQLError } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')

const isObjectEmpty = value => Object.keys(value).length === 0
const isNil = value => value === null || value === undefined

function areArraysEqual (left, right) {
    if (!Array.isArray(right) || left.length !== right.length) return false

    const unmatched = [...right]
    return left.every(leftItem => {
        const matchIndex = unmatched.findIndex(rightItem => isDeepStrictEqual(leftItem, rightItem))
        if (matchIndex === -1) return false
        unmatched.splice(matchIndex, 1)
        return true
    })
}

function chunkArray (items, chunkSize) {
    return Array.from(
        { length: Math.ceil(items.length / chunkSize) },
        (_, index) => items.slice(index * chunkSize, (index + 1) * chunkSize),
    )
}

function forEachSequential (items, callback) {
    return items.reduce(
        (previous, item) => previous.then(() => callback(item)),
        Promise.resolve(),
    )
}

/**
 * Creates request-local helpers and metrics for one receipt processing stage.
 * Domain state and caches stay inside the stage function instead of being hidden
 * on a short-lived class instance.
 */
function createStageContext ({ name, context }) {
    const logger = getLogger()
    const startedAt = process.hrtime()
    const stats = { created: 0, updated: 0, unTouched: 0 }
    const dvSender = {
        dv: 1,
        sender: { dv: 1, fingerprint: `register-receipt-${name}-resolver` },
    }

    function error (errorDefinition, index, originalError, messageInterpolation) {
        if (originalError) {
            logger.error({ msg: `${name} internal error`, err: originalError })
        }
        const fields = {
            ...errorDefinition,
            inputIndex: index,
            ...messageInterpolation ? { messageInterpolation } : {},
        }
        return originalError
            ? new GQLError(fields, context, originalError)
            : new GQLError(fields, context)
    }

    function buildCreateInput (data, relations = []) {
        const createInput = { ...dvSender }
        for (const [propertyName, propertyValue] of Object.entries(data)) {
            if (!isNil(propertyValue)) {
                createInput[propertyName] = relations.includes(propertyName)
                    ? { connect: { id: propertyValue } }
                    : propertyValue
            }
        }
        logger.debug({ msg: `Create new ${name}`, data: createInput })
        return createInput
    }

    function buildUpdateInput (data, existingItem, relations = [], { allowNull = false } = {}) {
        const updateInput = {}
        for (const [propertyName, propertyValue] of Object.entries(data)) {
            const shouldCompare = allowNull ? propertyValue !== undefined : !isNil(propertyValue)
            const valuesAreEqual = Array.isArray(existingItem[propertyName])
                ? areArraysEqual(existingItem[propertyName], propertyValue)
                : isDeepStrictEqual(existingItem[propertyName], propertyValue)
            if (shouldCompare && !valuesAreEqual) {
                updateInput[propertyName] = relations.includes(propertyName)
                    ? { connect: { id: propertyValue } }
                    : propertyValue
            }
        }
        if (!isObjectEmpty(updateInput)) {
            const versionedInput = { ...dvSender, ...updateInput }
            logger.debug({ msg: `Update ${name}`, data: { updateInput: versionedInput } })
            return versionedInput
        }
        return updateInput
    }

    function buildStats () {
        const elapsed = process.hrtime(startedAt)
        const time = ((elapsed[0] * 1000 + elapsed[1] / 1e6) / 1000).toFixed(2)
        const nonEmptyStats = Object.fromEntries(Object.entries(stats).filter(([, count]) => count > 0))
        return {
            name,
            time: Number(time),
            ...!isObjectEmpty(nonEmptyStats) ? { stats: nonEmptyStats } : {},
        }
    }

    function result (receiptIndex, metadata = {}) {
        const partitioned = Object.entries(receiptIndex).reduce((result, [index, receipt]) => {
            if (receipt.error) {
                result.errorReceipts[index] = receipt.error
            } else {
                result.receipts[index] = receipt
            }
            return result
        }, { errorReceipts: {}, receipts: {} })

        return {
            ...partitioned,
            debugMessages: [buildStats()],
            ...metadata,
        }
    }

    return {
        buildCreateInput,
        buildUpdateInput,
        error,
        markCreated: () => stats.created++,
        markUpdated: () => stats.updated++,
        markUntouched: () => stats.unTouched++,
        result,
    }
}


module.exports = {
    chunkArray,
    createStageContext,
    forEachSequential,
    isObjectEmpty,
}
