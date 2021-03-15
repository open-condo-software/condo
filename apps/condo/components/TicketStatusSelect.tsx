// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useMemo } from 'react'
import { Select } from 'antd'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { green , grey, orange, red, yellow } from '@ant-design/colors'
import { Ticket , TicketStatus } from '../utils/clientSchema/Ticket'
import { runMutation } from '../utils/mutations.utils'
import { CANCEL, COMPLETE, DEFFER, IN_PROGRESS, OPEN } from '../constants/statusIds'
import { colors } from '../constants/style'
import { getTicketLabel } from '../utils/ticket'

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
    const selectValue = { value: ticket.status.id, label: getTicketLabel(ticket, intl) }

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

