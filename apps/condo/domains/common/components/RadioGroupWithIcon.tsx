/** @jsx jsx */
import React from 'react'
import { Radio, RadioGroupProps } from 'antd'
import { css, jsx } from '@emotion/core'
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

const RadioGroupWithIcon: React.FC<RadioGroupProps> = ({ children, ...radioButtonGroupProps }) => {
    return <Radio.Group className={'sberRadioGroup'} css={radioButtonCss} {...radioButtonGroupProps}>
        {children}
    </Radio.Group>
}

export default RadioGroupWithIcon
