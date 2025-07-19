// Number:
const RU_NUMBER_WEIGHTS = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1]
const RU_NUMBER_CONTROL_SUM_FAILED = 'Control sum is not valid for number'

// Tin: 
const RU_TIN_WEIGHTS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]
const RU_TIN_WRONG_LENGTH = 'Ru tin length was expected to be 10 or 12, but received '
const RU_TIN_CONTROL_SUM_FAILED = 'Control sum is not valid for tin'
const RU_TIN_NOT_NUMERIC = 'Tin can contain only digits'

// Classification Code (КБК):
const WRONG_LENGTH = 'Classification code length was expected to be 20, but received '

/**
 * For RU number:
 * 1) Check checksum verification for number
 *
 * Example:
 * number - 50286516400000008106
 * routing number - 823397286
 *
 * @param {string} number - BankAccount number
 * @param {string} routingNumber - Bic
 * @param {[]} errors
 */
const validateRuNumber = (number, routingNumber, errors) => {

    // no validation for state funded organisations
    if (routingNumber.startsWith('01')) return 
    const controlString = routingNumber.substr(-3) + number

    let controlSum = 0
    for (const i in RU_NUMBER_WEIGHTS) {
        controlSum += (RU_NUMBER_WEIGHTS[i] * controlString[i]) % 10
    }

    if (controlSum % 10 !== 0) {
        errors.push(RU_NUMBER_CONTROL_SUM_FAILED)
    }
}

/**
 * For RU routing number:
 * *** In Russia, number routing is equivalent to BIC***
 * 1) For RU organizations country code (first two digits) is 04 or 01 (for government organizations)
 *
 * @param {string} routingNumber
 * @param {[]} errors
 */
const validateRuRoutingNumber = (routingNumber, errors) => {
    const WRONG_RU_COUNTRY_CODE = 'For RU organizations country code is 04 or 01, but routing number has '

    const countryCode = routingNumber.substr(0, 2)

    if (countryCode !== '04' && countryCode !== '01' && countryCode !== '00') {
        errors.push(WRONG_RU_COUNTRY_CODE + countryCode)
    }
}

/**
 * For RU tin:
 * *** In Russia, tin is equivalent to INN***
 * 1) Check checksum verification for TIN
 * 2) Check for length and format (Consists of 10 or 12 digits)
 *  *
 * Example:
 * RU TIN with 10 characters - 7791815382
 * RU TIN with 12 characters - 397144170672
 */
const validateRuTin = (tin, errors) => {
    if (!/^[0-9]*$/.test(tin)) errors.push(RU_TIN_NOT_NUMERIC)

    if (tin.length !== 10 && tin.length !== 12) errors.push(RU_TIN_WRONG_LENGTH + tin.length)

    if (tin.length === 10)
        if (getRuTinControlSum(tin) !== Number(tin.slice(-1))) {
            errors.push(RU_TIN_CONTROL_SUM_FAILED)
        }

    if (tin.length === 12) {
        if (getRuTinControlSum(tin.slice(0, 11)) !==
				Number(tin.slice(10, -1)
					|| getRuTinControlSum(tin) !== Number(tin.slice(-1)))) {
            errors.push(RU_TIN_CONTROL_SUM_FAILED)
        }
    }
}

const getRuTinControlSum = (num) => {
    const weights = RU_TIN_WEIGHTS.slice(-num.length)

    let controlSum = 0
    for (let i = 0; i < num.length; i++)
        controlSum += num[i] * weights[i]

    return controlSum % 11 % 10
}

/**
 * For RU (budget) classification code  :
 * *** In Russia, classification code is equivalent to KBK***
 * 2) Check for length and format (Consists of 20 digits)
 *  *
 * Example: 90205039900060030131
 */
const validateRuClassificationCode = (code, errors) => {
    const classificationCodeWithoutSpaces = code.toString().trim()

    if (classificationCodeWithoutSpaces.length !== 20) {
        errors.push(WRONG_LENGTH + classificationCodeWithoutSpaces.length)
    }
}

module.exports = {
    validator: {
        number: validateRuNumber,
        routingNumber: validateRuRoutingNumber,
        tin: validateRuTin,
        classificationCode: validateRuClassificationCode,
    },
    RU_NUMBER_WEIGHTS,
    RU_TIN_WEIGHTS,
    getRuTinControlSum,
}