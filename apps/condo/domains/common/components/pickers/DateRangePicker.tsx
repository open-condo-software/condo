/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import { DatePicker } from './DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { DownOutlined, MinusOutlined } from '@ant-design/icons'
import { colors } from '../../constants/style'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'

const rangePickerCss = css`
  & {
    background-color: ${colors.lightGrey[4]};
    padding: 8px 12px 8px;
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

export function DateRangePicker (props: RangePickerSharedProps<Dayjs>) {
    return (
        <DatePicker.RangePicker
            css={rangePickerCss}
            allowClear={false}
            suffixIcon={<DownOutlined />}
            disabledDate={(date) => date > dayjs()}
            format='DD.MM.YYYY'
            separator={<MinusOutlined />}
            {...props}
        />
    )
}
