import {
    SortMeterReadingsBy,
    SortMetersBy,
    Meter as MeterType,
    PropertyMeter as PropertyMeterType,
    SortPropertyMeterReadingsBy,
    MeterUnitTypeType,
    Organization,
} from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ColumnsType } from 'antd/lib/table'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import uniqWith from 'lodash/uniqWith'
import { useRouter } from 'next/router'
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
import { AddressAndUnitInfo } from '@condo/domains/meter/components/AddressAndUnitInfo'
import { CreateMeterReadingsActionBar } from '@condo/domains/meter/components/CreateMeterReadingsActionBar'
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
    METER_TYPES,
} from '@condo/domains/meter/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { ContactsInfo } from '@condo/domains/ticket/components/BaseTicketForm'


export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

export type MetersTableRecord = {
    meter: MeterType | PropertyMeterType
    lastMeterReading: string
    lastMeterReadingDate: string
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
                    lastMeterReadingDate: lastMeterReading && lastMeterReading.date,
                    meterReadingSource: lastMeterReading && lastMeterReading.source.name,
                    tariffNumber: String(tariffNumber),
                })
            }
        } else {
            dataSource.push({
                meter,
                lastMeterReading: lastMeterReading && lastMeterReading.value1,
                lastMeterReadingDate: lastMeterReading && lastMeterReading.date,
                meterReadingSource: lastMeterReading && lastMeterReading.source.name,
                tariffNumber: '1',

            })
        }
    }

    return dataSource
}

type MetersTableProps = {
    handleSave: () => void
    selectedPropertyId: string
    tableColumns: Record<string, unknown>[] | ColumnsType<any>
    newMeterReadings: Array<unknown> | unknown
    setNewMeterReadings: (readings) => void
    selectedUnitName: string
    selectedUnitType: MeterUnitTypeType
}

export const MetersTable = ({
    handleSave,
    selectedPropertyId,
    selectedUnitName,
    selectedUnitType,
    tableColumns,
    newMeterReadings,
    setNewMeterReadings,
}: MetersTableProps): JSX.Element => {
    const intl = useIntl()
    const MetersAndReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MetersAndReadings' })

    const { user } = useAuth()
    const { breakpoints } = useLayoutContext()
    const tableScrollConfig = useMemo(() => !breakpoints.TABLET_LARGE ? TABLE_SCROlL_CONFIG : null, [breakpoints.TABLET_LARGE])
    const router = useRouter()

    const { objs: meters, refetch: refetchMeters, loading: metersLoading, count: total } = Meter.useObjects({
        where: {
            property: { id: selectedPropertyId },
            unitName: selectedUnitName,
            unitType: selectedUnitType,
            archiveDate: null,
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
                router.push(`/meter/unit/${meter.id}`)
            },
        }
    }, [router])

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
                    meters={meters}
                />
            </Col>
        </>
    )
}

const VALIDATE_FORM_TRIGGER = ['onBlur', 'onSubmit']
const FORM_ROW_LARGE_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const FORM_ROW_MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 20]

type CreateMeterReadingsFormProps = {
    organization: Pick<Organization, 'id'>
    canManageMeterReadings: boolean
}

export const CreateMeterReadingsForm = ({ organization, canManageMeterReadings }: CreateMeterReadingsFormProps): JSX.Element => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })
    const MeterReadingsFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.MeterReadingsFromResident' })
    const NotFoundMetersForAddress = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress' })
    const NotFoundMetersLink = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress.link' })

    const router = useRouter()

    const propertyIdFromQuery = router.query?.propertyId ?? null
    const unitNameFromQuery = router.query?.unitName ?? null
    const unitTypeFromQuery = router.query?.unitType ?? null
    const contactFromQuery = router.query?.contact ?? null
    const clientNameFromQuery = router.query?.clientName ?? null
    const clientPhoneFromQuery = router.query?.clientPhone ?? null

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyIdFromQuery as string || null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(unitNameFromQuery as string || null)
    const [selectedUnitType, setSelectedUnitType] = useState<MeterUnitTypeType>(unitTypeFromQuery as MeterUnitTypeType || MeterUnitTypeType.Flat)
    const selectPropertyIdRef = useRef(selectedPropertyId)
    const selectedUnitNameRef = useRef(selectedUnitName)
    const selectedUnitTypeRef = useRef(selectedUnitType)

    const disabledFields = useMemo(() => !canManageMeterReadings, [canManageMeterReadings])

    useEffect(() => {
        selectedUnitTypeRef.current = selectedUnitType
    }, [selectedUnitType])

    const { ContactsEditorComponent } = useContactsEditorHook({
        initialQuery: { organization: { id: organization.id } },
    })

    const { obj: property, loading: propertyLoading } = Property.useObject({
        where: { id: selectedPropertyId },
    }, { skip: isNull(selectedPropertyId) })

    const { count: meterCountForAddress, loading: meterCountForAddressLoading } = Meter.useCount({
        where: {
            property: { id: selectedPropertyId },
            archiveDate: null,
        },
    }, { skip: isNull(selectedPropertyId) })

    const { count: meterCountForUnitName, loading: meterCountForUnitNameLoading } = Meter.useCount({
        where: {
            property: { id: selectedPropertyId },
            unitName: selectedUnitName,
            unitType: selectedUnitType,
            archiveDate: null,
        },
    }, { skip: isNull(selectedPropertyId) || isNull(selectedUnitName) })

    const { newMeterReadings, setNewMeterReadings, tableColumns } = useMeterTableColumns(METER_TAB_TYPES.meter)
    const isNoMeterForAddress = useMemo(() => !isEmpty(selectedPropertyId) && !meterCountForAddressLoading && meterCountForAddress === 0, [meterCountForAddress, meterCountForAddressLoading, selectedPropertyId])
    const isNoMeterForUnitName = useMemo(() => isEmpty(selectedUnitName) ? false : !meterCountForUnitNameLoading && meterCountForUnitName < 1, [meterCountForUnitName, meterCountForUnitNameLoading, selectedUnitName])

    const [propertyUnitInitialValues, setPropertyUnitInitialValues] = useState(()=> !propertyIdFromQuery ? ({}) : ({
        propertyId: propertyIdFromQuery as string,
        unitName: unitNameFromQuery as string,
        unitType: unitTypeFromQuery as string,
    }))

    const createMeterReadingAction = MeterReading.useCreate({
        source: { connect: { id: CALL_METER_READING_SOURCE_ID } },
    }, async () => {
        await router.push(`/meter?tab=${METER_TAB_TYPES.meterReading}&type=${METER_TYPES.unit}`)
    })

    const handleSubmit = useCallback(async (values) => {
        for (const [meterId, newMeterReading] of Object.entries(newMeterReadings)) {
            const value1 = get(newMeterReading, '1')
            const value2 = get(newMeterReading, '2')
            const value3 = get(newMeterReading, '3')
            const value4 = get(newMeterReading, '4')
            const date = get(newMeterReading, 'date')
            const { property, unitName, unitType, sectionName, floorName, ...clientInfo } = values

            createMeterReadingAction({
                ...clientInfo,
                meter: { connect: { id: meterId } },
                contact: values.contact ? { connect: { id: values.contact } } : undefined,
                value1,
                value2,
                value3,
                value4,
                date,
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
        if (!propertyUnitInitialValues || !selectedPropertyId) {
            setSelectedUnitName(null)
            setSelectedUnitType(MeterUnitTypeType.Flat)
        }
        if (!selectedPropertyId) setPropertyUnitInitialValues({})

    }, [selectedPropertyId, meterCountForAddressLoading, meterCountForAddress])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
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
                    href={`/meter/create?tab=meter&propertyId=${selectedPropertyId}${isNoMeterForUnitName ? `&unitName=${selectedUnitName}&unitType=${selectedUnitType}` : ''}`}
                    target='_blank'
                />
            </div>
        )
    }, [NotFoundMetersForAddress, NotFoundMetersLink, isNoMeterForUnitName, selectedPropertyId, selectedUnitName, selectedUnitType])

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
            submitButtonProps={{
                disabled: disabledFields,
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
                                                    organizationId={organization?.id}
                                                    form={form}
                                                    getHandleSelectPropertyAddress={getHandleSelectPropertyAddress}
                                                    handleDeselectPropertyAddress={handleDeselectPropertyAddress}
                                                    isMatchSelectedProperty
                                                    meterType={METER_TAB_TYPES.meter}
                                                    selectedPropertyId={selectedPropertyId}
                                                    isNoMeterForAddress={isNoMeterForAddress}
                                                    isNoMeterForUnitName={isNoMeterForUnitName}
                                                    notFoundMetersForAddressTooltip={notFoundMetersForAddressTooltip}
                                                    property={property}
                                                    propertyLoading={propertyLoading}
                                                    setSelectedUnitName={setSelectedUnitName}
                                                    setSelectedUnitType={setSelectedUnitType}
                                                    initialValues={propertyUnitInitialValues}
                                                />
                                            </Col>
                                            {selectedPropertyId && <Col span={24}>
                                                <ContactsInfo
                                                    ContactsEditorComponent={ContactsEditorComponent}
                                                    form={form}
                                                    initialValues={{
                                                        contact: contactFromQuery,
                                                        clientName: clientNameFromQuery,
                                                        clientPhone: clientPhoneFromQuery,
                                                    }}
                                                    selectedPropertyId={selectedPropertyId}
                                                    hasNotResidentTab={false}
                                                    residentTitle={MeterReadingsFromResidentMessage}
                                                />
                                            </Col>}
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            {selectedPropertyId && <MetersTable
                                selectedPropertyId={selectedPropertyId}
                                selectedUnitName={selectedUnitName}
                                selectedUnitType={selectedUnitType}
                                handleSave={handleSave}
                                tableColumns={tableColumns}
                                setNewMeterReadings={setNewMeterReadings}
                                newMeterReadings={newMeterReadings}
                            />}
                        </Row>
                    </Col>
                </>
            )}
        </FormWithAction>
    )
}

type PropertyMetersTableProps = {
    handleSave: () => void
    selectedPropertyId: string
    tableColumns: Record<string, unknown>[] | ColumnsType<any>
    newMeterReadings: Array<unknown> | unknown
    setNewMeterReadings: (readings) => void
}

export const PropertyMetersTable = ({
    handleSave,
    selectedPropertyId,
    tableColumns,
    newMeterReadings,
    setNewMeterReadings,
}: PropertyMetersTableProps): JSX.Element => {
    const intl = useIntl()
    const MetersAndReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MetersAndReadings' })

    const { breakpoints } = useLayoutContext()
    const tableScrollConfig = useMemo(() => !breakpoints.TABLET_LARGE ? TABLE_SCROlL_CONFIG : null, [breakpoints.TABLET_LARGE])
    const router = useRouter()

    const { objs: meters, refetch: refetchMeters, loading: metersLoading, count: total } = PropertyMeter.useObjects({
        where: {
            property: { id: selectedPropertyId },
            archiveDate: null,
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
                router.push(`/meter/property/${meter.id}`)
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
                    meters={meters}
                />
            </Col>
        </>
    )
}


type CreatePropertyMeterReadingsFormProps = {
    organization: Pick<Organization, 'id'>
    canManageMeterReadings: boolean
}

export const CreatePropertyMeterReadingsForm = ({ organization, canManageMeterReadings }: CreatePropertyMeterReadingsFormProps): JSX.Element => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })
    const NotFoundMeters = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress' })
    const NotFoundMetersLink = intl.formatMessage({ id: 'pages.condo.meter.noMetersOnAddress.link' })

    const router = useRouter()
    const propertyIdFromQuery = get(router.query, 'propertyId')

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyIdFromQuery as string || null)
    const selectPropertyIdRef = useRef(selectedPropertyId)
    const organizationId = get(organization, 'id')

    const disabledFields = useMemo(() => !canManageMeterReadings, [canManageMeterReadings])

    const {
        newMeterReadings,
        setNewMeterReadings,
        tableColumns,
    } = useMeterTableColumns(METER_TAB_TYPES.propertyMeter)


    const createMeterReadingAction = PropertyMeterReading.useCreate({
        source: { connect: { id: CRM_METER_READING_SOURCE_ID } },
    }, async () => {
        await router.push(`/meter?tab=${METER_TAB_TYPES.meterReading}&type=${METER_TYPES.property}`)
    })

    const { count: propertyMetersCount, loading: propertyMetersCountLoading } = PropertyMeter.useCount({
        where: {
            property: { id: selectedPropertyId },
            archiveDate: null,
        },
    }, { skip: isNull(selectedPropertyId) })

    const propertyUnitInitialValues = useMemo(()=> ({
        propertyId: propertyIdFromQuery as string,
    }), [propertyIdFromQuery])

    const isNoMeterForAddress = useMemo(() => !isEmpty(selectedPropertyId) && !propertyMetersCountLoading && propertyMetersCount === 0, [propertyMetersCount, propertyMetersCountLoading, selectedPropertyId])

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId

    }, [selectedPropertyId, propertyMetersCountLoading, propertyMetersCount])

    const handleSubmit = useCallback(async (values) => {
        for (const [meterId, newMeterReading] of Object.entries(newMeterReadings)) {
            const value1 = get(newMeterReading, '1')
            const value2 = get(newMeterReading, '2')
            const value3 = get(newMeterReading, '3')
            const value4 = get(newMeterReading, '4')

            createMeterReadingAction({
                meter: { connect: { id: meterId } },
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
                    href={`/meter/create?tab=property-meter&propertyId=${selectedPropertyId}`}
                    target='_blank'
                />
            </div>
        )
    }, [NotFoundMeters, NotFoundMetersLink, selectedPropertyId])

    return (
        <FormWithAction
            {...LAYOUT}
            validateTrigger={VALIDATE_FORM_TRIGGER}
            action={handleSubmit}
            submitButtonProps={{
                disabled: disabledFields,
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
                                <AddressAndUnitInfo
                                    form={form}
                                    getHandleSelectPropertyAddress={getHandleSelectPropertyAddress}
                                    handleDeselectPropertyAddress={handleDeselectPropertyAddress}
                                    isMatchSelectedProperty
                                    meterType={METER_TAB_TYPES.propertyMeter}
                                    organizationId={organizationId}
                                    selectedPropertyId={selectedPropertyId}
                                    notFoundMetersForAddressTooltip={notFoundMetersForAddressTooltip}
                                    isNoMeterForAddress={isNoMeterForAddress}
                                    initialValues={propertyUnitInitialValues}
                                />
                            </Col>
                            <PropertyMetersTable
                                selectedPropertyId={selectedPropertyId}
                                handleSave={handleSave}
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
