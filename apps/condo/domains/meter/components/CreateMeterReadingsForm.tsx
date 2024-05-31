import {
    BuildingUnitSubType,
    SortMeterReadingsBy,
    SortMetersBy,
    Meter as MeterType,
    PropertyMeter as PropertyMeterType,
    SortPropertyMeterReadingsBy,
} from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import uniqWith from 'lodash/uniqWith'
import router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Meters } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Tour, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import Prompt from '@condo/domains/common/components/Prompt'
import { Table, TABLE_SCROlL_CONFIG } from '@condo/domains/common/components/Table/Index'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import {
    CALL_METER_READING_SOURCE_ID,
    CRM_METER_READING_SOURCE_ID,
} from '@condo/domains/meter/constants/constants'
import { useMeterTableColumns } from '@condo/domains/meter/hooks/useMeterTableColumns'
import {
    Meter,
    MeterReading,
    PropertyMeterReading,
    PropertyMeter,
    METER_TAB_TYPES,
} from '@condo/domains/meter/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { ContactsInfo } from '@condo/domains/ticket/components/BaseTicketForm'

import { AddressAndUnitInfo } from './AddressAndUnitInfo'
import { CreateMeterReadingsActionBar } from './CreateMeterReadingsActionBar'


export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

type MetersTableRecord = {
    meter: MeterType | PropertyMeterType
    lastMeterReading: string
    meterReadingSource: string
    tariffNumber: string
}

function getTableData (meters: MeterType[] | PropertyMeterType[], meterReadings): MetersTableRecord[] {
    const dataSource: MetersTableRecord[] = []

    const lastMeterReadings = uniqWith(meterReadings.filter((meterReading) => meterReading.meter !== null),
        (meterReading1: any, meterReading2: any) =>
            meterReading1.meter.id === meterReading2.meter.id
    )

    for (const meter of meters) {
        const meterTariffsCount = meter.numberOfTariffs
        const lastMeterReading = lastMeterReadings.find(meterReading => {
            const meterReadingMeterId = get(meterReading, ['meter', 'id'])

            return meterReadingMeterId === meter.id
        })

        if (meterTariffsCount > 1) {
            for (let tariffNumber = 1; tariffNumber <= meterTariffsCount; ++tariffNumber) {
                dataSource.push({
                    meter,
                    lastMeterReading: lastMeterReading && lastMeterReading[`value${tariffNumber}`],
                    meterReadingSource: lastMeterReading && lastMeterReading.source.name,
                    tariffNumber: String(tariffNumber),
                })
            }
        } else {
            dataSource.push({
                meter,
                lastMeterReading: lastMeterReading && lastMeterReading.value1,
                meterReadingSource: lastMeterReading && lastMeterReading.source.name,
                tariffNumber: '1',

            })
        }
    }

    return dataSource
}

export const MetersTable = ({
    handleSave,
    selectedPropertyId,
    addressKey,
    selectedUnitName,
    selectedUnitType,
    organizationId,
    tableColumns,
    newMeterReadings,
    setNewMeterReadings,
}): JSX.Element => {
    const intl = useIntl()
    const MetersAndReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MetersAndReadings' })

    const { user } = useAuth()
    const { breakpoints } = useLayoutContext()
    const tableScrollConfig = useMemo(() => !breakpoints.TABLET_LARGE ? TABLE_SCROlL_CONFIG : null, [breakpoints.TABLET_LARGE])

    const { objs: meters, refetch: refetchMeters, loading: metersLoading, count: total } = Meter.useObjects({
        where: {
            property: { id: selectedPropertyId },
            unitName: selectedUnitName,
            unitType: selectedUnitType,
        },
        orderBy: SortMetersBy.CreatedAtDesc,
    })

    const meterIds = meters.map(meter => meter.id)
    const { objs: meterReadings, refetch: refetchMeterReadings, loading: meterReadingsLoading } = MeterReading.useObjects({
        where: {
            meter: { id_in: meterIds },
        },
        sortBy: [SortMeterReadingsBy.CreatedAtDesc],
    })
    const refetch = useCallback(() => {
        refetchMeters()
        refetchMeterReadings()
    }, [refetchMeterReadings, refetchMeters])

    const loading = metersLoading || meterReadingsLoading
    const dataSource = useMemo(() => getTableData(meters, meterReadings), [meterReadings, meters])

    useEffect(() => {
        refetch()
        setNewMeterReadings({})
    }, [selectedPropertyId, selectedUnitName, selectedUnitType])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                router.push(`/meter/property-meter/${meter.id}`)
            },
        }
    }, [])

    const { count, loading: countLoading } = Meter.useCount({
        where: {
            createdBy: { id: user.id },
        },
    }, { skip: !user })
    const { setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        if (!user || countLoading || count > 0 || loading) return setCurrentStep(0)

        // 0 - no hint
        // 1 - create meter button
        // 2 - meter readings input
        // 3 - form submit button
        if (!selectedUnitName) {
            return setCurrentStep(0)
        }
        if (meters.length === 0) {
            return setCurrentStep(1)
        }
        if (isEmpty(newMeterReadings)) {
            return setCurrentStep(2)
        }

        return setCurrentStep(3)
    }, [
        count, countLoading, loading, meters.length,
        newMeterReadings, selectedUnitName, setCurrentStep, user,
    ])

    return (
        <>
            <Col span={24}>
                <Row gutter={FORM_ROW_MEDIUM_VERTICAL_GUTTER}>
                    <Typography.Title level={2}>{MetersAndReadingsMessage}</Typography.Title>
                    {
                        selectedUnitName && dataSource.length ? (
                            <Table
                                scroll={tableScrollConfig}
                                loading={loading}
                                totalRows={total}
                                dataSource={dataSource}
                                columns={tableColumns}
                                pagination={false}
                                onRow={handleRowAction}
                            />
                        ) : null
                    }
                </Row>
            </Col>
            <Col span={24}>
                <CreateMeterReadingsActionBar
                    handleSave={handleSave}
                    newMeterReadings={newMeterReadings}
                    isLoading={loading}
                    meterType={METER_TAB_TYPES.meter}
                />
            </Col>
        </>
    )
}

const VALIDATE_FORM_TRIGGER = ['onBlur', 'onSubmit']
const FORM_ROW_LARGE_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const FORM_ROW_MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 20]

export const CreateMeterReadingsForm = ({ organization, role }) => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })
    const MeterReadingsFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.MeterReadingsFromResident' })
    const NotFoundMetersForAddress = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress' })
    const NotFoundMetersLink = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress.link' })

    const router = useRouter()

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(null)
    const [selectedUnitType, setSelectedUnitType] = useState<BuildingUnitSubType>(BuildingUnitSubType.Flat)
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    const [isNoMeterForAddress, setIsNoMeterForAddress] = useState(false)
    const [isNoMeterForUnitName, setIsNoMeterForUnitName] = useState(false)
    const selectPropertyIdRef = useRef(selectedPropertyId)
    const selectedUnitNameRef = useRef(selectedUnitName)
    const selectedUnitTypeRef = useRef(selectedUnitType)

    useEffect(() => {
        selectedUnitTypeRef.current = selectedUnitType
    }, [selectedUnitType])

    const { ContactsEditorComponent } = useContactsEditorHook({
        role,
        initialQuery: { organization: { id: organization.id } },
    })

    const { obj: property, loading: propertyLoading } = Property.useObject({
        where: { id: selectedPropertyId },
    }, { skip: isNull(selectedPropertyId) })

    const { count: meterCountForAddress, loading: meterCountForAddressLoading } = Meter.useCount({
        where: { property: { id: selectedPropertyId } },
    }, { skip: isNull(selectedPropertyId) })

    const { count: meterCountForUnitName, loading: meterCountForUnitNameLoading } = Meter.useCount({
        where: { 
            property: { id: selectedPropertyId },
            unitName: selectedUnitName,
        },
    }, { skip: isNull(selectedPropertyId || selectedUnitName) })

    const { newMeterReadings, setNewMeterReadings, tableColumns } = useMeterTableColumns(METER_TAB_TYPES.meter)

    const createMeterReadingAction = MeterReading.useCreate({
        source: { connect: { id: CALL_METER_READING_SOURCE_ID } },
    }, async () => {
        await router.push(`/meter?tab=${METER_TAB_TYPES.meterReading}`)
    })

    const handleSubmit = useCallback(async (values) => {
        for (const [meterId, newMeterReading] of Object.entries(newMeterReadings)) {
            const value1 = get(newMeterReading, '1')
            const value2 = get(newMeterReading, '2')
            const value3 = get(newMeterReading, '3')
            const value4 = get(newMeterReading, '4')
            const { property, unitName, unitType, sectionName, floorName, ...clientInfo } = values

            createMeterReadingAction({
                ...clientInfo,
                meter: { connect: { id: meterId } },
                contact: values.contact ? { connect: { id: values.contact } } : undefined,
                date: new Date(),
                value1,
                value2,
                value3,
                value4,
            })
        }
    }, [createMeterReadingAction, newMeterReadings])

    const getHandleSelectPropertyAddress = useCallback((form) => (_, option) => {
        form.setFieldsValue({
            unitName: null,
            sectionName: null,
            floorName: null,
        })
        setSelectedPropertyId(String(option.key))
    }, [])

    const handleDeselectPropertyAddress = useCallback(() =>  {
        setSelectedPropertyId(null)
    }, [])

    useEffect(() => {        
        selectPropertyIdRef.current = selectedPropertyId
        setSelectedUnitName(null)
        if (selectedPropertyId && !meterCountForAddressLoading && meterCountForAddress < 1) {
            setIsNoMeterForAddress(true)
        } else {
            setIsNoMeterForAddress(false)
        }

    }, [selectedPropertyId, meterCountForAddressLoading, meterCountForAddress])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
        if (!selectedUnitName) {
            setIsNoMeterForUnitName(false)
        } else {
            if (!meterCountForUnitNameLoading && meterCountForUnitName < 1) setIsNoMeterForUnitName(true)
        }
    }, [selectedUnitName, meterCountForUnitName, meterCountForUnitNameLoading])

    const notFoundMetersForAddressTooltip = useMemo(() => {
        return (
            <div>
                <Typography.Text type='secondary' size='medium'>
                    {NotFoundMetersForAddress}
                </Typography.Text>
                &nbsp;
                <LinkWithIcon
                    title={NotFoundMetersLink}
                    size='medium'
                    PostfixIcon={Meters}
                    href='/meter/create?tab=meter'
                    target='_blank'
                />
            </div>
        )
    }, [NotFoundMetersForAddress, NotFoundMetersLink])

    return (
        <FormWithAction
            {...LAYOUT}
            validateTrigger={VALIDATE_FORM_TRIGGER}
            action={handleSubmit}
            formValuesToMutationDataPreprocessor={(values) => {
                values.property = selectPropertyIdRef.current
                values.unitName = selectedUnitNameRef.current
                values.unitType = selectedUnitTypeRef.current
                return values
            }}
        >
            {({ handleSave, form }) => (
                <>
                    <Prompt
                        title={PromptTitle}
                        form={form}
                        handleSave={handleSave}
                    >
                        <Typography.Paragraph>
                            {PromptHelpMessage}
                        </Typography.Paragraph>
                    </Prompt>
                    <Col span={24}>
                        <Row gutter={FORM_ROW_LARGE_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row gutter={FORM_ROW_LARGE_VERTICAL_GUTTER} justify='space-between'>
                                    <Col lg={17} md={24}>
                                        <Row gutter={FORM_ROW_LARGE_VERTICAL_GUTTER}>
                                            <Col span={24}>
                                                <AddressAndUnitInfo 
                                                    organizationId={get(organization, 'id')}
                                                    form={form}
                                                    getHandleSelectPropertyAddress={getHandleSelectPropertyAddress}
                                                    handleDeselectPropertyAddress={handleDeselectPropertyAddress}
                                                    isMatchSelectedProperty={isMatchSelectedProperty}
                                                    meterType={METER_TAB_TYPES.meter}
                                                    selectedPropertyId={selectedPropertyId}
                                                    isNoMeterForAddress={isNoMeterForAddress}
                                                    isNoMeterForUnitName={isNoMeterForUnitName}
                                                    notFoundMetersForAddressTooltip={notFoundMetersForAddressTooltip}
                                                    property={property}
                                                    propertyLoading={propertyLoading}
                                                    setSelectedUnitName={setSelectedUnitName}
                                                    setSelectedUnitType={setSelectedUnitType}
                                                />
                                            </Col>
                                            <Col span={24}>
                                                <ContactsInfo
                                                    ContactsEditorComponent={ContactsEditorComponent}
                                                    form={form}
                                                    selectedPropertyId={selectedPropertyId}
                                                    hasNotResidentTab={false}
                                                    residentTitle={MeterReadingsFromResidentMessage}
                                                />
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <MetersTable
                                selectedPropertyId={selectedPropertyId}
                                addressKey={get(property, 'addressKey', null)}
                                selectedUnitName={selectedUnitName}
                                selectedUnitType={selectedUnitType}
                                handleSave={handleSave}
                                organizationId={organization.id}
                                tableColumns={tableColumns}
                                setNewMeterReadings={setNewMeterReadings}
                                newMeterReadings={newMeterReadings}
                            />
                        </Row>
                    </Col>
                </>
            )}
        </FormWithAction>
    )
}
export const PropertyMetersTable = ({
    handleSave,
    selectedPropertyId,
    organizationId,
    tableColumns,
    newMeterReadings,
    setNewMeterReadings,
}): JSX.Element => {
    const intl = useIntl()
    const MetersAndReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MetersAndReadings' })

    const { breakpoints } = useLayoutContext()
    const tableScrollConfig = useMemo(() => !breakpoints.TABLET_LARGE ? TABLE_SCROlL_CONFIG : null, [breakpoints.TABLET_LARGE])

    const { obj: property } = Property.useObject({ where: { id: selectedPropertyId } })

    const { objs: meters, refetch: refetchMeters, loading: metersLoading, count: total } = PropertyMeter.useObjects({
        where: {
            property: { id: selectedPropertyId },
        },
        orderBy: SortMetersBy.CreatedAtDesc,
    })

    const meterIds = meters.map(meter => meter.id)
    const { objs: meterReadings, refetch: refetchMeterReadings, loading: meterReadingsLoading } = PropertyMeterReading.useObjects({
        where: {
            meter: { id_in: meterIds },
        },
        sortBy: [SortPropertyMeterReadingsBy.CreatedAtDesc],
    })
    const refetch = useCallback(() => {
        refetchMeters()
        refetchMeterReadings()
    }, [refetchMeterReadings, refetchMeters])

    const loading = metersLoading || meterReadingsLoading 
    const dataSource = useMemo(() => getTableData(meters, meterReadings), [meterReadings, meters])

    useEffect(() => {
        refetch()
        setNewMeterReadings({})
    }, [selectedPropertyId])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                router.push(`/meter/${meter.id}`)
            },
        }
    }, [])

    return (
        <>
            <Col span={24}>
                <Row gutter={FORM_ROW_MEDIUM_VERTICAL_GUTTER}>
                    <Typography.Title level={2}>{MetersAndReadingsMessage}</Typography.Title>
                    {
                        dataSource.length ? (
                            <Table
                                scroll={tableScrollConfig}
                                loading={loading}
                                totalRows={total}
                                dataSource={dataSource}
                                columns={tableColumns}
                                pagination={false}
                                onRow={handleRowAction}
                            />
                        ) : null
                    }
                </Row>
            </Col>
            <Col span={24}>
                <CreateMeterReadingsActionBar
                    handleSave={handleSave}
                    newMeterReadings={newMeterReadings}
                    isLoading={loading}
                    meterType={METER_TAB_TYPES.propertyMeter}
                />
            </Col>
        </>
    )
}


export const CreatePropertyMeterReadingsForm = ({ organization }) => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })
    const NotFoundMeters = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress' })
    const NotFoundMetersLink = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress.link' })

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    const [isNoMeterForAddress, setIsNoMeterForAddress] = useState(false)
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const {
        newMeterReadings,
        setNewMeterReadings,
        tableColumns,
    } = useMeterTableColumns(METER_TAB_TYPES.propertyMeter)

    const router = useRouter()

    const createMeterReadingAction = PropertyMeterReading.useCreate({
        source: { connect: { id: CRM_METER_READING_SOURCE_ID } },
    }, async () => {
        await router.push(`/meter?tab=${METER_TAB_TYPES.propertyMeter}`)
    })

    const { count: proeprtyMeterCount, loading: propertyMeterCountLoading } = PropertyMeter.useCount({
        where: { property: { id: selectedPropertyId } },
    }, { skip: isNull(selectedPropertyId) })

    useEffect(() => {        
        selectPropertyIdRef.current = selectedPropertyId
        if (selectedPropertyId && !propertyMeterCountLoading && proeprtyMeterCount < 1) {
            setIsNoMeterForAddress(true)
        } else {
            setIsNoMeterForAddress(false)
        }

    }, [selectedPropertyId, propertyMeterCountLoading, proeprtyMeterCount])

    const handleSubmit = useCallback(async (values) => {
        for (const [meterId, newMeterReading] of Object.entries(newMeterReadings)) {
            const value1 = get(newMeterReading, '1')
            const value2 = get(newMeterReading, '2')
            const value3 = get(newMeterReading, '3')
            const value4 = get(newMeterReading, '4')

            createMeterReadingAction({
                meter: { connect: { id: meterId } },
                date: new Date().toISOString(),
                value1,
                value2,
                value3,
                value4,
            })
        }
    }, [createMeterReadingAction, newMeterReadings])

    const getHandleSelectPropertyAddress = useCallback((form) => (_, option) => {
        setSelectedPropertyId(String(option.key))
    }, [])

    const handleDeselectPropertyAddress = useCallback(() =>  {
        setSelectedPropertyId(null)
    }, [])

    const notFoundMetersForAddressTooltip = useMemo(() => {
        return (
            <div>
                <Typography.Text type='secondary' size='medium'>
                    {NotFoundMeters}
                </Typography.Text>
                &nbsp;
                <LinkWithIcon
                    title={NotFoundMetersLink}
                    size='medium'
                    PostfixIcon={Meters}
                    href='/meter/create?tab=property-meter'
                    target='_blank'
                />
            </div>
        )
    }, [NotFoundMeters, NotFoundMetersLink])

    return (
        <FormWithAction
            {...LAYOUT}
            validateTrigger={VALIDATE_FORM_TRIGGER}
            action={handleSubmit}
        >
            {({ handleSave, form }) => (
                <>
                    <Prompt
                        title={PromptTitle}
                        form={form}
                        handleSave={handleSave}
                    >
                        <Typography.Paragraph>
                            {PromptHelpMessage}
                        </Typography.Paragraph>
                    </Prompt>
                    <Col span={24}>
                        <Row gutter={FORM_ROW_LARGE_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row gutter={FORM_ROW_LARGE_VERTICAL_GUTTER} justify='space-between'>
                                    <Col span={24}>
                                        <Row gutter={FORM_ROW_LARGE_VERTICAL_GUTTER} style={{ width: '100%' }}>
                                            <Col span={24}>
                                                <Row justify='space-between' gutter={FORM_ROW_MEDIUM_VERTICAL_GUTTER}>
                                                    <Col span={24}>
                                                        <AddressAndUnitInfo 
                                                            form={form}
                                                            getHandleSelectPropertyAddress={getHandleSelectPropertyAddress}
                                                            handleDeselectPropertyAddress={handleDeselectPropertyAddress}
                                                            isMatchSelectedProperty={isMatchSelectedProperty}
                                                            meterType={METER_TAB_TYPES.propertyMeter}
                                                            organizationId={get(organization, 'id')}
                                                            selectedPropertyId={selectedPropertyId}
                                                            notFoundMetersForAddressTooltip={notFoundMetersForAddressTooltip}
                                                            isNoMeterForAddress={isNoMeterForAddress}
                                                        />
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <PropertyMetersTable
                                selectedPropertyId={selectedPropertyId}
                                handleSave={handleSave}
                                organizationId={organization.id}
                                tableColumns={tableColumns}
                                setNewMeterReadings={setNewMeterReadings}
                                newMeterReadings={newMeterReadings}
                            />
                        </Row>
                    </Col>
                </>
            )}
        </FormWithAction>
    )
}
