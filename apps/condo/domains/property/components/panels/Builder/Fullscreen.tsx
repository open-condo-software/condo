/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { colors, DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'
import styled from '@emotion/styled'
import isPropValid from '@emotion/is-prop-valid'

export const FullscreenWrapper = styled('div', { shouldForwardProp: isPropValid })<{
    mode?: 'view' | 'edit';
}>`
  border-radius: ${DEFAULT_BORDER_RADIUS};
  padding: 24px;
  background: ${colors.backgroundLightGrey};
  &.fullscreen {
    ${({ mode }) => `padding: ${mode === 'view' ? '76px 24px 84px' : '76px 24px 84px'};`}
    box-sizing: padding-box;
    overflow: auto;

    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100vh - 62px);
    right: 0;
    bottom: 0;
    z-index: 20;
  }
`

export const FullscreenHeader = styled('div', { shouldForwardProp: isPropValid })<{
    edit?: boolean
}>`
    margin: -24px -24px 0;
    padding: 0 24px 0 24px;
    ${({ edit }) => (!edit ? `
        display: none;
        width: 100%;
        padding-bottom: 12px;
    ` : '')}

    div.fullscreen & {
        background: ${colors.backgroundLightGrey};
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        z-index: 2;
        margin: 0;
        display: block;
    }

    ${({ edit }) => (edit ? `
        &>div:first-child {
            display: none;
        }

        div.fullscreen>&>div:first-child {
            display: flex;
        }
    ` : '')}
`

export const FullscreenFooter = css`
    margin: 0 -21px -13px -24px;
    padding: 20px 0 12px 0;

    div.fullscreen & {
        left: 0;
        right: 0;
        bottom: 0;
        padding: 12px 47px 12px 47px;
        background: ${colors.backgroundLightGrey};
        z-index: 1;
        position: fixed;
        // border-top: 1px solid ${colors.lightGrey[5]};
        margin-right: -21px;
        margin-bottom: 0;
    }
 `
