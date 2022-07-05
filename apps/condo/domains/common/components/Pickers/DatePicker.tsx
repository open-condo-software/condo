import React, { useContext } from 'react'
import { Dayjs } from 'dayjs'
import dayjsGenerateConfig from 'rc-picker/lib/generate/dayjs'
import generatePicker, {
    PickerDateProps,
    PickerProps,
    PickerTimeProps,
    RangePickerProps,
} from 'antd/lib/date-picker/generatePicker'
import { ConfigProvider } from 'antd'

type PickerType =
    React.ComponentClass<PickerProps<Dayjs>, any>
    | React.ComponentClass<RangePickerProps<Dayjs>>
    | React.ComponentClass<Omit<PickerDateProps<Dayjs>, 'picker'>, any>
    | React.ComponentClass<Omit<PickerTimeProps<Dayjs>, 'picker'>, any>

type PropsWithRef<P, R = any> = P & { ref?: React.ForwardedRef<R> }

type DatePickerType = React.FC<PropsWithRef<PickerProps<Dayjs>>> & {
    WeekPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>,
    MonthPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>,
    YearPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>,
    RangePicker: React.FC<PropsWithRef<RangePickerProps<Dayjs>>>,
    TimePicker: React.FC<PropsWithRef<Omit<PickerTimeProps<Dayjs>, 'picker'>>>,
    QuarterPicker: React.FC<PropsWithRef<Omit<PickerTimeProps<Dayjs>, 'picker'>>>,
}

const _DatePicker = generatePicker<Dayjs>(dayjsGenerateConfig)

const generateDatePickerWithLocale = (Picker: PickerType) => (props) => {
    const { locale } = useContext(ConfigProvider.ConfigContext)

    return <Picker locale={locale.DatePicker} {...props} />
}

const DatePicker = generateDatePickerWithLocale(_DatePicker) as DatePickerType
DatePicker.WeekPicker = generateDatePickerWithLocale(_DatePicker.WeekPicker)
DatePicker.MonthPicker = generateDatePickerWithLocale(_DatePicker.MonthPicker)
DatePicker.YearPicker = generateDatePickerWithLocale(_DatePicker.YearPicker)
DatePicker.RangePicker = generateDatePickerWithLocale(_DatePicker.RangePicker)
DatePicker.TimePicker = generateDatePickerWithLocale(_DatePicker.TimePicker)
DatePicker.QuarterPicker = generateDatePickerWithLocale(_DatePicker.QuarterPicker)

export default DatePicker
