/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
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
    background-color: ${color[4]};
    border-color: ${color[4]};
  }

  &:disabled, &:hover:disabled {
    box-shadow: none;
    background-color: ${color[3]};
    border-color: ${color[3]};
    color: ${colors.defaultWhite[3]}
  }
`

const buttonSecondaryCss = (color) => css`
  background-color: ${colors.white};
  box-shadow: 0 3px 6px ${colors.lightGrey[4]}, 0 6px 16px ${colors.lightGrey[3]}, 0 9px 28px ${colors.lightGrey[2]};
  border: 1px solid ${color[5]};
  color: ${color[6]};
  font-weight: 400;

  &:hover, &:focus {
    box-shadow: none;
    color: ${color[6]};
    border-color: ${color[5]};
  }

  &:active {
    border-color: ${color[4]};
  }

  &:disabled, &:hover:disabled {
    box-shadow: none;
    border-color: ${color[3]};
    color: ${color[3]}
  }
`

interface CustomButtonProps extends Omit<ButtonProps, 'type'>{
    type: 'sberDefault' | 'sberPrimary' | ButtonProps['type'],
    secondary?: boolean
}

export const Button:React.FunctionComponent<CustomButtonProps> = ({ type, secondary, ...restProps }) => {
    if (type !== 'sberDefault' && type !== 'sberPrimary') {
        return <DefaultButton {...{ ...restProps, type }}/>
    } else {
        const buttonStyles = secondary ? buttonSecondaryCss(colors[type]) : buttonCss(colors[type])

        return <DefaultButton css={buttonStyles} {...restProps}/>
    }

}
