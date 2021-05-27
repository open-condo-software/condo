import styled from '@emotion/styled'
import { colors } from '../constants/style'
import get from 'lodash/get'

interface IFrontLayerContainerProps {
    showLayer?: boolean
}

export const FrontLayerContainer = styled.div<IFrontLayerContainerProps>`
  margin: 0 -24px;
  padding: 0 24px 24px;
  position: relative;
  user-select: none;
  ${(props) => get(props, 'showLayer', false) && `
    &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background-color: ${colors.white};
        opacity: 0.5;
        z-index: 1;
    }
  `}
`