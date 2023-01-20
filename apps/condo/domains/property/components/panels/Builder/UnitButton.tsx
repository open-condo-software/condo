/** @jsx jsx */
import { BuildingUnitSubType } from '@app/condo/schema'
import { css, jsx } from '@emotion/react'
import { Button, ButtonProps } from 'antd'
import React from 'react'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { colors, gradients, UNIT_TYPE_COLOR_SET } from '@condo/domains/common/constants/style'

const buttonCss = css`
    display: inline-block;
    background-color: #FFF;
    border: 1px solid #F5F5F5;
    color: black;
    font-size: 16px;
    line-height: 24px;
    font-weight: 600;
    border-radius: 8px;
    margin-top: 8px;
    margin-right: 8px;
    text-align: center;
    height: 44px;
    width: 44px;
    padding: 0;
    box-shadow: none;
    
    &:last-child {
      margin-right: 0;
    }
    
    &:hover {
        color: ${colors.black};
        border-color: ${colors.inputBorderHover};
    }
    &:focus {
        background-color: ${gradients.sberActionGradient};
        color: ${colors.white};
        border-color: transparent;
    }
    
    &:active {
        background-color: ${gradients.sberActionGradient};
        color: ${colors.white};
        border-color: transparent;
    }
    
    &:disabled, &:disabled:hover {
        background-color: ${colors.white};
        cursor: default;
        pointer-events: none;
        color: black;
        border: transparent;
    }
`

const buttonSecondaryCss = css`
    display: inline-block;
    background-color: transparent;
    border: 1px solid ${colors.inputBorderHover};
    color: black;
    font-size: 14px;
    line-height: 40px;
    border-radius: 8px;
    margin-top: 8px;
    margin-right: 8px;
    text-align: center;
    height: 44px;
    width: 44px;
    padding: 0 8px;
    box-shadow: none;

    &:hover {
        color: ${colors.black};
        background-color: transparent;
        border-color: ${colors.black};
    }
    &:focus {
        background: ${gradients.sberActionGradient};
        color: white;
        border-color: transparent;
    }

    &:active {
        background: ${gradients.sberActionGradient};
        color: white;
        border-color: transparent;
    }

    &:disabled, &:hover:disabled {
        background-color: transparent;
        color: black;
        border-color: transparent;        
        cursor: default;
    }    
`
const selectedCss = css`
    background: ${gradients.sberActionInversed};
    color: white;
    border: none;
    
    &:hover, &:focus {
        background: ${gradients.sberActionGradient};
        color: white;
        border: 1px solid transparent;
    }

    &:active {
        background: ${gradients.sberActionInversed};
        color: white;
        border: 1px solid transparent;
    }
`
const previewCss = (unitType: BuildingUnitSubType) => css`
  opacity: 0.5;
  background-color: ${UNIT_TYPE_COLOR_SET[unitType]};
`
const noninteractiveCss = css`
    cursor: default;
    &:after {
        animation: none !important;
    }
    &:hover, &:focus, &:active {
        background-color: #F5F5F5;
        color: black;
        border-color:  #F5F5F5;
    }
`
const duplicatedUnitStyle = css`
  background-color: ${colors.brightRed};
`

const unitTypeCss = (unitType: BuildingUnitSubType) => css`
  background-color: ${UNIT_TYPE_COLOR_SET[unitType]};
  &:hover {
    opacity: ${['flat', 'parking'].includes(unitType) ? 1 : .6};
    background-color: ${UNIT_TYPE_COLOR_SET[unitType]};
  }
  &:focus {
    background-color: ${UNIT_TYPE_COLOR_SET[unitType]};
  }
`

interface CustomButtonProps extends ButtonProps {
    secondary?: boolean
    selected?: boolean
    noninteractive?: boolean
    preview?: boolean
    ellipsis?: boolean
    unitType?: BuildingUnitSubType
    isDuplicated?: boolean
}
const TOOLTIP_OVERLAY_STYLE: React.CSSProperties = {
    background: colors.white,
    color: colors.black,
    borderRadius: '12px',
}

export const UnitButton: React.FC<CustomButtonProps> = (props) => {
    const { secondary, selected, preview, noninteractive, ellipsis = true, unitType, isDuplicated, children, ...restProps } = props
    const OriginalLabel = children ? children.toString() : ''
    if (!secondary && OriginalLabel.length > 4 && ellipsis) {
        let ButtonLabel = OriginalLabel
        if (!isNaN(Number(ButtonLabel))) {
            ButtonLabel = `…${ButtonLabel.substring(ButtonLabel.length - 2)}`
        } else {
            ButtonLabel = `${ButtonLabel.substring(0, 2)}…`
        }
        return (
            <Tooltip
                placement='topLeft'
                title={OriginalLabel}
            >
                <Button css={css`
                    ${buttonCss};
                    ${selected ? selectedCss : ''};
                    ${noninteractive ? noninteractiveCss : ''};                    
                    ${preview ? previewCss(unitType) : ''};
                    ${unitType ? unitTypeCss(unitType) : ''};
                    ${isDuplicated ? duplicatedUnitStyle : ''};
                `} {...restProps}>{ButtonLabel}</Button>
            </Tooltip>
        )
    } else {
        return (
            <Button css={css`
                ${secondary ? buttonSecondaryCss : buttonCss};
                ${selected ? selectedCss : ''};
                ${noninteractive ? noninteractiveCss : ''};
                ${preview ? previewCss(unitType) : ''};
                ${unitType ? unitTypeCss(unitType) : ''};
                ${isDuplicated ? duplicatedUnitStyle : ''};
            `} {...restProps}>{children || ' ' }</Button>
        )
    }

}
