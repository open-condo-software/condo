import {
    Incident as IIncident,
    IncidentClassifier,
    IncidentStatusType,
    IncidentClassifierIncident as IIncidentClassifierIncident,
    IncidentProperty as IIncidentProperty,
} from '@app/condo/schema'
import { TableColumnType } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import React from 'react'
import { IntlShape } from 'react-intl/src/types'

import { Tag, Typography } from '@open-condo/ui'

import { getDateRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getTimeLeftMessage, getTimeLeftMessageType } from '@condo/domains/common/utils/date.utils'
import { getOneAddressAndPropertiesCountRender } from '@condo/domains/property/utils/clientSchema/Renders'
import { INCIDENT_STATUS_COLORS } from '@condo/domains/ticket/constants/incident'


type GetRenderType = TableColumnType<IIncident>['render']

type GetRenderNumberType = () => GetRenderType

type GetRenderOrganizationType = () => GetRenderType

type GetRenderDetailsType = () => GetRenderType

type GetRenderStatusType = (intl: IntlShape) => GetRenderType

type GetRenderWorkStartType = (intl: IntlShape) => GetRenderType

type GetRenderWorkFinishType = (intl: IntlShape) => GetRenderType

type GetRenderPropertiesType = (intl: IntlShape, search: FilterValue, incidentProperties: IIncidentProperty[]) => GetRenderType

type GetRenderClassifiersType = (incidentClassifiers: IIncidentClassifierIncident[]) => GetRenderType


const MAX_CELL_CONTENT_LENGTH = 150


export const getRenderNumber: GetRenderNumberType = () => (number, incident) =>
    getTableCellRenderer({ href: `/incident/${incident.id}`, underline: false })(number)

export const getRenderOrganization: GetRenderOrganizationType = () => getTableCellRenderer()

export const getRenderDetails: GetRenderDetailsType = () => (details) =>  {
    const trimmedText = String(details).length > MAX_CELL_CONTENT_LENGTH ? `${String(details).substring(0, MAX_CELL_CONTENT_LENGTH)}…` : details
    return getTableCellRenderer({ extraTitle: details })(trimmedText)
}

export const getRenderStatus: GetRenderStatusType = (intl) => (status, incident) => {
    const ActualMessage = intl.formatMessage({ id: 'incident.status.actual' })
    const NotActualMessage = intl.formatMessage({ id: 'incident.status.notActual' })

    const isActual = status === IncidentStatusType.Actual
    return (
        <Tag
            bgColor={INCIDENT_STATUS_COLORS[incident.status].background}
            textColor={INCIDENT_STATUS_COLORS[incident.status].text}
        >
            {isActual ? ActualMessage : NotActualMessage}
        </Tag>
    )
}

export const getRenderWorkStart: GetRenderWorkStartType = (intl) => getDateRender(intl)

export const getRenderWorkFinish: GetRenderWorkFinishType = (intl) => (stringDate, incident) => {
    const OverdueMessage = intl.formatMessage({ id: 'incident.fields.workDate.overdue' }).toLowerCase()
    const TimeLeftMessage = intl.formatMessage({ id: 'incident.fields.workDate.timeLeft' }).toLowerCase()

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
            <Typography.Text type={timeLeftMessageType} size='medium'>
                {renderTimeLeftMessage}
            </Typography.Text>
        </>
    )
}

export const getRenderProperties: GetRenderPropertiesType = (intl, search, incidentProperties) => (_, incident) => {
    const AllPropertiesMessage = intl.formatMessage({ id: 'incident.fields.properties.allSelected' })

    if (get(incident, 'hasAllProperties')) {
        return AllPropertiesMessage
    }

    const properties = incidentProperties
        .filter(item => get(item, 'incident.id') === incident.id)
        .map(item => ({
            id: get(item, 'property.id', null),
            address: get(item, 'property.address', get(item, 'propertyAddress', null)),
            addressMeta: get(item, 'property.addressMeta', get(item, 'propertyAddressMeta', null)),
            deletedAt: get(item, 'property.deletedAt', true),
        }))

    return getOneAddressAndPropertiesCountRender(search)(intl, properties)
}

export const getManyIncidentClassifiersGroupByPlaceRender = () => {
    return (classifiers: IncidentClassifier[]): React.ReactElement => {
        const categoryNames = uniqBy(classifiers
            .map(item => item.category)
            .filter(Boolean), (item) => item.id)
            .map(item => item.name)

        const problemNames = uniqBy(classifiers
            .map(item => item.problem)
            .filter(Boolean), (item) => item.id)
            .map(item => item.name)

        if (isEmpty(categoryNames)) {
            return null
        }

        const categoriesPart = `${categoryNames.join(', ')}`
        const problemsPart = !isEmpty(problemNames) ? ` » ${problemNames.join(', ')}` : ''

        const text = `${categoriesPart}${problemsPart}`
        const trimmedText = text.length > MAX_CELL_CONTENT_LENGTH ? `${text.substring(0, MAX_CELL_CONTENT_LENGTH)}…` : text

        return getTableCellRenderer({ extraTitle: text })(trimmedText)
    }
}

export const getRenderClassifiers: GetRenderClassifiersType = (incidentClassifiers) => (_, incident) => {
    const classifiers = incidentClassifiers
        .filter(item => get(item, 'incident.id') === incident.id)
        .map(item => item.classifier)

    return getManyIncidentClassifiersGroupByPlaceRender()(classifiers)
}
