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
export const paymentPeriodFilter = (search: QueryArgType): PaymentsFileWhereInput | undefined => {
    if (!Array.isArray(search) || search.length !== 2) return

    const rangeStart = dayjs(search[0])
    const rangeEnd = dayjs(search[1])
    if (!rangeStart.isValid() || !rangeEnd.isValid()) return

    return {
        AND: [
            { paymentPeriodEndDay_gte: rangeStart.format('YYYY-MM-DD') },
            { paymentPeriodStartDate_lte: rangeEnd.format('YYYY-MM-DD') },
        ],
    }
}
const registryNumberFilter = getFilter('number', 'array', 'number', 'in')
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
    const RegistryNumberMessage = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.registryNumber' })
    const RegistryNumberPlaceholder = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.registryNumber.placeholder' })
    const TypeMessage = intl.formatMessage({ id: 'pages.condo.payments.type' })
    const EnterTypeMessage = intl.formatMessage({ id: 'pages.condo.payments.enterType' })
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
                keyword: 'number',
                filters: [registryNumberFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: RegistryNumberPlaceholder,
                        tokenSeparators: [',', ' '],
                    },
                    modalFilterComponentWrapper: {
                        label: RegistryNumberMessage,
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
                        placeholder: EnterTypeMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: TypeMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
        ]
    }, [StartDateMessage, EndDateMessage, FormationDateMessage, PaymentPeriodMessage, RegistryNumberMessage, RegistryNumberPlaceholder, statusOptions, EnterStatusMessage, StatusTitle, organizationId, EnterTypeMessage, TypeMessage])

}
