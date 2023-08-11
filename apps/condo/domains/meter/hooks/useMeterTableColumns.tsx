/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { InputNumber } from 'antd'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getDateRender, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { colors } from '@condo/domains/common/constants/style'
import { fontSizes } from '@condo/domains/common/constants/style'
import { METER_PAGE_TYPES, MeterPageTypes } from '@condo/domains/meter/utils/clientSchema'

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
    const AddMeterReadingPlaceholderMessage = intl.formatMessage({ id: 'meter.create.addMeterReadingPlaceholder' })

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

export const useMeterTableColumns = (meterType: MeterPageTypes) => {
    const intl = useIntl()
    const AccountMessage = intl.formatMessage({ id: 'meter.account' })
    const ResourceMessage = intl.formatMessage({ id: 'meter.resource' })
    const MeterNumberMessage = intl.formatMessage({ id: 'meter.meterNumber' })
    const PlaceMessage = intl.formatMessage({ id: 'meter.place' })
    const SourceMessage = intl.formatMessage({ id: 'field.source' })
    const VerificationDateMessage = intl.formatMessage({ id: 'meter.verificationDate' })
    const MeterReadingsMessage = intl.formatMessage({ id: 'meter.create.meterReadings' })
    const LastReadingMessage = intl.formatMessage({ id: 'meter.create.lastReading' })
    const FirstTariffMessage = intl.formatMessage({ id: 'meter.tariff1Message' })
    const SecondTariffMessage = intl.formatMessage({ id: 'meter.tariff2Message' })
    const ThirdTariffMessage = intl.formatMessage({ id: 'meter.tariff3Message' })
    const FourthTariffMessage = intl.formatMessage({ id: 'meter.tariff4Message' })

    const isPropertyMeter = meterType === METER_PAGE_TYPES.propertyMeter
    const [newMeterReadings, setNewMeterReadings] = useState({})
    const tariffNumberMessages = useMemo(() =>
        [`(${FirstTariffMessage})`, `(${SecondTariffMessage})`, `(${ThirdTariffMessage})`, `(${FourthTariffMessage})`],
    [FirstTariffMessage, FourthTariffMessage, SecondTariffMessage, ThirdTariffMessage])

    const meterResourceRenderer = useCallback(record => {
        const meterResource = get(record, ['meter', 'resource', 'name'])
        const numberOfTariffs = get(record, ['meter', 'numberOfTariffs'])

        if (numberOfTariffs > 1) {
            const tariffNumber = get(record, 'tariffNumber')

            return meterResource + `\n${tariffNumberMessages[tariffNumber - 1]}`
        }

        return meterResource
    }, [tariffNumberMessages])
    const meterReadingRenderer = useCallback((record) => (
        <MeterReadingInput
            record={record}
            newMeterReadings={newMeterReadings}
            setNewMeterReadings={setNewMeterReadings}
        />
    ), [newMeterReadings])
    const textRenderer = useMemo(() => getTextRender(), [getTextRender])
    const dateRenderer = useMemo(() => getDateRender(intl), [intl, getDateRender])

    const tableColumns = useMemo(() => compact([
        !isPropertyMeter ? {
            title: AccountMessage,
            dataIndex: ['meter', 'accountNumber'],
            width: '10%',
            render: textRenderer,
        } : undefined,
        {
            title: ResourceMessage,
            width: '10%',
            render: meterResourceRenderer,
        },
        {
            title: MeterNumberMessage,
            dataIndex: ['meter', 'number'],
            width: '10%',
            render: textRenderer,
        },
        !isPropertyMeter ? {
            title: PlaceMessage,
            dataIndex: ['meter', 'place'],
            width: '10%',
            render: textRenderer,
        } : undefined,
        {
            title: LastReadingMessage,
            dataIndex: 'lastMeterReading',
            width: '10%',
            render: textRenderer,
        },
        {
            title: SourceMessage,
            dataIndex: 'meterReadingSource',
            width: '10%',
            render: textRenderer,
        },
        {
            title: VerificationDateMessage,
            dataIndex: ['meter', 'verificationDate'],
            width: '10%',
            render: dateRenderer,
        },
        {
            title: MeterReadingsMessage,
            width: '20%',
            render: meterReadingRenderer,
        },
    ]),
    [
        AccountMessage, LastReadingMessage, MeterNumberMessage, MeterReadingsMessage, PlaceMessage, isPropertyMeter,
        ResourceMessage, SourceMessage, VerificationDateMessage, dateRenderer, meterReadingRenderer, meterResourceRenderer, textRenderer,
    ])

    return useMemo(() => ({ tableColumns, newMeterReadings, setNewMeterReadings }),
        [newMeterReadings, tableColumns])
}