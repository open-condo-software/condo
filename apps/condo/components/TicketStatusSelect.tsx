// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Select } from 'antd'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { yellow, orange, grey, green, red } from '@ant-design/colors'
import RU from 'date-fns/locale/ru'
import EN from 'date-fns/locale/en-US'
import get from 'lodash/get'
import { Ticket, TicketStatus } from '../utils/clientSchema/Ticket'
import { runMutation } from '../utils/mutations.utils'
import { OPEN, IN_PROGRESS, CANCEL, COMPLETE, DEFFER } from '../constants/statusIds'
import { colors } from '../constants/style'

const LOCALES = {
    ru: RU,
    en: EN,
}

const statusSelectColors = {
    [OPEN]: {
        color: yellow[9],
        backgroundColor: yellow[2],
    },
    [IN_PROGRESS]: {
        color: orange[8],
        backgroundColor: orange[4],
    },
    [CANCEL]: {
        color: grey[9],
        backgroundColor: colors.lightGrey[5],
    },
    [COMPLETE]: {
        color: green[8],
        backgroundColor: green[3],
    },
    [DEFFER]: {
        color: red[6],
        backgroundColor: red[2],
    },
}

const StyledSelect = styled(Select)`
  width: 100%;
  font-weight: 700;
  border-radius: 4px;

  .ant-select-single.ant-select-open .ant-select-selection-item {
    color: ${colors.black};
  }
`

const getTicketLabel = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const { createdAt, statusUpdatedAt } = ticket
    const ticketLastUpdateDate = createdAt || statusUpdatedAt
    const formattedDate = format(
        new Date(ticketLastUpdateDate), 'M MMM',
        { locale: LOCALES[intl.locale] }
    )

    return `${get(ticket, ['status', 'name'])} ${intl.formatMessage({ id: 'from' })} ${formattedDate}`
}

export const TicketStatusSelect = ({ ticket, onUpdate, ...props }) => {
    const intl = useIntl()
    const { objs: statuses, loading } = TicketStatus.useObjects()
    const update = Ticket.useUpdate({}, () => onUpdate())

    const updateTicketStatus = useCallback((variables) => runMutation({
        action:() => update(variables, ticket),
        intl,
    }), [ticket])

    const options = useMemo(() => statuses.map((status) => {
        const { value, label } = TicketStatus.convertGQLItemToFormSelectState(status)
        const { color } = statusSelectColors[value]

        return (<Select.Option key={value} value={value} title={label} style={{ color }}>{label}</Select.Option>)
    }), [statuses, ticket])

    const handleChange = useCallback(({ value }) => {
        updateTicketStatus({ status: value, statusUpdatedAt: new Date() })
    }, [ticket])

    const { color, backgroundColor } = statusSelectColors[ticket.status.id]
    const selectValue = { value: ticket.status.id, label: getTicketLabel(intl, ticket) }

    return (
        <StyledSelect
            style={{
                color,
                backgroundColor,
            }}
            loading={loading}
            onChange={handleChange}
            defaultValue={selectValue}
            value={selectValue}
            bordered={false}
            labelInValue
            {...props}
        >
            {options}
        </StyledSelect>
    )
}

