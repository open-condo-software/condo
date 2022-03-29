import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'

interface TagContainerProps {
    top?: number,
    right?: number,
    bottom?: number,
    left?: number,
}

export const TagContainer = styled.div<TagContainerProps>`
  position: absolute;
  ${(props) => props.top ? `top: ${props.top}px;` : ''}
  ${(props) => props.right ? `right: ${props.right}px;` : ''}
  ${(props) => props.bottom ? `bottom: ${props.bottom}px;` : ''}
  ${(props) => props.left ? `left: ${props.left}px;` : ''}
  font-size: 12px;
  background: ${colors.backgroundLightGrey};
  border-radius: 100px;
  padding: 2px 10px;
  font-weight: 600;
`