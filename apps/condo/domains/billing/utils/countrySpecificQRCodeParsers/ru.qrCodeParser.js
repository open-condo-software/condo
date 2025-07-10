const get = require('lodash/get')

const { convertEncoding, detectEncoding } = require('@open-condo/keystone/file/utils')
const { getLogger } = require('@open-condo/keystone/logging')


const logger = getLogger()

// NOTE(YEgorLu): billings send qrCodes with fields in any casing. So let's map all variants to one casing
const FIELDS_OVERRIDES = {
    'name': 'Name',
    'personalacc': 'PersonalAcc',
    'bankname': 'BankName',
    'bic': 'BIC',
    'correspacc': 'CorrespAcc',
    'sum': 'Sum',
    'purpose': 'Purpose',
    'payeeinn': 'PayeeINN',
    'lastname': 'LastName',
    'payeraddress': 'PayerAddress',
    'persacc': 'PersAcc',
    'paymperiod': 'PaymPeriod',
}

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
        logger.error({ msg:'error qr-code parsing', data: { qrStr: qrBase64Str, decodedQrStr, detectedEncoding } })
        throw new Error('Invalid QR code')
    }
    logger.info({ msg:'parsed qr-code', data: { qrStr: qrBase64Str, decodedQrStr, detectedEncoding } })

    const requisitesStr = get(matches, ['groups', 'requisitesStr'], '')
    return Object.fromEntries(
        requisitesStr
            .split('|')
            .map((part) => part.split('=', 2))
            .map(keyValue => {
                const key = keyValue[0].toLowerCase()
                if (FIELDS_OVERRIDES[key]) {
                    keyValue[0] = FIELDS_OVERRIDES[key]
                }
                return keyValue
            })
    )
}

module.exports = parseRUReceiptQRCode
