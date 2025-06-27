const { Text } = require('@open-keystone/fields')

const { isISO8601Duration } = require('./utils/validations')

class DateInterval extends Text.implementation {
    /*
    P is the duration designator (for period) placed at the start of the duration representation.
        - Y is the year designator that follows the value for the number of calendar years.
        - M is the month designator that follows the value for the number of calendar months.
        - W is the week designator that follows the value for the number of weeks.
        - D is the day designator that follows the value for the number of calendar days.
    T is the time designator that precedes the time components of the representation.
        - H is the hour designator that follows the value for the number of hours.
        - M is the minute designator that follows the value for the number of minutes.
        - S is the second designator that follows the value for the number of seconds.

    For example, "P3Y6M4DT12H30M5S" represents a duration of "three years, six months, four days, twelve hours, thirty minutes, and five seconds".

    link: https://en.wikipedia.org/wiki/ISO_8601
    */
    async validateInput (args) {
        const { resolvedData, addFieldValidationError } = args
        const value = resolvedData[this.path]

        if (value === null) return true
        if (!isISO8601Duration(value)) addFieldValidationError('Invalid DateInterval value.')

        await super.validateInput(args)
    }
}

module.exports = {
    DateInterval,
}
