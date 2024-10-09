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
 * @param {string} qrStr The QR code string got from the picture
 * @param {function} logger ValidateQRCodeService logger
 * @return {TRUQRCodeFields}
 */
function parseRUReceiptQRCode (qrStr) {
    const buffer = Buffer.from(qrStr, 'base64')
    const detectedEncoding = detectEncoding(buffer)
    const decodedRequisitesStr = convertEncoding(buffer, detectedEncoding)

    const matches = /^ST(?<version>\d{4})(?<encodingTag>\d)\|(?<requisitesStr>.*)$/g.exec(decodedRequisitesStr)

    if (!matches) {
        logger.error({ msg:'Error qr-code parsing', data: { qrStr, decodedRequisitesStr, detectedEncoding }, step: 'decoded' })
        throw new Error('Invalid QR code')
    }
    logger.info({ msg:'Parsed qr-code', data: { qrStr, decodedRequisitesStr, detectedEncoding }, step: 'decoded' })

    return Object.fromEntries(
        decodedRequisitesStr.slice(8) // rm tag ST
            .split('|').map((part) => part.split('=', 2))
    )
}

module.exports = parseRUReceiptQRCode
