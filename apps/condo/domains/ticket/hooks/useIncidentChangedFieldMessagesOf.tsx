import { IncidentChange as IIncidentChange, IncidentStatusType } from '@app/condo/schema'
import { Typography } from 'antd'
import dayjs from 'dayjs'
import { has, isNil } from 'lodash'
import React, { ComponentProps } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ChangeHistory } from '@condo/domains/common/components/ChangeHistory'

import { SafeUserMention } from '../../common/components/ChangeHistory/SafeUserMention'
import { Tooltip } from '../../common/components/Tooltip'
import { INCIDENT_STATUS_COLORS } from '../constants/incident'
import { MAX_DESCRIPTION_DISPLAY_LENGTH } from '../constants/restrictions'

enum IncidentChangeFieldMessageType {
    From,
    To,
}

interface IIncidentChangeFieldMessages {
    add?: string,
    change?: string,
    remove?: string,
}

type UseIncidentChangedFieldMessagesOfType =
    (incidentChange: IIncidentChange) => ReturnType<ComponentProps<typeof ChangeHistory>['useChangedFieldMessagesOf']>


const DETAILS_TOOLTIP_STYLE: React.CSSProperties = { maxWidth: '80%' }

export const useIncidentChangedFieldMessagesOf: UseIncidentChangedFieldMessagesOfType = (incidentChange) => {
    const intl = useIntl()
    const DetailsMessage = intl.formatMessage({ id: 'incident.changeHistory.details' })
    const StatusMessage = intl.formatMessage({ id: 'incident.changeHistory.status' })
    const TextForResidentMessage = intl.formatMessage({ id: 'incident.changeHistory.textForResident' })
    const WorkStartMessage = intl.formatMessage({ id: 'incident.changeHistory.workStart' })
    const WorkFinishMessage = intl.formatMessage({ id: 'incident.changeHistory.workFinish' })
    const WorkTypeMessage = intl.formatMessage({ id: 'incident.changeHistory.workType' })
    const WorkTypeIsScheduledMessage = intl.formatMessage({ id: 'incident.changeHistory.workType.scheduled' })
    const WorkTypeIsNotScheduledMessage = intl.formatMessage({ id: 'incident.changeHistory.workType.notScheduled' })
    const WorkTypeIsEmergencyMessage = intl.formatMessage({ id: 'incident.changeHistory.workType.emergency' })
    const WorkTypeIsNotEmergencyMessage = intl.formatMessage({ id: 'incident.changeHistory.workType.notEmergency' })
    const ActualMessage = intl.formatMessage({ id: 'incident.status.actual' }).toLowerCase()
    const NotActualMessage = intl.formatMessage({ id: 'incident.status.notActual' }).toLowerCase()

    const fields: Array<{ fieldName: string, message: string, changeMessage?: IIncidentChangeFieldMessages }> = [
        { fieldName: 'details', message: DetailsMessage },
        { fieldName: 'status', message: StatusMessage },
        { fieldName: 'textForResident', message: TextForResidentMessage },
        { fieldName: 'workStart', message: WorkStartMessage },
        { fieldName: 'workFinish', message: WorkFinishMessage },
        { fieldName: 'isScheduled', message: WorkTypeMessage },
        { fieldName: 'isEmergency', message: WorkTypeMessage },
    ]

    const BooleanToString = {
        isScheduled: {
            'true': WorkTypeIsScheduledMessage,
            'false': WorkTypeIsNotScheduledMessage,
        },
        isEmergency: {
            'true': WorkTypeIsEmergencyMessage,
            'false': WorkTypeIsNotEmergencyMessage,
        },
    }

    const formatField = (field, value, type: IncidentChangeFieldMessageType) => {
        const formatterFor = {
            details: (field, value, type) => {
                const formattedValue = value.length > MAX_DESCRIPTION_DISPLAY_LENGTH ? (
                    <Tooltip
                        title={value}
                        placement='top'
                        overlayStyle={DETAILS_TOOLTIP_STYLE}
                    >
                        {value.slice(0, MAX_DESCRIPTION_DISPLAY_LENGTH) + '…'}
                    </Tooltip>
                ) : value
                return <Typography.Text>«{formattedValue}»</Typography.Text>
            },
            textForResident: (field, value, type) => {
                const formattedValue = value && value.length > MAX_DESCRIPTION_DISPLAY_LENGTH ? (
                    <Tooltip
                        title={value}
                        placement='top'
                        overlayStyle={DETAILS_TOOLTIP_STYLE}
                    >
                        {value.slice(0, MAX_DESCRIPTION_DISPLAY_LENGTH) + '…'}
                    </Tooltip>
                ) : value
                return <Typography.Text>«{formattedValue}»</Typography.Text>
            },
            status: (field, value, type) => {
                const isActual = value === IncidentStatusType.Actual
                const style = { color: INCIDENT_STATUS_COLORS[isActual ? IncidentStatusType.Actual : IncidentStatusType.NotActual].background }
                const formattedValue = <Typography.Text style={style}>{isActual ? ActualMessage : NotActualMessage}</Typography.Text>
                return <Typography.Text>«{formattedValue}»</Typography.Text>
            },
            workStart: (field, value, type) => {
                return <Typography.Text>{dayjs(value).format('DD MMMM YYYY')}</Typography.Text>
            },
            workFinish: (field, value, type) => {
                return <Typography.Text>{dayjs(value).format('DD MMMM YYYY')}</Typography.Text>
            },
        }

        return has(formatterFor, field)
            ? formatterFor[field](field, value, type)
            : <Typography.Text>{value}</Typography.Text>
    }

    const formatDiffMessage = (field, message, incidentChange, customMessages: IIncidentChangeFieldMessages = {}) => {
        if (typeof incidentChange[`${field}To`] === 'boolean') {
            const valueTo = BooleanToString[field][incidentChange[`${field}To`]]
            const formattedValueTo = formatField(field, valueTo, IncidentChangeFieldMessageType.To)
            const values = {
                field: message,
                to: formattedValueTo,
            }

            return (
                <>
                    <SafeUserMention changeValue={incidentChange}/>
                    &nbsp;
                    {/*
                        NOTE: We can't declare these translations at the beginning of the component,
                        because dynamic data is used for replace in templates
                     */}
                    {intl.formatMessage({ id: customMessages.change || 'incident.changeHistory.booleanChange' }, values)}
                </>
            )
        }

        const valueFrom = incidentChange[`${field}From`]
        const valueTo = incidentChange[`${field}To`]
        const isValueFromNotEmpty = !isNil(valueFrom)
        const isValueToNotEmpty = !isNil(valueTo)
        const formattedValueFrom = formatField(field, valueFrom, IncidentChangeFieldMessageType.From)
        const formattedValueTo = formatField(field, valueTo, IncidentChangeFieldMessageType.To)
        const values = {
            field: message,
            from: formattedValueFrom,
            to: formattedValueTo,
        }

        if (isValueFromNotEmpty && isValueToNotEmpty) {
            return (
                <>
                    <SafeUserMention changeValue={incidentChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.change || 'incident.changeHistory.change' }, values)}
                </>
            )
        } else if (isValueToNotEmpty) { // only "to" part
            return (
                <>
                    <SafeUserMention changeValue={incidentChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.add || 'incident.changeHistory.add' }, values)}
                </>
            )
        } else if (isValueFromNotEmpty) {
            return (
                <>
                    <SafeUserMention changeValue={incidentChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.remove || 'incident.changeHistory.remove' }, values)}
                </>
            )
        }
    }

    // Omit what was not changed
    const changedFields = fields.filter(({ fieldName }) => (
        incidentChange[`${fieldName}From`] !== null || incidentChange[`${fieldName}To`] !== null
    ))

    return changedFields
        .map(({ fieldName, message, changeMessage }) => ({
            field: fieldName,
            message: formatDiffMessage(fieldName, message, incidentChange, changeMessage),
        }))
}
