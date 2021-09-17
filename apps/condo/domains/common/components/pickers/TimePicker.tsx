import React from 'react'
import { Dayjs } from 'dayjs'
import { PickerTimeProps } from 'antd/es/date-picker/generatePicker'
import { DatePicker } from './DatePicker'

type TimePickerProps = Omit<PickerTimeProps<Dayjs>, 'picker'>

export const TimePicker = React.forwardRef<any, TimePickerProps>((props, ref) => {
    return <DatePicker {...props} picker="time" mode={undefined} ref={ref} />
})

TimePicker.displayName = 'TimePicker'
