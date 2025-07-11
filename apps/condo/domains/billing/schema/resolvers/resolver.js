const { isEmpty, isNil, xorWith, isEqual } = require('lodash')

const { GQLError } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')

const isArrayEqual = (x, y) => isEmpty(xorWith(x, y, isEqual))

class Resolver {

    constructor (billingContext, context, params = {}) {
        const { name = 'resolver' } = params
        this.name = name
        this.dvSender = {
            dv: 1,
            sender: { dv: 1, fingerprint: `register-receipt-${name}-resolver` },
        }
        this.billingContext = billingContext
        this.context = context
        this.timeStart = process.hrtime()
        this.debugMessages = []
        this.unTouched = 0
        this.created = 0
        this.updated = 0
        this.logger = getLogger()
    }

    error (error, index, errorDescription) {
        if (errorDescription) {
            this.logger.error({ msg: `${this.name} internal error`, data: { errorDescription } })
        }
        return new GQLError({ ...error, inputIndex: index }, this.context)
    }

    debug (message) {
        this.debugMessages.push(message)
    }

    async init () {
        // some init logic
    }

    buildCreateInput (data, relations = []) {
        const createInput = { ...this.dvSender }
        for (const [propertyName, propertyValue] of Object.entries(data)) {
            if (!isNil(propertyValue)) {
                if (relations.indexOf(propertyName) !== -1) {
                    createInput[propertyName] = { connect: { id: propertyValue } }
                } else {
                    createInput[propertyName] = propertyValue
                }
            }
        }
        this.created++
        this.logger.debug({ msg: `Create new ${this.name}`, data: createInput })
        return createInput
    }

    isEqual (oldValue, newValue) {
        if (Array.isArray(oldValue)) {
            return isArrayEqual(oldValue, newValue)
        }
        return isEqual(oldValue, newValue)
    }

    buildUpdateInput (data, existingItem, relations = []) {
        let updateInput = {}
        for (const [propertyName, propertyValue] of Object.entries(data)) {
            if (!isNil(propertyValue) && !this.isEqual(existingItem[propertyName], data[propertyName])) {
                if (relations.indexOf(propertyName) !== -1) {
                    updateInput[propertyName] = { connect: { id: propertyValue } }
                } else {
                    updateInput[propertyName] = propertyValue
                }
            }
        }
        if (!isEmpty(updateInput)) {
            updateInput = { ...this.dvSender, ...updateInput }
            this.logger.debug({ msg: `Update ${this.name}`, data: { updateInput } })
            this.updated++
        } else {
            this.unTouched++
        }
        return updateInput
    }

    buildStats () {
        const timeEnd = process.hrtime(this.timeStart)
        const time = ((timeEnd[0] * 1000 + timeEnd[1] / 1e6) / 1000).toFixed(2)
        const stats = {
            ...this.created ? { created: this.created } : {},
            ...this.updated ? { updated: this.updated } : {},
            ...this.unTouched ? { unTouched: this.unTouched } : {},
        }
        return { name: this.name, time: Number(time), ...!isEmpty(stats) ? { stats } : {} }
    }

    result ( receiptIndex ) {
        this.debug(this.buildStats())
        return Object.entries(receiptIndex).reduce((result, [index, receipt]) => {
            if (receipt.error) {
                result.errorReceipts[index] = receipt.error
            } else {
                result.receipts[index] = receipt
            }
            return result
        }, {
            errorReceipts: {},
            receipts: {},
        })
    }


}


module.exports = {
    Resolver,
}