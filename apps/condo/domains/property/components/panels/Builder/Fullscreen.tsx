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
    ${({ mode }) => `padding: ${mode === 'view' ? '104px 24px 12px' : '256px 24px 12px'};`}
    box-sizing: padding-box;
    overflow: auto;
  }
`

export const FullscreenHeader = styled.div<{
    edit?: boolean
}>`
    margin: -24px -24px 0;
    padding: 16px 24px 16px 24px;
    ${({ edit }) => (!edit ? `
        display: none;
        width: 100%;
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
        padding-left: 62px;
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
        padding: 16px 60px 16px 62px;
        background: ${colors.whiteTranslucent};
        z-index: 1;
        position: fixed;
        border-top: 1px solid ${colors.lightGrey[5]};
        margin-right: -21px;
        margin-bottom: 0;
    }
 `
