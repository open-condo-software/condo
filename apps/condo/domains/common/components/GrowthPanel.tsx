/** @jsx jsx */
import { colors } from '../constants/style'
import { ArrowIconDown, ArrowIconUp } from './ArrowIcons'
import { css, jsx } from '@emotion/core'

const growthPanelCss = (isPositive) => css`
  display: flex;
  font-size: 16px;
  font-weight: 600;
  align-items: center;
  color: ${isPositive ? colors.green[5] : colors.red[5]};
`

export const GrowthPanel = ({ value }: { value: number }) => (
    <div css={growthPanelCss(value > 0)} >
        {value > 0 ? <ArrowIconUp /> : <ArrowIconDown/>}&nbsp;{value}&nbsp;%
    </div>
)
