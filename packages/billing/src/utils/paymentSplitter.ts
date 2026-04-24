import { Big } from 'big.js'

export type Recipient = {
    tin: string
    bic: string
    bankAccount: string
    bankName?: string
    classificationCode?: string
    iec?: string
    name?: string
    offsettingAccount?: string
    territoryCode?: string
}

export type Split = {
    recipient: Recipient | null
    /**
     * The amount without fee
     */
    amount?: string
    feeAmount?: string
}

export type DistributionItem = {
    recipient: Recipient
    amount: string
    isFeePayer?: boolean
    order?: number
    /** Victim of rounding */
    vor?: boolean
    overpaymentPart?: number
}

export type SplitOptions = {
    /** Needed for case when payments are partial */
    appliedSplits?: Split[]
    /** The country-specific setting - how many digits are placed after the delimiter in numbers. Default value is 2. */
    decimalPlaces?: number
    feeAmount?: string
}

/**
 * @param {string} paymentAmount The amount paid by customer. May be less than sum of distributions in the case of partial pay.
 * @param {DistributionItem[]} distribution
 * @param {SplitOptions} [options]
 * @return {Split[]}
 */
export function split (paymentAmount: string, distribution: DistributionItem[], options: SplitOptions = {}): Split[] {
    const {
        /** @type {Split[]} */
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
    const groupKeys = new Set<number>()
    const groupedDistributions = distribution.reduce<Record<number, DistributionItem[]>>((res, d) => {
        const order = d.order || 0
        const orderGroup = res[order] || []
        orderGroup.push(d)
        res[order] = orderGroup
        groupKeys.add(order)

        totalDistributionAmount = totalDistributionAmount.plus(d.amount)
        return res
    }, {})

    const sortedGroupKeys = Array.from(groupKeys.values()).sort((a, b) => a - b)

    let totalAppliedAmount = Big(0) // including fees

    const appliedAmounts: Record<string, Big> = {}
    const appliedFeeAmounts: Record<string, Big> = {}
    for (const split of appliedSplits) {
        // The recipient field of the applied split may not contain the value in the case there are no fee-payers in the previous distribution
        // Search "NO-FEE-PAYERS" in this file below
        if (!split.recipient) continue

        totalAppliedAmount = totalAppliedAmount.plus(split.amount || 0).plus(split.feeAmount || 0)

        const key = createRecipientKey(split.recipient)

        const appliedAmount = appliedAmounts[key] || Big(0)
        appliedAmounts[key] = appliedAmount.plus(split.amount || 0)

        const appliedFeeAmount = appliedFeeAmounts[key] || Big(0)
        appliedFeeAmounts[key] = appliedFeeAmount.plus(split.feeAmount || 0)
    }

    let restUndistributedAmount = Big(paymentAmount)

    const splits: Split[] = []

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

        const alreadyAppliedForGroupAmount = g.reduce((res, d) => {
            const key = createRecipientKey(d.recipient)
            return res
                .plus(appliedAmounts[key] || 0)
                .plus(appliedFeeAmounts[key] || 0)
        }, Big(0))
        let needToSplitToGroupAmount = g.reduce((res, d) => res.plus(Big(d.amount)), Big(0)).minus(alreadyAppliedForGroupAmount)

        if (needToSplitToGroupAmount.lte(0)) {
            needToSplitToGroupAmount = Big(0)
            continue
        }
        const hasEnoughAmountForGroup = needToSplitToGroupAmount.lte(restUndistributedAmount)
        const undistributedAmountAvailableForGroup = Big(restUndistributedAmount)

        /**
         * The victim of the rounding operation MUST be the last item within the group
         */
        const sortedGroup: DistributionItem[] = g.sort((a) => a.vor ? 1 : -1)

        for (const d of sortedGroup) {
            const recipientKey = createRecipientKey(d.recipient)
            // The rest needed amount for particular recipient
            const distributionAmount = Big(d.amount)
                .minus(appliedAmounts[recipientKey] || 0)
                .minus(appliedFeeAmounts[recipientKey] || 0)

            const share = hasEnoughAmountForGroup ? distributionAmount : distributionAmount.div(needToSplitToGroupAmount).times(undistributedAmountAvailableForGroup)

            if (share.lte(0)) {
                continue
            }

            const roundedShare = share.round(decimalPlaces, Big.roundHalfUp)
            restUndistributedAmount = restUndistributedAmount.minus(roundedShare)

            let split: Split
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

    const distributionsByKey: Record<string, DistributionItem> = distribution.reduce<Record<string, DistributionItem>>((res, d) => {
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
            .sort(sortByVorAndOrderComparator)

        for (let i = 0; i < distributionsWithOverpayment.length; i++) {
            const d = distributionsWithOverpayment[i]
            const recipientKey = createRecipientKey(d.recipient)
            const splitIndex = splits.findIndex((split) => recipientKey === createRecipientKey(split.recipient))
            const isLast = i + 1 >= distributionsWithOverpayment.length
            const overpaymentShare = isLast ? restUndistributedOverpaymentAmount : Big(d.overpaymentPart || 0).div(totalOverpaymentReceiversParts).times(totalOverpaymentAmount)
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
        const splitsWithFeePayerIndexes: number[] = []
        for (let i = 0; i < splits.length; i++) {
            const split = splits[i]
            const key = createRecipientKey(split.recipient)
            if (distributionsByKey[key].isFeePayer) {
                feePayersTotalSharesAmount = feePayersTotalSharesAmount.plus(split.amount || 0)
                splitsWithFeePayerIndexes.push(i)
            }
        }

        // The victim of the rounding operation MUST be the last item within the group
        const sortedSplitsWithFeePayerIndexes = splitsWithFeePayerIndexes.sort((a, b) => {
            const dA = distributionsByKey[createRecipientKey(splits[a].recipient)]
            const dB = distributionsByKey[createRecipientKey(splits[b].recipient)]
            return sortByVorAndOrderComparator(dA, dB)
        })

        if (sortedSplitsWithFeePayerIndexes.length > 0) {
            for (const [index, i] of sortedSplitsWithFeePayerIndexes.entries()) {
                const recipientKey = createRecipientKey(splits[i].recipient)
                const d = distributionsByKey[recipientKey]
                if (!d.isFeePayer) {
                    continue
                }

                const isLast = index + 1 >= sortedSplitsWithFeePayerIndexes.length
                const feeShare = isLast ? restUndistributedFeeAmount : Big(splits[i].amount || 0).div(feePayersTotalSharesAmount).times(totalFeeAmount)
                const roundedFeeShare = feeShare.round(decimalPlaces, Big.roundHalfUp)
                restUndistributedFeeAmount = isLast ? Big(0) : restUndistributedFeeAmount.minus(roundedFeeShare)
                splits[i].feeAmount = roundedFeeShare.toString()
                const newAmount = Big(splits[i].amount || 0).minus(roundedFeeShare)
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { feeAmount: _, ...optionsWithoutFeeAmount } = options
            const splitsWithoutFee = split(Big(paymentAmount).minus(feeAmount).toString(), distribution, optionsWithoutFeeAmount)
            splitsWithoutFee.push({
                recipient: null,
                feeAmount,
            })

            return splitsWithoutFee
        }
    }

    return splits
}

export function getVorItems (g: DistributionItem[]): DistributionItem[] {
    return g.filter((d) => !!d.vor)
}

export function hasSingleVorItem (g: DistributionItem[]): boolean {
    return getVorItems(g).length === 1
}

function getOverpaymentItems (g: DistributionItem[]): DistributionItem[] {
    return g.filter((d) => !!d.overpaymentPart)
}

export function hasOverpaymentReceivers (g: DistributionItem[]): boolean {
    return getOverpaymentItems(g).length > 0
}

function getFeePayers (g: DistributionItem[]): DistributionItem[] {
    return g.filter((d) => d.isFeePayer)
}

export function hasFeePayers (g: DistributionItem[]): boolean {
    return getFeePayers(g).length > 0
}

export function createRecipientKey (recipient: Recipient | null): string {
    if (!recipient) {
        return ''
    }
    return `${recipient.tin}_${recipient.bic}_${recipient.bankAccount}`
}

export function areAllRecipientsUnique (distribution: DistributionItem[]): boolean {
    const uniqRecipientsKeys = new Set(distribution.map((d) => createRecipientKey(d.recipient)))

    return uniqRecipientsKeys.size === distribution.length
}

export function sortByVorAndOrderComparator (a: DistributionItem, b: DistributionItem): number {
    // ^ = xor
    // false ^ false = false
    // false ^ true = true
    // true ^ false = true
    // true ^ true = false
    return ((a.vor ? 1 : 0) ^ (b.vor ? 1 : 0))
        ? (a.vor ? 1 : -1)
        : ((a.order || 0) - (b.order || 0))
}
