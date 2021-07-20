import styled from '@emotion/styled'
import { colors } from '../constants/style'

interface IFocusContainerProps {
    color?: string,
    margin?: string
}

export const FocusContainer = styled.div<IFocusContainerProps>`
  max-width: calc(100% + 48px);
  margin: ${({ margin }) => margin || '0 -24px'};
  border: 1px solid ${({ color }) => color || colors.lightGrey[5]};
  border-radius: 8px;
  padding: 24px;
  
  &.disabled {
    opacity: 0.5;
    pointer-events: none;  
  }
`