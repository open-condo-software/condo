/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/core'
import DatePicker from './DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { DownOutlined, MinusOutlined } from '@ant-design/icons'
import { fontSizes } from '@condo/domains/common/constants/style'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'
import { colors } from '../../constants/style'


const RANGE_PICKER_CSS = css`
  &.ant-picker-focused {
    border-color: unset;
    box-shadow: unset;
  }
  &.ant-picker-range {
    background-color: ${colors.ultraLightGrey};
    border-radius: 8px
  }
  & input {
    text-align: center;
    font-size: ${fontSizes.content};
  }
`

const DateRangePicker: React.FC<RangePickerSharedProps<Dayjs>> = (props) => {
    return (
        <DatePicker.RangePicker
            css={RANGE_PICKER_CSS}
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
