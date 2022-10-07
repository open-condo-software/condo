import styled from '@emotion/styled'
import { Alert as DefaultAlert, AlertProps } from 'antd'
import React, { ComponentProps } from 'react'

import { colors } from '@condo/domains/common/constants/style'

const getAlertColorsByType = (type: ComponentProps<typeof Alert>['type']) => {
    const defaultColors = {
        bg: colors.infoAlertBg,
        message: colors.infoAlertMessage,
        description: colors.infoAlertDescription,
    }

    switch (type) {
        case 'info': return defaultColors

        default: return defaultColors
    }
}

const StyledAlert = styled(DefaultAlert)<{ bgColor, messageColor, descriptionColor }>`
  background-color: ${props => props.bgColor};
  border: none;
  
  .ant-alert-description > div {
    overflow: hidden;
    position: relative;
  }
  
  & svg {
    font-size: 21px;
    color: ${props => props.messageColor};
  }
  
  & > .ant-alert-content > .ant-alert-message {
    font-weight: 600;
    font-size: 16px;
    line-height: 21px;
    color: ${props => props.messageColor};
  }
`

export const Alert: React.FC<AlertProps> = ({ type, ...otherProps }) => {
    const alertColors = getAlertColorsByType(type)

    return (
        <StyledAlert
            bgColor={alertColors.bg}
            messageColor={alertColors.message}
            descriptionColor={alertColors.description}
            {...otherProps}
        />
    )
}