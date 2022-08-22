import styled from '@emotion/styled'
import { colors, shadows, transitions } from '@condo/domains/common/constants/style'

export interface CardWrapperProps {
    disabled?: boolean
}

// NOTE: Wrapper to fix inner css, since we cannot access title container from headStyle
export const CardWrapper = styled.div<CardWrapperProps>`
  position: relative;
  ${(props) => props.disabled ? '' : 'cursor: pointer;'}
  & > .ant-card {
    box-sizing: border-box;
    border: 1px solid ${colors.backgroundWhiteSecondary};
    transition: ${transitions.elevateTransition};
    ${(props) => props.disabled ? 'opacity: 0.5;' : `
    &:hover {
      border-color: ${colors.white};
      box-shadow: ${shadows.small};
    }`}
    & > .ant-card-head {
      width: 100%;
      height: 100%;
      padding: 30px;
      & > .ant-card-head-wrapper {
        & > .ant-card-head-title {
          position: relative;
          width: 100%;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          & > .ant-image {
            height: 36px;
          }
        }
      }
    }
  }
`
