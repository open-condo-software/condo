/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import DatePicker from './DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { DownOutlined, MinusOutlined } from '@ant-design/icons'
import { fontSizes } from '@condo/domains/common/constants/style'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'

const rangePickerCss = css`
  &.ant-picker-focused {
    border-color: unset;
    box-shadow: unset;
  }
  & input {
    text-align: center;
    font-size: ${fontSizes.content};
  }
`

const DateRangePicker: React.FC<RangePickerSharedProps<Dayjs>> = (props) => {
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

export default DateRangePicker
