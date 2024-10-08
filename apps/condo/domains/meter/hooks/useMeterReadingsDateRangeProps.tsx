import { FormInstance } from 'antd'
import { RangePickerProps } from 'antd/es/date-picker/generatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { CSSProperties, useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'

import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { EXPORT_METER_READINGS_MONTHS_LIMIT } from '@condo/domains/meter/constants/constants'

const DATE_RANGE_PICKER_STYLE: CSSProperties = { width: '100%' }


type MeterReadingsDateRangePropsHookType = () => (filtersModalForm?: FormInstance) => RangePickerProps<Dayjs>

export const useMeterReadingsDateRangeProps: MeterReadingsDateRangePropsHookType = () => {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })

    const [dateRange, setDateRange] = useDateRangeSearch('date')
    const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs]>()

    const onChange = useCallback((value, filtersModalForm) => {
        if (filtersModalForm) {
            filtersModalForm.setFieldValue('date', value)
            setSelectedDates(value)
        } else {
            setDateRange(value)
        }
    }, [setDateRange])

    const onCalendarChange = useCallback(dates => setSelectedDates(dates), [])

    const disabledDate = useCallback((current) => {
        if (current > dayjs()) return true
        if (!selectedDates) return false

        const startDate = selectedDates[0]
        const endDate = selectedDates[1]
        const tooLate = startDate && current.diff(startDate, 'months', true) > EXPORT_METER_READINGS_MONTHS_LIMIT
        const tooEarly = endDate && endDate.diff(current, 'months', true) > EXPORT_METER_READINGS_MONTHS_LIMIT

        return !!tooEarly || !!tooLate
    }, [selectedDates])

    const onOpenChange = useCallback((open: boolean) => {
        if (open || !selectedDates) {
            return
        }
        if (!selectedDates[0] || !selectedDates[1]) {
            setSelectedDates(null)
        }
    }, [selectedDates])

    useDeepCompareEffect(() => {
        setSelectedDates(dateRange)
    }, [dateRange])

    return useCallback((filtersModalForm) => ({
        value: selectedDates || dateRange,
        onChange: (value) => onChange(value, filtersModalForm),
        placeholder: [StartDateMessage, EndDateMessage],
        disabledDate,
        onCalendarChange,
        onOpenChange,
        style: DATE_RANGE_PICKER_STYLE,
    }), [EndDateMessage, StartDateMessage, dateRange, disabledDate, onCalendarChange, onChange, onOpenChange, selectedDates])
}