/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { green } from '@ant-design/colors'
import { Button as DefaultButton, ButtonProps } from 'antd'
import { colors } from '../constants/style'

const buttonCss = (color) => {
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
        border: none;
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

export interface CustomButtonProps extends Omit<ButtonProps, 'type'>{
    type: 'sberDefault' | 'sberPrimary' | 'inlineLink' | 'sberDanger' | 'sberGrey' | ButtonProps['type'],
    secondary?: boolean
}

export const Button: React.FC<CustomButtonProps> = ({ type, secondary, ...restProps }) => {
    if (
        type !== 'sberDefault' &&
        type !== 'sberPrimary' &&
        type !== 'sberDanger' &&
        type !== 'sberGrey' &&
        type !== 'inlineLink'
    ) {
        return <DefaultButton {...{ ...restProps, type }}/>
    } else {
        let buttonStyles
        if (type === 'inlineLink') {
            buttonStyles = buttonLinkCss
        } else {
            buttonStyles = secondary ? buttonSecondaryCss(colors[type]) : buttonCss(colors[type])
        }

        return <DefaultButton css={buttonStyles} {...restProps}/>
    }
}
