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

interface CustomButtonProps extends Omit<ButtonProps, 'type'>{
    type: 'sberDefault' | 'sberPrimary' | ButtonProps['type'],
}

export const Button:React.FunctionComponent<CustomButtonProps> = ({ type, ...restProps }) => {
    if (type !== 'sberDefault' && type !== 'sberPrimary') {
        return <DefaultButton {...{ ...restProps, type }}/>
    } else {
        const buttonStyles = buttonCss(colors[type])

        return <DefaultButton css={buttonStyles} {...restProps}/>
    }

}
