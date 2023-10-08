import styled from '@emotion/styled'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { gradients } from '@condo/domains/common/constants/style'

import { useFocusContext } from './FocusContextProvider'


const FocusWrapper = styled.div`
  position: relative;
  border-radius: 4px;
  padding: 0 0 0 16px;
  margin: 0 0 0 -16px;

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    background: ${gradients.onboardingIconGradient};
    background-size: 300% 300%;
    clip-path: polygon(0% 100%, 3px 100%, 3px 3px, calc(100% - 3px) 3px, calc(100% - 3px) calc(100% - 3px), 3px calc(100% - 3px), 3px 100%, 100% 100%, 100% 0%, 0% 0%);
    animation: frame-enter 1s forwards ease-in-out, gradient-animation 4s ease-in-out infinite;

    @keyframes gradient-animation {
      0% {
        background-position: 15% 0;
      }
      50% {
        background-position: 85% 100%;
      }
      100% {
        background-position: 15% 0;
      }
    }

    @keyframes frame-enter {
      0% {
        opacity: 0;
      }
      50% {
        opacity: 50%;
      }
      100% {
        opacity: 100%;
      }
    }
  }
`

export const FocusElement: React.FC = ({ children }) => {
    const intl = useIntl()
    const Title = intl.formatMessage({ id: 'focus.tooltipText' })

    const { isFocusVisible } = useFocusContext()

    return (
        isFocusVisible
            ? (
                <Tooltip
                    title={Title}
                    visible
                    placement='right'
                >
                    <FocusWrapper>
                        {children}
                    </FocusWrapper>
                </Tooltip>
            )
            : <>{ children }</>
    )
}
