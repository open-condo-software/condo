const { pick, omitBy, keys, isNull } = require('lodash')

// SBBOL has strict requirement on set of fields, that will go to digest
const SBBOL_DIGEST_FIELDS = [
    'acceptanceTerm',
    'amount',
    'date',
    'externalId',
    'operationCode',
    'payeeAccount',
    'payeeBankBic',
    'payeeBankCorrAccount',
    'payeeInn',
    'payeeName',
    'payerAccount',
    'payerBankBic',
    'payerBankCorrAccount',
    'payerInn',
    'payerName',
    'paymentCondition',
    'priority',
    'purpose',
    'voCode',
]

/**
 * Builds digest for body of payment request in format from SBBOL
 * The digest will be passed to signing with Digital Signature
 *
 * @param {Object} data request body to build digest from
 * @return {String} stringified object, according to requirements of SBBOL
 */
const buildDigestFrom = (data) => {
    const cleanedData = omitBy(data, isNull)
    const pickedData = pick(cleanedData, SBBOL_DIGEST_FIELDS)
    const sortedData = keys(pickedData)
        .sort()
        .reduce((acc, key) => ({
            ...acc,
            [key]: pickedData[key],
        }), {})

    const serializedData = Object.keys(sortedData).reduce((acc, key) => (
        [...acc, `${key}=${sortedData[key]}`]
    ), []).join('\n')
    return serializedData
}

module.exports = {
    buildDigestFrom,
}