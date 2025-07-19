import { useGetTicketPropertyHintByIdQuery, useGetTicketPropertyHintPropertyByPropertyQuery } from '@app/condo/gql'
import styled from '@emotion/styled'
import { Col, ColProps, Typography } from 'antd'
import { get } from 'lodash'
import React, { CSSProperties, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Alert } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { TicketPropertyHintContent } from './TicketPropertyHintContent'


const StyledAlert = styled(Alert)`
   background-color: ${colors.green[1]} !important;
  
   .condo-alert-description > div {
     overflow: hidden;
     position: relative;
   }
  
  & svg {
    color: ${colors.green[5]} !important;
  }
`

type TicketPropertyHintCardProps = {
    propertyId: string
    hintContentStyle?: CSSProperties
    colProps?: ColProps
}

export const TicketPropertyHintCard: React.FC<TicketPropertyHintCardProps> = ({ propertyId, hintContentStyle, colProps }) => {
    const intl = useIntl()
    const PropertyHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.ticketPropertyHint' })

    const { persistor } = useCachePersistor()
    const {
        data: ticketPropertyHintPropertyData,
    } = useGetTicketPropertyHintPropertyByPropertyQuery({
        variables: {
            propertyId,
        },
        skip: !persistor || !propertyId,
    })
    const ticketPropertyHintProperty = useMemo(() => ticketPropertyHintPropertyData?.ticketPropertyHintProperty?.filter(Boolean)[0],
        [ticketPropertyHintPropertyData?.ticketPropertyHintProperty])
    const ticketPropertyHintId = useMemo(() => ticketPropertyHintProperty?.ticketPropertyHint?.id,
        [ticketPropertyHintProperty?.ticketPropertyHint?.id])

    const {
        data: ticketPropertyHintData,
    } = useGetTicketPropertyHintByIdQuery({
        variables: {
            id: ticketPropertyHintId,
        },
        skip: !persistor || !ticketPropertyHintId,
    })
    const ticketPropertyHint = useMemo(() => ticketPropertyHintData?.ticketPropertyHints?.filter(Boolean)[0],
        [ticketPropertyHintData?.ticketPropertyHints])

    const htmlContent = useMemo(() => get(ticketPropertyHint, 'content'), [ticketPropertyHint])

    const Hint = useMemo(() => (
        <StyledAlert
            message={<Typography.Text strong>{PropertyHintMessage}</Typography.Text>}
            description={
                <TicketPropertyHintContent
                    html={htmlContent}
                    style={hintContentStyle}
                    linkToHint={`/property/${propertyId}/hint`}
                />
            }
            showIcon
            type='info'
        />
    ), [PropertyHintMessage, hintContentStyle, htmlContent, propertyId])

    if (!ticketPropertyHintProperty || !ticketPropertyHint) {
        return null
    }

    return colProps ? (<Col {...colProps}>{Hint}</Col>) : Hint
}