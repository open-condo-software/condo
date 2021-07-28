/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { DatePicker } from 'antd'
import moment, { Moment } from 'moment'
import { DownOutlined, MinusOutlined } from '@ant-design/icons'
import { colors } from '../constants/style'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'

const rangePickerCss = css`
  & {
    background-color: ${colors.lightGrey[4]};
  }
  &.ant-picker-focused {
    border-color: unset;
    box-shadow: unset;
  }
  & input {
    color: ${colors.lightGrey[9]};
    text-align: center;
  }
`

const DateRangePicker: React.FC<RangePickerSharedProps<Moment>> = (props) => {
    return (
        <DatePicker.RangePicker
            css={rangePickerCss}
            allowClear={false}
            suffixIcon={<DownOutlined />}
            disabledDate={(date) => date > moment()}
            format='DD.MM.YYYY'
            separator={<MinusOutlined />}
            {...props}
        />
    )
}

export default DateRangePicker
