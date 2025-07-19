const { get } = require('lodash')

const ruValidator = require('@condo/domains/banking/utils/validate/countrySpecificValidators/ru.validator')

/**
 * @type {{
 * [countryCode: string]: {
 * 		number: function(string, string, []): void,
 * 		routingNumber: function(string, []): void,
 * 		tin: function(string, []): void}
 * 	}}
 */
const countrySpecificValidators = {
    'ru': ruValidator.validator,
}

/**
 * Returns country specific validator or empty validator.
 * @param {string} field
 * @param {string} country
 */
const getCountrySpecificValidator = (field, country) => {
	
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const defaultValidator = () => {}
	
    return get(countrySpecificValidators, [country, field], defaultValidator )
}

module.exports = {
    getCountrySpecificValidator,
}