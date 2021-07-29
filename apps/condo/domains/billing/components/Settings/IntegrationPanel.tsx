import React from 'react'
import styled from '@emotion/styled'
import { colors, shadows } from '@condo/domains/common/constants/style'
import { Tooltip, Typography } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'

interface IIntegrationPanelProps {
    integrationId: string
    title: string
    shortDescription: string
    status: 'available' | 'chosen' | 'disabled'
}

const CardContainer = styled.div`
  box-sizing: border-box;
  border: 1px solid ${colors.lightGrey[5]};
  border-radius: 8px;
  padding: 24px;
  transition: all 0.2s ease-in-out;
  // @ts-ignore
  background-color: ${props => props['data-status'] === 'chosen' ? colors.lightGrey[4] : 'transparent'};
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

const ButtonWrap = styled.div`
  margin-top: 26px;
  width: fit-content;
  cursor: ${({ disabled }: { disabled: boolean }) => disabled ? 'not-allowed' : 'pointer'};
`

export const IntegrationPanel: React.FC<IIntegrationPanelProps> = ({
    integrationId,
    title,
    shortDescription,
    status }) => {
    const intl = useIntl()
    const ChooseMessage = intl.formatMessage({ id: 'Select' })
    const ChosenMessage = intl.formatMessage({ id: 'Selected' })
    const CompanyLabel = intl.formatMessage({ id: 'CompanyName' })
    const NoMoreBillingsAllowedMessage = intl.formatMessage({ id: 'NoMoreIntegrationsAllowed' }, {
        company: CompanyLabel,
    })
    const ContactSupportForCancellingMessage = intl.formatMessage({ id: 'ContactSupportToCancelIntegration' }, {
        company: CompanyLabel,
    })
    const ClickToSeeMoreMessage = intl.formatMessage({ id: 'ClickToSeeMore' })

    const TooltipMessage = status === 'available'
        ? ClickToSeeMoreMessage
        : (
            status === 'chosen'
                ? ContactSupportForCancellingMessage
                : NoMoreBillingsAllowedMessage
        )


    const router = useRouter()
    const onSelectPushRoute = `/settings/integration/${integrationId}/`
    const buttonDisabled = status !== 'available'
    const buttonIcon = status === 'chosen' ? <CheckOutlined /> : null
    const buttonMessage = status === 'chosen' ? ChosenMessage : ChooseMessage

    return (
        <CardContainer data-status={status}>
            <TwoLineClamp style={{ height: 56 }}>
                <Typography.Title level={4}>
                    {title}
                </Typography.Title>
            </TwoLineClamp>
            <TwoLineClamp style={{ height: 48, marginTop: 8 }}>
                <Typography.Text style={{ lineHeight: '24px', fontSize: 16 }}>
                    {shortDescription}
                </Typography.Text>
            </TwoLineClamp>
            <Tooltip title={TooltipMessage} >
                <ButtonWrap disabled={buttonDisabled}>
                    <Button
                        type={'sberPrimary'}
                        onClick={() => router.push(onSelectPushRoute)}
                        disabled={buttonDisabled}
                        style={{ pointerEvents: buttonDisabled ? 'none' : 'auto' }}
                        icon={buttonIcon}
                    >
                        {buttonMessage}
                    </Button>
                </ButtonWrap>
            </Tooltip>
        </CardContainer>
    )
}