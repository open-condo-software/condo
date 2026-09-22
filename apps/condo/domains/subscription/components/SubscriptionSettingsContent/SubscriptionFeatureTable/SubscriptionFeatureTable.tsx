import React from 'react'

import { Check, Close, Plus } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Tooltip, Typography, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { SUBSCRIPTION_PERIOD } from '@condo/domains/subscription/constants'
import { formatAmount } from '@condo/domains/subscription/utils/subscriptionPricing'

import styles from './SubscriptionFeatureTable.module.css'

import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'


export type RowBadge = {
    text: string
    bgColor: string
}

type SubscriptionFeatureTableProps = {
    rows: ReadonlyArray<CatalogRow>
    period: PlanPeriod
    isRowSelected: (row: CatalogRow) => boolean
    isRowDisabled: (row: CatalogRow) => boolean
    /** Set when the row is disabled only because the selection holds features in another state */
    isRowBlockedByMode: (row: CatalogRow) => boolean
    onToggleRow: (row: CatalogRow) => void
    /** Set when a row can still be tried for free, which puts a trial button next to its price */
    canTryRow?: (row: CatalogRow) => boolean
    onTryRow?: (row: CatalogRow) => void
    getRowBadge?: (row: CatalogRow) => RowBadge | null
    canManageSubscriptions: boolean
}

type FeatureRowProps = Omit<SubscriptionFeatureTableProps, 'rows'> & {
    row: CatalogRow
}

const FeatureRow: React.FC<FeatureRowProps> = ({
    row,
    isRowSelected,
    isRowDisabled,
    isRowBlockedByMode,
    onToggleRow,
    canTryRow,
    onTryRow,
    getRowBadge,
    canManageSubscriptions,
}) => {
    const intl = useIntl()
    const FreeInPlanMessage = intl.formatMessage({ id: 'subscription.featureTable.freeInPlan' })
    const IncludedTooltip = intl.formatMessage({ id: 'subscription.featureTable.includedTooltip' })
    const NotIncludedTooltip = intl.formatMessage({ id: 'subscription.featureTable.notIncludedTooltip' })
    const MixedStatusesTooltip = intl.formatMessage({ id: 'subscription.featureTable.mixedStatusesTooltip' })
    const AddToCartLabel = intl.formatMessage({ id: 'subscription.featureTable.addToCart' })

    const TryFreeMessage = intl.formatMessage(
        { id: 'subscription.planCard.tryFree' },
        { formattedPrice: formatAmount(0, row.price?.currencyCode ?? 'RUB', intl.locale) }
    )

    const selected = isRowSelected(row)
    const disabled = isRowDisabled(row) || !canManageSubscriptions
    const badge = getRowBadge?.(row) ?? null
    const isAvailable = row.includedInPlan || row.purchased
    const hasOwnPrice = !row.includedInPlan && Boolean(row.price)

    const priceText = hasOwnPrice ? formatAmount(Number(row.price.price), row.price.currencyCode, intl.locale) : null

    // Adding the row to the cart turns its price into plain text: the action bar takes over from here
    const showCartButton = hasOwnPrice && row.purchasable && !selected
    const canTry = showCartButton && Boolean(canTryRow?.(row)) && Boolean(onTryRow)

    let priceContent: React.ReactNode
    if (!hasOwnPrice) {
        priceContent = <Typography.Text type='secondary'>{FreeInPlanMessage}</Typography.Text>
    } else if (showCartButton) {
        priceContent = (
            <div className={styles.priceActions}>
                <Button
                    type='primary'
                    compact
                    disabled={disabled}
                    icon={<Plus size='small' />}
                    aria-label={AddToCartLabel}
                    onClick={() => onToggleRow(row)}
                >
                    {priceText}
                </Button>
                {canTry && (
                    <Button type='secondary' compact onClick={() => onTryRow(row)}>
                        {TryFreeMessage}
                    </Button>
                )}
            </div>
        )
    } else {
        priceContent = <Typography.Text>{priceText}</Typography.Text>
    }

    const checkbox = (
        <Checkbox
            checked={selected}
            disabled={disabled}
            id={`subscription-feature-checkbox-${row.key}`}
            onChange={() => onToggleRow(row)}
        />
    )

    const checkboxTooltip = row.includedInPlan
        ? IncludedTooltip
        : isRowBlockedByMode(row) ? MixedStatusesTooltip : null

    return (
        <tr className={styles.row}>
            <td className={styles.checkboxCell}>
                {checkboxTooltip ? (
                    <Tooltip title={checkboxTooltip}>
                        {/* a disabled checkbox swallows pointer events, the wrapper keeps the tooltip */}
                        <span className={styles.checkboxWrapper}>{checkbox}</span>
                    </Tooltip>
                ) : checkbox}
            </td>
            <td className={styles.availabilityCell}>
                {isAvailable ? (
                    <Check size='small' color={colors.green[5]} />
                ) : (
                    <Tooltip title={NotIncludedTooltip}>
                        <span className={styles.checkboxWrapper}>
                            <Close size='small' color={colors.gray[5]} />
                        </span>
                    </Tooltip>
                )}
            </td>
            <td className={styles.labelCell}>
                <Typography.Text underline={!row.includedInPlan}>{row.label}</Typography.Text>
            </td>
            <td className={styles.descriptionCell}>
                <Typography.Text type='secondary'>{row.description}</Typography.Text>
            </td>
            <td className={styles.priceCell}>
                <div className={styles.priceContent}>
                    {priceContent}
                    {badge && (
                        <button
                            type='button'
                            className={styles.badgeButton}
                            disabled={disabled}
                            onClick={() => !selected && onToggleRow(row)}
                        >
                            <Tag bgColor={badge.bgColor} textColor={colors.white}>{badge.text}</Tag>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}

export const SubscriptionFeatureTable: React.FC<SubscriptionFeatureTableProps> = ({ rows, ...rowProps }) => {
    const intl = useIntl()
    const FeatureColumn = intl.formatMessage({ id: 'subscription.featureTable.column.feature' })
    const DescriptionColumn = intl.formatMessage({ id: 'subscription.featureTable.column.description' })
    const PriceColumn = intl.formatMessage({
        id: rowProps.period === SUBSCRIPTION_PERIOD.YEAR
            ? 'subscription.featureTable.column.price.year'
            : 'subscription.featureTable.column.price.month',
    })

    if (rows.length === 0) return null

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.checkboxCell} aria-label={FeatureColumn} />
                        <th className={styles.availabilityCell} />
                        <th className={styles.labelCell}>
                            <Typography.Text type='secondary' size='small'>{FeatureColumn}</Typography.Text>
                        </th>
                        <th className={styles.descriptionCell}>
                            <Typography.Text type='secondary' size='small'>{DescriptionColumn}</Typography.Text>
                        </th>
                        <th className={styles.priceCell}>
                            <Typography.Text type='secondary' size='small'>{PriceColumn}</Typography.Text>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <FeatureRow key={row.key} row={row} {...rowProps} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
