import { PaymentsFileWhereInput } from '@app/condo/schema'
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
import { getDayRangeFilter, getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'


const dateLoadFilter = getDayRangeFilter('dateLoad')
const acquiringContextFilter = getFilter(['context', 'id'], 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')
const paymentOrderFilter = getStringContainsFilter('paymentOrder')

const statusType = [PAYMENTS_FILE_NEW_STATUS, PAYMENTS_FILE_DOWNLOADED_STATUS]

export function usePaymentsFilesTableFilters ( organizationId: string ): FiltersMeta<PaymentsFileWhereInput>[] {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const DepositedDateMessage = intl.formatMessage({ id: 'DepositedDate' })
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
                filters: [dateLoadFilter, paymentOrderFilter],
                combineType: 'OR',
            },
            {
                keyword: 'dateLoad',
                filters: [dateLoadFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: DepositedDateMessage,
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
    }, [StartDateMessage, EndDateMessage, DepositedDateMessage, statusOptions, EnterStatusMessage, StatusTitle, organizationId, EnterTypeMessage, TypeMessage])

}
