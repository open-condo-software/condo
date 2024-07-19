import { Meter, MeterResource } from '@app/condo/schema'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'


type MeterBaseFieldProps = {
    meter: Meter
}

type MeterResourceFieldProps = {
    resource: MeterResource
}

type MeterDateFieldProps = {
    date: Dayjs
    title: string
}


const ELLIPSIS_CONFIG = { rows: 2 }

const NoDataField = <Typography.Text>—</Typography.Text>

export const MeterAccountField: React.FC<MeterBaseFieldProps> = ({ meter }) => {
    const intl = useIntl()
    const MeterAccountMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })

    const accountNumber = get(meter, 'accountNumber')
 
    return (
        <PageFieldRow title={MeterAccountMessage} ellipsis={ELLIPSIS_CONFIG}>
            <Typography.Text>{accountNumber}</Typography.Text>
        </PageFieldRow>
    )
}

export const MeterResourceField: React.FC<MeterResourceFieldProps> = ({ resource }) => {
    const intl = useIntl()
    const MeterResourceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
    const resourceName = get(resource, 'name')

    const ResourceMessageName = intl.formatMessage({ id: resourceName as FormatjsIntl.Message['ids'] }) 
 
    return (
        <PageFieldRow title={MeterResourceMessage} ellipsis={ELLIPSIS_CONFIG}>
            <Typography.Text>{ResourceMessageName}</Typography.Text>
        </PageFieldRow>
    )
}

export const MeterNumberField: React.FC<MeterBaseFieldProps> = ({ meter }) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })

    const meterNumber = get(meter, 'number')
 
    return (
        <PageFieldRow title={MeterNumberMessage} ellipsis={ELLIPSIS_CONFIG}>
            <Typography.Text>{meterNumber}</Typography.Text>
        </PageFieldRow>
    )
}

export const MeterPlaceField: React.FC<MeterBaseFieldProps> = ({ meter }) => {
    const intl = useIntl()
    const MeterPlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterPlace' })

    const meterPlace = get(meter, 'place')
 
    return (
        <PageFieldRow title={MeterPlaceMessage} ellipsis={ELLIPSIS_CONFIG}>
            {meterPlace ? (
                <Typography.Text>{meterPlace}</Typography.Text>
            ) : (NoDataField)}
        </PageFieldRow>
    )
}


export const MeterCommonDateField: React.FC<MeterDateFieldProps> = ({ title, date }) => {
    const dateFormatted = dayjs(date).format('DD.MM.YYYY')
 
    return (
        <PageFieldRow title={title} ellipsis={ELLIPSIS_CONFIG}>
            {date ? (
                <Typography.Text>{dateFormatted}</Typography.Text>
            ) : (NoDataField)}
        </PageFieldRow>
    )
}