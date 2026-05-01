const { createCronTask } = require('@open-condo/keystone/tasks')

const { generateRentCharges } = require('@condo/domains/billing/utils/serverSchema/rentChargeGeneration')

module.exports = {
    generateRentCharges,
    generateRentChargesCronTask: createCronTask('generateRentCharges', '5 2 * * *', generateRentCharges),
}
