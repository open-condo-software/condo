/**
 * Rebuilds indices for specified BankCategory according to "Nested Set" data organization model
 *
 * @example
 * yarn workspace @app/condo node ./bin/banking/rebuildNestedSetIndexForBankCategories.js [id]
 */

const { pick } = require('lodash')
const { buildNestedSetIndex } = require('@condo/domains/banking/utils/serverSchema/BankCategory')
const { BankCategory } = require('@condo/domains/banking/utils/serverSchema')
const { connectKeystone } = require('../lib/keystone.helpers')

const dvSender = {
    dv: 1,
    sender: { dv: 1, fingerprint: 'nested-set-util' },
}

const printCategory = (category) => {
    console.info('- '.repeat(category.depth) + category.name, pick(category, ['id', 'name', 'left', 'right']))
}

async function main () {
    const context = await connectKeystone()
    const [id] = process.argv.slice(2)
    const root = await BankCategory.getOne(context, { id })
    await buildNestedSetIndex(context, dvSender, root)
    const updatedRoot = await BankCategory.getOne(context, { id })
    const categories = await BankCategory.getAll(context, { left_gt: updatedRoot.left, right_lt: updatedRoot.right  }, { sortBy: 'left_ASC' })
    console.info('New Nested Set indices for categories')
    printCategory(updatedRoot)
    for (let category of categories) {
        printCategory(category)
    }
}

main().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
})
