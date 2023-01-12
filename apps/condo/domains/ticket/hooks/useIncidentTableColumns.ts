import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    Incident as IIncident,
} from '@app/condo/schema'

import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { useRouter } from 'next/router'
import { getSorterMap, parseQuery } from '../../common/utils/tables.utils'
import get from 'lodash/get'
import { getFilteredValue } from '../../common/utils/helpers'
import { ColumnsType } from 'antd/es/table/interface'
import { getFilterIcon } from '../../common/components/TableFilter'
import { getDateRender, getTableCellRenderer } from '../../common/components/Table/Renders'
import { IncidentProperty, IncidentTicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { ColumnType } from 'rc-table/lib/interface'
import { geOneAddressAndPropertiesCountRender } from '../../property/utils/clientSchema/Renders'
import { getManyClassifiersGroupByPlaceRender } from '../utils/clientSchema/Renders'


type UseTableColumnsPropsType <T = any> = {
    filterMetas: Array<FiltersMeta<T>>
    incidents: IIncident[]
}

type UseTableColumnsReturnType = {
    columns: ColumnsType<IIncident>
    loading: boolean
}

export type UseTableColumnsType = (props: UseTableColumnsPropsType) => UseTableColumnsReturnType

const COLUMNS_WIDTH = {
    number: '6%',
    properties: '19%',
    classifiers: '21%',
    details: '25%',
    status: '9%',
    workStart: '10%',
    workFinish: '10%',
}

// todo(DOMA-2567) add translations
export const useIncidentTableColumns: UseTableColumnsType = (props)  => {
    const { incidents, filterMetas } = props

    const intl = useIntl()
    const NumberLabel = '№'
    const PropertiesLabel = 'Адреса'
    const ClassifiersLabel = 'Классификатор'
    const DetailsLabel = 'Описание'
    const StatusLabel = 'Статус'
    const WorkStartLabel = 'Начало работ'
    const WorkFinishLabel = 'Завершение работ'
    const AllPropertiesMessage = 'Все дома?'

    const incidentIds = useMemo(() => incidents.map(incident => incident.id), [incidents])

    const {
        loading: incidentPropertiesLoading,
        objs: incidentProperties,
    } = IncidentProperty.useAllObjects({
        where: {
            incident: { id_in: incidentIds, deletedAt: null },
            deletedAt: null,
        },
    })

    const {
        loading: incidentClassifiersLoading,
        objs: incidentClassifiers,
    } = IncidentTicketClassifier.useAllObjects({
        where: {
            incident: { id_in: incidentIds, deletedAt: null },
            deletedAt: null,
        },
    })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')

    const renderNumber = useCallback(() => getTableCellRenderer(), [])
    const renderDetails = useCallback(() => getTableCellRenderer(), [])
    const renderStatus = useCallback(() => getTableCellRenderer(), [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const renderWorkStart = useCallback(() => getDateRender(intl), [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const renderWorkFinish = useCallback(() => getDateRender(intl), [])

    const renderProperties: ColumnType<IIncident>['render'] = useCallback((_, incident) => {
        if (get(incident, 'hasAllProperties')) {
            return AllPropertiesMessage
        }

        const properties = incidentProperties
            .filter(item => get(item, 'incident.id') === incident.id)
            .map(item => item.property)

        // todo(DOMA-2567) fix function name
        return geOneAddressAndPropertiesCountRender(search)(intl, properties)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incidentProperties, search])

    const renderClassifiers: ColumnType<IIncident>['render'] = useCallback((_, incident) => {
        const classifiers = incidentClassifiers
            .filter(item => get(item, 'incident.id') === incident.id)
            .map(item => item.classifier)

        return getManyClassifiersGroupByPlaceRender()(classifiers)
    }, [incidentClassifiers])

    const loading = incidentPropertiesLoading || incidentClassifiersLoading

    return useMemo(() => ({
        loading,
        columns: [
            {
                title: NumberLabel,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: COLUMNS_WIDTH.number,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                filterIcon: getFilterIcon,
                render: renderNumber,
            },
            {
                title: PropertiesLabel,
                key: 'properties',
                width: COLUMNS_WIDTH.properties,
                render: renderProperties,
            },
            {
                title: ClassifiersLabel,
                key: 'classifiers',
                width: COLUMNS_WIDTH.classifiers,
                render: renderClassifiers,
            },
            {
                title: DetailsLabel,
                sortOrder: get(sorterMap, 'details'),
                filteredValue: getFilteredValue(filters, 'details'),
                dataIndex: 'details',
                key: 'details',
                width: COLUMNS_WIDTH.details,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'details'),
                filterIcon: getFilterIcon,
                render: renderDetails,
            },
            {
                title: StatusLabel,
                sortOrder: get(sorterMap, 'status'),
                filteredValue: getFilteredValue(filters, 'status'),
                dataIndex: 'status',
                key: 'status',
                width: COLUMNS_WIDTH.status,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'status'),
                filterIcon: getFilterIcon,
                render: renderStatus,
            },
            {
                title: WorkStartLabel,
                sortOrder: get(sorterMap, 'workStart'),
                filteredValue: getFilteredValue(filters, 'workStart'),
                dataIndex: 'workStart',
                key: 'workStart',
                width: COLUMNS_WIDTH.workStart,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'workStart'),
                filterIcon: getFilterIcon,
                render: renderWorkStart,
            },
            {
                title: WorkFinishLabel,
                sortOrder: get(sorterMap, 'workFinish'),
                filteredValue: getFilteredValue(filters, 'workFinish'),
                dataIndex: 'workFinish',
                key: 'workFinish',
                width: COLUMNS_WIDTH.workFinish,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'workFinish'),
                filterIcon: getFilterIcon,
                render: renderWorkFinish,
            },
        ],
    }), [filterMetas, filters, loading, renderClassifiers, renderDetails, renderNumber, renderProperties, renderStatus, renderWorkFinish, renderWorkStart, sorterMap])
}
