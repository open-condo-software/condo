import styled from '@emotion/styled'
import { colors } from '../constants/style'

export const FocusContainer = styled.div`
  margin: 0 -24px;
  border: 1px solid ${({ color }) => color || colors.lightGrey[5]};
  border-radius: 8px;
  padding: 24px;
  
  &.disabled {
    opacity: 0.5;
    pointer-events: none;  
  }
`