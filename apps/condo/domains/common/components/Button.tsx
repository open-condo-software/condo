import { green } from '@ant-design/colors'
import { css } from '@emotion/react'
import { Button as DefaultButton, ButtonProps } from 'antd'
import isString from 'lodash/isString'
import React, { useCallback, useMemo } from 'react'

import { analytics } from '@condo/domains/common/utils/analytics'

import { colors, gradients, transitions } from '../constants/style'


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
    const border = secondary ? `1px solid ${colors.black}` : '1px solid transparent'
    return  css`
      background: ${secondary ? 'transparent' : colors.black};
      border-radius: 8px;
      color: ${secondary ? colors.black : colors.defaultWhite[5]};
      box-shadow: none;
      font-weight: 600;
      outline: none;
      border: ${border};
      transition: ${transitions.allDefault};
      
      & span {
        position: relative;
        z-index: 1;
      }
      
      &:before {
        border-radius: inherit;
        background: ${gradients.sberActionInversed};
        content: '';
        display: block;
        position: absolute;
        top: -1px;
        left: 0;
        right: 0;
        height: inherit;
        width: inherit;
        color: ${colors.black};
        opacity: 0;
        border: none;
        padding: inherit;
      }

      &:hover, &:focus {
        color: ${colors.defaultWhite[5]};
        border: 1px solid transparent;
      }
      &:hover:not(:disabled):before,
      &:focus:not(:disabled):before {
        opacity: 1;
      }

      &:active {
        color: ${colors.defaultWhite[5]};
        border: 1px solid transparent;
      }
      &:active:before {
        background: ${gradients.sberActionInversed};
        opacity: 1;
      }

      &:disabled, &:hover:disabled {
        color: ${secondary ? colors.textSecondary : colors.white};
        background: ${secondary ? colors.lightGrey[3] : colors.black };
        opacity: ${secondary ? 1 : 0.5};
        border: ${secondary ? 'unset' : 'inherit'};
        pointer-events: none;
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

const sberDangerGhost = css`
  color: ${colors.sberDangerRed};
  font-weight: bold;
  border-color: ${colors.sberDangerRed};
  background-color: transparent;
  
  &:hover, &:focus {
    border-color: unset;
    color: ${colors.white};
    background-color: ${colors.sberDangerRed};
  }

  &:disabled, &:hover:disabled {
    color: ${colors.inputBorderHover};
    background: transparent;
    & {
      opacity: 70%;
    }
  }
`

const sberBlackCss = css`
  color: ${colors.black};
  font-weight: 600;
  border-color: ${colors.inputBorderHover};
  background-color: transparent;
  
  &:hover, &:focus {
    border-color: transparent;
    color: white;
    background-color: ${colors.black};
  }
`

export interface CustomButtonProps extends Omit<ButtonProps, 'type'> {
    type?: 'sberDefault' | 'sberGradient' | 'sberPrimary' | 'inlineLink' | 'sberDanger' | 'sberGrey' | 'sberAction'
    | 'sberDangerGhost' | 'sberDefaultGradient' | 'sberBlack' | ButtonProps['type']
    secondary?: boolean
}

const SKIP_BUTTON_TYPES_FOR_DEFAULT = [
    'sberDefault', 'sberGradient', 'sberDefaultGradient', 'sberPrimary', 'sberAction', 'sberDanger',
    'sberDangerGhost', 'sberGrey', 'inlineLink', 'sberBlack', 'ghost',
]

const BUTTON_TYPE_STYLES = {
    sberGradient: buttonGradientCss,
    inlineLink: buttonLinkCss,
    ghost: buttonGhostCss,
    sberDangerGhost: sberDangerGhost,
    sberBlack: sberBlackCss,
}

/** @deprecated use Button from @open-condo/ui **/
export const Button: React.FC<CustomButtonProps> = (props) => {
    const { type, secondary, id, onClick, ...restProps } = props

    const value = useMemo(() => {
        if (isString(restProps.children)) {
            return restProps.children
        } else if (Array.isArray(restProps.children)) {
            return restProps.children.filter(child => isString(child)).join(' ')
        }

        return null
    }, [restProps.children])

    const onClickWrapped: React.MouseEventHandler<HTMLElement> = useCallback((e) => {
        analytics.track('click', {
            component: 'Button',
            type,
            id,
            value,
            location: window.location.href,
        })

        if (onClick) {
            onClick(e)
        }
    }, [id, onClick, type, value])

    if (!SKIP_BUTTON_TYPES_FOR_DEFAULT.includes(type)) {
        return <DefaultButton {...restProps} type={type as ButtonProps['type']} onClick={onClickWrapped}/>
    }

    let buttonStyles
    if (BUTTON_TYPE_STYLES[type]) {
        buttonStyles = BUTTON_TYPE_STYLES[type]
    } else if (type === 'sberDefaultGradient') {
        buttonStyles = buttonDefaultGradientCss(secondary)
    } else {
        buttonStyles = secondary ? buttonSecondaryCss(colors[type]) : buttonCss(colors[type])
    }

    return <DefaultButton css={buttonStyles} {...restProps} onClick={onClickWrapped}/>
}
