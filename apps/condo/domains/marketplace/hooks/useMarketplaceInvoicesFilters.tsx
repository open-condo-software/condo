import { InvoiceWhereInput } from '@app/condo/schema'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    ComponentType,
    FiltersMeta,
    FilterComponentSize,
} from '@condo/domains/common/utils/filters.utils'
import {
    getDayRangeFilter, getFilter, getNumberFilter,
} from '@condo/domains/common/utils/tables.utils'
import { INVOICE_PAYMENT_TYPES, INVOICE_STATUSES } from '@condo/domains/marketplace/constants'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'


const createdAtRangeFilter = getDayRangeFilter('createdAt')
const numberFilter = getNumberFilter('number')
const paymentTypeFilter = getFilter('paymentType', 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')
const ticketNumberFilter = getNumberFilter(['ticket', 'number'])
const propertyFilter = getFilter(['property', 'id'], 'array', 'string', 'in')
const unitFilter = getFilter('unitName', 'array', 'string', 'in')

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
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.filters.EnterAddress' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const EnterUnitNameMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.filters.EnterUnitName' })
    const UnitMessage = intl.formatMessage({ id: 'field.FlatNumber' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const paymentTypeOptions = useMemo(() => INVOICE_PAYMENT_TYPES.map(type => ({
        label: intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.payment.${type}` as FormatjsIntl.Message['ids'] }),
        value: type,
    })), [intl])

    const statusOptions = useMemo(() => INVOICE_STATUSES.map(status => ({
        label: intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.${status}` as FormatjsIntl.Message['ids'] }),
        value: status,
    })), [intl])

    const paymentTypeTranslationsToValue = useMemo(() => INVOICE_PAYMENT_TYPES.reduce((acc, type) => {
        const message = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.payment.${type}` as FormatjsIntl.Message['ids'] })
        acc[message] = type
        return acc
    }, {}), [intl])
    const paymentTypeSearchFilter = getTranslationToValueFilter('paymentType', paymentTypeTranslationsToValue)
    const statusTranslationsToValue = useMemo(() => INVOICE_STATUSES.reduce((acc, status) => {
        const message = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.${status}` as FormatjsIntl.Message['ids'] })
        acc[message] = status
        return acc
    }, {}), [intl])
    const statusSearchFilter = getTranslationToValueFilter('status', statusTranslationsToValue)

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [createdAtRangeFilter, numberFilter, paymentTypeSearchFilter, statusSearchFilter, ticketNumberFilter],
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
                keyword: 'ticket',
                filters: [ticketNumberFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: NumberMessage,
                    },
                },
            },
            {
                keyword: 'property',
                filters: [propertyFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchOrganizationProperty(userOrganizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterAddressMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: AddressMessage,
                        size: FilterComponentSize.MediumLarge,
                    },
                    columnFilterComponentWrapper: {
                        width: '400px',
                    },
                },
            },
            {
                keyword: 'unitName',
                filters: [unitFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: EnterUnitNameMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: UnitMessage,
                        size: FilterComponentSize.Small,
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
    }, [EndDateMessage, NumberMessage, SelectMessage, StartDateMessage, userOrganizationId, paymentTypeOptions, statusOptions, AddressMessage, EnterAddressMessage, EnterUnitNameMessage, UnitMessage])
}