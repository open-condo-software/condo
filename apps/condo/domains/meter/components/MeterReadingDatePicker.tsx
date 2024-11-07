import { FormInstance } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { FC, CSSProperties, useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'

import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { EXPORT_METER_READINGS_MONTHS_LIMIT } from '@condo/domains/meter/constants/constants'


const DATE_RANGE_PICKER_STYLE: CSSProperties = { width: '100%' }

type MeterReadingDatePickerProps = {
    filtersModalForm?: FormInstance
}

export const MeterReadingDatePicker: FC<MeterReadingDatePickerProps> = ({ filtersModalForm, ...props }) => {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })

    const [dateRange, setDateRange] = useDateRangeSearch('date')
    const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs]>()

    const handleDateChange = useCallback((value) => {
        if (filtersModalForm) {
            filtersModalForm.setFieldValue('date', value)
            setSelectedDates(value)
        } else {
            setDateRange(value)
        }
    }, [filtersModalForm, setDateRange])

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

    return (
        <DateRangePicker
            value={selectedDates || dateRange}
            onChange={handleDateChange}
            placeholder={[StartDateMessage, EndDateMessage]}
            disabledDate={disabledDate}
            onCalendarChange={onCalendarChange}
            onOpenChange={onOpenChange}
            style={DATE_RANGE_PICKER_STYLE}
        />
    )
}