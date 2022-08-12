/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/react'
import DatePicker from './DatePicker'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import dayjs, { Dayjs } from 'dayjs'
import { DownOutlined, MinusOutlined } from '@ant-design/icons'
import { fontSizes } from '@condo/domains/common/constants/style'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'


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

const DateRangePicker: React.FC<RangePickerSharedProps<Dayjs>> = (props) => {
    const { onChange, ...restProps } = props

    const { logEvent, getEventName } = useTracking()

    const eventName = getEventName(TrackingEventType.Daterange)

    const onChangeCallback: RangePickerSharedProps<Dayjs>['onChange'] = (values, formatString) => {
        if (eventName && formatString.length) {
            const eventProperties = { component: { value: formatString } }

            const componentId = get(restProps, 'id')
            if (componentId) {
                eventProperties['component']['id'] = componentId
            }

            logEvent({ eventName, eventProperties })
        }

        if (isFunction(onChange)) {
            onChange(values, formatString)
        }
    }

    return (
        <DatePicker.RangePicker
            css={RANGE_PICKER_CSS}
            allowClear={false}
            suffixIcon={<DownOutlined />}
            disabledDate={(date) => date > dayjs()}
            format='DD.MM.YYYY'
            separator={<MinusOutlined />}
            onChange={onChangeCallback}
            {...restProps}
        />
    )
}

export default DateRangePicker
