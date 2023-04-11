import styled from '@emotion/styled'
import React from 'react'

import { Button, ButtonProps, Tooltip } from '@open-condo/ui'


type ButtonWithDisabledTooltipProps = ButtonProps & { title: string }

const DisabledButtonWrapper = styled.div<{ disabled }>`
    ${props => props.disabled ? 'cursor: not-allowed;' : 'cursor: auto;'}
    .condo-btn {
      width: 100%;
    }
`

export const ButtonWithDisabledTooltip: React.FC<ButtonWithDisabledTooltipProps> = ({ title, disabled, ...buttonProps }) => (
    <Tooltip title={disabled ? title : null}>
        <DisabledButtonWrapper disabled={disabled}>
            <Button
                disabled={disabled}
                {...buttonProps}
            />
        </DisabledButtonWrapper>
    </Tooltip>
)