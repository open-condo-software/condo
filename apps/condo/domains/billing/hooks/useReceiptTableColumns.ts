import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { Sheet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'

import { IFilters } from '@condo/domains/billing/utils/helpers'
import { getFilterIcon, getTextFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getIconRender, getMoneyRender, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'

export const useReceiptTableColumns = <T>(filterMetas: Array<FiltersMeta<T>>, detailed: boolean, currencyCode: string) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'field.address' })
    const UnitNameTitle = intl.formatMessage({ id: 'field.unitName' })
    const AccountTitle = intl.formatMessage({ id: 'field.accountNumberShort' })
    const FullNameTitle = intl.formatMessage({ id: 'field.holder' })
    const CategoryTitle = intl.formatMessage({ id: 'field.category' })
    const DebtTitle = intl.formatMessage({ id: 'debtOverpayment' })
    const ToPayTitle = intl.formatMessage({ id: 'field.totalPayment' })
    const PenaltyTitle = intl.formatMessage({ id: 'paymentPenalty' })
    const ChargeTitle = intl.formatMessage({ id: 'charged' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.shortFlatNumber' })
    const PaidTitle = intl.formatMessage({ id: 'paymentPaid' })
    const TooltipPDF = intl.formatMessage({ id: 'billing.receiptsTable.pdfTooltip' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const columns = {
            address: {
                title: AddressTitle,
                key: 'address',
                dataIndex: ['property', 'address'],
                sorter: false,
                filteredValue: get(filters, 'address'),
                width: detailed ? '25%' : '50%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown({ inputProps: { placeholder: AddressTitle } }),
                render: getTextRender(search),
            },
            unitName: {
                title: UnitNameTitle,
                key: 'unitName',
                dataIndex: ['account', 'unitName'],
                sorter: false,
                filteredValue: get(filters, 'unitName'),
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown({ inputProps: { placeholder: UnitNameTitle } }),
                width: '17%',
                render: getTextRender(search),
            },
            fullName: {
                title: FullNameTitle,
                key: 'fullName',
                dataIndex: ['account', 'fullName'],
                sorter: false,
                filteredValue: get(filters, 'fullName'),
                width: '18%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown({ inputProps: { placeholder: FullNameTitle } }),
                render: getTextRender(search),
            },
            category: {
                title: CategoryTitle,
                key: 'category',
                dataIndex: ['category', 'name'],
                sorter: false,
                filteredValue: getFilteredValue<IFilters>(filters, 'category'),
                width: '16%',
                filterIcon: getFilterIcon,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'category'),
                render: getTextRender(search),
            },
            account: {
                title: AccountTitle,
                key: 'account',
                dataIndex: ['account', 'number'],
                sorter: false,
                filteredValue: get(filters, 'account'),
                width: detailed ? '20%' : '30%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown({ inputProps: { placeholder: AccountTitle } }),
                render: getTextRender(search),
            },
            balance: {
                title: DebtTitle,
                key: 'balance',
                dataIndex: ['toPayDetails', 'balance'],
                sorter: false,
                width: '14%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
            penalty: {
                title: PenaltyTitle,
                key: 'penalty',
                dataIndex: ['toPayDetails', 'penalty'],
                sorter: false,
                width: '13%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
            charge: {
                title: ChargeTitle,
                key: 'charge',
                dataIndex: ['toPayDetails', 'charge'],
                sorter: false,
                width: '14%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
            paid: {
                title: PaidTitle,
                key: 'paid',
                dataIndex: ['toPayDetails', 'paid'],
                sorter: false,
                width: '14%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
            toPay: {
                title: ToPayTitle,
                key: 'toPay',
                dataIndex: ['toPay'],
                sorter: true,
                sortOrder: get(sorterMap, 'toPay'),
                width: detailed ? '13%' : '20%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
            pdf: {
                title: 'PDF',
                key: 'pdf',
                dataIndex: '',
                width: detailed ? '8%' : '10%',
                align: 'center',
                render: getIconRender(Sheet, '', TooltipPDF),
            },
        }

        return detailed
            ? [columns.address, columns.unitName, columns.fullName, columns.account, columns.category, columns.balance, columns.penalty, columns.charge, columns.paid, columns.toPay]
            : [columns.address, columns.unitName, columns.account, columns.toPay]
    }, [
        AddressTitle,
        FullNameTitle,
        UnitNameTitle,
        AccountTitle,
        ToPayTitle,
        DebtTitle,
        PaidTitle,
        PenaltyTitle,
        ChargeTitle,
        CategoryTitle,
        filters,
        sorterMap,
        ShortFlatNumber,
        TooltipPDF,
        detailed,
        currencyCode,
    ])
}
