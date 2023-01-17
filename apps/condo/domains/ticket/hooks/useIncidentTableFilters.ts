import { ComponentType, FilterComponentSize, FiltersMeta } from '../../common/utils/filters.utils'
import { IncidentWhereInput } from '../../../schema'
import { useMemo } from 'react'
import { getIncidentAttributesFilter } from '../utils/tables.utils'
import { INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL } from '../constants/incident'
import { useIntl } from '@open-condo/next/intl'
import { getDayRangeFilter, getFilter, getNumberFilter, getStringContainsFilter } from '../../common/utils/tables.utils'
import dayjs from 'dayjs'


const filterAttribute = getIncidentAttributesFilter([INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL])
const filterNumber = getNumberFilter('number')
const filterDetails = getStringContainsFilter('details')
const filterStatus = getFilter(['status'], 'array', 'string', 'in')
const filterWorkStartRange = getDayRangeFilter('workStart')
const filterWorkFinishRange = getDayRangeFilter('workFinish')

type UseIncidentTableFiltersReturnType = Array<FiltersMeta<IncidentWhereInput>>
// todo(DOMA-2567) add translations
export const useIncidentTableFilters = (): UseIncidentTableFiltersReturnType => {
    const intl = useIntl()
    const NumberMessage = 'NumberMessage'
    const DetailsMessage = 'DetailsMessage'
    const StatusMessage = 'StatusMessage'
    const WorkStartMessage = 'WorkStartMessage'
    const WorkFinishMessage = 'WorkFinishMessage'
    const ActualLabel = 'Актуальные'
    const NotActualLabel = 'Неактуальные'
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const AttributeLabel = 'AttributeLabel'
    // todo(DOMA-2587) change translates
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })

    const statusOptions = useMemo(() => [
        { label: ActualLabel, value: INCIDENT_STATUS_ACTUAL },
        { label: NotActualLabel, value: INCIDENT_STATUS_NOT_ACTUAL },
    ], [])

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
                type: ComponentType.Select,
                options: statusOptions,
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
                    disabledDate: (date) => false,
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
                    disabledDate: (date) => false,
                },
            },
        },
    ], [EndDateMessage, StartDateMessage, statusOptions])
}
