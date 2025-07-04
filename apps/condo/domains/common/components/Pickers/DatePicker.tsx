import { css } from '@emotion/react'
import { ConfigProvider } from 'antd'
import generatePicker, {
    PickerDateProps,
    PickerProps,
    PickerTimeProps,
    RangePickerProps,
} from 'antd/lib/date-picker/generatePicker'
import { Dayjs } from 'dayjs'
import dayjsGenerateConfig from 'rc-picker/lib/generate/dayjs'
import React, { useContext } from 'react'


type PickerType =
    React.ComponentClass<PickerProps<Dayjs>, any>
    | React.ComponentClass<RangePickerProps<Dayjs>>
    | React.ComponentClass<Omit<PickerDateProps<Dayjs>, 'picker'>, any>
    | React.ComponentClass<Omit<PickerTimeProps<Dayjs>, 'picker'>, any>

type PropsWithRef<P, R = any> = P & { ref?: React.Ref<R> }

export type DatePickerType = React.FC<PropsWithRef<PickerProps<Dayjs>>> & {
    WeekPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>
    MonthPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>
    YearPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>
    RangePicker: React.FC<PropsWithRef<RangePickerProps<Dayjs>>>
    TimePicker: React.FC<PropsWithRef<Omit<PickerTimeProps<Dayjs>, 'picker'>>>
    QuarterPicker: React.FC<PropsWithRef<Omit<PickerTimeProps<Dayjs>, 'picker'>>>
}

const PickerStyle = css`
  .ant-picker-input > input {
    font-size: 16px;
  }
`

const DefaultDatePicker = generatePicker<Dayjs>(dayjsGenerateConfig)

const generateDatePickerWithLocale = (Picker: PickerType) => (props) => {
    const { locale } = useContext(ConfigProvider.ConfigContext)

    return <Picker css={PickerStyle} locale={locale.DatePicker} {...props} />
}

const DatePicker = generateDatePickerWithLocale(DefaultDatePicker) as DatePickerType
DatePicker.WeekPicker = generateDatePickerWithLocale(DefaultDatePicker.WeekPicker)
DatePicker.MonthPicker = generateDatePickerWithLocale(DefaultDatePicker.MonthPicker)
DatePicker.YearPicker = generateDatePickerWithLocale(DefaultDatePicker.YearPicker)
DatePicker.RangePicker = generateDatePickerWithLocale(DefaultDatePicker.RangePicker)
DatePicker.TimePicker = generateDatePickerWithLocale(DefaultDatePicker.TimePicker)
DatePicker.QuarterPicker = generateDatePickerWithLocale(DefaultDatePicker.QuarterPicker)

export default DatePicker
