/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { colors } from '@condo/domains/common/constants/style'
import styled from '@emotion/styled'

export const FullscreenWrapper = styled.div<{
    mode?: 'view' | 'edit';
}>`
  margin: -24px;
  border-radius: 8px;
  padding: 24px;
  background: ${colors.white};

  &.fullscreen {
    ${({ mode }) => `padding: ${mode === 'view' ? '96px 24px 84px' : '218px 24px 84px'};`}
    box-sizing: padding-box;
    overflow: auto;

    position: fixed;
    top: 0;
    left: 0;
    width: 100wv;
    height: 100hv;
    right: 0;
    bottom: 0;
    z-index: 20;
  }

  &.fullscreen .scroll-container {
    overflow: initial !important;
  }
`

export const FullscreenHeader = styled.div<{
    edit?: boolean
}>`
    margin: -24px -24px 0;
    padding: 12px 24px 0 24px;
    ${({ edit }) => (!edit ? `
        display: none;
        width: 100%;
        padding-bottom: 12px;
    ` : '')}

    div.fullscreen & {
        border-bottom: 1px solid ${colors.lightGrey[5]};
        background: ${colors.whiteTranslucent};
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        z-index: 2;
        margin: 0;
        display: block;
        padding-left: 47px;
        padding-right: 11px;
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
    padding: 12px 0px 12px 0px;

    div.fullscreen & {
        left: 0;
        right: 0;
        bottom: 0;
        padding: 12px 47px 12px 47px;
        background: ${colors.whiteTranslucent};
        z-index: 1;
        position: fixed;
        border-top: 1px solid ${colors.lightGrey[5]};
        margin-right: -21px;
        margin-bottom: 0;
    }
 `
