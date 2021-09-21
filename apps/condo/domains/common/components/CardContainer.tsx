import styled from '@emotion/styled'
import { colors, shadows, transitions } from '../constants/style'

export const CardContainer = styled.div`
  position: relative;
  box-sizing: border-box;
  border: 1px solid ${colors.lightGrey[5]};
  border-radius: 8px;
  padding: 29px 24px 80px 24px;
  transition: ${transitions.elevateTransition};
  cursor: pointer;
  background-color: ${props => (props['data-status'] !== 'disabled' && props['data-status'] !== 'available')
        ? colors.lightGrey[4]
        : 'transparent'};
  &:hover {
    border-color: transparent;
    box-shadow: ${shadows.elevated};
  }
`