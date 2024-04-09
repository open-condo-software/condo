import {
    Incident as IIncident,
    IncidentProperty as IIncidentProperty,
    IncidentClassifierIncident as IIncidentClassifierIncident,
} from '@app/condo/schema'
import { ColumnsType } from 'antd/es/table/interface'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { UseIncidentTableFiltersReturnType } from '@condo/domains/ticket/hooks/useIncidentTableFilters'
import { IncidentProperty, IncidentClassifierIncident } from '@condo/domains/ticket/utils/clientSchema'
import {
    getRenderClassifiers,
    getRenderDetails,
    getRenderNumber,
    getRenderProperties,
    getRenderStatus,
    getRenderWorkFinish,
    getRenderWorkStart,
} from '@condo/domains/ticket/utils/clientSchema/IncidentRenders'


type UseTableColumnsPropsType = {
    filterMetas: UseIncidentTableFiltersReturnType
    incidents: IIncident[]
}

type UseTableColumnsReturnType = {
    columns: ColumnsType<IIncident>
    loading: boolean
}

type UseLoadRelatedDataReturnType = {
    incidentProperties: IIncidentProperty[]
    incidentClassifiers: IIncidentClassifierIncident[]
    loading: boolean
}

export type UseTableColumnsType = (props: UseTableColumnsPropsType) => UseTableColumnsReturnType
type UseIncidentRelatedDataType = (incidents: IIncident[]) => UseLoadRelatedDataReturnType

export const useIncidentRelatedData: UseIncidentRelatedDataType = (incidents) => {
    const incidentIds = useMemo(() => incidents.map(incident => incident.id), [incidents])

    const [incidentProperties, setIncidentProperties] = useState<IIncidentProperty[]>([])
    const [incidentClassifiers, setIncidentClassifiers] = useState<IIncidentClassifierIncident[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    const {
        refetch: refetchIncidentProperty,
    } = IncidentProperty.useAllObjects({}, { skip: true })

    const {
        refetch: refetchIncidentClassifierIncident,
    } = IncidentClassifierIncident.useAllObjects({}, { skip: true })

    const getIncidentProperties = useCallback(async (incidentIds: string[]) => {
        if (incidentIds.length < 1) {
            return { incidentProperties: [] }
        }

        const response = await refetchIncidentProperty({
            where: {
                incident: { id_in: incidentIds },
            },
        })
        return { incidentProperties: get(response, 'data.objs', []) }
    }, [])

    const getIncidentClassifierIncidents = useCallback(async (incidentIds: string[]) => {
        if (incidentIds.length < 1) {
            return { incidentClassifiers: [] }
        }

        const response = await refetchIncidentClassifierIncident({
            where: {
                incident: { id_in: incidentIds },
            },
        })
        return { incidentClassifiers: get(response, 'data.objs', []) }
    }, [])

    const getPropertiesAndClassifiers = useCallback(async (incidentIds: string[]) => {
        setLoading(true)
        const { incidentProperties } = await getIncidentProperties(incidentIds)
        const { incidentClassifiers } = await getIncidentClassifierIncidents(incidentIds)
        setIncidentProperties(incidentProperties)
        setIncidentClassifiers(incidentClassifiers)
        setLoading(false)
    }, [getIncidentProperties, getIncidentClassifierIncidents])

    useEffect(() => {
        getPropertiesAndClassifiers(incidentIds)
    }, [getPropertiesAndClassifiers, incidentIds])

    return useMemo(() => ({
        incidentProperties,
        incidentClassifiers,
        loading,
    }), [incidentClassifiers, incidentProperties, loading])
}

const COLUMNS_WIDTH = {
    number: '6%',
    properties: '19%',
    classifiers: '21%',
    details: '25%',
    status: '9%',
    workStart: '10%',
    workFinish: '10%',
}

export const useIncidentTableColumns: UseTableColumnsType = (props)  => {
    const intl = useIntl()
    const NumberLabel = intl.formatMessage({ id: 'incident.index.tableColumns.number.label' })
    const PropertiesLabel = intl.formatMessage({ id: 'incident.index.tableColumns.properties.label' })
    const ClassifiersLabel = intl.formatMessage({ id: 'incident.index.tableColumns.classifiers.label' })
    const DetailsLabel = intl.formatMessage({ id: 'incident.index.tableColumns.details.label' })
    const StatusLabel = intl.formatMessage({ id: 'incident.index.tableColumns.status.label' })
    const WorkStartLabel = intl.formatMessage({ id: 'incident.index.tableColumns.workStart.label' })
    const WorkFinishLabel = intl.formatMessage({ id: 'incident.index.tableColumns.workFinish.label' })

    const { incidents, filterMetas } = props

    const { incidentClassifiers, incidentProperties, loading } = useIncidentRelatedData(incidents)
    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')

    const renderNumber = useMemo(() => getRenderNumber(), [])
    const renderDetails = useMemo(() => getRenderDetails(), [])
    const renderStatus = useMemo(() => getRenderStatus(intl), [intl])
    const renderWorkStart = useMemo(() => getRenderWorkStart(intl), [intl])
    const renderWorkFinish = useMemo(() => getRenderWorkFinish(intl), [intl])
    const renderProperties = useMemo(() => getRenderProperties(intl, search, incidentProperties), [intl, search, incidentProperties])
    const renderClassifiers = useMemo(() => getRenderClassifiers(incidentClassifiers), [incidentClassifiers])

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
                sorter: true,
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
                sorter: true,
                width: COLUMNS_WIDTH.workStart,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'workStart'),
                filterIcon: getFilterIcon,
                render: renderWorkStart,
                ellipsis: true,
            },
            {
                title: WorkFinishLabel,
                sortOrder: get(sorterMap, 'workFinish'),
                filteredValue: getFilteredValue(filters, 'workFinish'),
                dataIndex: 'workFinish',
                key: 'workFinish',
                sorter: true,
                width: COLUMNS_WIDTH.workFinish,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'workFinish'),
                filterIcon: getFilterIcon,
                render: renderWorkFinish,
            },
        ],
    }), [ClassifiersLabel, DetailsLabel, NumberLabel, PropertiesLabel, StatusLabel, WorkFinishLabel, WorkStartLabel, filterMetas, filters, loading, renderClassifiers, renderDetails, renderNumber, renderProperties, renderStatus, renderWorkFinish, renderWorkStart, sorterMap])
}
