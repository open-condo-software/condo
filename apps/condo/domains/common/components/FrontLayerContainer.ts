import styled from '@emotion/styled'

import { colors } from '../constants/style'

interface IFrontLayerContainerProps {
    showLayer?: boolean,
    isSelectable?: boolean,
}

export const FrontLayerContainer = styled.div<IFrontLayerContainerProps>`
  margin: 0 -24px;
  padding: 0 24px 24px;
  position: relative;
  ${({ isSelectable = true }) => !isSelectable && 'user-select: none;'}
  ${({ showLayer = false }) => showLayer && `
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