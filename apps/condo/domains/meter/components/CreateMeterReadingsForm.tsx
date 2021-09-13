import { Col, Form, FormInstance, Row, Space, Typography } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { ErrorsContainer } from './ErrorsContainer'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { Loader } from '@condo/domains/common/components/Loader'
import { useMeterReadingsValidations } from './hooks/useMeterReadingsValidations'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import { Meter, MeterReading, MeterResource } from '../utils/clientSchema'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { UnitInfo } from '@condo/domains/ticket/components/BaseTicketForm'
import { get } from 'lodash'
import {
    CALL_METER_READING_SOURCE_ID,
} from '../constants/constants'
import styled from '@emotion/styled'
import { PlusCircleFilled } from '@ant-design/icons'
import { AccountNumberInput, EmptyAccountView } from './AccountNumberInput'
import { useCreateMeterModal } from './hooks/useCreateMeterModal'
import { FormListOperation } from 'antd/lib/form/FormList'
import { MeterCard } from './MeterCard'
import { convertToUIFormState, IMeterFormState } from '../utils/clientSchema/Meter'
import { useRouter } from 'next/router'

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

export const DisabledWrapper = styled.div`
  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`

const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, initialValues }) => {
    return (
        <Col span={24}>
            <Form.Item shouldUpdate noStyle>
                {({ getFieldsValue }) => {
                    const { unitName } = getFieldsValue(['unitName'])

                    const value = {
                        id: get(initialValues, ['contact', 'id']),
                        name: get(initialValues, 'clientName'),
                        phone: get(initialValues, 'clientPhone'),
                    }

                    return (
                        <DisabledWrapper className={!unitName ? 'disabled' : ''}>
                            <ContactsEditorComponent
                                form={form}
                                fields={{
                                    id: 'contact',
                                    phone: 'clientPhone',
                                    name: 'clientName',
                                }}
                                value={value}
                                property={selectedPropertyId}
                                unitName={unitName}
                            />
                        </DisabledWrapper>
                    )
                }}
            </Form.Item>
        </Col>
    )
}

export const CreateMeterReadingsActionBar = ({
    accountNumber,
    handleSave,
    handleAddMeterButtonClick,
    isLoading,
}) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.SendMetersReading' })
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    return (
        <Form.Item
            noStyle
            dependencies={['property']}
        >
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
                                    disabled={!property || !accountNumber}
                                >
                                    {SendMetersReadingMessage}
                                </Button>
                                <Button
                                    onClick={handleAddMeterButtonClick}
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={!property || !accountNumber}
                                    icon={<PlusCircleFilled/>}
                                    secondary
                                >
                                    {AddMeterMessage}
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

const MetersDataTitle = ({ isNoExistingMetersInThisUnit, isNoNewMetersInThisUnit }) => {
    const intl = useIntl()
    const MeterDataTitle = intl.formatMessage({ id: 'pages.condo.meter.MeterDataTitle' })
    const NoMetersMessage = intl.formatMessage({ id: 'pages.condo.meter.NoMeters' })
    const AddMetersMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeters' })

    return isNoExistingMetersInThisUnit && isNoNewMetersInThisUnit ? (
        <>
            <Typography.Title level={3}>
                {NoMetersMessage}
            </Typography.Title>
            <Typography.Paragraph type='secondary'>
                {AddMetersMessage}
            </Typography.Paragraph>
        </>
    ) : (
        <Typography.Paragraph
            strong={true}
            style={{ fontSize: '20px', marginBottom: 0 }}
        >
            {MeterDataTitle}
        </Typography.Paragraph>
    )
}

type IMeterValues = { value1: string, value2?: string, value3?: string, value4?: string }
type ICreateMeterReadingsFormVariables = {
    property: string
    newMeters: (IMeterFormState & IMeterValues)[]
    existedMeters: { [meterId: string]: IMeterValues }
    floorName: string
    sectionName: string
    unitName: string
    contact?: string
    client?: string
    clientName?: string
    clientEmail?: string
    clientPhone?: string
    accountNumber: string
}

export const CreateMeterReadingsForm = ({ organization, role }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })

    const router = useRouter()
    const validations = useMeterReadingsValidations()

    const { CreateMeterModal, setIsCreateMeterModalVisible } = useCreateMeterModal()

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(null)
    const [meterFormListOperations, setMeterFormListOperations] = useState<FormListOperation | null>(null)
    const [formFromState, setFormFromState] = useState<FormInstance | null>(null)
    const [accountNumber, setAccountNumber] = useState<string>(null)

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
        role,
    })

    const {
        obj: property,
        loading: propertyLoading,
    } = useObject({ where: { id: selectedPropertyId ? selectedPropertyId : null } })

    const { objs: existingMeters, loading: existingMetersLoading, refetch } = Meter.useObjects({
        where: {
            property: { id: selectedPropertyId ? selectedPropertyId : null },
            unitName: selectedUnitName ? selectedUnitName : null,
        },
    })

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})

    // const existingMetersAccounts = existingMeters.map(meter => meter.accountNumber)

    // const { objs: billingMeterReadings, loading: billingMeterReadingsLoading } = BillingAccountMeterReading.useObjects({
    //     where: {
    //         meter: { account: { number_in: existingMetersAccounts } },
    //     },
    //     sortBy: [SortBillingAccountMeterReadingsBy.CreatedAtDesc],
    // })

    useEffect(() => {
        if (existingMeters.length > 0) {
            // form.setFieldsValue({ accountNumber: existingMetersRef.current[0].accountNumber })
            setAccountNumber(existingMeters[0].accountNumber)
        }
        // else {
        //     setAccountNumber(null)
        // }
        // if (form.getFieldValue('accountNumber') && existingMetersRef.current.length === 0)
        //     form.setFieldsValue({ accountNumber: null })
    }, [existingMeters])

    console.log('selectedPropertyId, selectedUnitName, accountNumber', selectedPropertyId, selectedUnitName, accountNumber)

    const selectPropertyIdRef = useRef(selectedPropertyId)
    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        setSelectedUnitName(null)
    }, [selectedPropertyId])

    const selectedUnitNameRef = useRef(selectedUnitName)
    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
        setAccountNumber(null)
        formFromState && formFromState.setFieldsValue( { newMeters: null })
        refetch()
    }, [selectedUnitName])

    const accountNumberRef = useRef(accountNumber)
    useEffect(() => {
        accountNumberRef.current = accountNumber
    }, [accountNumber])

    const canCreateContactRef = useRef(canCreateContact)
    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    const isNoExistingMetersInThisUnit = existingMeters.length === 0

    const createMeterAction = Meter.useCreate({}, () => {
        return
    })
    const createMeterReadingAction = MeterReading.useCreate({
        source: CALL_METER_READING_SOURCE_ID,
    }, () => {
        return
    })

    const action = useCallback(async (variables: ICreateMeterReadingsFormVariables) => {
        let createdContact
        if (role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }

        const { property, accountNumber, newMeters, existedMeters, floorName, sectionName, unitName, ...clientInfo } = variables
        const getNewMeterReadingVariables = (meterReading) => {
            return {
                organization: organization.id,
                contact: get(createdContact, 'id') || variables.contact,
                value1: meterReading.value1,
                value2: meterReading.value2,
                value3: meterReading.value3,
                value4: meterReading.value4,
                meter: meterReading.id,
                date: new Date(),
                ...clientInfo,
            }
        }

        let existingMetersCreateActions = []
        if (existedMeters) {
            existingMetersCreateActions = Object.entries(existedMeters).map(([meterId, values]) => {
                return createMeterReadingAction({
                    ...getNewMeterReadingVariables({ id: meterId, ...values }),
                })
            })
        }

        let newMetersAndMeterReadingsCreateActions = []
        if (newMeters && newMeters.length > 0) {
            newMetersAndMeterReadingsCreateActions = newMeters.map(newMeterFromForm => {
                const { value1, value2, value3, value4, ...newMeterData } = newMeterFromForm

                return createMeterAction({
                    ...newMeterData,
                    organization: organization.id,
                    property: property,
                    numberOfTariffs: newMeterFromForm.numberOfTariffs ? newMeterFromForm.numberOfTariffs : 1,
                    unitName,
                    accountNumber,
                })
                    .then(
                        newMeter => (
                            createMeterReadingAction({
                                ...getNewMeterReadingVariables({ ...newMeterFromForm, id: newMeter.id }),
                            })
                        )
                    )
            })
        }

        await Promise.all([...existingMetersCreateActions, ...newMetersAndMeterReadingsCreateActions])
        await router.push('/meter')
    }, [])

    return (
        <FormWithAction
            {...LAYOUT}
            action={action}
            validateTrigger={['onBlur', 'onSubmit']}
            formValuesToMutationDataPreprocessor={(values) => {
                values.property = selectPropertyIdRef.current
                values.unitName = selectedUnitNameRef.current
                values.accountNumber = accountNumberRef.current
                return values
            }}
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
                    <Col span={24}>
                        <Row gutter={[0, 40]}>
                            <Col lg={14} md={24}>
                                <Row justify={'space-between'} gutter={[0, 20]}>
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
                                                    setSelectedPropertyId(String(option.key))
                                                }}
                                                placeholder={AddressPlaceholder}
                                                notFoundContent={AddressNotFoundContent}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <UnitInfo
                                            property={property}
                                            loading={propertyLoading}
                                            setSelectedUnitName={setSelectedUnitName}
                                            form={form}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ContactsInfo
                                            ContactsEditorComponent={ContactsEditorComponent}
                                            form={form}
                                            initialValues={{}}
                                            selectedPropertyId={selectedPropertyId}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            {
                                existingMetersLoading || resourcesLoading ? <Loader/> :
                                    !selectedUnitName ? null :
                                        !accountNumber ? <EmptyAccountView setAccountNumber={setAccountNumber} /> : (
                                            <>
                                                <AccountNumberInput
                                                    accountNumber={accountNumber}
                                                    setAccountNumber={setAccountNumber}
                                                    existingMeters={existingMeters}
                                                />
                                                <Col lg={14} md={24}>
                                                    <Row gutter={[0, 20]}>
                                                        <Col span={24}>
                                                            <MetersDataTitle
                                                                isNoExistingMetersInThisUnit={isNoExistingMetersInThisUnit}
                                                                isNoNewMetersInThisUnit={!form.getFieldValue('newMeters')}
                                                            />
                                                        </Col>
                                                        <Form.List name={['existedMeters']}>
                                                            {(fields, operations) => {
                                                                return existingMeters.map((existedMeter) => {
                                                                    const meter = convertToUIFormState(existedMeter)
                                                                    const resource = resources.find(resource => resource.id === meter.resource)

                                                                    return (
                                                                        <Col span={24} key={existedMeter.id}>
                                                                            <MeterCard
                                                                                meter={meter}
                                                                                resource={resource}
                                                                                name={meter.id}
                                                                            />
                                                                        </Col>
                                                                    )
                                                                })
                                                            }}
                                                        </Form.List>
                                                        <Form.List name={'newMeters'}>
                                                            {(fields, operations) => {
                                                                if (!meterFormListOperations) setMeterFormListOperations(operations)
                                                                if (!formFromState) setFormFromState(form)

                                                                return fields.map((field, index) => {
                                                                    const newMeter = form.getFieldValue(['newMeters', index])
                                                                    const resource = resources.find(resource => resource.id === newMeter.resource)

                                                                    return (
                                                                        <Col span={24} key={field.key}>
                                                                            <Form.Item
                                                                                {...field}
                                                                                name={field.name}
                                                                                noStyle
                                                                            >
                                                                                <MeterCard
                                                                                    meter={newMeter}
                                                                                    resource={resource}
                                                                                    name={field.name}
                                                                                />
                                                                            </Form.Item>
                                                                        </Col>
                                                                    )
                                                                })
                                                            }}
                                                        </Form.List>
                                                    </Row>
                                                </Col>
                                            </>
                                        )
                            }
                        </Row>
                    </Col>

                    <CreateMeterModal
                        addMeterToFormAction={
                            meterFormListOperations ?
                                meterFormListOperations.add :
                                null
                        }
                        resources={resources}
                    />

                    <CreateMeterReadingsActionBar
                        accountNumber={accountNumber}
                        handleSave={handleSave}
                        handleAddMeterButtonClick={() => setIsCreateMeterModalVisible(true)}
                        isLoading={isLoading}
                    />
                </>
            )}
        </FormWithAction>
    )
}
