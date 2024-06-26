/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { InputNumber } from 'antd'
import dayjs from 'dayjs'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tour } from '@open-condo/ui'

import { getTextRender } from '@condo/domains/common/components/Table/Renders'
import { colors } from '@condo/domains/common/constants/style'
import { fontSizes } from '@condo/domains/common/constants/style'
import { METER_TAB_TYPES, MeterPageTypes } from '@condo/domains/meter/utils/clientSchema'
import { getNextVerificationDateRender } from '@condo/domains/meter/utils/clientSchema/Renders'


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

const MeterReadingInput = ({ index, record, newMeterReadings, setNewMeterReadings }) => {
    const intl = useIntl()
    const AddMeterReadingPlaceholderMessage = intl.formatMessage({ id: 'pages.condo.meter.create.AddMeterReadingPlaceholder' })
    const MeterReadingTourStepTitle = intl.formatMessage({ id: 'pages.condo.meter.create.meterReadingTourStepTitle' })

    const meterId = get(record, ['meter', 'id'])
    const tariffNumber = get(record, 'tariffNumber')
    const meterResourceMeasure = get(record, ['meter', 'resource', 'measure'])
    const nextVerificationDate = get(record, ['meter', 'nextVerificationDate'], '')
    const inputValue = get(newMeterReadings, [meterId, tariffNumber], '')

    const isInputDisabled =  dayjs(nextVerificationDate).isBefore(dayjs(), 'day') && true

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

    const wrapperProps = useMemo(() => ({
        style: INPUT_CONTAINER_STYLE,
        onClick: handleInputContainerClick,
    }), [handleInputContainerClick])
    const inputProps = useMemo(() => ({
        placeholder: AddMeterReadingPlaceholderMessage,
        css: inputNumberCSS,
        stringMode: true,
        onChange: meterReadingValueChangeHandler,
        value: inputValue,
        formatter: inputMeterReadingFormatter,
        parser: inputMeterReadingParser,
        min: 0,
    }), [AddMeterReadingPlaceholderMessage, inputValue, meterReadingValueChangeHandler])

    if (index === 0) {
        return (
            <Tour.TourStep step={2} title={MeterReadingTourStepTitle}>
                <div {...wrapperProps}>
                    <InputNumber
                        {...inputProps}
                        autoFocus
                        disabled={isInputDisabled}
                    />
                    <div style={METER_READING_INPUT_ADDON_STYLE}>
                        {meterResourceMeasure}
                    </div>
                </div>
            </Tour.TourStep>
        )
    }

    return (
        <div {...wrapperProps}>
            <InputNumber
                {...inputProps}
                disabled={isInputDisabled}
            />
            <div style={METER_READING_INPUT_ADDON_STYLE}>
                {meterResourceMeasure}
            </div>
        </div>
    )
}

export const useMeterTableColumns = (meterType: MeterPageTypes) => {
    const intl = useIntl()
    const AccountMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const ResourceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const PlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.Place' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const NextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const MeterReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MeterReadings' })
    const LastReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.create.LastReading' })
    const FirstTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff1Message' })
    const SecondTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff2Message' })
    const ThirdTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff3Message' })
    const FourthTariffMessage = intl.formatMessage({ id: 'pages.condo.meter.Tariff4Message' })

    const isPropertyMeter = meterType === METER_TAB_TYPES.propertyMeter
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

    const meterReadingRenderer = useCallback((record, _, index) => (
        <MeterReadingInput
            index={index}
            record={record}
            newMeterReadings={newMeterReadings}
            setNewMeterReadings={setNewMeterReadings}
        />
    ), [newMeterReadings])

    const textRenderer = useMemo(() => getTextRender(), [])
    const nextVerificationDateRenderer = useMemo(() => getNextVerificationDateRender(intl), [intl])

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
            title: NextVerificationDateMessage,
            dataIndex: ['meter', 'nextVerificationDate'],
            width: '10%',
            render: nextVerificationDateRenderer,
        },
        {
            title: MeterReadingsMessage,
            width: '20%',
            render: meterReadingRenderer,
        },
    ]),
    [isPropertyMeter, AccountMessage, textRenderer, ResourceMessage, meterResourceRenderer, MeterNumberMessage, PlaceMessage, LastReadingMessage, SourceMessage, NextVerificationDateMessage, nextVerificationDateRenderer, MeterReadingsMessage, meterReadingRenderer])

    return useMemo(() => ({ tableColumns, newMeterReadings, setNewMeterReadings }),
        [newMeterReadings, tableColumns])
}
