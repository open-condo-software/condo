const { get } = require('lodash')

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
 * @param {TQRCode} qrCodeFields
 * @return {string[]}
 */
function getQRCodeMissedFields (qrCodeFields) {
    return REQUIRED_QR_CODE_FIELDS.filter((requiredField) => !get(qrCodeFields, requiredField, null))
}

async function searchReceiptForQRCode (qr) {

}

module.exports = { parseReceiptQRCode, getQRCodeMissedFields, searchReceiptForQRCode }
