import { Col, Form, FormInstance, Row, Space, Typography } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { ErrorsContainer } from './ErrorsContainer'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import { Meter, MeterReading, MeterResource } from '../utils/clientSchema'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { get } from 'lodash'
import {
    CALL_METER_READING_SOURCE_ID,
} from '../constants/constants'
import { PlusCircleFilled } from '@ant-design/icons'
import { AccountNumberInput } from './AccountNumberInput'
import { useCreateMeterModal } from '../hooks/useCreateMeterModal'
import { FormListOperation } from 'antd/lib/form/FormList'
import { MeterCard } from './MeterCard'
import { convertToUIFormState, IMeterFormState } from '../utils/clientSchema/Meter'
import { useRouter } from 'next/router'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { SortBillingAccountMeterReadingsBy } from '@app/condo/schema'
import { BillingAccountMeterReading } from '@condo/domains/billing/utils/clientSchema'
import { IMeterReadingFormState } from '../utils/clientSchema/MeterReading'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT } from '../constants/errors'
import { Loader } from '@condo/domains/common/components/Loader'
import { ContactsInfo } from '@condo/domains/ticket/components/BaseTicketForm'

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

export const CreateMeterReadingsActionBar = ({
    accountNumber,
    existedMeters,
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
            dependencies={['property', 'newMeters']}
            shouldUpdate={(prev, next) => prev.unitName !== next.unitName}
        >
            {
                ({ getFieldsValue }) => {
                    const { newMeters, property } = getFieldsValue(['newMeters', 'property'])

                    return (
                        <ActionBar>
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={(!newMeters && existedMeters.length === 0) || !property || !accountNumber}
                                >
                                    {SendMetersReadingMessage}
                                </Button>
                                <Button
                                    onClick={handleAddMeterButtonClick}
                                    type='sberPrimary'
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
        <Typography.Title level={5}>
            {MeterDataTitle}
        </Typography.Title>
    )
}

const ExistedMetersList = ({ existedMeters, resources, billingMeterReadings }) => (
    <Form.List name={'existedMeters'}>
        {(fields, operations) => {
            return existedMeters.map((existedMeter) => {
                const meter = convertToUIFormState(existedMeter)
                const resource = resources.find(resource => resource.id === meter.resource)

                const lastMeterBillingMeterReading = billingMeterReadings.find(
                    meterReading => meterReading.meter.number === meter.number
                )

                return (
                    <Col span={24} key={existedMeter.id}>
                        <MeterCard
                            meter={meter}
                            resource={resource}
                            name={meter.id}
                            lastMeterBillingMeterReading={lastMeterBillingMeterReading}
                        />
                    </Col>
                )
            })
        }}
    </Form.List>
)

type IMeterValues = { value1: string, value2?: string, value3?: string, value4?: string }
type ICreateMeterReadingsFormVariables = IMeterReadingFormState & {
    newMeters: (IMeterFormState & IMeterValues)[]
    existedMeters: { [meterId: string]: IMeterValues }
}

export const CreateMeterReadingsForm = ({ organization, role }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.meter.warning.modal.HelpMessage' })
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameNumberIsExist' })
    const AccountNumberIsExistInOtherUnitMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumberIsExistInOtherUnit' })
    const ClientInfoMessage = intl.formatMessage({ id: 'ClientInfo' })

    const router = useRouter()
    const { requiredValidator } = useValidations()

    const validations = {
        property: [requiredValidator],
    }

    const { CreateMeterModal, setIsCreateMeterModalVisible } = useCreateMeterModal()

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(null)
    const [meterFormListOperations, setMeterFormListOperations] = useState<FormListOperation | null>(null)
    const [formFromState, setFormFromState] = useState<FormInstance | null>(null)
    const [accountNumber, setAccountNumber] = useState<string>(null)
    const [isAccountNumberIntroduced, setIsAccountNumberIntroduced] = useState<boolean>(false)

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
        role,
    })

    const { obj: property, loading: propertyLoading } = useObject({
        where: { id: selectedPropertyId ? selectedPropertyId : null },
    })

    const { objs: existedMeters, loading: existedMetersLoading, refetch: refetchExistedMeters } = Meter.useObjects({
        where: {
            property: { id: selectedPropertyId ? selectedPropertyId : null },
            unitName: selectedUnitName ? selectedUnitName : null,
        },
    })

    const { objs: billingMeterReadings } = BillingAccountMeterReading.useObjects({
        where: {
            account: { number: accountNumber },
            context: {
                organization: {
                    id: organization.id,
                },
            },
        },
        sortBy: [SortBillingAccountMeterReadingsBy.CreatedAtDesc],
    })

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})

    const isNoExistedMetersInThisUnit = existedMeters.length === 0
    const verticalGutter = accountNumber || isAccountNumberIntroduced ? 40 : 80

    useEffect(() => {
        if (existedMeters.length > 0)
            setAccountNumber(existedMeters[0].accountNumber)
    }, [existedMetersLoading])

    const selectPropertyIdRef = useRef(selectedPropertyId)
    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        setSelectedUnitName(null)
    }, [selectedPropertyId])

    const selectedUnitNameRef = useRef(selectedUnitName)
    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
        setAccountNumber(null)
        formFromState && formFromState.setFieldsValue( { newMeters: null, existedMeters: null })
        refetchExistedMeters()
    }, [selectedPropertyId, selectedUnitName])

    const accountNumberRef = useRef(accountNumber)
    useEffect(() => {
        accountNumberRef.current = accountNumber
    }, [accountNumber])

    const canCreateContactRef = useRef(canCreateContact)
    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    useEffect(() => {
        setIsAccountNumberIntroduced(false)
    }, [selectedUnitName])

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
        if (role && role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }
        const normalizeReading = (reading) => reading?.replace(',', '.')

        const { property, accountNumber, newMeters, existedMeters, floorName, sectionName, unitName, ...clientInfo } = variables
        const getNewMeterReadingVariables = (meterReading) => {
            return {
                organization: organization.id,
                contact: get(createdContact, 'id') || variables.contact,
                value1: normalizeReading(meterReading.value1),
                value2: normalizeReading(meterReading.value2),
                value3: normalizeReading(meterReading.value3),
                value4: normalizeReading(meterReading.value4),
                meter: meterReading.id,
                date: new Date(),
                ...clientInfo,
            }
        }

        let existingMetersCreateActions = []
        if (existedMeters) {
            existingMetersCreateActions = Object.entries(existedMeters).map(([meterId, values]) => {
                const { value1, value2, value3, value4 } = values
                if (!value1 && ! value2 && !value3 && !value4) return

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
                        newMeter => {
                            if (!value1 && !value2 && !value3 && !value4) return

                            return createMeterReadingAction({
                                ...getNewMeterReadingVariables({ ...newMeterFromForm, id: newMeter.id }),
                            })
                        }
                    )
            })
        }

        await Promise.all([...existingMetersCreateActions, ...newMetersAndMeterReadingsCreateActions])
        await router.push('/meter')
    }, [])

    const ErrorToFormFieldMsgMapping = {
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: {
            name: 'newMeters',
            errors: [MeterWithSameNumberIsExistMessage],
        },
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: {
            name: 'accountNumber',
            errors: [AccountNumberIsExistInOtherUnitMessage],
        },
    }

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
            ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
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
                        <Row gutter={[0, verticalGutter]}>
                            <Col lg={13} md={24}>
                                <Row gutter={[0, 40]}>
                                    <Col span={24}>
                                        <Row justify={'space-between'} gutter={[0, 15]}>
                                            <Col span={24}>
                                                <Typography.Title level={5}>
                                                    {ClientInfoMessage}
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
                                                            setSelectedPropertyId(String(option.key))
                                                        }}
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
                                                            form={form}
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
                                            initialValues={{}}
                                            selectedPropertyId={selectedPropertyId}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            {
                                !selectedUnitName ? null : (
                                    <>
                                        <AccountNumberInput
                                            accountNumber={accountNumber}
                                            setAccountNumber={setAccountNumber}
                                            isAccountNumberIntroduced={isAccountNumberIntroduced}
                                            setIsAccountNumberIntroduced={setIsAccountNumberIntroduced}
                                            existingMeters={existedMeters}
                                        />
                                        {
                                            !accountNumber ? null : (
                                                <Col lg={13} md={24}>
                                                    <Row gutter={[0, 20]}>
                                                        <Col span={24}>
                                                            <MetersDataTitle
                                                                isNoExistingMetersInThisUnit={isNoExistedMetersInThisUnit}
                                                                isNoNewMetersInThisUnit={!form.getFieldValue('newMeters')}
                                                            />
                                                        </Col>
                                                        {
                                                            resourcesLoading ? <Loader /> : (
                                                                <>
                                                                    <ExistedMetersList
                                                                        existedMeters={existedMeters}
                                                                        resources={resources}
                                                                        billingMeterReadings={billingMeterReadings}
                                                                    />
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
                                                                                                removeAction={operations.remove}
                                                                                            />
                                                                                        </Form.Item>
                                                                                    </Col>
                                                                                )
                                                                            })
                                                                        }}
                                                                    </Form.List>
                                                                </>
                                                            )
                                                        }
                                                    </Row>
                                                </Col>
                                            )
                                        }
                                    </>
                                )
                            }
                            {
                                accountNumber || isAccountNumberIntroduced ? (
                                    <Col span={24}>
                                        <CreateMeterReadingsActionBar
                                            accountNumber={accountNumber}
                                            existedMeters={existedMeters}
                                            handleSave={handleSave}
                                            handleAddMeterButtonClick={() => setIsCreateMeterModalVisible(true)}
                                            isLoading={isLoading}
                                        />
                                    </Col>
                                ) : null
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
                        newMeters={form.getFieldValue('newMeters')}
                    />
                </>
            )}
        </FormWithAction>
    )
}