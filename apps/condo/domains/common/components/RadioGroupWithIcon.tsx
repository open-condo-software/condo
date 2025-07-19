import { css } from '@emotion/react'
import { Radio, RadioGroupProps } from 'antd'
import React from 'react'

import { colors } from '../constants/style'

const radioButtonCss = css`
  & .ant-radio-button-wrapper {
    height: 36px;
    width: 56px;
    text-align: center;
  }
  & .ant-radio-button-wrapper:not(.ant-radio-button-wrapper-checked) path,
  & .ant-radio-button-wrapper:not(.ant-radio-button-wrapper-checked) rect {
    fill: ${colors.black};
  }
`

const radioButtonBorderlessCss = css`
  & {
    margin-top: 5px;
    display: flex;
    flex-wrap: nowrap;
  }
  & .ant-radio-button-wrapper {
    border: none;
    padding: 0 16px 0 0;
  }
  & .ant-radio-button-wrapper.ant-radio-button-wrapper-checked {
    color: ${colors.green[5]};
    font-weight: bold;
  }
  & .ant-radio-button-wrapper::after,
  & .ant-radio-button-wrapper::before {
    display: none;
  }
`

const RadioGroupWithIcon: React.FC<RadioGroupProps> = ({ children, ...radioButtonGroupProps }) => {
    return <Radio.Group className='sberRadioGroup' css={radioButtonCss} {...radioButtonGroupProps}>
        {children}
    </Radio.Group>
}

export { radioButtonBorderlessCss }

export default RadioGroupWithIcon
