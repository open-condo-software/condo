import { Col, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import { ComponentProps, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Typography } from '@open-condo/ui'

import Select from '@condo/domains/common/components/antd/Select'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { ShowMoreFieldsButton } from '@condo/domains/common/components/ShowMoreFieldsButton'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { BaseMeterModalAccountNumberField } from '@condo/domains/meter/components/BaseMeterModal/BaseMeterModalAccountNumberField'
import { MeterModalDatePicker } from '@condo/domains/meter/components/BaseMeterModal/BaseMeterModalDatePicker'
import { BaseMeterModalFormItem } from '@condo/domains/meter/components/BaseMeterModal/BaseMeterModalFormItem'
import { ELECTRICITY_METER_RESOURCE_ID, METER_MODAL_FORM_ITEM_SPAN } from '@condo/domains/meter/constants/constants'
import { useMeterValidations } from '@condo/domains/meter/hooks/useMeterValidations'
import { MeterPageTypes, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { searchMeterResources } from '@condo/domains/meter/utils/clientSchema/search'


import type { MeterResource } from '@app/condo/schema'

type InitialMeterFormValuesType = {
    propertyId?: string
    unitName?: string
    accountNumber?: string
    number?: string
    resource?: MeterResource
    place?: string
    numberOfTariffs?: number
    installationDate?: string
    commissioningDate?: string
    sealingDate?: string
    verificationDate?: string
    nextVerificationDate?: string
    controlReadingsDate?: string
}

type BaseMetersFormFieldsProps = {
    handleSubmit: (values: unknown) => void,
    form: FormInstance,
    organizationId: string
    meterType: MeterPageTypes
    propertyId: string,
    addressKey: string,
    disabledFields: boolean
    initialValues?: InitialMeterFormValuesType,
    submitButtonProps?: ComponentProps<typeof Button>
    disabled?: boolean
}

const METER_MODAL_ROW_GUTTERS: [Gutter, Gutter] = [0, 20]
const DATE_FIELD_INSTALLATION_DATE_DEPENDENCY = ['installationDate']
const NEXT_VERIFICATION_DATE_FIELD_DEPENDENCIES = ['installationDate', 'verificationDate']
const { Option } = Select
const TARIFFS_NUMBER = 4

const getTariffNumberSelectOptions = () => {
    return Array.from({ length: TARIFFS_NUMBER }, (_, i) => i + 1)
        .map(number => (
            <Option key={number} value={number}>
                {number}
            </Option>
        ))
}

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

const getInitialDateValue = (initialValues, path) => {
    const stringInitialValue = get(initialValues, path)
    const dayjsInitialValue = dayjs(stringInitialValue)

    return stringInitialValue && dayjsInitialValue.isValid() ? dayjsInitialValue : null
}

export const BaseMetersFormFields: React.FC<BaseMetersFormFieldsProps> = ({ 
    form,
    meterType,
    addressKey,
    initialValues,
    propertyId,
    organizationId,
    disabledFields,
}) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const MeterPlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterPlace' })
    const TariffsCountMessage = intl.formatMessage({ id: 'pages.condo.meter.TariffsNumber' })
    const InstallationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.InstallationDate' })
    const CommissioningDateMessage = intl.formatMessage({ id: 'pages.condo.meter.CommissioningDate' })
    const SealingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.SealingDate' })
    const VerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const NextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.NextVerificationDate' })
    const ControlReadingsDateMessage = intl.formatMessage({ id: 'pages.condo.meter.ControlReadingsDate' })
    const ResourceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
    const DeviceInfoMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterInfo' })

    const isPropertyMeter = meterType === METER_TAB_TYPES.propertyMeter
    const meterResourceId = get(initialValues, ['resource', 'id'])
    const initialInstallationDate = useCallback(() => getInitialDateValue(initialValues, ['installationDate']),
        [initialValues])
    const initialVerificationDate = useCallback(() => getInitialDateValue(initialValues, ['verificationDate']),
        [initialValues])

    const [isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed] = useState<boolean>(true)
    const [isTariffsCountHidden, setIsTariffsCountHidden] = useState<boolean>(meterResourceId !== ELECTRICITY_METER_RESOURCE_ID)
    const [installationDate, setInstallationDate] = useState<Dayjs>(initialInstallationDate)
    const [verificationDate, setVerificationDate] = useState<Dayjs>(initialVerificationDate)

    const initialMeterNumber = get(initialValues, ['number'], null)
    const initialAccountNumber = get(initialValues, ['accountNumber'], null)
    const initialUnitName = get(initialValues, ['unitName'], null)

    const { requiredValidator, trimValidator } = useValidations()
    const {
        meterWithSameNumberValidator,
        earlierThanInstallationValidator,
        earlierThanFirstVerificationDateValidator,
        meterWithSameAccountNumberInOtherUnitValidation,
        meterResourceOwnerValidation,
    } = useMeterValidations(installationDate, verificationDate, propertyId, initialUnitName, organizationId, initialMeterNumber, addressKey)

    const meterNumberValidations = useMemo(() => [
        requiredValidator,
        trimValidator,
        meterWithSameNumberValidator,
    ], [requiredValidator, trimValidator, meterWithSameNumberValidator])

    const validations = useMemo(() => ({
        accountNumber: isPropertyMeter ? undefined : [requiredValidator, trimValidator, !initialAccountNumber && meterWithSameAccountNumberInOtherUnitValidation],
        number: meterNumberValidations,
        resource: [requiredValidator, meterResourceOwnerValidation],
        numberOfTariffs: [requiredValidator],
        commissioningDate: [earlierThanInstallationValidator],
        sealingDate: [earlierThanInstallationValidator],
        nextVerificationDate: [earlierThanFirstVerificationDateValidator],
        controlReadingsDate: [earlierThanInstallationValidator],
    }),
    [isPropertyMeter, requiredValidator, trimValidator, initialAccountNumber, meterWithSameAccountNumberInOtherUnitValidation, meterNumberValidations, meterResourceOwnerValidation, earlierThanInstallationValidator, earlierThanFirstVerificationDateValidator])

    const initialResourceValue = get(initialValues, ['resource', 'id'])
    const handleInstallationDateChange = useCallback(value => setInstallationDate(value), [])
    const handleResourceChange = useCallback((form, resource) => {
        setIsTariffsCountHidden(resource !== ELECTRICITY_METER_RESOURCE_ID)
        form.setFieldsValue({ numberOfTariffs: null })
    }, [])

    const tariffOptions = useMemo(() => getTariffNumberSelectOptions(), [])

    return (
        <Row gutter={METER_MODAL_ROW_GUTTERS}>
            <Col span={24}>
                <Row justify='space-between' gutter={METER_MODAL_ROW_GUTTERS}>
                    <Col span={24}>
                        <Typography.Title level={3}>
                            {DeviceInfoMessage}
                        </Typography.Title>
                    </Col>
                    {!isPropertyMeter && (
                        <Col span={METER_MODAL_FORM_ITEM_SPAN}>
                            <BaseMeterModalAccountNumberField
                                initialValues={initialValues}
                                rules={validations.accountNumber}
                                disabled={disabledFields}
                                validateFirst
                            />
                        </Col>
                    )}
                    <Col span={METER_MODAL_FORM_ITEM_SPAN}>
                        <BaseMeterModalFormItem
                            label={ResourceMessage}
                            name='resource'
                            rules={validations.resource}
                            initialValue={initialResourceValue}
                            validateFirst
                        >
                            <GraphQlSearchInput
                                onChange={resource => handleResourceChange(form, resource)}
                                search={searchMeterResources}
                                disabled={disabledFields}
                            />
                        </BaseMeterModalFormItem>
                    </Col>
                    <Col span={METER_MODAL_FORM_ITEM_SPAN}>
                        <BaseMeterModalFormItem
                            label={MeterNumberMessage}
                            name='number'
                            rules={validations.number}
                            initialValue={get(initialValues, 'number')}
                            validateFirst
                        >
                            <Input disabled={disabledFields}/>
                        </BaseMeterModalFormItem>
                    </Col>
                    {!isPropertyMeter && <Col span={METER_MODAL_FORM_ITEM_SPAN}>
                        <BaseMeterModalFormItem
                            label={MeterPlaceMessage}
                            name='place'
                            initialValue={get(initialValues, 'place')}
                        >
                            <Input disabled={disabledFields}/>
                        </BaseMeterModalFormItem>
                    </Col>}
                    {
                        !isTariffsCountHidden && (
                            <Col span={24}>
                                <BaseMeterModalFormItem
                                    rules={validations.numberOfTariffs}
                                    label={TariffsCountMessage}
                                    name='numberOfTariffs'
                                    initialValue={get(initialValues, 'numberOfTariffs')}
                                    validateFirst
                                >
                                    <Select disabled={disabledFields}>
                                        {tariffOptions}
                                    </Select>
                                </BaseMeterModalFormItem>
                            </Col>
                        ) 
                    }
                    {
                        !isAdditionalFieldsCollapsed && (
                            <>
                                <MeterModalDatePicker
                                    label={InstallationDateMessage}
                                    name='installationDate'
                                    onChange={handleInstallationDateChange}
                                    initialValue={get(initialValues, 'installationDate')}
                                    disabled={disabledFields}
                                />
                                <MeterModalDatePicker
                                    label={CommissioningDateMessage}
                                    name='commissioningDate'
                                    rules={validations.commissioningDate}
                                    dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                    initialValue={get(initialValues, 'commissioningDate')}
                                    disabled={disabledFields}
                                    validateFirst
                                />
                                <MeterModalDatePicker
                                    label={SealingDateMessage}
                                    name='sealingDate'
                                    rules={validations.sealingDate}
                                    dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                    initialValue={get(initialValues, 'sealingDate')}
                                    disabled={disabledFields}
                                    validateFirst
                                />
                                <MeterModalDatePicker
                                    label={VerificationDateMessage}
                                    name='verificationDate'
                                    onChange={value => setVerificationDate(value)}
                                    initialValue={get(initialValues, 'verificationDate')}
                                    disabled={disabledFields}
                                />
                                <MeterModalDatePicker
                                    label={NextVerificationDateMessage}
                                    name='nextVerificationDate'
                                    rules={validations.nextVerificationDate}
                                    dependencies={NEXT_VERIFICATION_DATE_FIELD_DEPENDENCIES}
                                    initialValue={get(initialValues, 'nextVerificationDate')}
                                    disabled={disabledFields}
                                    validateFirst
                                />
                                <MeterModalDatePicker
                                    label={ControlReadingsDateMessage}
                                    name='controlReadingsDate'
                                    rules={validations.controlReadingsDate}
                                    dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                    initialValue={get(initialValues, 'controlReadingsDate')}
                                    disabled={disabledFields}
                                    validateFirst
                                />
                            </>
                        )
                    }
                </Row>
            </Col>
            <Col>
                <ShowMoreFieldsButton
                    isAdditionalFieldsCollapsed={isAdditionalFieldsCollapsed}
                    setIsAdditionalFieldsCollapsed={setIsAdditionalFieldsCollapsed}
                />
            </Col>
        </Row>
    )
}