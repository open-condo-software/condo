import { IncidentChange as IIncidentChange, IncidentStatusType } from '@app/condo/schema'
import React, { ComponentProps } from 'react'
import { ChangeHistory } from '@condo/domains/common/components/ChangeHistory'
import { useIntl } from '@open-condo/next/intl'
import { has, isNil } from 'lodash'
import { Typography } from 'antd'
import { Tooltip } from '../../common/components/Tooltip'
import { MAX_DESCRIPTION_DISPLAY_LENGTH } from '../constants/restrictions'
import { INCIDENT_STATUS_COLORS } from '../constants/incident'
import dayjs from 'dayjs'

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

// TODO(DOMA-2567) add translates
export const useIncidentChangedFieldMessagesOf: UseIncidentChangedFieldMessagesOfType = (incidentChange) => {
    const intl = useIntl()
    const DetailsMessage = 'DetailsMessage'
    const StatusMessage = 'StatusMessage'
    const TextForResidentMessage = 'TextForResidentMessage'
    const WorkStartMessage = 'WorkStartMessage'
    const WorkFinishMessage = 'WorkFinishMessage'
    const IsScheduledMessage = 'IsScheduledMessage'
    const IsEmergencyMessage = 'IsEmergencyMessage'

    const fields: Array<{ fieldName: string, message: string, changeMessage?: IIncidentChangeFieldMessages }> = [
        { fieldName: 'details', message: DetailsMessage },
        { fieldName: 'status', message: StatusMessage },
        { fieldName: 'textForResident', message: TextForResidentMessage },
        { fieldName: 'workStart', message: WorkStartMessage },
        { fieldName: 'workFinish', message: WorkFinishMessage },
        { fieldName: 'isScheduled', message: IsScheduledMessage },
        { fieldName: 'isEmergency', message: IsEmergencyMessage },
    ]

    const BooleanToString = {
        isScheduled: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.canReadByResident.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.canReadByResident.false' }),
        },
        isEmergency: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.false' }),
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
            status: (field, value, type) => {
                const isActual = value === IncidentStatusType.Actual
                const style = { color: INCIDENT_STATUS_COLORS[isActual ? IncidentStatusType.Actual : IncidentStatusType.NotActual].background }
                const formattedValue = <Typography.Text style={style}>{value}</Typography.Text>
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
                    {intl.formatMessage({ id: customMessages.change || 'pages.condo.ticket.TicketChanges.boolean.change' }, values)}
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
                    {intl.formatMessage({ id: customMessages.change || 'pages.condo.ticket.TicketChanges.change' }, values)}
                </>
            )
        } else if (isValueToNotEmpty) { // only "to" part
            return (
                <>
                    <SafeUserMention changeValue={incidentChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.add || 'pages.condo.ticket.TicketChanges.add' }, values)}
                </>
            )
        } else if (isValueFromNotEmpty) {
            return (
                <>
                    <SafeUserMention changeValue={incidentChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.remove || 'pages.condo.ticket.TicketChanges.remove' }, values)}
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

// TODO(DOMA-2567) duplicate from useChangedFieldMessagesOf for TicketChange
const SafeUserMention = ({ changeValue }) => {
    const intl = useIntl()
    const DeletedCreatedAtNoticeTitle = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.notice.DeletedCreatedAt.title' })
    const DeletedCreatedAtNoticeDescription = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.notice.DeletedCreatedAt.description' })

    return (
        changeValue.createdBy ? (
            <>
                {changeValue.changedByRole} {changeValue.createdBy.name}
            </>
        ) : (
            <Tooltip placement='top' title={DeletedCreatedAtNoticeDescription}>
                <span>{DeletedCreatedAtNoticeTitle}</span>
            </Tooltip>
        )
    )
}