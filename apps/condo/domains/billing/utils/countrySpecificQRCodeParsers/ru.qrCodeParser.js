const get = require('lodash/get')

const { convertEncoding, detectEncoding } = require('@open-condo/keystone/file/utils')
const { getLogger } = require('@open-condo/keystone/logging')


const logger = getLogger('parseRUReceiptQRCode')

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
 * @param {string} qrBase64Str The QR code b64-encoded string got from the picture
 * @return {TRUQRCodeFields}
 */
function parseRUReceiptQRCode (qrBase64Str) {
    const buffer = Buffer.from(qrBase64Str, 'base64')
    const detectedEncoding = detectEncoding(buffer)
    const decodedQrStr = convertEncoding(buffer, detectedEncoding)

    const matches = /^ST(?<version>\d{4})(?<encodingTag>\d)\|(?<requisitesStr>.*)$/g.exec(decodedQrStr)

    if (!matches) {
        logger.error({ msg:'Error qr-code parsing', data: { qrStr: qrBase64Str, decodedQrStr, detectedEncoding } })
        throw new Error('Invalid QR code')
    }
    logger.info({ msg:'Parsed qr-code', data: { qrStr: qrBase64Str, decodedQrStr, detectedEncoding } })

    const requisitesStr = get(matches, ['groups', 'requisitesStr'], '')
    return Object.fromEntries(requisitesStr.split('|').map((part) => part.split('=', 2)))
}

module.exports = parseRUReceiptQRCode
