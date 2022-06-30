import React from 'react'
import { Dayjs } from 'dayjs'
import dayjsGenerateConfig from 'rc-picker/lib/generate/dayjs'
import generatePicker, {
    PickerDateProps,
    PickerProps,
    PickerTimeProps,
    RangePickerProps,
} from 'antd/lib/date-picker/generatePicker'
import { useIntl } from 'react-intl'
import ruRU from 'antd/lib/locale/ru_RU'
import enUS from 'antd/lib/locale/en_US'

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

const ANT_DATE_PICKER_LOCALES = {
    ru: ruRU.DatePicker,
    en: enUS.DatePicker,
}

const _DatePicker = generatePicker<Dayjs>(dayjsGenerateConfig)

const generateDatepickerWithRuLocale = (Picker: PickerType) => (props) => {
    const intl = useIntl()
    const antLocale = ANT_DATE_PICKER_LOCALES[intl.locale]

    return <Picker locale={antLocale} {...props} />
}

const MergedDatePicker = generateDatepickerWithRuLocale(_DatePicker) as MergedDatePickerType
MergedDatePicker.WeekPicker = generateDatepickerWithRuLocale(_DatePicker.WeekPicker)
MergedDatePicker.MonthPicker = generateDatepickerWithRuLocale(_DatePicker.MonthPicker)
MergedDatePicker.YearPicker = generateDatepickerWithRuLocale(_DatePicker.YearPicker)
MergedDatePicker.RangePicker = generateDatepickerWithRuLocale(_DatePicker.RangePicker)
MergedDatePicker.TimePicker = generateDatepickerWithRuLocale(_DatePicker.TimePicker)
MergedDatePicker.QuarterPicker = generateDatepickerWithRuLocale(_DatePicker.QuarterPicker)

export default MergedDatePicker
