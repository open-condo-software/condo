/** @jsx jsx */
import React from 'react'
import { Radio, RadioGroupProps } from 'antd'
import { css, jsx } from '@emotion/react'
import { colors } from '../constants/style'

const radioButtonCss = css`
  & .ant-radio-button-wrapper {
    height: 30px;
    width: 50px;
    text-align: center;
    background: none;
    border: none;
    path, rect {
      fill: ${colors.black};
    }
  }
`

const radioButtonBorderlessCss = css`
  & {
    margin-top: 5px;
    display: flex;
    flex-wrap: nowrap;
    flex-justify-content: center;
    padding: 5px 0px 0px 0px;
  }
  & .ant-radio-button-wrapper > .ant-radio-button {
    border: none;
    border-radius: 4px;
    display: none;
  } 
  & .ant-radio-button-wrapper.ant-radio-button-wrapper-checked {
    padding-top: 2px;
    color: ${colors.green[5]};
    font-weight: bold;
    background: white!important;
    border-radius: 4px!important;
  
  }
  & .ant-radio-button-wrapper::after,
  & .ant-radio-button-wrapper::before {
    display: none;
  }
`

const RadioGroupWithIcon: React.FC<RadioGroupProps> = ({ children, ...radioButtonGroupProps }) => {
    return <Radio.Group className={'sberRadioGroup'} css={radioButtonCss} {...radioButtonGroupProps}>
        <div style={{ 
            'padding': '5px',
            'background': `${colors.backgroundLightGrey}`, 'borderRadius': '8px' }}
        >
            {children}
        </div>
    </Radio.Group>
}

export { radioButtonBorderlessCss }

export default RadioGroupWithIcon
