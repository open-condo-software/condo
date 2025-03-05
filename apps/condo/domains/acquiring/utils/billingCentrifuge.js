const { Big } = require('big.js')
const { get, set, omit } = require('lodash')

/**
 * @typedef {Object} TRecipient
 * @property {string} bankAccount
 * @property {string} [bankName]
 * @property {string} bic
 * @property {string} [classificationCode]
 * @property {string} [iec]
 * @property {string} [name]
 * @property {string} [offsettingAccount]
 * @property {string} [territoryCode]
 * @property {string} tin
 */

/**
 * @typedef {Object} TSplit
 * @property {TRecipient|null} recipient
 * @property {string} [amount] The amount without fee
 * @property {string} [feeAmount]
 */

/**
 * @typedef {Object} TDistribution
 * @property {TRecipient} recipient
 * @property {string} amount
 * @property {boolean} [isFeePayer]
 * @property {number} [order]
 * @property {boolean} [vor] Victim of rounding
 * @property {number} [overpaymentPart]
 */

/**
 * @typedef {Object} TSplitOptions
 * @property {TSplit[]} [appliedSplits] Needed for case when payments are partial
 * @property {number} [decimalPlaces] The country-specific setting - how many digits are placed after the delimiter in numbers. Default value is 2.
 * @property {string} [feeAmount]
 */

/**
 * @param {string} paymentAmount The amount paid by customer. May be less than sum of distributions in the case of partial pay.
 * @param {TDistribution[]} distribution
 * @param {TSplitOptions} [options]
 * @return {TSplit[]}
 */
function split (paymentAmount, distribution, options = {}) {
    const {
        /** @type {TSplit[]} */
        appliedSplits = [],
        decimalPlaces = 2,
        feeAmount = '0',
    } = options

    if (!hasOverpaymentReceivers(distribution)) {
        throw new Error('Distribution does not have at least one item with overpaymentPart value')
    }

    if (!areAllRecipientsUnique(distribution)) {
        throw new Error('Distribution contains not unique recipients')
    }

    const totalFeeAmount = Big(feeAmount)

    if (totalFeeAmount.gt(0) && !hasFeePayers(distribution)) {
        throw new Error('The distribution does not contains at least one fee payer (isFeePayer=true)')
    }

    let totalDistributionAmount = Big(0)
    // Group distributions by order and keep all keys (aka orders) in external variable
    const groupKeys = new Set()
    const groupedDistributions = distribution.reduce((res, d) => {
        const order = get(d, 'order', 0)
        const orderGroup = get(res, order, [])
        orderGroup.push(d)
        set(res, order, orderGroup)
        groupKeys.add(order)

        totalDistributionAmount = totalDistributionAmount.plus(d.amount)
        return res
    }, {})

    const sortedGroupKeys = Array.from(groupKeys.values()).sort((a, b) => a > b ? 1 : -1)

    let totalAppliedAmount = Big(0) // including fees

    const appliedAmounts = {}
    const appliedFeeAmounts = {}
    for (const split of appliedSplits) {
        // The recipient field of the applied split may not contain the value in the case there are no fee-payers in the previous distribution
        // Search "NO-FEE-PAYERS" in this file below
        if (!split.recipient) continue

        totalAppliedAmount = totalAppliedAmount.plus(split.amount || 0).plus(split.feeAmount || 0)

        const key = createRecipientKey(split.recipient)

        const appliedAmount = get(appliedAmounts, key, Big(0))
        appliedAmounts[key] = appliedAmount.plus(split.amount || 0)

        const appliedFeeAmount = get(appliedFeeAmounts, key, Big(0))
        appliedFeeAmounts[key] = appliedFeeAmount.plus(split.feeAmount || 0)
    }

    let restUndistributedAmount = Big(paymentAmount)

    /** @type TSplit[] */
    const splits = []

    for (const order of sortedGroupKeys) {
        const g = groupedDistributions[order]

        // Each group must contain a SINGLE item with vor=true
        if (!hasSingleVorItem(g)) {
            throw new Error(`Group ${order} does not contains a SINGLE element with vor=true`)
        }

        // vor-item must pay fee and receive overpayments
        const [vorItem] = getVorItems(g)
        if (totalFeeAmount.gt(0) && !vorItem.isFeePayer) {
            throw new Error('The victim of rounding (vor) must have isFeePayer=true')
        }
        if (!vorItem.overpaymentPart) {
            throw new Error('The victim of rounding (vor) must have overpaymentPart value')
        }

        const noopForGroupAmount = g.reduce((res, d) => {
            const key = createRecipientKey(d.recipient)
            return res
                .plus(get(appliedAmounts, key, Big(0)))
                .plus(get(appliedFeeAmounts, key, Big(0)))
        }, Big(0))
        let needToSplitToGroupAmount = g.reduce((res, d) => res.plus(Big(d.amount)), Big(0)).minus(noopForGroupAmount)

        if (needToSplitToGroupAmount.lte(0)) {
            needToSplitToGroupAmount = Big(0)
            continue
        }
        const hasEnoughAmountForGroup = needToSplitToGroupAmount.lte(restUndistributedAmount)
        const undistributedAmountAvailableForGroup = Big(restUndistributedAmount)

        /**
         * @type {TDistribution[]}
         * The victim of the rounding operation MUST be the last item within the group
         */
        const sortedGroup = g.sort((a, b) => a.vor ? 1 : -1)

        for (const d of sortedGroup) {
            const recipientKey = createRecipientKey(d.recipient)
            // The rest needed amount for particular recipient
            let distributionAmount = Big(d.amount)
                .minus(get(appliedAmounts, recipientKey, Big(0)))
                .minus(get(appliedFeeAmounts, recipientKey, Big(0)))

            let share = hasEnoughAmountForGroup ? distributionAmount : distributionAmount.div(needToSplitToGroupAmount).times(undistributedAmountAvailableForGroup)

            if (share.lte(0)) {
                continue
            }

            const roundedShare = share.round(decimalPlaces, Big.roundHalfUp)
            restUndistributedAmount = restUndistributedAmount.minus(roundedShare)

            /** @type {TSplit} */
            let split
            if (hasEnoughAmountForGroup) {
                split = {
                    recipient: d.recipient,
                    amount: roundedShare.toString(),
                }
            } else if (d.vor) {
                // `hasEnoughAmountForGroup=false` means that this is the last group of recipients to split amount for
                // Also, this means that VOR-item gets rounding result (the rest undistributed amount)

                // if this is the last recipient within sorted group (vor=true)
                split = {
                    recipient: d.recipient,
                    amount: roundedShare.plus(restUndistributedAmount).toString(),
                }
                restUndistributedAmount = Big(0)
            } else {
                split = {
                    recipient: d.recipient,
                    amount: roundedShare.toString(),
                }
            }

            splits.push(split)
        }

        if (restUndistributedAmount.lte(0)) {
            break
        }
    }

    /** @type {Record<string, TDistribution>} */
    const distributionsByKey = distribution.reduce((res, d) => {
        const key = createRecipientKey(d.recipient)
        res[key] = d

        return res
    }, {})

    //
    // Distribute overpayment
    //
    let restUndistributedOverpaymentAmount = totalAppliedAmount.plus(paymentAmount).minus(totalDistributionAmount)
    if (restUndistributedOverpaymentAmount.gt(0)) {
        const totalOverpaymentAmount = Big(restUndistributedOverpaymentAmount)

        let totalOverpaymentReceiversParts = 0
        for (const d of distribution) {
            const key = createRecipientKey(d.recipient)
            if (distributionsByKey[key].overpaymentPart) {
                totalOverpaymentReceiversParts += distributionsByKey[key].overpaymentPart
            }
        }
        const distributionsWithOverpayment = distribution
            .filter((d) => !!d.overpaymentPart)
            // The victim of the rounding operation MUST be the last item
            // If there are several vor-item here, sort by order
            .sort((a, b) => (a.vor && b.vor) ? a.order - b.order : (a.vor ? 1 : -1))

        for (let i = 0; i < distributionsWithOverpayment.length; i++) {
            const d = distributionsWithOverpayment[i]
            const recipientKey = createRecipientKey(d.recipient)
            const splitIndex = splits.findIndex((split) => recipientKey === createRecipientKey(split.recipient))
            const isLast = i + 1 >= distributionsWithOverpayment.length
            const overpaymentShare = isLast ? restUndistributedOverpaymentAmount : Big(d.overpaymentPart).div(totalOverpaymentReceiversParts).times(totalOverpaymentAmount)
            const roundedOverpaymentShare = overpaymentShare.round(decimalPlaces, Big.roundHalfUp)
            restUndistributedOverpaymentAmount = isLast ? Big(0) : restUndistributedOverpaymentAmount.minus(roundedOverpaymentShare)
            if (splitIndex >= 0) {
                const newAmount = Big(splits[splitIndex].amount || 0).plus(roundedOverpaymentShare)
                splits[splitIndex].amount = newAmount.toString()
            } else {
                splits.push({
                    recipient: d.recipient,
                    amount: roundedOverpaymentShare.toString(),
                })
            }
        }
    }

    //
    // Extract fee from splits
    //
    let restUndistributedFeeAmount = Big(feeAmount)
    if (restUndistributedFeeAmount.gt(0)) {
        let feePayersTotalSharesAmount = Big(0)
        const splitsWithFeePayerIndexes = []
        for (let i = 0; i < splits.length; i++) {
            const split = splits[i]
            const key = createRecipientKey(split.recipient)
            if (distributionsByKey[key].isFeePayer) {
                feePayersTotalSharesAmount = feePayersTotalSharesAmount.plus(split.amount || 0)
                splitsWithFeePayerIndexes.push(i)
            }
        }

        // The victim of the rounding operation MUST be the last item within the group
        const sortedSplitsWithFeePayerIndexes = splitsWithFeePayerIndexes.sort((a, b) => distributionsByKey[createRecipientKey(splits[a].recipient)].vor ? 1 : -1)

        if (sortedSplitsWithFeePayerIndexes.length > 0) {
            for (const i of sortedSplitsWithFeePayerIndexes) {
                const recipientKey = createRecipientKey(splits[i].recipient)
                const d = distributionsByKey[recipientKey]
                if (!d.isFeePayer) {
                    continue
                }

                const isLast = i + 1 >= splits.length
                const feeShare = isLast ? restUndistributedFeeAmount : Big(splits[i].amount).div(feePayersTotalSharesAmount).times(totalFeeAmount)
                const roundedFeeShare = feeShare.round(decimalPlaces, Big.roundHalfUp)
                restUndistributedFeeAmount = isLast ? Big(0) : restUndistributedFeeAmount.minus(roundedFeeShare)
                splits[i].feeAmount = roundedFeeShare.toString()
                const newAmount = Big(splits[i].amount).minus(roundedFeeShare)
                if (newAmount.lt(0)) {
                    throw new Error(`Recipient ${JSON.stringify(splits[i].recipient)} has amount=${splits[i].amount} and feeAmount=${splits[i].feeAmount}`)
                }
                splits[i].amount = newAmount.toString()
            }
        } else {
            // There are no receivers who must pay fee, but feeAmount was set.
            // So we decrease origin sum and distribute without fee
            // Than add extracted fee to separated split without recipient
            // Search "NO-FEE-PAYERS" in this file above
            const splitsWithoutFee = split(Big(paymentAmount).minus(feeAmount).toString(), distribution, omit(options, ['feeAmount']))
            splitsWithoutFee.push({
                recipient: null,
                feeAmount,
            })

            return splitsWithoutFee
        }
    }

    return splits
}

/**
 * @param {TDistribution[]} g
 * @returns {TDistribution[]}
 */
function getVorItems (g) {
    return g.filter((d) => !!d.vor)
}

/**
 * @param {TDistribution[]} g
 * @returns {boolean}
 */
function hasSingleVorItem (g) {
    return getVorItems(g).length === 1
}

/**
 * @param {TDistribution[]} g
 * @returns {TDistribution[]}
 */
function getOverpaymentItems (g) {
    return g.filter((d) => !!d.overpaymentPart)
}

/**
 * @param {TDistribution[]} g
 * @returns {boolean}
 */
function hasOverpaymentReceivers (g) {
    return getOverpaymentItems(g).length > 0
}

/**
 * @param {TDistribution[]} g
 * @returns {TDistribution[]}
 */
function getFeePayers (g) {
    return g.filter((d) => d.isFeePayer)
}

/**
 * @param {TDistribution[]} g
 * @returns {boolean}
 */
function hasFeePayers (g) {
    return getFeePayers(g).length > 0
}

/**
 * @param {TRecipient} recipient
 * @returns {string}
 */
function createRecipientKey (recipient) {
    return `${recipient.tin}_${recipient.bic}_${recipient.bankAccount}`
}

/**
 * @param {TDistribution[]} distribution
 * @returns {boolean}
 */
function areAllRecipientsUnique (distribution) {
    const uniqRecipientsKeys = new Set(distribution.map((d) => createRecipientKey(d.recipient)))

    return uniqRecipientsKeys.size === distribution.length
}

module.exports = {
    split,
    getVorItems,
    hasSingleVorItem,
    hasOverpaymentReceivers,
    createRecipientKey,
    hasFeePayers,
    areAllRecipientsUnique,
}
