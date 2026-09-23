import React from 'react'

import { Tag, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { formatAmount } from '@condo/domains/subscription/utils/subscriptionPricing'

import styles from './PriceText.module.css'


type PriceTextProps = {
    amount: number
    fullAmount: number | null
    currencyCode: string | null
    locale: string
}

/** A discounted price is struck through and followed by the price actually paid, with the saving pinned above it */
export const PriceText: React.FC<PriceTextProps> = ({ amount, fullAmount, currencyCode, locale }) => {
    if (!fullAmount || fullAmount <= amount) return <>{formatAmount(amount, currencyCode, locale)}</>

    return (
        <>
            <Typography.Text strong delete>{formatAmount(fullAmount, currencyCode, locale)}</Typography.Text>
            {' '}
            <span className={styles.discountedPrice}>
                <span className={styles.discountedPriceBadge}>
                    <Tag bgColor={colors.green[5]} textColor={colors.white}>{`-${formatAmount(fullAmount - amount, currencyCode, locale)}`}</Tag>
                </span>
                <Typography.Text strong type='success'>{formatAmount(amount, currencyCode, locale)}</Typography.Text>
            </span>
        </>
    )
}
