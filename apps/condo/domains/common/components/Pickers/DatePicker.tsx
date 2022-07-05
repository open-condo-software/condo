import React, {useContext} from 'react'
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

type MergedDatePickerType = React.FC<PropsWithRef<PickerProps<Dayjs>>> & {
    WeekPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>,
    MonthPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>,
    YearPicker: React.FC<PropsWithRef<Omit<PickerDateProps<Dayjs>, 'picker'>>>,
    RangePicker: React.FC<PropsWithRef<RangePickerProps<Dayjs>>>,
    TimePicker: React.FC<PropsWithRef<Omit<PickerTimeProps<Dayjs>, 'picker'>>>,
    QuarterPicker: React.FC<PropsWithRef<Omit<PickerTimeProps<Dayjs>, 'picker'>>>,
}

const DatePicker = generatePicker<Dayjs>(dayjsGenerateConfig)

const generateDatepickerWithLocale = (Picker: PickerType) => (props) => {
    const { locale } = useContext(ConfigProvider.ConfigContext)

    return <Picker locale={locale.DatePicker} {...props} />
}

const MergedDatePicker = generateDatepickerWithLocale(DatePicker) as MergedDatePickerType
MergedDatePicker.WeekPicker = generateDatepickerWithLocale(DatePicker.WeekPicker)
MergedDatePicker.MonthPicker = generateDatepickerWithLocale(DatePicker.MonthPicker)
MergedDatePicker.YearPicker = generateDatepickerWithLocale(DatePicker.YearPicker)
MergedDatePicker.RangePicker = generateDatepickerWithLocale(DatePicker.RangePicker)
MergedDatePicker.TimePicker = generateDatepickerWithLocale(DatePicker.TimePicker)
MergedDatePicker.QuarterPicker = generateDatepickerWithLocale(DatePicker.QuarterPicker)

export default MergedDatePicker
