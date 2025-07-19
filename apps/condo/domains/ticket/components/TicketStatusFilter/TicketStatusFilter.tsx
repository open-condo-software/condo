import { TicketStatusTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { Close } from '@open-condo/icons'
import { Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { transitions } from '@condo/domains/common/constants/style'
import { analytics } from '@condo/domains/common/utils/analytics'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

type StatusTagType = 'active' | 'checked' | 'disabled'
const getTicketStatusTagType = (filters, statusType): StatusTagType => {
    if (!Array.isArray(filters.status)) {
        return 'active'
    } else {
        return filters.status.includes(statusType) ? 'checked' : 'disabled'
    }
}
type StatusTagColor = {
    bgColor: string
    hoverBgColor?: string
    hoverTextColor?: string
    hoverBgCounterColor?: string
    textColor: string
    counterBgColor: string
    counterTextColor: string
    borderColor: string
}
const getTagColorsByTagType = (tagType: StatusTagType, ticketStatusType: TicketStatusTypeType): StatusTagColor => {
    const getStatusColors = (statusType: TicketStatusTypeType) => {
        switch (statusType) {
            case TicketStatusTypeType.NewOrReopened:
                return colors.pink
            case TicketStatusTypeType.Processing:
                return colors.orange
            case TicketStatusTypeType.Canceled:
                return colors.brown
            case TicketStatusTypeType.Completed:
                return colors.green
            case TicketStatusTypeType.Deferred:
                return colors.blue
            case TicketStatusTypeType.Closed:
                return colors.teal
        }
    }
    const statusColor = getStatusColors(ticketStatusType)
    const defaultStatusColor = statusColor[5]
    const hoverStatusColor = statusColor[7]

    switch (tagType) {
        case 'checked': {
            return {
                bgColor: defaultStatusColor,
                hoverBgColor: hoverStatusColor,
                textColor: colors.white,
                counterBgColor: colors.white,
                counterTextColor: defaultStatusColor,
                borderColor: defaultStatusColor,
            }
        }
        case 'active': {
            return {
                bgColor: colors.white,
                textColor: colors.black,
                counterBgColor: defaultStatusColor,
                counterTextColor: colors.white,
                borderColor: colors.gray[3],
            }
        }
        case 'disabled': {
            return {
                bgColor: colors.white,
                textColor: colors.gray[7],
                counterBgColor: colors.gray[5],
                counterTextColor: colors.white,
                borderColor: colors.gray[3],
                hoverTextColor: colors.black,
                hoverBgCounterColor: defaultStatusColor,
            }
        }
    }
}

const StatusFilterContainer = styled.div<{ tagType, colorsByTagType }>`
  border-radius: 100px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 10px 6px 6px;
  gap: 6px;
  cursor: pointer;
  height: 34px;
  white-space: nowrap;
  border: ${props => `1px solid ${props.colorsByTagType.borderColor}`};
  background-color: ${props => props.colorsByTagType.bgColor};
  color: ${props => props.colorsByTagType.textColor};
  transition: ${transitions.allDefault};
  
  &:hover {
    ${props => props.tagType !== 'checked' && `border-color: ${colors.gray[7]};`}
    ${props => props.colorsByTagType.hoverBgColor && `background-color: ${props.colorsByTagType.hoverBgColor};`}
    ${props => props.colorsByTagType.hoverTextColor && `color: ${props.colorsByTagType.hoverTextColor};`}

    & > .condo-tag {
      ${props => props.colorsByTagType.hoverBgCounterColor && `background-color: ${props.colorsByTagType.hoverBgCounterColor} !important;`}
    }
  }
  
  & > .condo-tag {
    border-radius: 100px;
    padding: 0 8px 2px;
    ${props => props.colorsByTagType.counterBgColor && `background-color: ${props.colorsByTagType.counterBgColor} !important;`}
  }
`

export const TicketStatusFilter = ({ count, title, type }) => {
    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const ticketStatusTagType = useMemo(() => getTicketStatusTagType(filters, type), [filters, type])
    const colorsByTagType = useMemo(() => getTagColorsByTagType(ticketStatusTagType, type), [ticketStatusTagType, type])

    const handleStatusFilterClick = useCallback(async () => {
        if (ticketStatusTagType === 'checked') {
            const newStatusFilter = Array.isArray(filters.status) && filters.status.filter(statusType => statusType !== type)
            const newParameters = getFiltersQueryData({ ...filters, status: newStatusFilter })
            await updateQuery(router, { newParameters }, { shallow: true })
        } else {
            const newStatusFilter = Array.isArray(filters.status) ? [...filters.status, type] : [type]
            const newParameters = getFiltersQueryData({ ...filters, status: newStatusFilter })
            await updateQuery(router, { newParameters }, { routerAction: 'replace', shallow: true })
        }

        analytics.track('ticket_status_filter_click', { status: type })
    }, [filters, router, ticketStatusTagType, type])

    return (
        <StatusFilterContainer
            colorsByTagType={colorsByTagType}
            tagType={ticketStatusTagType}
            onClick={handleStatusFilterClick}
        >
            <Tag
                textColor={colorsByTagType.counterTextColor}
            >
                {count?.[type]?.count}
            </Tag>
            {title}
            {
                ticketStatusTagType === 'checked' && (
                    <Close color={colorsByTagType.textColor} size='small'/>
                )
            }
        </StatusFilterContainer>
    )
}
