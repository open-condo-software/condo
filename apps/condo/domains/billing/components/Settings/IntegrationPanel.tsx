import React from 'react'
import styled from '@emotion/styled'
import { colors, shadows } from '@condo/domains/common/constants/style'
import { Tooltip, Typography, Tag } from 'antd'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'

export type CardStatuses = 'available' | 'inProgress' | 'done' | 'disabled' | 'error'

interface IIntegrationPanelProps {
    integrationId: string
    title: string
    shortDescription: string
    status: CardStatuses
}

const CardContainer = styled.div`
  position: relative;
  height: 229px;
  box-sizing: border-box;
  border: 1px solid ${colors.lightGrey[5]};
  border-radius: 8px;
  padding: 24px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  background-color: ${props => (props['data-status'] !== 'disabled' && props['data-status'] !== 'available') 
        ? colors.lightGrey[4] 
        : 'transparent'};
  &:hover {
    border-color: transparent;
    ${shadows.elevatedShadow}
  }
`

const TwoLineClamp = styled.div`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
`

export const IntegrationPanel: React.FC<IIntegrationPanelProps> = ({
    integrationId,
    title,
    shortDescription,
    status }) => {
    const intl = useIntl()
    const CompanyLabel = intl.formatMessage({ id: 'CompanyName' })
    const IntegrationInProgressMessage = intl.formatMessage({ id: 'ConnectionInProgress' })
    const IntegrationConnectedMessage = intl.formatMessage({ id: 'Connected' })
    const NoMoreBillingsAllowedMessage = intl.formatMessage({ id: 'NoMoreIntegrationsAllowed' }, {
        company: CompanyLabel,
    })
    const ContactSupportForCancellingMessage = intl.formatMessage({ id: 'ContactSupportToCancelIntegration' }, {
        company: CompanyLabel,
    })
    const IntegrationErrorMessage = intl.formatMessage({ id: 'ErrorHappenedDuringIntegration' }, {
        company: CompanyLabel,
    })
    const ClickToSeeMoreMessage = intl.formatMessage({ id: 'ClickToSeeMore' })
    const ErrorOccurredMessage = intl.formatMessage({ id: 'ErrorOccurred' })

    let TooltipMessage = ContactSupportForCancellingMessage
    if (status === 'available') {
        TooltipMessage = ClickToSeeMoreMessage
    } else if (status === 'error') {
        TooltipMessage = IntegrationErrorMessage
    } else if (status === 'disabled') {
        TooltipMessage = NoMoreBillingsAllowedMessage
    }

    let tagBackgroundColor = colors.green[2]
    let tagTextColor = colors.green[7]
    let tagText = IntegrationConnectedMessage

    if (status === 'inProgress') {
        tagBackgroundColor = colors.orange[3]
        tagTextColor = colors.orange[7]
        tagText = IntegrationInProgressMessage
    } else if (status === 'error') {
        tagBackgroundColor = colors.red[2]
        tagTextColor = colors.red[5]
        tagText = ErrorOccurredMessage
    }


    const router = useRouter()
    const onSelectPushRoute = `/settings/integration/${integrationId}/`
    const onClickEvent = () => {
        router.push(onSelectPushRoute)
    }

    return (
        <Tooltip title={TooltipMessage}>
            <CardContainer data-status={status} onClick={onClickEvent}>
                {['inProgress', 'done', 'error'].includes(status)  && (
                    <Tag
                        color={tagBackgroundColor}
                        style={{ position: 'absolute', top: 12, right: 4 }}
                    >
                        <Typography.Text style={{ color: tagTextColor }}>
                            {tagText}
                        </Typography.Text>
                    </Tag>
                )}
                <TwoLineClamp style={{ marginTop: 5 }}>
                    <Typography.Title level={4}>
                        {title}
                    </Typography.Title>
                </TwoLineClamp>
                <TwoLineClamp style={{ height: 48, marginTop: 8 }}>
                    <Typography.Text style={{ lineHeight: '24px', fontSize: 16 }}>
                        {shortDescription}
                    </Typography.Text>
                </TwoLineClamp>
            </CardContainer>
        </Tooltip>
    )
}