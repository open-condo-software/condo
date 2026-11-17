const isEmpty = require('lodash/isEmpty')
const isEqual = require('lodash/isEqual')
const isNil = require('lodash/isNil')
const xorWith = require('lodash/xorWith')

const { GQLError } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')

const isArrayEqual = (left, right) => isEmpty(xorWith(left, right, isEqual))

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
                ? isArrayEqual(existingItem[propertyName], propertyValue)
                : isEqual(existingItem[propertyName], propertyValue)
            if (shouldCompare && !valuesAreEqual) {
                updateInput[propertyName] = relations.includes(propertyName)
                    ? { connect: { id: propertyValue } }
                    : propertyValue
            }
        }
        if (!isEmpty(updateInput)) {
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
            ...!isEmpty(nonEmptyStats) ? { stats: nonEmptyStats } : {},
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
    createStageContext,
}
