const iconv = require('iconv-lite')
const jschardet = require('jschardet')

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
    const { encoding: detectedEncoding } = jschardet.detect(buffer)

    // In Russia, only two formats are used: utf and windows-1251. Therefore, here we strictly control the formats
    const encoding = detectedEncoding && detectedEncoding.toUpperCase() === 'UTF-8' ? 'UTF-8' : 'WINDOWS-1251'

    // Skip decoding for utf string
    const decodedRequisitesStr = encoding === 'UTF-8' ? buffer.toString() : iconv.decode(buffer, encoding)

    const matches = /^ST(?<version>\d{4})(?<encodingTag>\d)\|(?<requisitesStr>.*)$/g.exec(decodedRequisitesStr)

    if (!matches) {
        throw new Error('Invalid QR code')
    }

    return Object.fromEntries(decodedRequisitesStr.split('|').map((part) => part.split('=', 2)))
}

module.exports = parseRUReceiptQRCode
