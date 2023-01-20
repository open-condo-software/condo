import { InfoCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Alert, Col, Typography } from 'antd'
import { get } from 'lodash'
import React, { CSSProperties, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { TicketPropertyHint, TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'

import { TicketPropertyHintContent } from './TicketPropertyHintContent'

const StyledAlert = styled(Alert)`
  background-color: ${colors.successBG};
  border: none;
  
  .ant-alert-description > div {
    overflow: hidden;
    position: relative;
  }
  
  & svg {
    font-size: 21px;
    color: ${colors.successText};
  }
  
  & > .ant-alert-content > .ant-alert-message {
    font-size: 16px;
    line-height: 21px;
    color: ${colors.successText}};
  }
`

type TicketPropertyHintCardProps = {
    propertyId: string
    hintContentStyle?: CSSProperties
    withCol?: boolean
}

export const TicketPropertyHintCard: React.FC<TicketPropertyHintCardProps> = ({ propertyId, hintContentStyle, withCol }) => {
    const intl = useIntl()
    const PropertyHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.ticketPropertyHint' })

    const { obj: ticketPropertyHintProperty } = TicketPropertyHintProperty.useObject({
        where: {
            property: { id: propertyId },
        },
    })
    const ticketPropertyHintId = useMemo(() => get(ticketPropertyHintProperty, ['ticketPropertyHint', 'id'], null), [ticketPropertyHintProperty])

    const { obj: ticketPropertyHint } = TicketPropertyHint.useObject({
        where: {
            id: ticketPropertyHintId,
        },
    })

    const AlertMessage = <Typography.Text strong>{PropertyHintMessage}</Typography.Text>
    const htmlContent = useMemo(() => get(ticketPropertyHint, 'content'), [ticketPropertyHint])

    if (!ticketPropertyHintProperty || !ticketPropertyHint) {
        return <></>
    }
    
    return withCol ? (
        <Col span={24}>
            <StyledAlert
                message={AlertMessage}
                description={
                    <TicketPropertyHintContent
                        html={htmlContent}
                        style={hintContentStyle}
                        linkToHint={`/property/${propertyId}/hint`}
                    />
                }
                showIcon
                icon={<InfoCircleOutlined/>}
            />
        </Col>
    ) : (
        <StyledAlert
            message={AlertMessage}
            description={
                <TicketPropertyHintContent
                    html={htmlContent}
                    style={hintContentStyle}
                    linkToHint={`/property/${propertyId}/hint`}
                />
            }
            showIcon
            icon={<InfoCircleOutlined/>}
        />
    )
}