/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/react'
import DatePicker from './DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { DownOutlined, MinusOutlined } from '@ant-design/icons'
import { fontSizes } from '@condo/domains/common/constants/style'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'
import { BirdieArrowIconSvg } from '../icons/BirdieArrowIcon'

const RANGE_PICKER_CSS = css`
  &.ant-picker-focused {
    border-color: unset;
    box-shadow: unset;
  }
  & input {
    text-align: center;
    font-size: ${fontSizes.content};
  }
  & .ant-picker-suffix {
    height: 5px;
    width: 13px;
  }
`

const DateRangePicker: React.FC<RangePickerSharedProps<Dayjs>> = (props) => {
    return (
        <DatePicker.RangePicker
            css={RANGE_PICKER_CSS}
            allowClear={false}
            suffixIcon={<BirdieArrowIconSvg width={'13px'} height={'6px'}/>}
            disabledDate={(date) => date > dayjs()}
            format='DD.MM.YYYY'
            separator={<MinusOutlined />}
            {...props}
        />
    )
}

export default DateRangePicker
