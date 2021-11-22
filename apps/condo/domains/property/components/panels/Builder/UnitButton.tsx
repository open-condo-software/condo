/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { Button, ButtonProps, Tooltip } from 'antd'

const buttonCss = css`
    display: inline-block;
    background-color: #FFF;
    border: 1px solid #F5F5F5;
    color: black;
    font-size: 14px;
    line-height: 40px;
    font-weight: bold;
    border-radius: 5px;
    margin-top: 2px;
    margin-right: 2px;
    text-align: center;
    height: 40px;
    width: 40px;
    padding: 0px;
    box-shadow: none;

    &:hover {
        background-color: #F5F5F5;
        color: black;
        border-color:  black;
    }
    &:focus {
        background-color: #F5F5F5;
        color: black;
        border-color:  #F5F5F5;
    }

    &:active {
        background-color: #F5F5F5;
        color: black;
        border-color: black;
    }

    &:disabled, &:disabled:hover {
        background-color: #F5F5F5;
        cursor: default;
        color: black;
        border: 1px solid #F5F5F5;
    }
 `

const buttonSecondaryCss = css`
    display: inline-block;
    background-color: transparent;
    border: 1px solid transparent;
    color: black;
    font-size: 12px;
    line-height: 40px;
    border-radius: 5px;
    margin-top: 2px;
    margin-right: 2px;
    text-align: center;
    height: 40px;
    width: 40px;
    padding: 0px;
    box-shadow: none;

    &:hover {
        background-color: transparent;
        color: black;
        border-color: black;
    }
    &:focus {
        background-color: transparent;
        color: black;
        border-color: transparent;
    }

    &:active {
        background-color: transparent;
        color: black;
        border-color: black;
    }

    &:disabled, &:hover:disabled {
        background-color: transparent;
        color: black;
        border-color: transparent;        
        cursor: default;
    }    
`
const selectedCss = css`
    background-color: black;
    color: white;
    border-color: black;
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
    opacity: 0.3;
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
