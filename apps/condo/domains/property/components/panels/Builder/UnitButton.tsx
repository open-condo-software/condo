/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { Button, ButtonProps, Tooltip } from 'antd'
import { colors, gradients } from '@condo/domains/common/constants/style'

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
        background: ${gradients.sberActionGradient};
        color: ${colors.white};
        border-color: transparent;
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
    padding: 0;
    box-shadow: none;

    &:hover {
        background: ${gradients.sberActionGradient};
        color: white;
        border-color: transparent;
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
    border-color: transparent;
    &:hover {
        background-color: black;
        color: white;
        border-color: black;
    }

    &:focus {
        background-color: black;
        color: white;
        border-color: transparent;
    }

    &:active {
        background-color: black;
        color: white;
        border-color: black;
    }    
`
const previewCss = css`
    opacity: 0.5;
`
const noninteractiveCss = css`
    cursor: default;
    pointer-events: none;
    &:after {
        animation: none !important;
    }    
    &:hover, &:focus, &:active {
        background-color: #F5F5F5;
        color: black;
        border-color:  #F5F5F5;
    }
`

interface CustomButtonProps extends ButtonProps {
    secondary?: boolean
    selected?: boolean
    noninteractive?: boolean
    preview?: boolean
}

export const UnitButton: React.FC<CustomButtonProps> = ({ secondary, selected, preview, noninteractive, children, ...restProps }) => {
    const OriginalLabel = children ? children.toString() : ''
    if (!secondary && OriginalLabel.length > 4) {
        let ButtonLabel = OriginalLabel
        if (!isNaN(Number(ButtonLabel))) {
            ButtonLabel = `…${ButtonLabel.substring(ButtonLabel.length - 2)}`
        } else {
            ButtonLabel = `${ButtonLabel.substring(0, 2)}…`
        }
        return (
            <Tooltip placement='topLeft' title={OriginalLabel}>
                <Button css={css`
                    ${buttonCss};
                    ${selected ? selectedCss : ''};
                    ${noninteractive ? noninteractiveCss : ''};                    
                    ${preview ? previewCss : ''};
                `} {...restProps}>{ButtonLabel}</Button>
            </Tooltip>
        )
    } else {
        return (
            <Button css={css`
                ${secondary ? buttonSecondaryCss : buttonCss};
                ${selected ? selectedCss : ''};
                ${noninteractive ? noninteractiveCss : ''};
                ${preview ? previewCss : ''};
            `} {...restProps}>{children || ' ' }</Button>
        )
    }

}
