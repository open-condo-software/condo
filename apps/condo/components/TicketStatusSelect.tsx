// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useMemo } from 'react'
import { Select, Space, Typography } from 'antd'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { green , grey, orange, red, yellow } from '@ant-design/colors'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { TicketStatus } from '../utils/clientSchema/Ticket'
import { runMutation } from '../utils/mutations.utils'
import { PROCESSING, CANCELED, COMPLETED, DEFERRED, NEW_OR_REOPEND } from '../constants/statusTypes'
import { colors } from '../constants/style'
import { getTicketFormattedLastStatusUpdate, getTicketLabel, sortStatusesByType } from '../utils/ticket'

const statusSelectColors = {
    [NEW_OR_REOPEND]: {
        color: yellow[9],
        backgroundColor: yellow[2],
    },
    [PROCESSING]: {
        color: orange[8],
        backgroundColor: orange[4],
    },
    [CANCELED]: {
        color: grey[9],
        backgroundColor: colors.lightGrey[5],
    },
    [COMPLETED]: {
        color: green[8],
        backgroundColor: green[3],
    },
    [DEFERRED]: {
        color: red[6],
        backgroundColor: red[2],
    },
}

const StyledSelect = styled(Select)`
  width: 100%;
  font-weight: 700;
  border-radius: 4px;
`

export const TicketStatusSelect = ({ ticket, onUpdate, ...props }) => {
    const intl = useIntl()
    const { objs: statuses, loading } = TicketStatus.useObjects()
    const update = Ticket.useUpdate({}, () => onUpdate())

    const updateTicketStatus = useCallback((variables) => runMutation({
        action:() => update(variables, ticket),
        intl,
    }), [ticket])

    const options = useMemo(() => sortStatusesByType(statuses).map((status) => {
        const { value, label, type } = TicketStatus.convertGQLItemToFormSelectState(status)
        const { color } = statusSelectColors[type]

        return (<Select.Option key={value} value={value} title={label} style={{ color }}>{label}</Select.Option>)
    }), [statuses, ticket])

    const handleChange = useCallback(({ value }) => {
        updateTicketStatus({ status: value, statusUpdatedAt: new Date() })
    }, [ticket])

    const { color, backgroundColor } = statusSelectColors[ticket.status.type]
    const selectValue = { value: ticket.status.id, label: getTicketLabel(intl, ticket) }
    const FormattedStatusUpdateMessage = useMemo(() => getTicketFormattedLastStatusUpdate(intl, ticket), [ticket])

    return (
        <Space size={8} direction={'vertical'} align={'end'}>
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
            <Typography.Text type="warning" style={{ color }}>{FormattedStatusUpdateMessage}</Typography.Text>
        </Space>
    )
}
