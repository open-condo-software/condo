import { Col, Form, Row, Space, Typography } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { ErrorsContainer } from './BaseMeterReadingsForm/ErrorsContainer'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { MetersGroup } from '../MetersGroup'
import { SnowflakeIcon } from '@condo/domains/common/components/icons/SnowflakeIcon'
import { Loader } from '@condo/domains/common/components/Loader'
import { useTicketValidations } from './BaseMeterReadingsForm/useTicketValidations'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import { Meter, MeterResource, MeterReading } from '../../utils/clientSchema'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { UnitInfo } from '@condo/domains/ticket/components/BaseTicketForm'
import { get, pickBy, uniqBy } from 'lodash'
// @ts-ignore
import { SortMeterReadingsBy } from '../../../../schema.d.ts'
import { useForm } from 'antd/lib/form/Form'


const COLD_WATER_METER_RESOURCE_ID = 'e2bd70ac-0630-11ec-9a03-0242ac130003'
const HOT_WATER_METER_RESOURCE_ID = '0f54223c-0631-11ec-9a03-0242ac130003'

const CALL_SOURCE_ID = '61764f14-0630-11ec-9a03-0242ac130003'

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, initialValues }) => {
    const intl = useIntl()
    return (
        <Col span={24}>
            <Form.Item shouldUpdate noStyle>
                {({ getFieldsValue }) => {
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])

                    const value = {
                        id: get(initialValues, ['contact', 'id']),
                        name: get(initialValues, 'clientName'),
                        phone: get(initialValues, 'clientPhone'),
                    }

                    return (
                        <ContactsEditorComponent
                            form={form}
                            fields={{
                                id: 'contact',
                                phone: 'clientPhone',
                                name: 'clientName',
                            }}
                            value={value}
                            // Local `property` cannot be used here, because `PropertyAddressSearchInput`
                            // sets `Property.address` as its value, but we need `Property.id` here
                            property={selectedPropertyId}
                            unitName={unitName}
                        />
                    )
                }}
            </Form.Item>
        </Col>
    )
}

export const CreateTicketActionBar = ({ handleSave, isLoading }) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'SendMetersReading' })

    return (
        <Form.Item noStyle dependencies={['property']}>
            {
                ({ getFieldsValue }) => {
                    const { property } = getFieldsValue(['property'])

                    return (
                        <ActionBar>
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={!property}
                                >
                                    {SendMetersReadingMessage}
                                </Button>
                                <ErrorsContainer property={property}/>
                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}

export interface IMetersFormState {
    meterNumber: string,
    isNewMeter: boolean,
    place: string,
    resourceId: string,
    lastReadingData?: {
        date: string,
        source: string,
        lastValue: number,
    }
}

export interface IMeterReadingFromState {
    [meterNumber: string]: string
}

// const updateFormMeters = (existingMeters, existingMeterReadings, setMeters) => {
//     const lastMeterReadings = uniqBy(existingMeterReadings, 'meter')
//
//     const metersForState = existingMeters.map(meter => {
//         const lastMeterReading = lastMeterReadings.find(meterReading => meterReading.meter === meter.id)
//
//         return {
//             meterNumber: meter.number,
//             isNewMeter: false,
//             place: meter.place,
//             resourceId: meter.resource,
//             lastReadingData: {
//                 date: lastMeterReading.date,
//                 source: lastMeterReading.source,
//                 lastValue: lastMeterReading.value,
//             },
//         }
//     })
//
//     console.log('meters for state', metersForState)
//
//     setMeters(meters => [...meters.filter(meter => meter.isNewMeter), ...metersForState])
// }

const mapExistingMetersToFormMeters = (existingMeters, existingMeterReadings) => {
    const lastMeterReadings = uniqBy(existingMeterReadings, 'meter')

    return existingMeters.map(meter => {
        const lastMeterReading = lastMeterReadings.find(meterReading => meterReading.meter === meter.id)

        return {
            meterNumber: meter.number,
            isNewMeter: false,
            place: meter.place,
            resourceId: meter.resource,
            lastReadingData: lastMeterReading ? {
                date: lastMeterReading.date,
                source: lastMeterReading.source,
                lastValue: lastMeterReading.value,
            } : null,
        }
    })
}


export const CreateMeterReadingsForm: React.FC = () => {
    const intl = useIntl()
    const UserInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.ClientInfo' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.HelpMessage' })

    const { organization, link: { role: role } } = useOrganization()
    const validations = useTicketValidations()

    const initialValues = {}

    const [selectedPropertyId, setSelectedPropertyId] = useState(get(initialValues, 'property'))
    const selectPropertyIdRef = useRef(selectedPropertyId)
    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const [selectedUnitName, setSelectedUnitName] = useState(get(initialValues, 'unitName'))
    const selectedUnitNameRef = useRef(selectedUnitName)

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
        role,
    })
    const canCreateContactRef = useRef(canCreateContact)
    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    const [meters, setMeters] = useState<IMetersFormState[]>([])
    const metersRef = useRef(meters)
    useEffect(() => {
        metersRef.current = meters
    }, [meters])

    const [meterReadings, setMeterReadings] = useState<IMeterReadingFromState>({})
    const meterReadingsRef = useRef(meterReadings)
    useEffect(() => {
        meterReadingsRef.current = meterReadings
    }, [meterReadings])

    const { loading, obj: property } = useObject({ where: { id: selectedPropertyId ? selectedPropertyId : null } })

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})

    const { objs: existingMeters, loading: existingMetersLoading, refetch } = Meter.useObjects({
        where: {
            property: { id: selectedPropertyId ? selectedPropertyId : null },
            unitName: selectedUnitNameRef.current ? selectedUnitNameRef.current : null,
        },
    })

    const existingMetersIds = existingMeters.map(meter => meter.id)
    const { objs: existingMeterReadings, loading: existingMeterReadingsLoading } = MeterReading.useObjects({
        where: {
            meter: { id_in: existingMetersIds },
        },
        sortBy: [SortMeterReadingsBy.CreatedAtDesc],
    })

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
        refetch()
    }, [selectedUnitName])

    const existedMetersRef = useRef()
    useEffect(() => {
        if (existingMetersLoading || existingMeterReadingsLoading) return
        const mapped = mapExistingMetersToFormMeters(existingMeters, existingMeterReadings)
        existedMetersRef.current = mapped
        // setMeters(meters => [...meters.filter(meter => meter.isNewMeter), ...mapped])
        console.log(existedMetersRef.current)
    }, [existingMeterReadings, existingMeters])

    const createMeterAction = Meter.useCreate({}, () => {return})

    const createMeterReadingAction = MeterReading.useCreate({
        source: CALL_SOURCE_ID,
    }, () => {return})


    const action = useCallback(async (variables) => {
        console.log('existedMetersRef.current, metersRef.current, meterReadingsRef.current, variables',
            existedMetersRef.current, metersRef.current, meterReadingsRef.current, variables)

        let createdContact
        if (role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }

        const { unitName, property } = variables

        const newMetersFromState = metersRef.current.filter(meter => meter.isNewMeter)
        const newMeters = []
        for (const newMeter of newMetersFromState) {
            newMeters.push(await createMeterAction({
                number: newMeter.meterNumber,
                organization: organization.id,
                property: property,
                unitName,
                place: newMeter.place,
                resource: newMeter.resourceId,
            }))
        }
        // const result = await _action({
        //     ...otherVariables,
        //     contact: get(createdContact, 'id') || variables.contact,
        //     // @ts-ignore
        // }, ...args)
        //
        // return result
    }, [])

    const form = useForm()

    return (
        <FormWithAction
            {...LAYOUT}
            action={action}
            initialValues={initialValues}
            validateTrigger={['onBlur', 'onSubmit']}
            formValuesToMutationDataPreprocessor={(values) => {
                values.property = selectPropertyIdRef.current
                values.unitName = selectedUnitNameRef.current
                return values
            }}
            form={form}
        >
            {({ handleSave, isLoading, form }) => (
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
                    <Col lg={13} md={24}>
                        <Row gutter={[0, 20]}>
                            <Col span={24}>
                                <Row justify={'space-between'} gutter={[0, 15]}>
                                    <Col span={24}>
                                        <Typography.Title level={5}
                                            style={{ margin: '0' }}>{UserInfoTitle}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name={'property'} label={AddressLabel}
                                            rules={validations.property}>
                                            <PropertyAddressSearchInput
                                                organization={organization}
                                                autoFocus={true}
                                                onSelect={(_, option) => {
                                                    form.setFieldsValue({
                                                        unitName: null,
                                                        sectionName: null,
                                                        floorName: null,
                                                    })
                                                    setSelectedPropertyId(option.key)
                                                }}
                                                placeholder={AddressPlaceholder}
                                                notFoundContent={AddressNotFoundContent}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <UnitInfo
                                        property={property}
                                        loading={loading}
                                        setSelectedUnitName={setSelectedUnitName}
                                        form={form}
                                    />
                                </Row>
                            </Col>
                            <ContactsInfo
                                ContactsEditorComponent={ContactsEditorComponent}
                                form={form}
                                initialValues={initialValues}
                                selectedPropertyId={selectedPropertyId}
                            />
                            {
                                !resourcesLoading ? (
                                    <>
                                        <Typography.Paragraph
                                            strong={true}
                                            style={{ fontSize: '20px' }}
                                        >
                                            Данные счетчиков
                                        </Typography.Paragraph>
                                        <MetersGroup
                                            form={form}
                                            meters={meters.filter(meter => meter.resourceId === COLD_WATER_METER_RESOURCE_ID)}
                                            setMeters={setMeters}
                                            setMeterReadings={setMeterReadings}
                                            Icon={SnowflakeIcon}
                                            meterResource={resources.find(resource => resource.id === COLD_WATER_METER_RESOURCE_ID)}
                                        />
                                        {/*<MetersGroup*/}
                                        {/*    meters={meters.filter(meter => meter.resourceId === HOT_WATER_METER_RESOURCE_ID)}*/}
                                        {/*    setMeters={setMeters}*/}
                                        {/*    Icon={SnowflakeIcon}*/}
                                        {/*    meterResource={resources.find(resource => resource.id === HOT_WATER_METER_RESOURCE_ID)}*/}
                                        {/*/>*/}
                                    </>
                                ) :  <Loader />
                            }
                        </Row>
                    </Col>
                    <CreateTicketActionBar handleSave={handleSave} isLoading={isLoading}/>
                </>
            )}
        </FormWithAction>
    )
}
