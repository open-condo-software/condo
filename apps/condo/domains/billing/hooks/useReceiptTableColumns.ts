import { BillingReceipt, BillingReceiptWhereInput, BuildingUnitSubType } from '@app/condo/schema'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { TableColumn } from '@open-condo/ui'

import { getMoneyRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterComponentByKey, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getAddressDetails } from '@condo/domains/common/utils/helpers'

type ReceiptTableRow = BillingReceipt
type ReceiptColumn = TableColumn<ReceiptTableRow>
type ReceiptDataKey = Extract<ReceiptColumn, { dataKey: unknown }>['dataKey']

const receiptDataKey = <TKey extends ReceiptDataKey>(value: TKey): TKey => value

export const useReceiptTableColumns = (
    filterMetas: Array<TableFiltersMeta<BillingReceiptWhereInput>>,
    currencyCode: string
): ReceiptColumn[] => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const UnitNameTitle = intl.formatMessage({ id: 'field.UnitName' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const FullNameTitle = intl.formatMessage({ id: 'field.Holder' })
    const CategoryTitle = intl.formatMessage({ id: 'field.Category' })
    const DebtTitle = intl.formatMessage({ id: 'DebtOverpayment' })
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalPayment' })
    const PenaltyTitle = intl.formatMessage({ id: 'PaymentPenalty' })
    const ChargeTitle = intl.formatMessage({ id: 'Charged' })
    const PaidTitle = intl.formatMessage({ id: 'PaymentPaid' })

    return useMemo(() => {
        const renderAddressCell = (value: string, record: ReceiptTableRow, _index: number, globalFilter?: string) => {
            const property = get(record, 'property', {})
            const { streetPart, renderPostfix } = getAddressDetails(property)
            const addressLine = streetPart || get(property, 'address') || value

            return getTableCellRenderer({
                search: globalFilter,
                ellipsis: true,
                postfix: renderPostfix,
                extraPostfixProps: {
                    type: 'secondary',
                    style: { whiteSpace: 'pre-line' },
                },
            })(addressLine)
        }
        const renderTextCellWithoutTooltip = (value: string, _record: ReceiptTableRow, _index: number, globalFilter?: string) => {
            if (!value) return null

            return getTableCellRenderer({ search: globalFilter, ellipsis: true })(value)
        }
        const renderUnitNameCell = (value: string, record: ReceiptTableRow, _index: number, globalFilter?: string) => {
            const unitType = get(record, 'account.unitType', BuildingUnitSubType.Flat)
            const unitTypeMessage = unitType
                ? intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` as FormatjsIntl.Message['ids'] })
                : null

            return getTableCellRenderer({ search: globalFilter, ellipsis: true, extraTitle: unitTypeMessage + ' ' + value })(value)
        }
        const renderMoneyCell = getMoneyRender(intl, currencyCode)

        const allColumns: Record<string, ReceiptColumn> = {
            address: {
                header: AddressTitle,
                id: 'address',
                dataKey: receiptDataKey('property.address'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(filterMetas, 'address'),
                initialSize: '21%',
                render: renderAddressCell,
            },
            unitName: {
                header: UnitNameTitle,
                id: 'unitName',
                dataKey: receiptDataKey('account.unitName'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(filterMetas, 'unitName'),
                initialSize: '8%',
                render: renderUnitNameCell,
            },
            fullName: {
                header: FullNameTitle,
                id: 'fullName',
                dataKey: receiptDataKey('account.fullName'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(filterMetas, 'fullName'),
                initialSize: '18%',
                render: renderTextCellWithoutTooltip,
            },
            category: {
                header: CategoryTitle,
                id: 'category',
                dataKey: receiptDataKey('category.name'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(filterMetas, 'category'),
                initialSize: '10%',
                render: renderTextCellWithoutTooltip,
            },
            account: {
                header: AccountTitle,
                id: 'account',
                dataKey: receiptDataKey('account.number'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(filterMetas, 'account'),
                initialSize: '14%',
                render: renderTextCellWithoutTooltip,
            },
            balance: {
                header: DebtTitle,
                id: 'balance',
                dataKey: receiptDataKey('toPayDetails.balance'),
                enableSorting: false,
                initialVisibility: false,
                initialSize: '14%',
                render: renderMoneyCell,
            },
            penalty: {
                header: PenaltyTitle,
                id: 'penalty',
                dataKey: receiptDataKey('toPayDetails.penalty'),
                enableSorting: false,
                initialVisibility: false,
                initialSize: '13%',
                render: renderMoneyCell,
            },
            charge: {
                header: ChargeTitle,
                id: 'charge',
                dataKey: receiptDataKey('toPayDetails.charge'),
                enableSorting: false,
                initialSize: '12%',
                render: renderMoneyCell,
            },
            paid: {
                header: PaidTitle,
                id: 'paid',
                dataKey: receiptDataKey('toPayDetails.paid'),
                enableSorting: false,
                initialVisibility: false,
                initialSize: '12%',
                render: renderMoneyCell,
            },
            toPay: {
                header: ToPayTitle,
                id: 'toPay',
                dataKey: receiptDataKey('toPay'),
                enableSorting: true,
                initialSize: '12%',
                render: renderMoneyCell,
            },
        }
        return Object.values(allColumns)
    }, [
        AccountTitle,
        AddressTitle,
        CategoryTitle,
        ChargeTitle,
        DebtTitle,
        FullNameTitle,
        PaidTitle,
        PenaltyTitle,
        ToPayTitle,
        UnitNameTitle,
        currencyCode,
        filterMetas,
        intl,
    ])
}
