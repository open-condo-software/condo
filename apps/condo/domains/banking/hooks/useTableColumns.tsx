import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import {
    getTextRender,
    getMoneyRender,
    getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

import type { RenderReturnType } from '@condo/domains/common/components/Table/Renders'
import type { FilterValue } from 'antd/lib/table/interface'

const renderCategory = (intl, search: FilterValue | string, nullReplace: string) => {
    return function render (text: string, data): RenderReturnType {
        let costItem = nullReplace
        let costItemCategory = null

        if (!isNull(text)) {
            costItem = intl.formatMessage({ id: `banking.costItem.${text}.name` })
            costItemCategory = intl.formatMessage({ id: `banking.category.${get(data, 'costItem.category.name')}.name` })
        }

        const postfix = isNull(text) ? null : (
            <Typography.Text size='medium' type='secondary'>({costItemCategory})</Typography.Text>
        )

        return getTableCellRenderer({ search, ellipsis: true, postfix })(costItem)
    }
}

const renderDate = (intl, search?: FilterValue | string) => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
        const text = `${date.format('DD.MM.YYYY')}`

        return getTableCellRenderer({ search, ellipsis: true })(text)
    }
}

export function useTableColumns () {
    const intl = useIntl()
    const ContractorTitle = intl.formatMessage({ id: 'global.contractor' }, { isSingular: true })
    const TinTitle = intl.formatMessage({ id: 'global.tin' })
    const BankAccountTitle = intl.formatMessage({ id: 'global.bankAccount' })
    const CategoryTitle = intl.formatMessage({ id: 'global.category' })
    const NumberTitle = intl.formatMessage({ id: 'global.number' })
    const DateTitle = intl.formatMessage({ id: 'date' })
    const ReceiverTitle = intl.formatMessage({ id: 'global.receiver' })
    const PaymentPurposeTitle = intl.formatMessage({ id: 'global.paymentPurpose' })
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const CategoryNotSetTitle = intl.formatMessage({ id: 'banking.table.notSet' })

    const router = useRouter()

    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    return useMemo(() => [
        [
            {
                title: NumberTitle,
                key: 'number',
                width: '10%',
                render: getTextRender(search),
                dataIndex: 'number',
            },
            {
                title: DateTitle,
                key: 'date',
                width: '10%',
                dataIndex: 'date',
                render: renderDate(intl, search),
            },
            {
                title: ReceiverTitle,
                key: 'receiver',
                width: '12%',
                render: getTextRender(search),
                dataIndex: ['contractorAccount', 'name'],
            },
            {
                title: BankAccountTitle,
                key:'bankAccount',
                width: '17%',
                render: getTextRender(search),
                dataIndex: ['account', 'number'],
            },
            {
                title: PaymentPurposeTitle,
                key: 'target',
                width: '18%',
                render: getTextRender(search),
                dataIndex: 'purpose',
            },
            {
                title: CategoryTitle,
                key: 'category',
                width: '14%',
                render: renderCategory(intl, search, CategoryNotSetTitle),
                dataIndex: ['costItem', 'name'],
            },
            {
                title: SumTitle,
                key: 'sum',
                width: '15%',
                render: getMoneyRender(intl, 'rub'),
                dataIndex: 'amount',
            },
        ],
        [
            {
                title: ContractorTitle,
                dataIndex: 'name',
                key: 'name',
                width: '20%',
                render: getTextRender(search),
            },
            {
                title: TinTitle,
                dataIndex: 'tin',
                key: 'tin',
                width: '20%',
                render: getTextRender(search),
            },
            {
                title: BankAccountTitle,
                dataIndex: 'number',
                key: 'number',
                width: '25%',
                render: getTextRender(search),
            },
            {
                title: CategoryTitle,
                dataIndex: ['costItem', 'name'],
                key: 'category',
                width: '35%',
                render: renderCategory(intl, search, CategoryNotSetTitle),
            },
        ],
    ], [search, ContractorTitle, TinTitle, BankAccountTitle, CategoryTitle, NumberTitle, CategoryNotSetTitle, intl,
        DateTitle, PaymentPurposeTitle, SumTitle, ReceiverTitle])
}
