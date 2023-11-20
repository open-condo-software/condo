const { isEmpty } = require('lodash')

const { GQLError } = require('@open-condo/keystone/errors')

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
    }


    error (error, index) {
        return new GQLError({ ...error, inputIndex: index }, this.context)
    }


    debug (message) {
        this.debugMessages.push(message)
    }


    async init () {
        // some init logic
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