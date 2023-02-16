import {
    Incident as IIncident,
    IncidentClassifier,
    IncidentStatusType,
    IncidentClassifierIncident as IIncidentClassifierIncident,
    IncidentProperty as IIncidentProperty,
} from '@app/condo/schema'
import { FilterValue } from 'antd/es/table/interface'
import { EllipsisConfig } from 'antd/es/typography/Base'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { ColumnType } from 'rc-table/lib/interface'
import React from 'react'
import { IntlShape } from 'react-intl/src/types'

import { Tag, Typography } from '@open-condo/ui'

import { getDateRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getTimeLeftMessage, getTimeLeftMessageType } from '@condo/domains/common/utils/date.utils'
import { getOneAddressAndPropertiesCountRender } from '@condo/domains/property/utils/clientSchema/Renders'
import { INCIDENT_STATUS_COLORS } from '@condo/domains/ticket/constants/incident'


type GetRenderType = ColumnType<IIncident>['render']

type GetRenderNumberType = () => GetRenderType

type GetRenderOrganizationType = () => GetRenderType

type GetRenderDetailsType = () => GetRenderType

type GetRenderStatusType = (intl: IntlShape) => GetRenderType

type GetRenderWorkStartType = (intl: IntlShape) => GetRenderType

type GetRenderWorkFinishType = (intl: IntlShape) => GetRenderType

type GetRenderPropertiesType = (intl: IntlShape, search: FilterValue, incidentProperties: IIncidentProperty[]) => GetRenderType

type GetRenderClassifiersType = (incidentClassifiers: IIncidentClassifierIncident[]) => GetRenderType


const CELL_ELLIPSIS_SETTINGS: EllipsisConfig = { rows: 4, expandable: false }


export const getRenderNumber: GetRenderNumberType = () => getTableCellRenderer()

export const getRenderOrganization: GetRenderOrganizationType = () => getTableCellRenderer()

export const getRenderDetails: GetRenderDetailsType = () => getTableCellRenderer('', CELL_ELLIPSIS_SETTINGS)

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
            <Typography.Text type={timeLeftMessageType}>
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
        .map(item => item.property)

    return getOneAddressAndPropertiesCountRender(search)(intl, properties)
}

export const getManyIncidentClassifiersGroupByPlaceRender = (ellipsis?: boolean | EllipsisConfig) => {
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

        return getTableCellRenderer(null, ellipsis)(text)
    }
}

export const getRenderClassifiers: GetRenderClassifiersType = (incidentClassifiers) => (_, incident) => {
    const classifiers = incidentClassifiers
        .filter(item => get(item, 'incident.id') === incident.id)
        .map(item => item.classifier)

    return getManyIncidentClassifiersGroupByPlaceRender(CELL_ELLIPSIS_SETTINGS)(classifiers)
}
