/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { Button, ButtonProps, Tooltip } from 'antd'
import { colors, gradients } from '@condo/domains/common/constants/style'

const buttonCss = css`
    display: inline-block;
    background-color: #fff;
    border: 1px solid #f5f5f5;
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

    &:disabled,
    &:disabled:hover {
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

    &:disabled,
    &:hover:disabled {
        background-color: transparent;
        color: black;
        border-color: transparent;
        cursor: default;
    }
`
const selectedCss = css`
    background: ${gradients.sberActionInversed};
    color: white;
    border: 1px solid transparent;

    &:hover,
    &:focus {
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
const previewCss = css`
    opacity: 0.5;
`
const noninteractiveCss = css`
    cursor: default;
    pointer-events: none;
    &:after {
        animation: none !important;
    }
    &:hover,
    &:focus,
    &:active {
        background-color: #f5f5f5;
        color: black;
        border-color: #f5f5f5;
    }
`

interface CustomButtonProps extends ButtonProps {
    secondary?: boolean
    selected?: boolean
    noninteractive?: boolean
    preview?: boolean
    ellipsis?: boolean
}

export const UnitButton: React.FC<CustomButtonProps> = (props) => {
    const { secondary, selected, preview, noninteractive, ellipsis = true, children, ...restProps } = props
    const OriginalLabel = children ? children.toString() : ''
    if (!secondary && OriginalLabel.length > 4 && ellipsis) {
        let ButtonLabel = OriginalLabel
        if (!isNaN(Number(ButtonLabel))) {
            ButtonLabel = `…${ButtonLabel.substring(ButtonLabel.length - 2)}`
        } else {
            ButtonLabel = `${ButtonLabel.substring(0, 2)}…`
        }
        return (
            <Tooltip placement="topLeft" title={OriginalLabel}>
                <Button
                    css={css`
                        ${buttonCss};
                        ${selected ? selectedCss : ''};
                        ${noninteractive ? noninteractiveCss : ''};
                        ${preview ? previewCss : ''};
                    `}
                    {...restProps}
                >
                    {ButtonLabel}
                </Button>
            </Tooltip>
        )
    } else {
        return (
            <Button
                css={css`
                    ${secondary ? buttonSecondaryCss : buttonCss};
                    ${selected ? selectedCss : ''};
                    ${noninteractive ? noninteractiveCss : ''};
                    ${preview ? previewCss : ''};
                `}
                {...restProps}
            >
                {children || ' '}
            </Button>
        )
    }
}
