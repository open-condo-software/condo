import { Col, Divider, Form, Input, Row, Space, Typography } from 'antd'
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
import { BillingAccountMeterReading } from '@condo/domains/billing/utils/clientSchema'
import { get } from 'lodash'
// @ts-ignore
import { SortBillingAccountMeterReadingsBy } from '../../../schema.ts'
import { useRouter } from 'next/router'
import { 
    CALL_METER_READING_SOURCE_ID,
} from '../constants/constants'
import styled from '@emotion/styled'
import { PlusCircleFilled } from '@ant-design/icons'
import { BasicEmptyListView } from '../../common/components/EmptyListView'
import { fontSizes } from '../../common/constants/style'
import { useCreateAccountModal } from './hooks/useCreateAccountModal'
import { AccountNumberInput } from './AccountNumberInput'
import { useCreateMeterModal } from './hooks/useCreateMeterModal'
import { FormListOperation } from 'antd/lib/form/FormList'
import { useForm } from 'antd/lib/form/Form'
import { MeterCard } from './MeterCard'
import { convertToUIFormState } from '../utils/clientSchema/Meter'

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

export const CreateMeterReadingsActionBar = ({ handleSave, handleAddMeterButtonClick, accountNumber, isLoading }) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.SendMetersReading' })
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    return (
        <Form.Item noStyle dependencies={['property']}>
            {
                ({ getFieldsValue }) => {
                    const { meters, property } = getFieldsValue(['meters', 'property'])

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
                                    icon={<PlusCircleFilled />}
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

export const CreateMeterReadingsForm = ({ organization, role }) => {
    const intl = useIntl()
    const UserInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.ClientInfo' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })
    const MeterDataTitle = intl.formatMessage({ id: 'pages.condo.meter.MeterDataTitle' })
    const NoMetersMessage = intl.formatMessage({ id: 'pages.condo.meter.NoMeters' })
    const AddMetersMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeters' })

    const validations = useMeterReadingsValidations()

    const { CreateMeterModal,  setIsCreateMeterModalVisible } = useCreateMeterModal()

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(null)
    const [meterFormListOperations, setMeterFormListOperations] = useState<FormListOperation | null>(null)

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
        role,
    })

    const { obj: property, loading: propertyLoading } = useObject({ where: { id: selectedPropertyId ? selectedPropertyId : null } })

    const { objs: existingMeters, loading: existingMetersLoading, refetch } = Meter.useObjects({
        where: {
            property: { id: selectedPropertyId ? selectedPropertyId : null },
            unitName: selectedUnitName ? selectedUnitName : null,
        },
    })

    console.log('existingMeters', existingMeters)

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})

    const existingMetersAccounts = existingMeters.map(meter => meter.accountNumber)

    // const { objs: billingMeterReadings, loading: billingMeterReadingsLoading } = BillingAccountMeterReading.useObjects({
    //     where: {
    //         meter: { account: { number_in: existingMetersAccounts } },
    //     },
    //     sortBy: [SortBillingAccountMeterReadingsBy.CreatedAtDesc],
    // })

    const selectPropertyIdRef = useRef(selectedPropertyId)
    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const selectedUnitNameRef = useRef(selectedUnitName)
    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
        refetch()
    }, [selectedUnitName])

    const canCreateContactRef = useRef(canCreateContact)
    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    const existingMetersRef = useRef(existingMeters)
    useEffect(() => {
        existingMetersRef.current = existingMeters
    }, [existingMeters])

    const meterFormListOperationsRef = useRef(meterFormListOperations)
    useEffect(() => {
        meterFormListOperationsRef.current = meterFormListOperations
    }, [meterFormListOperations])

    const isNoExistingMetersInThisUnit = existingMetersRef.current.length === 0

    const createMeterAction = Meter.useCreate({}, () => { return })
    const createMeterReadingAction = MeterReading.useCreate({}, () => { return })

    const action = useCallback(async (variables) => {
        let createdContact
        if (role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }

        const { property, unitName, newMeters, accountNumber, client, clientName, clientEmail, clientPhone } = variables

        // const existedMetersFromForm = variables.existedMeters
        // if (existedMetersFromForm) {
        //     const existingMetersCreateActions = Object.entries(existedMetersFromForm).map(([meterId, value]) => {
        //         if (!value) return
        //         const existedMeter = existingMetersRef.current.find(meter => meter.id === meterId)
        //
        //         return createMeterReadingAction({
        //             organization: organization.id,
        //             contact: get(createdContact, 'id') || variables.contact,
        //             value1: Number(value),
        //             meter: meterId,
        //             date: new Date(),
        //             client,
        //             clientName,
        //             clientEmail,
        //             clientPhone,
        //             source,
        //         })
        //     })
        //     await Promise.all([existingMetersCreateActions])
        // }


        const newMetersAndMeterReadingsCreateActions = newMeters.map(newMeterFromForm => (
            createMeterAction({
                commissioningDate: newMeterFromForm.commissioningDate,
                installationDate: newMeterFromForm.installationDate,
                sealingDate: newMeterFromForm.sealingDate,
                number: newMeterFromForm.number,
                organization: organization.id,
                property: property,
                numberOfTariffs: newMeterFromForm.numberOfTariffs ? newMeterFromForm.numberOfTariffs : 1,
                unitName,
                accountNumber,
                place: newMeterFromForm.place,
                resource: newMeterFromForm.resource,
            })
                .then(
                    newMeter =>
                        (
                            createMeterReadingAction({
                                organization: organization.id,
                                contact: get(createdContact, 'id') || variables.contact,
                                value1: newMeterFromForm.value1,
                                value2: newMeterFromForm.value2,
                                value3: newMeterFromForm.value3,
                                value4: newMeterFromForm.value4,
                                meter: newMeter.id,
                                date: new Date(),
                                client,
                                clientName,
                                clientEmail,
                                clientPhone,
                                source: CALL_METER_READING_SOURCE_ID,
                            })
                        )
                )
        ))

        await Promise.all(newMetersAndMeterReadingsCreateActions)

        // await router.push('/')
    }, [])

    return (
        <FormWithAction
            {...LAYOUT}
            action={action}
            validateTrigger={['onBlur', 'onSubmit']}
            formValuesToMutationDataPreprocessor={(values) => {
                values.property = selectPropertyIdRef.current
                values.unitName = selectedUnitNameRef.current
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
                    <Col lg={13} md={24}>
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row justify={'space-between'} gutter={[0, 20]}>
                                    <Col span={24}>
                                        <Typography.Title level={5} style={{ margin: '0' }}>
                                            {UserInfoTitle}
                                        </Typography.Title>
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
                                    {
                                        !existingMetersLoading && selectedUnitNameRef.current ? (
                                            <Col span={24}>
                                                <AccountNumberInput
                                                    form={form}
                                                    existingMeters={existingMeters}
                                                />
                                            </Col>
                                        ) : null
                                    }
                                </Row>
                            </Col>
                            {
                                existingMetersLoading || resourcesLoading ? <Loader /> :
                                    !selectedUnitNameRef.current || !form.getFieldValue('accountNumber') ? null :
                                        (
                                            <Col span={24}>
                                                <Row gutter={[0, 20]}>
                                                    <Col span={24}>
                                                        {
                                                            isNoExistingMetersInThisUnit &&
                                                        !form.getFieldValue('newMeters') ? (
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
                                                    </Col>
                                                    <Form.Item name={'existedMeters'}>
                                                        <Row gutter={[0, 20]}>
                                                            {
                                                                existingMeters.map((existedMeter, index) => {
                                                                    const meter = convertToUIFormState(existedMeter)
                                                                    const resource = resources.find(resource => resource.id === meter.resource)

                                                                    return (
                                                                        <Col span={24} key={existedMeter.id}>
                                                                            <Form.Item
                                                                                name={['existedMeters', index]}
                                                                            >
                                                                                <MeterCard
                                                                                    meter={meter}
                                                                                    resource={resource}
                                                                                    name={['existedMeters', index]}
                                                                                />
                                                                            </Form.Item>
                                                                        </Col>
                                                                    )
                                                                })
                                                            }
                                                        </Row>
                                                    </Form.Item>
                                                    <Form.List name={'newMeters'}>
                                                        {(fields, operations) => {
                                                            if (!meterFormListOperationsRef.current) setMeterFormListOperations(operations)

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
                                        )
                            }
                        </Row>
                    </Col>

                    <CreateMeterModal
                        addMeterToFormAction={
                            meterFormListOperationsRef.current ?
                                meterFormListOperationsRef.current.add :
                                null
                        }
                        resources={resources}
                    />

                    <CreateMeterReadingsActionBar
                        handleSave={handleSave}
                        handleAddMeterButtonClick={() => setIsCreateMeterModalVisible(true)}
                        isLoading={isLoading}
                        accountNumber={form.getFieldValue('accountNumber')}
                    />
                </>
            )}
        </FormWithAction>
    )
}
