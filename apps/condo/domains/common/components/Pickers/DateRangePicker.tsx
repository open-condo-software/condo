import { DownOutlined, MinusOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { RangePickerProps } from 'antd/lib/date-picker/generatePicker'
import dayjs, { Dayjs } from 'dayjs'
import isFunction from 'lodash/isFunction'
import React from 'react'

import { fontSizes } from '@condo/domains/common/constants/style'
import { analytics } from '@condo/domains/common/utils/analytics'

import DatePicker from './DatePicker'


const RANGE_PICKER_CSS = css`
  &.ant-picker-focused {
    border-color: unset;
    box-shadow: unset;
  }
  & input {
    text-align: center;
    font-size: ${fontSizes.content};
  }
`

const DateRangePicker: React.FC<RangePickerProps<Dayjs>> = (props) => {
    const { onChange, id, ...restProps } = props

    const onChangeCallback: RangePickerProps<Dayjs>['onChange'] = (values, formatString) => {
        if (formatString.length > 1) {
            const [from, to] = formatString
            analytics.track('change', { component: 'DateRangePicker', from, to, id, location: window.location.href })
        }

        if (isFunction(onChange)) {
            onChange(values, formatString)
        }
    }

    return (
        <DatePicker.RangePicker
            css={RANGE_PICKER_CSS}
            suffixIcon={<DownOutlined />}
            disabledDate={(date) => date > dayjs()}
            format='DD.MM.YYYY'
            separator={<MinusOutlined />}
            onChange={onChangeCallback}
            id={id}
            {...restProps}
        />
    )
}

export default DateRangePicker
