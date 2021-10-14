import { Typography } from 'antd'
import React from 'react'
import styled from '@emotion/styled'
import { useServiceSubscriptionContext } from './SubscriptionContext'
import { gradients } from '@condo/domains/common/constants/style'
import get from 'lodash/get'

const StyledPanel = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  position: relative;
  background-color: white;
  line-height: 24px;
  text-align: center;
  font-size: 12px;

  &:before {
    content: "";
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border-radius: 50%;
    background: ${gradients.subscriptionGradient};
    z-index: -1;
  }
`

export const ServiceSubscriptionIndicator: React.FC = () => {
    const { subscription, daysLeft } = useServiceSubscriptionContext()

    if (!subscription || !get(subscription, 'isTrial')) {
        return null
    }

    return (
        <StyledPanel>
            <Typography.Paragraph strong>
                {daysLeft}
            </Typography.Paragraph>
        </StyledPanel>
    )
}
