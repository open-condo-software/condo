import styled from '@emotion/styled'

import { colors } from '@open-condo/ui/colors'

import { DEFAULT_BORDER_RADIUS } from '../constants/style'

interface IFocusContainerProps {
    color?: string
    margin?: string
    padding?: string
}

export const FocusContainer = styled.div<IFocusContainerProps>`
  max-width: calc(100% + 48px);
  margin: ${({ margin }) => margin || '0 -24px'};
  border: 1px solid ${({ color }) => color || colors.gray[3]};
  border-radius: ${DEFAULT_BORDER_RADIUS};
  padding: ${({ padding }) => padding ? padding : '24px'};

  &.disabled {
    opacity: 0.5;
    pointer-events: none;  
  }
`
