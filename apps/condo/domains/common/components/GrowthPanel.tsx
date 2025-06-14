import { css } from '@emotion/react'

import { fontSizes } from '@condo/domains/common/constants/style'

import { ArrowIconDown, ArrowIconUp } from './icons/ArrowIcons'

import { colors } from '../constants/style'

const growthPanelCss = (isPositive) => css`
  display: flex;
  font-size: ${fontSizes.content};
  font-weight: 600;
  align-items: center;
  color: ${isPositive ? colors.green[5] : colors.red[5]};
`

export const GrowthPanel = ({ value }: { value: number }) => {
    if (!value) return null
    return (
        <div css={growthPanelCss(value > 0)}>
            {value > 0 ? <ArrowIconUp/> : <ArrowIconDown/>}&nbsp;{value}&nbsp;%
        </div>)
}
