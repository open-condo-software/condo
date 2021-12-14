import get from 'lodash/get'
import { getFilteredValue } from '../../common/utils/helpers'
import { getDateRender, getTextRender } from '../../common/components/Table/Renders'
import { getFilterDropdownByKey } from '../../common/utils/filters.utils'
import { useIntl } from 'react-intl'
import { MeterReading } from '../utils/clientSchema'
import React, { useCallback, useState } from 'react'
import { Input, InputNumber } from 'antd'
/** @jsx jsx */
import { css, jsx } from '@emotion/core'

const inputNumberCSS = css`
  & .ant-input-number-handler-wrap {
    visibility: hidden;
  }
`

export const useMeterTableColumns = () => {
    const intl = useIntl()
    const [newMeterReadings, setNewMeterReadings] = useState({})

    const meterReadingValueChangeHandler = useCallback((record, e) => setNewMeterReadings(meterReadings => {
        const newReadingsFromOtherTariffs = get(meterReadings, [record.meterId], {})

        return { ...meterReadings, [record.meterId]: { ...newReadingsFromOtherTariffs, [record.tariffNumber]: String(e) } }
    }), [setNewMeterReadings])

    const tableColumns = [
        {
            title: 'Лицевой счет',
            dataIndex: 'meterAccountNumber',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: 'Ресурс',
            dataIndex: 'meterResource',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: '№ прибора учета',
            dataIndex: 'meterNumber',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: 'Место',
            dataIndex: 'meterPlace',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: 'Предыдущие показания',
            dataIndex: 'lastMeterReading',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: 'Источник',
            dataIndex: 'meterReadingSource',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: 'Дата поверки',
            dataIndex: 'meterVerificationDate',
            width: '10%',
            render: getDateRender(intl),
        },
        {
            title: 'Показания',
            width: '10%',
            render: (record) => {
                return (
                    <InputNumber
                        css={inputNumberCSS}
                        stringMode
                        onChange={e => meterReadingValueChangeHandler(record, e)}
                        value={get(newMeterReadings, [record.meterId, record.tariffNumber], '')}
                    />
                )
            },
        },
    ]

    return { tableColumns, newMeterReadings, setNewMeterReadings }
}