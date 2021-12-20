import { Col, Form, FormInstance, Row, Space, Typography } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import uniqWith from 'lodash/uniqWith'
import {
    CALL_METER_READING_SOURCE_ID,
} from '../constants/constants'
import { PlusCircleFilled } from '@ant-design/icons'
import { AccountNumberInput } from './AccountNumberInput'
import { useCreateMeterModal } from '../hooks/useCreateMeterModal'
import { FormListOperation } from 'antd/lib/form/FormList'
import { MeterCard } from './MeterCard'
import { convertToUIFormState, IMeterFormState, IMeterUIState } from '../utils/clientSchema/Meter'
import { useRouter } from 'next/router'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { SortBillingAccountMeterReadingsBy, SortMeterReadingsBy, SortMetersBy } from '@app/condo/schema'
import { BillingAccountMeterReading } from '@condo/domains/billing/utils/clientSchema'
import { IMeterReadingFormState, IMeterReadingUIState } from '../utils/clientSchema/MeterReading'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT } from '../constants/errors'
import { Loader } from '@condo/domains/common/components/Loader'
import { ContactsInfo } from '@condo/domains/ticket/components/BaseTicketForm'
import { Table } from '@condo/domains/common/components/Table/Index'
import { useMeterTableColumns } from '../hooks/useMeterTableColumns'
import { get, isEmpty } from 'lodash'
import { getTableScrollConfig } from '../../common/utils/tables.utils'
import { useLayoutContext } from '../../common/components/LayoutContext'
import { useUpdateMeterModal } from '../hooks/useUpdateMeterModal'
import { jsx } from '@emotion/core'

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

export const CreateMeterReadingsActionBar = ({
    handleSave,
    handleAddMeterButtonClick,
    isLoading,
    newMeterReadings,
}) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.SendMetersReading' })
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    return (
        <Form.Item
            noStyle
            dependencies={['property']}
            shouldUpdate={(prev, next) => prev.unitName !== next.unitName}
        >
            {
                ({ getFieldsValue }) => {
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])
                    const disabled = !property || !unitName || isEmpty(newMeterReadings)

                    return (
                        <ActionBar>
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={disabled}
                                >
                                    {SendMetersReadingMessage}
                                </Button>
                                <Button
                                    onClick={handleAddMeterButtonClick}
                                    type='sberPrimary'
                                    disabled={!property}
                                    icon={<PlusCircleFilled/>}
                                    secondary
                                >
                                    {AddMeterMessage}
                                </Button>
                                <ErrorsContainer
                                    property={property}
                                    unitName={unitName}
                                    newMeterReadings={newMeterReadings}
                                />
                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}

type IMeterValues = { value1: string, value2?: string, value3?: string, value4?: string }
type ICreateMeterReadingsFormVariables = IMeterReadingFormState & {
    newMeters: (IMeterFormState & IMeterValues)[]
    existedMeters: { [meterId: string]: IMeterValues }
}

type MetersTableRecord = {
    // meterId: string
    // meterAccountNumber: string
    // meterResource: string
    // meterResourceMeasure: string
    // meterNumber: string
    // meterPlace: string
    // meterVerificationDate: string
    meter: IMeterUIState
    lastMeterReading: string
    meterReadingSource: string
    tariffNumber: string
}

function getTableData (meters: IMeterUIState[], meterReadings: IMeterReadingUIState[]): MetersTableRecord[] {
    const dataSource: MetersTableRecord[] = []
    const lastMeterReadings = uniqWith(meterReadings,
        (meterReading1, meterReading2) =>
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

    const { isSmall } = useLayoutContext()
    const { requiredValidator } = useValidations()
    const validations = {
        property: [requiredValidator],
    }

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(null)
    const selectPropertyIdRef = useRef(selectedPropertyId)
    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        setSelectedUnitName(null)
    }, [selectedPropertyId])

    const selectedUnitNameRef = useRef(selectedUnitName)
    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
        role,
    })

    const { obj: property, loading: propertyLoading } = useObject({
        where: { id: selectedPropertyId ? selectedPropertyId : null },
    })

    const canCreateContactRef = useRef(canCreateContact)
    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    const router = useRouter()
    const { objs: meters, refetch: refetchMeters, loading: metersLoading, count: total } = Meter.useObjects({
        where: {
            property: { id: selectedPropertyId },
            unitName: selectedUnitName,
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
    const { CreateMeterModal, setIsCreateMeterModalVisible } = useCreateMeterModal(organization.id, selectedPropertyId, selectedUnitName, refetch)
    const dataSource = useMemo(() => getTableData(meters, meterReadings), [meterReadings, meters])

    const { tableColumns, newMeterReadings, setNewMeterReadings } = useMeterTableColumns()
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch)
    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                setSelectedMeter(meter)
            },
        }
    }, [])

    useEffect(() => {
        refetch()
        setNewMeterReadings({})
    }, [selectedPropertyId, selectedUnitName])

    const createMeterReadingAction = MeterReading.useCreate({
        source: CALL_METER_READING_SOURCE_ID,
    }, () => {
        router.push('/meter')
    })

    const handleSubmit = useCallback(async (values) => {
        let createdContact
        if (role && role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }

        for (const [meterId, newMeterReading] of Object.entries(newMeterReadings)) {
            const value1 = get(newMeterReading, '1')
            const value2 = get(newMeterReading, '2')
            const value3 = get(newMeterReading, '3')
            const value4 = get(newMeterReading, '4')

            const { property, unitName, sectionName, floorName, ...clientInfo } = values

            createMeterReadingAction({
                ...clientInfo,
                organization: organization.id,
                contact: get(createdContact, 'id') || values.contact,
                meter: meterId,
                date: new Date(),
                value1,
                value2,
                value3,
                value4,
            })
        }
    }, [createContact, createMeterReadingAction, newMeterReadings, organization.id, role])

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
            validateTrigger={['onBlur', 'onSubmit']}
            action={handleSubmit}
            formValuesToMutationDataPreprocessor={(values) => {
                values.property = selectPropertyIdRef.current
                values.unitName = selectedUnitNameRef.current
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
                        <Row gutter={[0, 40]}>
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
                            <Col span={24}>
                                <Row gutter={[0, 20]}>
                                    <Typography.Title level={2}>Приборы учета и показания</Typography.Title>
                                    {
                                        selectedUnitName ? (
                                            <Table
                                                scroll={getTableScrollConfig(isSmall)}
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
                                    handleAddMeterButtonClick={() => setIsCreateMeterModalVisible(true)}
                                    isLoading={loading}
                                />
                            </Col>
                            <CreateMeterModal />
                            <UpdateMeterModal />
                        </Row>
                    </Col>
                </>
            )}
        </FormWithAction>
    )
}