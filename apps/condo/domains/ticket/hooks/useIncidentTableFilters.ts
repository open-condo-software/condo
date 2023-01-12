import { ComponentType, FiltersMeta } from '../../common/utils/filters.utils'
import { IncidentWhereInput } from '../../../schema'
import { useMemo } from 'react'


type UseIncidentTableFiltersReturnType = Array<FiltersMeta<IncidentWhereInput>>
// todo(DOMA-2567) add translations
export const useIncidentTableFilters = (): UseIncidentTableFiltersReturnType => {
    const NumberMessage = 'NumberMessage'
    const DetailsMessage = 'DetailsMessage'
    const StatusMessage = 'StatusMessage'
    const WorkStartMessage = 'WorkStartMessage'
    const WorkFinishMessage = 'WorkFinishMessage'

    return useMemo((): UseIncidentTableFiltersReturnType => [
        {
            keyword: 'number',
            filters: [],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: NumberMessage,
                },
            },
        },
        {
            keyword: 'details',
            filters: [],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: DetailsMessage,
                },
            },
        },
        {
            keyword: 'status',
            filters: [],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: StatusMessage,
                },
            },
        },
        {
            keyword: 'workStart',
            filters: [],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: WorkStartMessage,
                },
            },
        },
        {
            keyword: 'workFinish',
            filters: [],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: WorkFinishMessage,
                },
            },
        },
    ], [])
}
