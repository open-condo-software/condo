import get from 'lodash/get'
import { getFilteredValue } from '../../common/utils/helpers'
import { getDateRender, getTextRender } from '../../common/components/Table/Renders'
import { getFilterDropdownByKey } from '../../common/utils/filters.utils'
import { useIntl } from 'react-intl'
import { MeterReading } from '../utils/clientSchema'
import React, { useCallback, useState } from 'react'
import { Input, InputNumber, Row } from 'antd'
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { colors } from '../../common/constants/style'
import { fontSizes } from '@condo/domains/common/constants/style'
import pickBy from 'lodash/pickBy'
import { isEmpty } from 'lodash'

const inputNumberCSS = css`
  & .ant-input-number-handler-wrap {
    visibility: hidden;
  }

  font-size: ${fontSizes.label};
  
  width: 100%;
  padding-right: 20%;
`

const MeterReadingInput = ({ record, newMeterReadings, setNewMeterReadings }) => {
    const meterReadingValueChangeHandler = useCallback((meterId, tariffNumber, e) => setNewMeterReadings(meterReadings => {
        const newReadingsFromOtherTariffs = get(meterReadings, [meterId], {})
        const newMeterMeterReadings = pickBy({ ...newReadingsFromOtherTariffs, [tariffNumber]: e ? String(e) : '' })

        return pickBy({ ...meterReadings, [meterId]: newMeterMeterReadings }, meterReading => !isEmpty(meterReading))
    }), [setNewMeterReadings])

    const meterId = get(record, ['meter', 'id'])
    const tariffNumber = get(record, 'tariffNumber')
    const meterResourceMeasure = get(record, ['meter', 'resource', 'measure'])

    return (
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <InputNumber
                placeholder={'Введите значение'}
                css={inputNumberCSS}
                stringMode
                onChange={e => meterReadingValueChangeHandler(meterId, tariffNumber, e)}
                value={get(newMeterReadings, [meterId, tariffNumber], '')}
                formatter={value => value.toString().replace(',', '.')}
                parser={input => {
                    return input.replace(/,+/g, '.')
                }}
            />
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '2%',
                padding: '0 5px',
                fontSize: '0.8rem',
                backgroundColor: colors.backgroundLightGrey,
                verticalAlign: 'middle',
                height: '85%',
                borderRadius: '0 8px 8px 0',
                transform: 'translateY(-50%)',
                width: '30%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.sberGrey[6],
            }}>
                {meterResourceMeasure}
            </div>
        </div>
    )
}

export const useMeterTableColumns = () => {
    const intl = useIntl()
    const [newMeterReadings, setNewMeterReadings] = useState({})

    const tableColumns = [
        {
            title: 'Лицевой счет',
            dataIndex: ['meter', 'accountNumber'],
            width: '10%',
            render: getTextRender(),
        },
        {
            title: 'Ресурс',
            width: '10%',
            render: (record => {
                const meterResource = get(record, ['meter', 'resource', 'name'])
                const numberOfTariffs = get(record, ['meter', 'numberOfTariffs'])

                if (numberOfTariffs > 1) {
                    const tariffNumberMessages = ['(Т1 - День)', '(T2 - Ночь)', '(T3)', '(T4)']
                    const tariffNumber = get(record, 'tariffNumber')

                    return meterResource + `\n${tariffNumberMessages[tariffNumber - 1]}`
                }

                return meterResource
            }),
        },
        {
            title: '№ прибора учета',
            dataIndex: ['meter', 'number'],
            width: '10%',
            render: getTextRender(),
        },
        {
            title: 'Место',
            dataIndex: ['meter', 'place'],
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
            dataIndex: ['meter', 'verificationDate'],
            width: '10%',
            render: getDateRender(intl),
        },
        {
            title: 'Показания',
            width: '20%',
            render: (record) => (
                <MeterReadingInput
                    record={record}
                    newMeterReadings={newMeterReadings}
                    setNewMeterReadings={setNewMeterReadings}
                />
            ),
        },
    ]

    return { tableColumns, newMeterReadings, setNewMeterReadings }
}