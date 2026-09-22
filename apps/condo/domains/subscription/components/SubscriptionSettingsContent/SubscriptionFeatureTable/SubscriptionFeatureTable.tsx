import React, { useCallback, useMemo } from 'react'

import { Check, Close, Plus } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Space, Table, Tooltip, Typography, Tag } from '@open-condo/ui'
import type { GetTableData, TableColumn, RenderTableCell } from '@open-condo/ui'
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

const getRowId = (row: CatalogRow): string => row.key

export const SubscriptionFeatureTable: React.FC<SubscriptionFeatureTableProps> = ({
    rows,
    period,
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
    const FeatureColumn = intl.formatMessage({ id: 'subscription.featureTable.column.feature' })
    const DescriptionColumn = intl.formatMessage({ id: 'subscription.featureTable.column.description' })
    const PriceColumn = intl.formatMessage({
        id: period === SUBSCRIPTION_PERIOD.YEAR
            ? 'subscription.featureTable.column.price.year'
            : 'subscription.featureTable.column.price.month',
    })
    const IncludedTooltip = intl.formatMessage({ id: 'subscription.featureTable.includedTooltip' })
    const NotIncludedTooltip = intl.formatMessage({ id: 'subscription.featureTable.notIncludedTooltip' })
    const MixedStatusesTooltip = intl.formatMessage({ id: 'subscription.featureTable.mixedStatusesTooltip' })
    const AddToCartLabel = intl.formatMessage({ id: 'subscription.featureTable.addToCart' })
    const FreeInPlanMessage = intl.formatMessage({ id: 'subscription.featureTable.freeInPlan' })

    const renderPriceCell = useCallback((row: CatalogRow) => {
        const selected = isRowSelected(row)
        const disabled = isRowDisabled(row) || !canManageSubscriptions
        const badge = getRowBadge?.(row) ?? null
        const hasOwnPrice = !row.includedInPlan && Boolean(row.price)
        const priceText = hasOwnPrice ? formatAmount(Number(row.price.price), row.price.currencyCode, intl.locale) : null

        // Adding the row to the cart turns its price into plain text: the action bar takes over from here
        const showCartButton = hasOwnPrice && row.purchasable && !selected
        const canTry = showCartButton && Boolean(canTryRow?.(row)) && Boolean(onTryRow)
        const TryFreeMessage = intl.formatMessage(
            { id: 'subscription.planCard.tryFree' },
            { formattedPrice: formatAmount(0, row.price?.currencyCode ?? 'RUB', intl.locale) }
        )

        let priceContent: React.ReactNode
        if (!hasOwnPrice) {
            priceContent = <Typography.Text type='secondary'>{FreeInPlanMessage}</Typography.Text>
        } else if (showCartButton) {
            priceContent = (
                <Space size={8} wrap align='center'>
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
                </Space>
            )
        } else {
            priceContent = <Typography.Text>{priceText}</Typography.Text>
        }

        return (
            <Space size={8} wrap align='center'>
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
            </Space>
        )
    }, [isRowSelected, isRowDisabled, canManageSubscriptions, getRowBadge, canTryRow, onTryRow, onToggleRow, intl, FreeInPlanMessage, AddToCartLabel])

    const renderSelect = useCallback<RenderTableCell<CatalogRow>>((_, row) => {
        const selected = isRowSelected(row)
        const disabled = isRowDisabled(row) || !canManageSubscriptions
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

        return checkboxTooltip ? (
            <Tooltip title={checkboxTooltip}>
                {/* a disabled checkbox swallows pointer events, the wrapper keeps the tooltip */}
                <span className={styles.checkboxWrapper}>{checkbox}</span>
            </Tooltip>
        ) : checkbox
    }, [isRowSelected, isRowDisabled, canManageSubscriptions, onToggleRow, isRowBlockedByMode, IncludedTooltip, MixedStatusesTooltip])

    const renderAvailability = useCallback<RenderTableCell<CatalogRow>>((_, row) => (row.includedInPlan || row.purchased) ? (
        <Check size='small' color={colors.green[5]} />
    ) : (
        <Tooltip title={NotIncludedTooltip}>
            <span className={styles.checkboxWrapper}>
                <Close size='small' color={colors.gray[5]} />
            </span>
        </Tooltip>
    ), [NotIncludedTooltip])

    const renderLabel = useCallback<RenderTableCell<CatalogRow, CatalogRow['label']>>((label, row) => (
        <Typography.Text underline={!row.includedInPlan}>{label}</Typography.Text>
    ), [])

    const renderDescription = useCallback<RenderTableCell<CatalogRow, CatalogRow['description']>>((description) => (
        <Typography.Text type='secondary'>{description}</Typography.Text>
    ), [])

    const renderPrice = useCallback<RenderTableCell<CatalogRow>>((_, row) => renderPriceCell(row), [renderPriceCell])

    const columns = useMemo<TableColumn<CatalogRow>[]>(() => {
        const selectColumn: TableColumn<CatalogRow> = {
            id: 'select',
            header: '',
            enableSorting: false,
            enableColumnSettings: false,
            enableColumnResize: false,
            initialSize: 56,
            render: renderSelect,
        }
        const availabilityColumn: TableColumn<CatalogRow> = {
            id: 'availability',
            header: '',
            enableSorting: false,
            enableColumnSettings: false,
            enableColumnResize: false,
            initialSize: 40,
            render: renderAvailability,
        }
        const labelColumn: TableColumn<CatalogRow> = {
            id: 'label',
            dataKey: 'label',
            header: FeatureColumn,
            enableSorting: false,
            enableColumnSettings: false,
            initialSize: '22%',
            render: renderLabel,
        }
        const descriptionColumn: TableColumn<CatalogRow> = {
            id: 'description',
            dataKey: 'description',
            header: DescriptionColumn,
            enableSorting: false,
            enableColumnSettings: false,
            initialSize: '40%',
            render: renderDescription,
        }
        const priceColumn: TableColumn<CatalogRow> = {
            id: 'price',
            header: PriceColumn,
            enableSorting: false,
            enableColumnSettings: false,
            initialSize: '26%',
            render: renderPrice,
        }

        return [selectColumn, availabilityColumn, labelColumn, descriptionColumn, priceColumn]
    }, [renderSelect, renderAvailability, renderLabel, renderDescription, renderPrice, FeatureColumn, DescriptionColumn, PriceColumn])

    const dataSource = useCallback<GetTableData<CatalogRow>>(async () => ({
        rowData: rows as CatalogRow[],
        rowCount: rows.length,
    }), [rows])

    if (rows.length === 0) return null

    return (
        <Table<CatalogRow>
            id='subscription-feature-table'
            dataSource={dataSource}
            columns={columns}
            getRowId={getRowId}
            pageSize={Math.max(rows.length, 1)}
        />
    )
}
