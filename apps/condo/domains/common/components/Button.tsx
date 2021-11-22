/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { green } from '@ant-design/colors'
import { Button as DefaultButton, ButtonProps } from 'antd'
import { colors, gradients } from '../constants/style'

const buttonCss = (color) => {
    // Ant returns an array of hue-separated colors, check them out here
    // refs: https://ant.design/docs/spec/colors
    // We name some of the colors that we use
    const primary = color[5]
    const secondary = color[6]

    return css`
      background-color: ${primary};
      border: 2px solid ${secondary};
      color: ${colors.defaultWhite[5]};
      box-shadow: none;
      font-weight: 700;

      &:hover, &:focus {
        background-color: ${secondary};
        border-color: ${secondary};
        color: ${colors.defaultWhite[5]};
      }

      &:active {
        background-color: ${secondary};
        color: ${colors.defaultWhite[5]};
        opacity: 70%;
      }

      &:disabled, &:hover:disabled {
        background-color: ${primary};
        border-color: ${secondary};
        color: ${colors.lightGrey[1]};
        opacity: 70%;

        & span {
          opacity: 70%;
        }
      }
    `
}

const buttonSecondaryCss = (color) => {
    // Ant returns an array of hue-separated colors, check them out here:
    // refs: https://ant.design/docs/spec/colors
    // We name some of the colors that we use
    const primary = color[6]

    return css`
      background-color: ${colors.white};
      border: 2px solid ${colors.sberGrey[0]};
      color: ${primary};
      box-shadow: none;
      font-weight: 700;

      &:hover, &:focus {
        background-color: ${colors.sberGrey[0]};
        border-color: ${colors.sberGrey[0]};
        color: ${primary};
      }

      &:active {
        border-color: ${colors.sberGrey[0]};
        background-color: ${colors.sberGrey[0]};
        color: ${primary};
        opacity: 70%;

        & span {
          opacity: 100%;
        }
      }

      &:disabled, &:hover:disabled {
        border-color: ${colors.sberGrey[0]};
        opacity: 70%;
        color: ${primary};
        background-color: ${colors.white};

        & span {
          opacity: 70%;
        }
      }
    `
}

const buttonLinkCss = css`
  display: inline-block;
  padding: 0;
  margin: 0;
  background-color: transparent;
  color: ${green[6]};
  border: none;
  height: auto;
  box-shadow: none;

  &:hover, &:focus {
    color: ${green[5]};
  }

  &:active {
    color: ${green[5]};
    opacity: 80%;
  }

  &:disabled, &:hover:disabled {
    color: ${green[5]};
    opacity: 60%;
    background-color: transparent;
  }
`

const buttonGradientCss = css`
      background: ${gradients.sberActionGradient};
      border-radius: 8px;
      color: ${colors.defaultWhite[5]};
      box-shadow: none;
      padding: 12px 18px;
      height: auto;
      font-weight: 700;
      transition: none;
      outline: none;
      border: none;

      &:hover, &:focus {
        color: ${colors.defaultWhite[5]};
        background: ${gradients.sberActionInversed};
      }

      &:active {
        color: ${colors.defaultWhite[5]};
        opacity: 70%;
      }

      &:disabled, &:hover:disabled {
        color: ${colors.lightGrey[1]};
        opacity: 70%;

        & span {
          opacity: 70%;
        }
      }
    `
const buttonDefaultGradientCss = (secondary = false) => {
    const border = secondary ? `1px solid ${colors.inputBorderHover}` : 'none'
    return  css`
      background: ${secondary ? 'transparent' : colors.black};
      border-radius: 8px;
      color: ${secondary ? colors.black : colors.defaultWhite[5]};
      box-shadow: none;
      padding: 12px 18px;
      height: auto;
      font-weight: 700;
      transition: none;
      outline: none;
      border: ${border};
    
      &:hover, &:focus {
        color: ${colors.defaultWhite[5]};
        background: ${gradients.sberActionGradient};
      }
    
      &:active {
        color: ${colors.defaultWhite[5]};
        background: ${gradients.sberActionInversed};    
      }
    
      &:disabled, &:hover:disabled {
        color: ${colors.inputBorderHover};
        background: ${secondary ? 'transparent' : '#E6E8F1'};
        & {
          opacity: 70%;
        }
      }
    `
}
const buttonGhostCss = css`
  & {
    color: ${green[5]};
    font-weight: bold;
    border-width: 2px;
    box-shadow: none;
  }

  &:hover, &:focus {
    border-color: ${green[5]};
    color: ${green[6]};
  }

  &:disabled, &:hover:disabled {
    color: ${green[5]};
    opacity: 60%;
    background-color: transparent;
  }
`

export interface CustomButtonProps extends Omit<ButtonProps, 'type'>{
    type?: 'sberDefault' | 'sberGradient' | 'sberPrimary' | 'inlineLink' | 'sberDanger' | 'sberGrey' | 'sberAction'
    | 'sberDefaultGradient' | ButtonProps['type'],
    secondary?: boolean
}

export const Button: React.FC<CustomButtonProps> = ({ type, secondary, ...restProps }) => {
    if (
        type !== 'sberDefault' &&
        type !== 'sberGradient' &&
        type !== 'sberDefaultGradient' &&
        type !== 'sberPrimary' &&
        type !== 'sberAction' &&
        type !== 'sberDanger' &&
        type !== 'sberGrey' &&
        type !== 'inlineLink' &&
        type !== 'ghost'
    ) {
        return <DefaultButton {...{ ...restProps, type }}/>
    } else {
        let buttonStyles

        if (type === 'sberGradient') {
            buttonStyles = buttonGradientCss
        } else if (type === 'inlineLink') {
            buttonStyles = buttonLinkCss
        } else if (type === 'ghost') {
            buttonStyles = buttonGhostCss
        } else if (type === 'sberDefaultGradient') {
            buttonStyles = buttonDefaultGradientCss(secondary)
        } else {
            buttonStyles = secondary ? buttonSecondaryCss(colors[type]) : buttonCss(colors[type])
        }

        return <DefaultButton css={buttonStyles} {...restProps}/>
    }
}
