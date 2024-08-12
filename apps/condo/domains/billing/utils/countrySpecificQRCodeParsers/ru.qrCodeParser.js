const iconv = require('iconv-lite')
const { get } = require('lodash')

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
    const matches = /^ST(?<version>\d{4})(?<encodingTag>\d)\|(?<requisitesStr>.*)$/g.exec(qrStr)

    if (!matches) {
        throw new Error('Invalid QR code')
    }

    const requisitesStr = get(matches, ['groups', 'requisitesStr'], '')

    // https://encoding.spec.whatwg.org/#koi8-r
    // https://encoding.spec.whatwg.org/#windows-1251
    const encodingTag = get(matches, ['groups', 'encodingTag'])
    const encoding = get({ 1: 'cp1251', 2: 'utf-8', 3: 'koi8-r' }, encodingTag, 'utf-8')

    // Skip decoding for utf string
    const decodedRequisitesStr = encodingTag === '2' ? requisitesStr : iconv.decode(requisitesStr, encoding)

    return Object.fromEntries(decodedRequisitesStr.split('|').map((part) => part.split('=', 2)))
}

module.exports = parseRUReceiptQRCode
