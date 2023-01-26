import { getTimeLeftMessage, getTimeLeftMessageType } from '@app/condo/pages/incident/[id]'
import { Incident as IIncident, IncidentStatusType } from '@app/condo/schema'
import { ColumnsType } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { ColumnType } from 'rc-table/lib/interface'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tag, Typography } from '@open-condo/ui'

import { getDateRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getOneAddressAndPropertiesCountRender } from '@condo/domains/property/utils/clientSchema/Renders'
import { INCIDENT_STATUS_COLORS } from '@condo/domains/ticket/constants/incident'
import { IncidentProperty, IncidentTicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { getManyClassifiersGroupByPlaceRender } from '@condo/domains/ticket/utils/clientSchema/Renders'


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


export const useIncidentTableColumns: UseTableColumnsType = (props)  => {
    const intl = useIntl()
    const NumberLabel = intl.formatMessage({ id: 'incident.index.tableColumns.number.label' })
    const PropertiesLabel = intl.formatMessage({ id: 'incident.index.tableColumns.properties.label' })
    const ClassifiersLabel = intl.formatMessage({ id: 'incident.index.tableColumns.classifiers.label' })
    const DetailsLabel = intl.formatMessage({ id: 'incident.index.tableColumns.details.label' })
    const StatusLabel = intl.formatMessage({ id: 'incident.index.tableColumns.status.label' })
    const WorkStartLabel = intl.formatMessage({ id: 'incident.index.tableColumns.workStart.label' })
    const WorkFinishLabel = intl.formatMessage({ id: 'incident.index.tableColumns.workFinish.label' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'incident.fields.properties.allSelected' })
    const ActualMessage = intl.formatMessage({ id: 'incident.status.actual' })
    const NotActualMessage = intl.formatMessage({ id: 'incident.status.notActual' })
    const OverdueMessage = intl.formatMessage({ id: 'incident.fields.workDate.overdue' }).toLowerCase()
    const TimeLeftMessage = intl.formatMessage({ id: 'incident.fields.workDate.timeLeft' }).toLowerCase()

    const { incidents, filterMetas } = props

    const incidentIds = useMemo(() => incidents.map(incident => incident.id), [incidents])

    const [incidentProperties, setIncidentProperties] = useState([])
    const [incidentClassifiers, setIncidentClassifiers] = useState([])
    const [loading, setLoading] = useState<boolean>(true)

    const {
        refetch: refetchIncidentProperty,
    } = IncidentProperty.useAllObjects({}, { skip: true })

    const {
        refetch: refetchIncidentTicketClassifier,
    } = IncidentTicketClassifier.useAllObjects({}, { skip: true })

    const getIncidentProperties = useCallback(async (incidentIds: string[]) => {
        if (incidentIds.length < 1) {
            return { incidentProperties: [] }
        }

        const response = await refetchIncidentProperty({
            where: {
                incident: { id_in: incidentIds, deletedAt: null },
                deletedAt: null,
            },
        })
        return { incidentProperties: response.data.objs }
    }, [])

    const getIncidentTicketClassifiers = useCallback(async (incidentIds: string[]) => {
        if (incidentIds.length < 1) {
            return { incidentClassifiers: [] }
        }

        const response = await refetchIncidentTicketClassifier({
            where: {
                incident: { id_in: incidentIds, deletedAt: null },
                deletedAt: null,
            },
        })
        return { incidentClassifiers: response.data.objs }
    }, [])

    const getPropertiesAndClassifiers = useCallback(async (incidentIds: string[]) => {
        setLoading(true)
        const { incidentProperties } = await getIncidentProperties(incidentIds)
        const { incidentClassifiers } = await getIncidentTicketClassifiers(incidentIds)
        setIncidentProperties(incidentProperties)
        setIncidentClassifiers(incidentClassifiers)
        setLoading(false)
    }, [getIncidentProperties, getIncidentTicketClassifiers])

    useEffect(() => {
        getPropertiesAndClassifiers(incidentIds)
    }, [getPropertiesAndClassifiers, incidentIds])

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')

    const renderNumber = useMemo(() => getTableCellRenderer(), [])

    const renderDetails = useMemo(() => getTableCellRenderer(), [])

    const renderStatus = useCallback((status, incident) => {
        const isActual = status === IncidentStatusType.Actual
        return (
            <Tag
                bgColor={INCIDENT_STATUS_COLORS[incident.status].background}
                textColor={INCIDENT_STATUS_COLORS[incident.status].text}
            >
                {isActual ? ActualMessage : NotActualMessage}
            </Tag>
        )
    }, [ActualMessage, NotActualMessage])

    const renderWorkStart = useMemo(() => getDateRender(intl), [intl])
    const renderWorkFinish = useCallback((stringDate: string, incident) => {
        const renderDate = getDateRender(intl)(stringDate)
        if (!stringDate) return renderDate

        const isActual = incident.status === IncidentStatusType.Actual
        const currentDate = dayjs().toISOString()
        const timeLeftMessageType = getTimeLeftMessageType({
            deadline: stringDate,
            isDefault: !isActual,
            startWithDate: currentDate,
        })
        const renderTimeLeftMessage = getTimeLeftMessage({
            show: isActual,
            deadline: incident.workFinish,
            startWithDate: currentDate,
            OverdueMessage,
            TimeLeftMessage,
        })

        return (
            <>
                {renderDate}
                <Typography.Text type={timeLeftMessageType}>
                    {renderTimeLeftMessage}
                </Typography.Text>
            </>
        )
    }, [OverdueMessage, TimeLeftMessage, intl])

    const renderProperties: ColumnType<IIncident>['render'] = useCallback((_, incident) => {
        if (get(incident, 'hasAllProperties')) {
            return AllPropertiesMessage
        }

        const properties = incidentProperties
            .filter(item => get(item, 'incident.id') === incident.id)
            .map(item => item.property)

        return getOneAddressAndPropertiesCountRender(search)(intl, properties)
    }, [AllPropertiesMessage, incidentProperties, intl, search])

    const renderClassifiers: ColumnType<IIncident>['render'] = useCallback((_, incident) => {
        const classifiers = incidentClassifiers
            .filter(item => get(item, 'incident.id') === incident.id)
            .map(item => item.classifier)

        return getManyClassifiersGroupByPlaceRender()(classifiers)
    }, [incidentClassifiers])

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
