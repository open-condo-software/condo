/** @jsx jsx */
import React, { CSSProperties, useCallback, useState } from 'react'
import { InputNumber } from 'antd'
import { css, jsx } from '@emotion/core'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import isEmpty from 'lodash/isEmpty'
import { useIntl } from 'react-intl'

import { getDateRender, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { colors } from '@condo/domains/common/constants/style'
import { fontSizes } from '@condo/domains/common/constants/style'

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
const PARSER_METER_READING_REGEX = /[,.]+/g
const inputMeterReadingParser = input => input.replace(PARSER_METER_READING_REGEX, '.')
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

    const meterId = get(record, ['meter', 'id'])
    const tariffNumber = get(record, 'tariffNumber')
    const meterResourceMeasure = get(record, ['meter', 'resource', 'measure'])
    const inputValue = get(newMeterReadings, [meterId, tariffNumber], '')

    const updateMeterReadingsValue = useCallback((oldMeterReadings, newTariffValue) => {
        const newReadingsFromOtherTariffs = get(oldMeterReadings, [meterId], {})
        const newMeterMeterReadings = pickBy({ ...newReadingsFromOtherTariffs, [tariffNumber]: newTariffValue })
        const pickMeterReadingCondition = meterReading => !isEmpty(meterReading)

        return pickBy({ ...oldMeterReadings, [meterId]: newMeterMeterReadings }, pickMeterReadingCondition)
    }, [meterId, tariffNumber])

    const meterReadingValueChangeHandler = useCallback((e) => {
        const newTariffValue = e ? String(e) : ''
        setNewMeterReadings(oldMeterReadings => updateMeterReadingsValue(oldMeterReadings, newTariffValue))
    }, [setNewMeterReadings, updateMeterReadingsValue])

    const handleInputContainerClick = useCallback(e => e.stopPropagation(), [])

    return (
        <div style={INPUT_CONTAINER_STYLE} onClick={handleInputContainerClick}>
            <InputNumber
                placeholder={AddMeterReadingPlaceholderMessage}
                css={inputNumberCSS}
                stringMode
                onChange={meterReadingValueChangeHandler}
                value={inputValue}
                formatter={inputMeterReadingFormatter}
                parser={inputMeterReadingParser}
                min={0}
            />
            <div style={METER_READING_INPUT_ADDON_STYLE}>
                {meterResourceMeasure}
            </div>
        </div>
    )
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
    const FirstTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff1Message' })
    const SecondTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff2Message' })
    const ThirdTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff3Message' })
    const FourthTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff4Message' })

    const [newMeterReadings, setNewMeterReadings] = useState({})

    const meterResourceRender = useCallback(record => {
        const meterResource = get(record, ['meter', 'resource', 'name'])
        const numberOfTariffs = get(record, ['meter', 'numberOfTariffs'])

        if (numberOfTariffs > 1) {
            const tariffNumberMessages = [`(${FirstTariffMessage})`, `(${SecondTariffMessage})`, `(${ThirdTariffMessage})`, `(${FourthTariffMessage})`]
            const tariffNumber = get(record, 'tariffNumber')

            return meterResource + `\n${tariffNumberMessages[tariffNumber - 1]}`
        }

        return meterResource
    }, [FirstTariffMessage, FourthTariffMessage, SecondTariffMessage, ThirdTariffMessage])

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