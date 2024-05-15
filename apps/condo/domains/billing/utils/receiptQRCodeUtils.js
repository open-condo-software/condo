const { get } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')

const REQUIRED_QR_CODE_FIELDS = ['BIC', 'PayerAddress', 'PaymPeriod', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc']

/**
 * @typedef {{ [p: string]: any }} TQRCode
 * @property {string} BIC
 * @property {string} PayerAddress
 * @property {string} PaymPeriod
 * @property {string} Sum
 * @property {string} PersAcc
 * @property {string} PayeeINN
 * @property {string} PersonalAcc
 */

/**
 * @param {string} qrStr The QR code string got from the picture
 * @return {TQRCode}
 */
function parseReceiptQRCode (qrStr) {
    const matches = /^ST(?<version>\d{4})(?<encodingTag>\d)\|(?<requisitesStr>.*)$/g.exec(qrStr)
    const requisitesStr = get(matches, ['groups', 'requisitesStr'], '')

    // TODO(AleX83Xpert): maybe decode requisitesStr
    // Need to test the result of scanning from mobile devices
    // https://encoding.spec.whatwg.org/#koi8-r
    // https://encoding.spec.whatwg.org/#windows-1251
    // const encodingTag = get(matches, ['groups', 'encodingTag'])
    // const encoding = get(['windows-1251', 'utf-8', 'koi8-r'], encodingTag, 'utf-8')

    return Object.fromEntries(requisitesStr.split('|').map((part) => part.split('=', 2)))
}

/**
 * @param {TQRCode} qrCode
 * @return {string[]}
 */
function getQRCodeMissedFields (qrCode) {
    return REQUIRED_QR_CODE_FIELDS.filter((requiredField) => !get(qrCode, requiredField, null))
}

async function hasReceiptDuplicates (context, accountNumber, period, organizationIds, recipientBankAccount) {
    // check if receipt already paid
    // at this point no mater if receipt was paid as a virtual one or by billing receipt
    // since all of them must have enough information about payment destination

    // let's request payments that have specific statuses and receipt params
    // and decide if we are going to make a duplicate
    const payments = await find('Payment', {
        accountNumber,
        period,
        organization: { id_in: organizationIds },
        status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
        recipientBankAccount,
        deletedAt: null,
    })

    return payments.length > 0
}

module.exports = { parseReceiptQRCode, getQRCodeMissedFields, hasReceiptDuplicates }
