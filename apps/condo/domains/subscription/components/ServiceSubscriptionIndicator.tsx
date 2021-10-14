import { Typography } from 'antd'
import React from 'react'
import styled from '@emotion/styled'
import { useServiceSubscriptionContext } from './SubscriptionContext'
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
    background: conic-gradient(from 0deg at 50% 50%, #FC5055 0deg, #62B2F9 360deg);
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
                {daysLeft} 14
            </Typography.Paragraph>
        </StyledPanel>
    )
}
