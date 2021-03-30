/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { green } from '@ant-design/colors'
import { Button as DefaultButton, ButtonProps } from 'antd'
import { colors } from '../constants/style'

const buttonCss = (color) => css`
  background-color: ${color[5]};
  box-shadow: 0 3px 6px ${color[4]}, 0 6px 16px ${color[3]}, 0 9px 28px ${color[2]};
  border: 1px solid ${color[5]};
  color: ${colors.defaultWhite[5]};
  font-weight: 700;

  &:hover, &:focus {
    box-shadow: none;
    background-color: ${color[5]};
    color: ${colors.defaultWhite[5]};
    border-color: ${color[5]};
  }

  &:active {
    background-color: ${color[5]};
    border-color: ${color[5]};
    opacity: 80%;
  }

  &:disabled, &:hover:disabled {
    box-shadow: none;
    background-color: ${color[5]};
    border-color: ${color[5]};
    color: ${colors.lightGrey[1]}
  }
`

const buttonSecondaryCss = (color) => css`
  background-color: ${colors.white};
  box-shadow: 0 3px 6px ${colors.lightGrey[4]}, 0 6px 16px ${colors.lightGrey[3]}, 0 9px 28px ${colors.lightGrey[2]};
  border: 1px solid ${color[6]};
  color: ${color[6]};
  font-weight: 400;

  &:hover, &:focus {
    box-shadow: none;
    color: ${color[6]};
    border-color: ${color[6]};
  }

  &:active {
    opacity: 80%;
    border-color: ${color[6]};
    color: ${color[6]};
  }

  &:disabled, &:hover:disabled {
    box-shadow: none;
    background-color: ${colors.white};
    opacity: 50%;
    border-color: ${color[6]};
    color: ${color[6]};
  }
`

const buttonLinkCss = css`
  display: inline-block;
  padding: 0;
  margin: 0;
  background-color: transparent;
  color: ${green[6]};
  border: none;
  height: auto;

  &:hover, &:focus {
    color: ${green[5]};
  }

  &:active {
    color: ${green[5]};
    opacity: 80%;
  }

  &:disabled, &:hover:disabled {
    color: ${colors.lightGrey[5]};
  }
`

export interface CustomButtonProps extends Omit<ButtonProps, 'type'>{
    type: 'sberDefault' | 'sberPrimary' | 'inlineLink' | ButtonProps['type'],
    secondary?: boolean
}

export const Button: React.FC<CustomButtonProps> = ({ type, secondary, ...restProps }) => {
    if (type !== 'sberDefault' && type !== 'sberPrimary' && type !== 'inlineLink') {
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
