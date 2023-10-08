import { IncidentWhereInput } from '@app/condo/schema'
import { RangePickerProps } from 'antd/lib/date-picker/generatePicker'
import { Dayjs } from 'dayjs'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import {
    getDayRangeFilter,
    getFilter,
    getNumberFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL } from '@condo/domains/ticket/constants/incident'
import { getIncidentAttributesFilter } from '@condo/domains/ticket/utils/tables.utils'


const filterAttribute = getIncidentAttributesFilter([INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL])
const filterNumber = getNumberFilter('number')
const filterDetails = getStringContainsFilter('details')
const filterStatus = getFilter(['status'], 'array', 'string', 'in')
const filterWorkStartRange = getDayRangeFilter('workStart')
const filterWorkFinishRange = getDayRangeFilter('workFinish')

export type UseIncidentTableFiltersReturnType = Array<FiltersMeta<IncidentWhereInput>>

export const disabledDate: RangePickerProps<Dayjs>['disabledDate'] = () => false

export const useIncidentTableFilters = (): UseIncidentTableFiltersReturnType => {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'incident.index.filter.number.placeholder' })
    const DetailsMessage = intl.formatMessage({ id: 'incident.index.filter.details.placeholder' })
    const StatusMessage = intl.formatMessage({ id: 'incident.index.filter.status.placeholder' })
    const ActualLabel = intl.formatMessage({ id: 'incident.index.filter.attributes.actual.label' })
    const NotActualLabel = intl.formatMessage({ id: 'incident.index.filter.attributes.notActual.label' })
    const StartDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.start' })
    const EndDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.end' })

    const statusOptions = useMemo(() => [
        { label: ActualLabel, value: INCIDENT_STATUS_ACTUAL },
        { label: NotActualLabel, value: INCIDENT_STATUS_NOT_ACTUAL },
    ], [ActualLabel, NotActualLabel])

    return useMemo((): UseIncidentTableFiltersReturnType => [
        {
            keyword: 'attributes',
            filters: [filterAttribute],
        },
        {
            keyword: 'number',
            filters: [filterNumber],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: NumberMessage,
                },
            },
        },
        {
            keyword: 'details',
            filters: [filterDetails],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: DetailsMessage,
                },
            },
        },
        {
            keyword: 'status',
            filters: [filterStatus],
            component: {
                type: ComponentType.Select,
                options: statusOptions,
                props: {
                    mode: 'multiple',
                    showArrow: true,
                    placeholder: StatusMessage,
                },
            },
        },
        {
            keyword: 'workStart',
            filters: [filterWorkStartRange],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: [StartDateMessage, EndDateMessage],
                    disabledDate,
                },
            },
        },
        {
            keyword: 'workFinish',
            filters: [filterWorkFinishRange],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: [StartDateMessage, EndDateMessage],
                    disabledDate,
                },
            },
        },
    ], [DetailsMessage, EndDateMessage, NumberMessage, StartDateMessage, StatusMessage, statusOptions])
}
