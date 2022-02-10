import React from 'react'
import styled from '@emotion/styled'
import { Row, Tooltip, Typography, Col } from 'antd'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'

import { colors, shadows, transitions } from '@condo/domains/common/constants/style'
import { Tag, TagType } from '@condo/domains/common/components/Tag'


export type CardStatuses = 'available' | 'inProgress' | 'done' | 'disabled' | 'error'

interface IIntegrationPanelProps {
    integrationUrlPrefix: string
    integrationUrlId: string
    title: string
    shortDescription: string
    status: CardStatuses
}

const CardContainer = styled.div`
  position: relative;
  box-sizing: border-box;
  border: 1px solid ${colors.lightGrey[5]};
  border-radius: 8px;
  padding: 29px 24px 80px 24px;
  transition: ${transitions.elevateTransition};
  cursor: pointer;
  background-color: ${props => (props['data-status'] !== 'disabled' && props['data-status'] !== 'available') 
        ? colors.lightGrey[4] 
        : 'transparent'};
  &:hover {
    border-color: transparent;
    box-shadow: ${shadows.elevated};
  }
`

export const IntegrationPanel: React.FC<IIntegrationPanelProps> = ({
    integrationUrlPrefix,
    integrationUrlId,
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

    let tagType: TagType = 'green'
    let tagText = IntegrationConnectedMessage

    if (status === 'inProgress') {
        tagType = 'orange'
        tagText = IntegrationInProgressMessage
    } else if (status === 'error') {
        tagType = 'red'
        tagText = ErrorOccurredMessage
    }


    const router = useRouter()
    const onSelectPushRoute = `/settings/${integrationUrlPrefix}/${integrationUrlId}/`
    const onClickEvent = () => {
        router.push(onSelectPushRoute)
    }

    return (
        <Tooltip title={TooltipMessage}>
            <CardContainer data-status={status} onClick={onClickEvent}>
                {['inProgress', 'done', 'error'].includes(status)  && (
                    <Tag
                        type={tagType}
                        style={{ position: 'absolute', top: 12, right: 4 }}
                    >
                        {tagText}
                    </Tag>
                )}
                <Row gutter={[0, 8]}>
                    <Col span={24}>
                        <Typography.Paragraph style={{ height: 56, margin: 0 }} ellipsis={{ rows: 2 }}>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                                {title}
                            </Typography.Title>
                        </Typography.Paragraph>
                        <Typography.Paragraph style={{ height: 48, margin: 0 }} ellipsis={{ rows: 2 }}>
                            <Typography.Text style={{ lineHeight: '24px', fontSize: 16, margin: 0 }}>
                                {shortDescription}
                            </Typography.Text>
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </CardContainer>
        </Tooltip>
    )
}