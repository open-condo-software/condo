import get from 'lodash/get'
import { getFilteredValue } from '../../common/utils/helpers'
import { getDateRender, getTextRender } from '../../common/components/Table/Renders'
import { getFilterDropdownByKey } from '../../common/utils/filters.utils'
import { useIntl } from 'react-intl'
import { MeterReading } from '../utils/clientSchema'
import React, { CSSProperties, useCallback, useState } from 'react'
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

const INPUT_CONTAINER_STYLE: CSSProperties = { position: 'relative' }
const inputMeterReadingFormatter = value => value.toString().replace(',', '.')
const inputMeterReadingParser = input => input.replace(/,+/g, '.')
const METER_READING_INPUT_ADDON_STYLE: CSSProperties = {
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
}

const MeterReadingInput = ({ record, newMeterReadings, setNewMeterReadings }) => {
    const intl = useIntl()
    const AddMeterReadingPlaceholderMessage = intl.formatMessage({ id: 'pages.condo.meter.create.AddMeterReadingPlaceholder' })

    const meterReadingValueChangeHandler = useCallback((meterId, tariffNumber, e) => setNewMeterReadings(meterReadings => {
        const newReadingsFromOtherTariffs = get(meterReadings, [meterId], {})
        const newMeterMeterReadings = pickBy({ ...newReadingsFromOtherTariffs, [tariffNumber]: e ? String(e) : '' })

        return pickBy({ ...meterReadings, [meterId]: newMeterMeterReadings }, meterReading => !isEmpty(meterReading))
    }), [setNewMeterReadings])

    const meterId = get(record, ['meter', 'id'])
    const tariffNumber = get(record, 'tariffNumber')
    const meterResourceMeasure = get(record, ['meter', 'resource', 'measure'])

    const handleInputContainerClick = useCallback(e => e.stopPropagation(), [])
    const handleInputChange = useCallback(e => meterReadingValueChangeHandler(meterId, tariffNumber, e),
        [meterId, meterReadingValueChangeHandler, tariffNumber])

    return (
        <div style={INPUT_CONTAINER_STYLE} onClick={handleInputContainerClick}>
            <InputNumber
                placeholder={AddMeterReadingPlaceholderMessage}
                css={inputNumberCSS}
                stringMode
                onChange={handleInputChange}
                value={get(newMeterReadings, [meterId, tariffNumber], '')}
                formatter={inputMeterReadingFormatter}
                parser={inputMeterReadingParser}
            />
            <div style={METER_READING_INPUT_ADDON_STYLE}>
                {meterResourceMeasure}
            </div>
        </div>
    )
}

const meterResourceRender = record => {
    const meterResource = get(record, ['meter', 'resource', 'name'])
    const numberOfTariffs = get(record, ['meter', 'numberOfTariffs'])

    if (numberOfTariffs > 1) {
        const tariffNumberMessages = ['(Т1 - День)', '(T2 - Ночь)', '(T3)', '(T4)']
        const tariffNumber = get(record, 'tariffNumber')

        return meterResource + `\n${tariffNumberMessages[tariffNumber - 1]}`
    }

    return meterResource
}

export const useMeterTableColumns = () => {
    const intl = useIntl()
    const AccountMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const ResourceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const PlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.Place' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const VerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const MeterReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MeterReadings' })
    const LastReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.create.LastReading' })

    const [newMeterReadings, setNewMeterReadings] = useState({})

    const renderMeterReading = useCallback((record) => (
        <MeterReadingInput
            record={record}
            newMeterReadings={newMeterReadings}
            setNewMeterReadings={setNewMeterReadings}
        />
    ), [newMeterReadings])

    const tableColumns = [
        {
            title: AccountMessage,
            dataIndex: ['meter', 'accountNumber'],
            width: '10%',
            render: getTextRender(),
        },
        {
            title: ResourceMessage,
            width: '10%',
            render: meterResourceRender,
        },
        {
            title: MeterNumberMessage,
            dataIndex: ['meter', 'number'],
            width: '10%',
            render: getTextRender(),
        },
        {
            title: PlaceMessage,
            dataIndex: ['meter', 'place'],
            width: '10%',
            render: getTextRender(),
        },
        {
            title: LastReadingMessage,
            dataIndex: 'lastMeterReading',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: SourceMessage,
            dataIndex: 'meterReadingSource',
            width: '10%',
            render: getTextRender(),
        },
        {
            title: VerificationDateMessage,
            dataIndex: ['meter', 'verificationDate'],
            width: '10%',
            render: getDateRender(intl),
        },
        {
            title: MeterReadingsMessage,
            width: '20%',
            render: renderMeterReading,
        },
    ]

    return { tableColumns, newMeterReadings, setNewMeterReadings }
}