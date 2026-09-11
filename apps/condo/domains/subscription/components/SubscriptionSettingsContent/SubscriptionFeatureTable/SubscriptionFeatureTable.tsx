import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Switch, Tooltip, Typography, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { SUBSCRIPTION_PERIOD } from '@condo/domains/subscription/constants'
import { formatAmount, isCustomPrice } from '@condo/domains/subscription/utils/subscriptionPricing'

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
    onToggleRow: (row: CatalogRow) => void
    getRowBadge?: (row: CatalogRow) => RowBadge | null
    canManageSubscriptions: boolean
}

type FeatureRowProps = Omit<SubscriptionFeatureTableProps, 'rows'> & {
    row: CatalogRow
}

const FeatureRow: React.FC<FeatureRowProps> = ({
    row,
    period,
    isRowSelected,
    isRowDisabled,
    onToggleRow,
    getRowBadge,
    canManageSubscriptions,
}) => {
    const intl = useIntl()
    const FreeInPlanMessage = intl.formatMessage({ id: 'subscription.featureTable.freeInPlan' })
    const IncludedTooltip = intl.formatMessage({ id: 'subscription.featureTable.includedTooltip' })

    const periodMessage = intl.formatMessage({
        id: `subscription.planCard.planPrice.${period}` as FormatjsIntl.Message['ids'],
    })

    const isOn = row.includedInPlan
        // a purchased row starts on and is turned off to cancel it
        ? true
        : row.purchased
            ? !isRowSelected(row)
            : isRowSelected(row)

    const disabled = isRowDisabled(row) || !canManageSubscriptions
    const badge = getRowBadge?.(row) ?? null

    const priceCell = row.includedInPlan || !row.price || isCustomPrice(row.price)
        ? <Typography.Text type='secondary'>{FreeInPlanMessage}</Typography.Text>
        : (
            <>
                <Typography.Text>{formatAmount(Number(row.price.price), row.price.currencyCode, intl.locale)}</Typography.Text>
                <Typography.Text type='secondary'>{` /${periodMessage}`}</Typography.Text>
            </>
        )

    const toggle = (
        <Switch
            size='large'
            checked={isOn}
            disabled={disabled}
            id={`subscription-feature-toggle-${row.key}`}
            onChange={() => onToggleRow(row)}
        />
    )

    return (
        <tr className={styles.row}>
            <td className={styles.toggleCell}>
                {row.includedInPlan ? (
                    <Tooltip title={IncludedTooltip}>
                        {/* a disabled switch swallows pointer events, the wrapper keeps the tooltip */}
                        <span className={styles.toggleWrapper}>{toggle}</span>
                    </Tooltip>
                ) : toggle}
            </td>
            <td className={styles.labelCell}>
                <Typography.Text underline={!row.includedInPlan}>{row.label}</Typography.Text>
            </td>
            <td className={styles.descriptionCell}>
                <Typography.Text type='secondary'>{row.description}</Typography.Text>
            </td>
            <td className={styles.priceCell}>
                <div className={styles.priceContent}>
                    <div>{priceCell}</div>
                    {badge && (
                        <span>
                            <Tag bgColor={badge.bgColor} textColor={colors.white}>{badge.text}</Tag>
                        </span>
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
                        <th className={styles.toggleCell} aria-label={FeatureColumn} />
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
