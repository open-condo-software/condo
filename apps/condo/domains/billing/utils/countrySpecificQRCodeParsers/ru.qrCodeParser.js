const { convertEncoding, detectEncoding } = require('@open-condo/keystone/file/utils')

/**
 * @typedef {Object} TRUQRCodeFields
 * @property {string} BIC
 * @property {string} PayerAddress
 * @property {string} PaymPeriod
 * @property {string} Sum
 * @property {string} PersAcc The resident's account
 * @property {string} PayeeINN
 * @property {string} PersonalAcc The bank account of the receiver
 */

/**
 * @param {string} qrStr The QR code string got from the picture
 * @return {TRUQRCodeFields}
 */
function parseRUReceiptQRCode (qrStr) {
    const buffer = Buffer.from(qrStr, 'base64')
    const decodedRequisitesStr = convertEncoding(buffer, detectEncoding(buffer))

    const matches = /^ST(?<version>\d{4})(?<encodingTag>\d)\|(?<requisitesStr>.*)$/g.exec(decodedRequisitesStr)

    if (!matches) {
        throw new Error('Invalid QR code')
    }

    return Object.fromEntries(decodedRequisitesStr.split('|').map((part) => part.split('=', 2)))
}

module.exports = parseRUReceiptQRCode
