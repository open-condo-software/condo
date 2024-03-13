import {
    BuildingUnitSubType,
    SortMeterReadingsBy,
    SortMetersBy,
    Meter as MeterType,
    PropertyMeter as PropertyMeterType,
    SortPropertyMeterReadingsBy,
} from '@app/condo/schema'
import { Col, ColProps, Form, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import uniqWith from 'lodash/uniqWith'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Tour, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import Prompt from '@condo/domains/common/components/Prompt'
import { Table, TABLE_SCROlL_CONFIG } from '@condo/domains/common/components/Table/Index'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import {
    CALL_METER_READING_SOURCE_ID,
    CRM_METER_READING_SOURCE_ID,
} from '@condo/domains/meter/constants/constants'
import { useCreateMeterModal } from '@condo/domains/meter/hooks/useCreateMeterModal'
import { useMeterTableColumns } from '@condo/domains/meter/hooks/useMeterTableColumns'
import { useUpdateMeterModal } from '@condo/domains/meter/hooks/useUpdateMeterModal'
import {
    Meter,
    MeterReading,
    PropertyMeterReading,
    PropertyMeter,
    METER_PAGE_TYPES,
} from '@condo/domains/meter/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { PropertyFormItemTooltip } from '@condo/domains/property/PropertyFormItemTooltip'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { ContactsInfo } from '@condo/domains/ticket/components/BaseTicketForm'

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

    const lastMeterReadings = uniqWith(meterReadings.filter((meterReading) => meterReading.meter !== null ),
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

export const MetersForm = ({
    handleSave,
    selectedPropertyId,
    addressKey,
    selectedUnitName,
    selectedUnitType,
    organizationId,
    tableColumns,
    newMeterReadings,
    setNewMeterReadings,
}) => {
    const intl = useIntl()
    const MetersAndReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MetersAndReadings' })

    const { user } = useAuth()
    const { breakpoints } = useLayoutContext()
    const tableScrollConfig = useMemo(() => !breakpoints.TABLET_LARGE ? TABLE_SCROlL_CONFIG : null,  [breakpoints.TABLET_LARGE])

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
    const { CreateMeterModal, isCreateMeterModalVisible, setIsCreateMeterModalVisible } = useCreateMeterModal({
        organizationId,
        addressKey,
        meterType: METER_PAGE_TYPES.meter,
        unitName: selectedUnitName,
        unitType: selectedUnitType,
        refetch,
        propertyId: selectedPropertyId,
    })
    const dataSource = useMemo(() => getTableData(meters, meterReadings), [meterReadings, meters])

    useEffect(() => {
        refetch()
        setNewMeterReadings({})
    }, [selectedPropertyId, selectedUnitName, selectedUnitType])

    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch)
    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                setSelectedMeter(meter)
            },
        }
    }, [setSelectedMeter])
    const handleAddMeterButtonClick = useCallback(() => setIsCreateMeterModalVisible(true),
        [setIsCreateMeterModalVisible])

    const { count, loading: countLoading } = Meter.useCount({
        where: {
            createdBy: { id: user.id },
        },
    }, { skip: !user })
    const { setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        if (!user || countLoading || count > 0 || loading || isCreateMeterModalVisible) return setCurrentStep(0)

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
        count, countLoading, isCreateMeterModalVisible, loading, meters.length,
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
                    handleAddMeterButtonClick={handleAddMeterButtonClick}
                    isLoading={loading}
                    meterType={METER_PAGE_TYPES.meter}
                />
            </Col>
            <CreateMeterModal />
            <UpdateMeterModal />
        </>
    )
}

const VALIDATE_FORM_TRIGGER = ['onBlur', 'onSubmit']
const FORM_ROW_LARGE_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const FORM_ROW_MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 20]
const FORM_ITEM_WRAPPER_COLUMN_STYLE: ColProps = { style: { width: '100%', padding: 0 } }

export const CreateMeterReadingsForm = ({ organization, role }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })
    const ClientInfoMessage = intl.formatMessage({ id: 'ClientInfo' })
    const MeterReadingsFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.MeterReadingsFromResident' })

    const router = useRouter()

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(null)
    const [selectedUnitType, setSelectedUnitType] = useState<BuildingUnitSubType>(BuildingUnitSubType.Flat)
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    const selectPropertyIdRef = useRef(selectedPropertyId)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        setSelectedUnitName(null)
    }, [selectedPropertyId])

    const selectedUnitNameRef = useRef(selectedUnitName)
    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    const selectedUnitTypeRef = useRef(selectedUnitType)
    useEffect(() => {
        selectedUnitTypeRef.current = selectedUnitType
    }, [selectedUnitType])

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()
    const validations = {
        property: [requiredValidator, addressValidator(selectedPropertyId, isMatchSelectedProperty)],
    }

    const { ContactsEditorComponent } = useContactsEditorHook({
        role,
        initialQuery: { organization: { id: organization.id } },
    })

    const { obj: property, loading: propertyLoading } = Property.useObject({
        where: { id: selectedPropertyId },
    }, { skip: isNull(selectedPropertyId) })

    const { newMeterReadings, setNewMeterReadings, tableColumns } = useMeterTableColumns(METER_PAGE_TYPES.meter)

    const createMeterReadingAction = MeterReading.useCreate({
        source: { connect: { id: CALL_METER_READING_SOURCE_ID } },
    }, async () => {
        await router.push('/meter')
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
                                                <Row justify='space-between' gutter={FORM_ROW_MEDIUM_VERTICAL_GUTTER}>
                                                    <Col span={24}>
                                                        <Typography.Title level={5}>
                                                            {ClientInfoMessage}
                                                        </Typography.Title>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Form.Item
                                                            name='property'
                                                            label={AddressLabel}
                                                            rules={validations.property}
                                                            wrapperCol={FORM_ITEM_WRAPPER_COLUMN_STYLE}
                                                            shouldUpdate
                                                            tooltip={<PropertyFormItemTooltip />}
                                                        >
                                                            <PropertyAddressSearchInput
                                                                organizationId={get(organization, 'id')}
                                                                autoFocus={true}
                                                                onSelect={getHandleSelectPropertyAddress(form)}
                                                                placeholder={AddressPlaceholder}
                                                                notFoundContent={AddressNotFoundContent}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    {
                                                        selectedPropertyId && (
                                                            <Col span={24}>
                                                                <UnitInfo
                                                                    property={property}
                                                                    loading={propertyLoading}
                                                                    setSelectedUnitName={setSelectedUnitName}
                                                                    setSelectedUnitType={setSelectedUnitType}
                                                                    form={form}
                                                                    required
                                                                />
                                                            </Col>
                                                        )
                                                    }
                                                </Row>
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
                            <MetersForm
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
export const PropertyMetersForm = ({
    handleSave,
    selectedPropertyId,
    organizationId,
    tableColumns,
    newMeterReadings,
    setNewMeterReadings,
}) => {
    const intl = useIntl()
    const MetersAndReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.create.MetersAndReadings' })

    const { breakpoints } = useLayoutContext()
    const tableScrollConfig = useMemo(() => !breakpoints.TABLET_LARGE ? TABLE_SCROlL_CONFIG : null,  [breakpoints.TABLET_LARGE])

    const { obj: property, loading: propertyLoading } = Property.useObject({ where: { id: selectedPropertyId } })

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

    const loading = metersLoading || meterReadingsLoading || propertyLoading
    const { CreateMeterModal, setIsCreateMeterModalVisible } = useCreateMeterModal({
        organizationId,
        propertyId: selectedPropertyId,
        refetch,
        addressKey: get(property, 'addressKey', null),
        unitType: null,
        unitName: null,
        meterType: METER_PAGE_TYPES.propertyMeter,
    })
    const dataSource = useMemo(() => getTableData(meters, meterReadings), [meterReadings, meters])

    useEffect(() => {
        refetch()
        setNewMeterReadings({})
    }, [selectedPropertyId])

    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch, METER_PAGE_TYPES.propertyMeter)
    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                setSelectedMeter(meter)
            },
        }
    }, [setSelectedMeter])
    const handleAddMeterButtonClick = useCallback(() => setIsCreateMeterModalVisible(true),
        [setIsCreateMeterModalVisible])

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
                    handleAddMeterButtonClick={handleAddMeterButtonClick}
                    isLoading={loading}
                    meterType={METER_PAGE_TYPES.propertyMeter}
                />
            </Col>
            <CreateMeterModal />
            <UpdateMeterModal />
        </>
    )
}

export const CreatePropertyMeterReadingsForm = ({ organization, role }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const {
        newMeterReadings,
        setNewMeterReadings,
        tableColumns,
    } = useMeterTableColumns(METER_PAGE_TYPES.propertyMeter)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()
    const validations = {
        property: [requiredValidator, addressValidator(selectedPropertyId, isMatchSelectedProperty)],
    }

    const router = useRouter()

    const createMeterReadingAction = PropertyMeterReading.useCreate({
        source: { connect: { id: CRM_METER_READING_SOURCE_ID } },
    }, async () => {
        await router.push(`/meter?tab=${METER_PAGE_TYPES.propertyMeter}`)
    })

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
                                                        <Form.Item
                                                            name='property'
                                                            label={AddressLabel}
                                                            rules={validations.property}
                                                            wrapperCol={FORM_ITEM_WRAPPER_COLUMN_STYLE}
                                                            shouldUpdate
                                                        >
                                                            <PropertyAddressSearchInput
                                                                organizationId={get(organization, 'id')}
                                                                autoFocus={true}
                                                                onSelect={getHandleSelectPropertyAddress(form)}
                                                                placeholder={AddressPlaceholder}
                                                                notFoundContent={AddressNotFoundContent}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <PropertyMetersForm
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
