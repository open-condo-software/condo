const { padStart } = require('lodash')
const { logger: baseLogger } = require('../common')

const logger = baseLogger.child({ func: 'buildBicryptId' })

/**
 * Builds bicryptId string in format, required by SBBOL API
 *
 * @param certCenterCode 4- or 6-digit code
 * @param certCenterNum 2-digit index with values in set `00`…`09`…`0A`…`0Z`…`ZZ`
 * @param firstName of certificate owner
 * @param lastName of certificate owner
 * @param patronymic of certificate owner
 * @return {String}
 */
function buildBicryptId ({ certCenterCode, certCenterNum, firstName, lastName, patronymic }) {
    if (certCenterCode === null || typeof certCenterCode === 'undefined' || certCenterCode.length === 0) {
        logger.error({ message: 'certCenterCode is not specified' })
        throw new Error('certCenterCode is not specified')
    }
    if (![4, 6].includes(certCenterCode.length)) {
        logger.error({ message: 'certCenterCode has incorrect length', certCenterCode })
        throw new Error('certCenterCode has incorrect length')
    }
    if (certCenterNum === null || typeof certCenterNum === 'undefined' || certCenterNum.length === 0) {
        logger.error({ message: 'certCenterNum is not specified' })
        throw new Error('certCenterNum is not specified')
    }
    const validCertCenterNumRegexp = /^[0-9A-Z]{2}$/
    if (!certCenterNum.match(validCertCenterNumRegexp)) {
        logger.error({ message: 'certCenterNum has invalid format', certCenterCode })
        throw new Error('certCenterNum has invalid format')
    }
    if (firstName === null || typeof firstName === 'undefined' || firstName.length === 0) {
        logger.error({ message: 'firstName is not specified' })
        throw new Error('firstName is not specified')
    }
    if (lastName === null || typeof lastName === 'undefined' || lastName.length === 0) {
        logger.error({ message: 'lastName is not specified' })
        throw new Error('lastName is not specified')
    }
    if (patronymic === null || typeof patronymic === 'undefined' || patronymic.length === 0) {
        logger.error({ message: 'patronymic is not specified' })
        throw new Error('patronymic is not specified')
    }
    const paddedCertCenterNum = certCenterCode.length === 4
        ? padStart(certCenterNum, 4, '0')
        : certCenterNum
    const result = certCenterCode + paddedCertCenterNum + 's' + lastName + firstName[0] + patronymic[0]
    return result
}

module.exports = {
    buildBicryptId,
}