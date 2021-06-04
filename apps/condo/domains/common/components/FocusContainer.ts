import styled from '@emotion/styled'
import { colors } from '../constants/style'

export const FocusContainer = styled.div<{
    mode?: 'view' | 'edit';
    color?: string;
}>`
  margin: 0 -24px;
  border-radius: 8px;
  padding: 24px 24px 12px;
  position: relative;
  border: 1px solid ${({ color }) => color || colors.lightGrey[5]};
  &:fullscreen {
    ${({ mode }) => `padding: ${mode === 'view' ? '78px 24px 12px' : '230px 24px 12px'};`}
    box-sizing: padding-box;
    overflow: auto;
  }
`
