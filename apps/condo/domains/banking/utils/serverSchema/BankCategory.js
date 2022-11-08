const { BankCategory } = require('./index')
const { pick } = require('lodash')

/**
 * Sets indices for a subtree of specified root node using Depth-First Search
 *
 * Call this function manually after you build or changed a tree of `BankCategory` records.
 *
 * NOTE(antonal): This function is impossible to use in `afterChange` hook of a `BankCategory` model,
 * to get, at first sight, an auto updating feature after moving a category as a child to another.
 * Because update queries for `BankCategory` can be executed in unknown time and order,
 * result will be unpredictable and greedy on performance.
 *
 * @param context - Keystone context
 * @param dvSender - standard fields `dv, sender: { dv, fingerprint }`
 * @param category - `BankCategory` node that needs to be recursively traversed
 * @param i - starting index for root node
 * @param depth - level index within a tree
 * @return {Promise<number>} - right index after recursive traversing of specified `BankCategory` node
 */
async function buildNestedSetIndex (context, dvSender, category, i = 1, depth = 0) {
    await BankCategory.update(context, category.id, { left: i, depth, ...dvSender })
    const children = await BankCategory.getAll(context, {
        parent: {
            id: category.id,
        },
    }, {
        sortBy: 'sortOrder_ASC',
    })
    let right = i
    for (const child of children) {
        right = await buildNestedSetIndex(context, dvSender, child, right + 1, depth + 1)
    }
    right++
    await BankCategory.update(context, category.id, { right, ...dvSender })
    return right
}

module.exports = {
    buildNestedSetIndex,
}