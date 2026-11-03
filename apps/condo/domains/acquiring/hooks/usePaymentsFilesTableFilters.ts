import { PaymentsFileWhereInput } from '@app/condo/schema'
import dayjs from 'dayjs'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PAYMENTS_FILE_NEW_STATUS, PAYMENTS_FILE_DOWNLOADED_STATUS } from '@condo/domains/acquiring/constants/constants'
import { searchAcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema/search'
import {
    ComponentType,
    convertToOptions,
    FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import { getDayRangeFilter, getFilter, getStringContainsFilter, QueryArgType } from '@condo/domains/common/utils/tables.utils'


const loadedAtFilter = getDayRangeFilter('loadedAt')
const CALENDAR_DAY_PREFIX_REGEXP = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/

const parseCalendarDay = (value: string): dayjs.Dayjs | undefined => {
    const match = CALENDAR_DAY_PREFIX_REGEXP.exec(value)
    if (!match) return

    const [, year, month, day] = match
    const calendarDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    if (
        calendarDate.getUTCFullYear() !== Number(year)
        || calendarDate.getUTCMonth() !== Number(month) - 1
        || calendarDate.getUTCDate() !== Number(day)
    ) return

    const parsedDate = dayjs(value)
    return parsedDate.isValid() ? parsedDate : undefined
}

export const paymentPeriodFilter = (search: QueryArgType): PaymentsFileWhereInput | undefined => {
    if (!Array.isArray(search) || search.length !== 2) return

    const rangeStart = parseCalendarDay(search[0])
    const rangeEnd = parseCalendarDay(search[1])
    if (!rangeStart || !rangeEnd) return
    if (rangeStart.isAfter(rangeEnd)) {
        return {
            paymentPeriodStartDate_gt: rangeStart.format('YYYY-MM-DD'),
            paymentPeriodStartDate_lt: rangeEnd.format('YYYY-MM-DD'),
        }
    }

    return {
        AND: [
            { paymentPeriodEndDay_gte: rangeStart.format('YYYY-MM-DD') },
            { paymentPeriodStartDate_lte: rangeEnd.format('YYYY-MM-DD') },
        ],
    }
}
export const paymentOrderNumbersFilter = getFilter('paymentOrder', 'array', 'string', 'in')
const acquiringContextFilter = getFilter(['context', 'id'], 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')
const paymentOrderFilter = getStringContainsFilter('paymentOrder')

const statusType = [PAYMENTS_FILE_NEW_STATUS, PAYMENTS_FILE_DOWNLOADED_STATUS]

export function usePaymentsFilesTableFilters ( organizationId: string ): FiltersMeta<PaymentsFileWhereInput>[] {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const FormationDateMessage = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.formationDate' })
    const PaymentPeriodMessage = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.paymentPeriod' })
    const PaymentOrderMessage = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.paymentOrder' })
    const PaymentOrderPlaceholder = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.paymentOrder.placeholder' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const EnterSourceMessage = intl.formatMessage({ id: 'pages.condo.payments.enterSource' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })
    const EnterStatusMessage = intl.formatMessage({ id: 'pages.condo.payments.enterStatus' })

    const statuses = statusType.map((item) => ({
        name: intl.formatMessage({ id: `accrualsAndPayments.payments.type.registry.status.${item}` as FormatjsIntl.Message['ids'] }),
        id: item,
    }))
    const statusOptions = convertToOptions(statuses, 'name', 'id')

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [loadedAtFilter, paymentOrderFilter],
                combineType: 'OR',
            },
            {
                keyword: 'paymentPeriod',
                filters: [paymentPeriodFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: PaymentPeriodMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'loadedAt',
                filters: [loadedAtFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: FormationDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'paymentOrder',
                filters: [paymentOrderNumbersFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: PaymentOrderPlaceholder,
                        tokenSeparators: [',', ' '],
                    },
                    modalFilterComponentWrapper: {
                        label: PaymentOrderMessage,
                        size: FilterComponentSize.Medium,
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
                        placeholder: EnterStatusMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: StatusTitle,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'type',
                filters: [acquiringContextFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchAcquiringIntegration(organizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterSourceMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: SourceMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
        ]
    }, [StartDateMessage, EndDateMessage, FormationDateMessage, PaymentPeriodMessage, PaymentOrderMessage, PaymentOrderPlaceholder, statusOptions, EnterStatusMessage, StatusTitle, organizationId, EnterSourceMessage, SourceMessage])

}
