import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import { Check, Close, ShoppingCartPlus } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Space, Table, Tooltip, Typography, Tag } from '@open-condo/ui'
import type { GetTableData, TableColumn, TableRef, RenderTableCell } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { SUBSCRIPTION_PERIOD } from '@condo/domains/subscription/constants'
import { formatAmount } from '@condo/domains/subscription/utils/subscriptionPricing'

import styles from './SubscriptionFeatureTable.module.css'

import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'


const { publicRuntimeConfig: { subscriptionFeatureHelpLinks = {} } } = getConfig()

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
    /** Blocks repeated clicks on the trial button while a registration is already in progress */
    activateLoading?: boolean
    getRowBadge?: (row: CatalogRow) => RowBadge | null
    canManageSubscriptions: boolean
    /** Whether this table shows the plan the organization is actually on, not one opened just to compare */
    isViewingActivePlan: boolean
    /** Name of the plan currently on screen, spelled out for a capability this plan lacks but a higher one has */
    planName: string
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
    activateLoading,
    getRowBadge,
    canManageSubscriptions,
    isViewingActivePlan,
    planName,
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
    const NotInPlanMessage = intl.formatMessage({ id: 'subscription.featureTable.notInPlan' }, { planName })

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
            // Not sold on its own and not part of this plan either - it only comes bundled with a higher one
            priceContent = (
                <Typography.Text>
                    {row.includedInPlan ? FreeInPlanMessage : NotInPlanMessage}
                </Typography.Text>
            )
        } else if (showCartButton) {
            const cartButtons = (
                <Space size={8} wrap align='center'>
                    <Button
                        type='primary'
                        disabled={disabled}
                        size='medium'
                        icon={<ShoppingCartPlus size='small' />}
                        aria-label={AddToCartLabel}
                        onClick={() => onToggleRow(row)}
                    >
                        {priceText}
                    </Button>
                    {canTry && (
                        <Button 
                            type='accent'
                            disabled={disabled}
                            size='medium'
                            loading={activateLoading}
                            onClick={() => onTryRow(row)}
                        >
                            {TryFreeMessage}
                        </Button>
                    )}
                </Space>
            )
            priceContent = row.requiresSetupFeature ? (
                <Tooltip title={intl.formatMessage({ id: `subscription.featureTable.${row.requiresSetupFeature}.requiresSetup` as FormatjsIntl.Message['ids'] })}>
                    {/* disabled buttons swallow pointer events, the wrapper keeps the tooltip */}
                    <span className={styles.checkboxWrapper}>{cartButtons}</span>
                </Tooltip>
            ) : cartButtons
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
    }, [isRowSelected, isRowDisabled, canManageSubscriptions, getRowBadge, canTryRow, onTryRow, activateLoading, onToggleRow, intl, FreeInPlanMessage, NotInPlanMessage, AddToCartLabel])

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
        const blockedTooltip = isRowBlockedByMode(row) ? MixedStatusesTooltip : null
        const checkboxTooltip = row.includedInPlan ? IncludedTooltip : blockedTooltip

        return checkboxTooltip ? (
            <Tooltip title={checkboxTooltip}>
                {/* a disabled checkbox swallows pointer events, the wrapper keeps the tooltip */}
                <span className={styles.checkboxWrapper}>{checkbox}</span>
            </Tooltip>
        ) : checkbox
    }, [isRowSelected, isRowDisabled, canManageSubscriptions, onToggleRow, isRowBlockedByMode, IncludedTooltip, MixedStatusesTooltip])

    const renderAvailability = useCallback<RenderTableCell<CatalogRow>>((_, row) => {
        // On another plan just being compared, only what it actually bundles counts as available
        const isAvailable = row.includedInPlan
            || (isViewingActivePlan && (row.purchased || row.status?.type === 'renewalCancelled'))

        return isAvailable ? (
            <Check size='small' color={colors.green[5]} />
        ) : (
            <Tooltip title={NotIncludedTooltip}>
                <span className={styles.checkboxWrapper}>
                    <Close size='small' color={colors.gray[5]} />
                </span>
            </Tooltip>
        )
    }, [NotIncludedTooltip, isViewingActivePlan])

    const renderLabel = useCallback<RenderTableCell<CatalogRow, CatalogRow['label']>>((label, row) => {
        const helpLink = row.capabilities.map(capability => subscriptionFeatureHelpLinks[capability]).find(Boolean)

        return helpLink ? (
            <Typography.Link href={helpLink} target='_blank' size='medium'>{label}</Typography.Link>
        ) : (
            <Typography.Text size='medium'>{label}</Typography.Text>
        )
    }, [])

    const renderDescription = useCallback<RenderTableCell<CatalogRow, CatalogRow['description']>>((description) => (
        <Typography.Text>{description}</Typography.Text>
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

    // Table reads dataSource through a ref and only refetches on paging/sorting/filtering, so a new plan or period has to trigger it explicitly
    const tableRef = useRef<TableRef>(null)

    useEffect(() => {
        tableRef.current?.api.refetchData()
    }, [rows])

    if (rows.length === 0) return null

    return (
        <Table<CatalogRow>
            ref={tableRef}
            id='subscription-feature-table'
            dataSource={dataSource}
            columns={columns}
            getRowId={getRowId}
            pageSize={Math.max(rows.length, 1)}
        />
    )
}
