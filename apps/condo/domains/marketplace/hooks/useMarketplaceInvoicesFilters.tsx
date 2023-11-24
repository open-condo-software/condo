import { InvoiceWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    ComponentType,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    getDayRangeFilter, getFilter, getNumberFilter,
} from '@condo/domains/common/utils/tables.utils'
import { INVOICE_PAYMENT_TYPES, INVOICE_STATUSES } from '@condo/domains/marketplace/constants'


const createdAtRangeFilter = getDayRangeFilter('createdAt')
const numberFilter = getNumberFilter('number')
const paymentTypeFilter = getFilter('paymentType', 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')

const getTranslationToValueFilter = (field, fieldTranslationsToValueMap) => (search) => {
    if (!search) return

    const value = search.toUpperCase()

    for (const translation of Object.keys(fieldTranslationsToValueMap)) {
        if (value === translation.toUpperCase()) {
            return {
                [field]: fieldTranslationsToValueMap[translation],
            }
        }
    }

    return {}
}

export function useMarketplaceInvoicesFilters (): Array<FiltersMeta<InvoiceWhereInput>>  {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })

    const paymentTypeOptions = useMemo(() => INVOICE_PAYMENT_TYPES.map(type => ({
        label: intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.payment.${type}` }),
        value: type,
    })), [intl])

    const statusOptions = useMemo(() => INVOICE_STATUSES.map(status => ({
        label: intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.${status}` }),
        value: status,
    })), [intl])

    const paymentTypeTranslationsToValue = useMemo(() => INVOICE_PAYMENT_TYPES.reduce((acc, type) => {
        acc[intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.payment.${type}` })] = type
        return acc
    }, {}), [intl])
    const paymentTypeSearchFilter = getTranslationToValueFilter('paymentType', paymentTypeTranslationsToValue)
    const statusTranslationsToValue = useMemo(() => INVOICE_STATUSES.reduce((acc, status) => {
        acc[intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.${status}` })] = status
        return acc
    }, {}), [intl])
    const statusSearchFilter = getTranslationToValueFilter('status', statusTranslationsToValue)

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [createdAtRangeFilter, numberFilter, paymentTypeSearchFilter, statusSearchFilter],
                combineType: 'OR',
            },
            {
                keyword: 'createdAt',
                filters: [createdAtRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                },
            },
            {
                keyword: 'number',
                filters: [numberFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: NumberMessage,
                    },
                },
            },
            {
                keyword: 'paymentType',
                filters: [paymentTypeFilter],
                component: {
                    type: ComponentType.Select,
                    options: paymentTypeOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                },
            },
            {
                keyword: 'status',
                filters: [statusFilter],
                component: {
                    type: ComponentType.Select,
                    options: statusOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                },
            },
        ]
    }, [EndDateMessage, NumberMessage, SelectMessage, StartDateMessage, paymentTypeOptions, statusOptions])
}