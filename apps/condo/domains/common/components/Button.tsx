/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/react'
import { green } from '@ant-design/colors'
import { Button as DefaultButton, ButtonProps } from 'antd'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import { colors, gradients, transitions } from '../constants/style'
import { ITrackingComponent, useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import styled from '@emotion/styled'

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
      border-radius: 8px;
      color: ${colors.defaultWhite[5]};
      box-shadow: none;
      font-weight: 700;
      transition: none;
      outline: none;
      border: none;
      background: -webkit-linear-gradient(145deg, #56A9D7 16%, #6AC773 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      svg {
        fill: #4CD174;
      }

      &:hover, &:focus {
        color: ${colors.defaultWhite[5]};
        background: ${gradients.sberActionInversed};
        -webkit-background-clip: inherit;
        -webkit-text-fill-color: ${colors.white};
        svg {
          fill: ${colors.white};
        }
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
    return  css`
      background: ${secondary ? colors.white : colors.black};
      border-radius: 8px;
      color: ${secondary ? colors.black : colors.defaultWhite[5]};
      box-shadow: none;
      font-weight: 600;
      outline: none;
      border: none;
      transition: background-color 0.150s, width 0s, height 0s;
      
      & span {
        position: relative;
        z-index: 1;
        svg {
          fill: ${colors.black}
        }
      }

      &:before {
        border-radius: inherit;
        background: ${secondary ? 'none' : gradients.sberActionInversed};
        content: '';
        display: block;
        position: absolute;
        top: 0;
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
        border: none;
        transition: background-color 0.150s;
        & span {
          background: ${secondary ? '-webkit-linear-gradient(145deg, #56A9D7 16%, #6AC773 100%)' : 'transparent'};
          -webkit-background-clip: ${secondary ? 'text' : 'inherit'};
          -webkit-text-fill-color: ${secondary ? 'transparent' : 'inherit'};
          svg {
              fill: #4CD174;
          }
          
        }
        
      }
      &:hover:not(:disabled):before,
      &:focus:not(:disabled):before {
        opacity: 1;
      }

      &:active {
        color: ${colors.defaultWhite[5]};
        border: none;
      }
      &:active:before {
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
    color: ${colors.white};
    background-color: ${colors.sberDangerRed};
    border-color: transparent;
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

const ButtonGradientBorderWrapperCss = (secondary = false, disabled = false) => css`
  padding: 1px;
  background: ${ disabled ? colors.lightGrey[3] : (secondary ? colors.black : gradients.sberActionGradient)};
  border-radius: 9px;
  pointer-events: ${disabled ? 'none' : 'inherit'};
  &:hover, &:active, &:focus {
    background: ${disabled ? colors.lightGrey[3] : gradients.sberActionGradient};
  }
`
export const ButtonGradientBorderWrapper: React.FC<ButtonGradientBorderWrapperProps> = ({ children, secondary = false, disabled = false }) => {
    const wrapperStyle = ButtonGradientBorderWrapperCss(secondary, disabled)
    return (
        <div css={wrapperStyle}>
            <div style={{ 
                'background':`${colors.white}`, 
                'borderRadius':'8.5px' }}>
                {children}
            </div>
        </div>
    )
}
interface ButtonGradientBorderWrapperProps {
    secondary?: boolean
    disabled?: boolean
}

export interface CustomButtonProps extends Omit<ButtonProps, 'type'>, ITrackingComponent {
    type?: 'sberDefault' | 'sberGradient' | 'sberPrimary' | 'inlineLink' | 'sberDanger' | 'sberGrey' | 'sberAction'
    | 'sberDangerGhost' | 'sberDefaultGradient' | 'sberBlack' | ButtonProps['type'],
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

export const Button: React.FC<CustomButtonProps> = (props) => {
    const { type, secondary, onClick, eventName: propEventName, eventProperties = {}, ...restProps } = props
    const { getTrackingWrappedCallback, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Click)
    const componentProperties = { ...eventProperties }

    if (restProps.children) {
        if (isString(restProps.children)) {
            componentProperties['components'] = { value: restProps.children }
        }
        if (isArray(restProps.children)) {
            const stringValue = restProps.children.filter(child => isString(child)).join(' ')
            componentProperties['components'] = { value: stringValue }
        }
    }

    const onClickCallback = eventName ? getTrackingWrappedCallback(eventName, componentProperties, onClick) : onClick

    if (!SKIP_BUTTON_TYPES_FOR_DEFAULT.includes(type)) {
        return <DefaultButton {...restProps} type={type as ButtonProps['type']} onClick={onClickCallback}/>
    }

    let buttonStyles
    if (BUTTON_TYPE_STYLES[type]) {
        buttonStyles = BUTTON_TYPE_STYLES[type]
    } else if (type === 'sberDefaultGradient') {
        buttonStyles = buttonDefaultGradientCss(secondary)
    } else {
        buttonStyles = secondary ? buttonSecondaryCss(colors[type]) : buttonCss(colors[type])
    }

    return <DefaultButton css={buttonStyles} {...restProps} onClick={onClickCallback}/>
}
