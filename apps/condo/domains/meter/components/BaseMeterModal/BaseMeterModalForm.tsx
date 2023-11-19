import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import Input from '@condo/domains/common/components/antd/Input'
import Select from '@condo/domains/common/components/antd/Select'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { ShowMoreFieldsButton } from '@condo/domains/common/components/ShowMoreFieldsButton'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { METER_MODAL_FORM_ITEM_SPAN } from '@condo/domains/meter/constants/constants'
import { ELECTRICITY_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'
import {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
} from '@condo/domains/meter/constants/errors'
import { useMeterValidations } from '@condo/domains/meter/hooks/useMeterValidations'
import { METER_PAGE_TYPES, MeterPageTypes } from '@condo/domains/meter/utils/clientSchema'
import { searchMeterResources } from '@condo/domains/meter/utils/clientSchema/search'

import { BaseMeterModalAccountNumberField } from './BaseMeterModalAccountNumberField'
import { MeterModalDatePicker } from './BaseMeterModalDatePicker'
import { BaseMeterModalFormItem } from './BaseMeterModalFormItem'

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

type BaseMeterModalFormProps = ComponentProps<typeof BaseModalForm> & {
    handleSubmit: (values: unknown) => void,
    initialValues: InitialMeterFormValuesType,
    ModalTitleMsg: JSX.Element | string,
    ModalSaveButtonLabelMsg: JSX.Element | string
    modalNotification?: JSX.Element | string
    disabled?: boolean
    organizationId: string
    meterType: MeterPageTypes
}

const METER_MODAL_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
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

const getInitialDateValue = (initialValues, path) => {
    const stringInitialValue = get(initialValues, path)
    const dayjsInitialValue = dayjs(stringInitialValue)

    return stringInitialValue && dayjsInitialValue.isValid() ? dayjsInitialValue : null
}

export const BaseMeterModalForm: React.FC<BaseMeterModalFormProps> = ({
    propertyId,
    addressKey,
    unitName,
    handleSubmit,
    initialValues,
    ModalSaveButtonLabelMsg,
    ModalTitleMsg,
    organizationId,
    disabled,
    meterType,
    ...otherProps
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
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameNumberIsExist' })
    const AccountNumberIsExistInOtherUnitMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumberIsExistInOtherUnit' })
    const ControlReadingsDateMessage = intl.formatMessage({ id: 'pages.condo.meter.ControlReadingsDate' })
    const ResourceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })

    const isPropertyMeter = meterType === METER_PAGE_TYPES.propertyMeter
    const meterResourceId = get(initialValues, ['resource', 'id'])
    const initialInstallationDate = useCallback(() => getInitialDateValue(initialValues, ['installationDate']),
        [initialValues])
    const initialVerificationDate = useCallback(() => getInitialDateValue(initialValues, ['verificationDate']),
        [initialValues])

    const [isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed] = useState<boolean>(true)
    const [isModalVisible, setModalVisible] = useState<boolean>(false)
    const [isTariffsCountHidden, setIsTariffsCountHidden] = useState<boolean>(meterResourceId !== ELECTRICITY_METER_RESOURCE_ID)
    const [installationDate, setInstallationDate] = useState<Dayjs>(initialInstallationDate)
    const [verificationDate, setVerificationDate] = useState<Dayjs>(initialVerificationDate)

    const initialMeterNumber = get<InitialMeterFormValuesType['number']>(initialValues, ['number'], null)

    const { link } = useOrganization()
    const canManageMeters = get(link, 'role.canManageMeters', false)

    const disabledFields = useMemo(() => disabled || !canManageMeters, [canManageMeters, disabled])

    const { requiredValidator, trimValidator } = useValidations()
    const {
        meterWithSameNumberValidator,
        earlierThanInstallationValidator,
        earlierThanFirstVerificationDateValidator,
        meterWithSameAccountNumberInOtherUnitValidation,
        meterResourceOwnerValidation,
    } = useMeterValidations(installationDate, verificationDate, propertyId, unitName, organizationId, initialMeterNumber, addressKey)

    const meterNumberValidations = useMemo(() => [
        requiredValidator,
        trimValidator,
        meterWithSameNumberValidator,
    ], [requiredValidator, trimValidator, meterWithSameNumberValidator])

    const validations = useMemo(() => ({
        accountNumber: isPropertyMeter ? undefined : [requiredValidator, trimValidator, meterWithSameAccountNumberInOtherUnitValidation],
        number: meterNumberValidations,
        resource: [requiredValidator, meterResourceOwnerValidation],
        numberOfTariffs: [requiredValidator],
        commissioningDate: [earlierThanInstallationValidator],
        sealingDate: [earlierThanInstallationValidator],
        nextVerificationDate: [earlierThanFirstVerificationDateValidator],
        controlReadingsDate: [earlierThanInstallationValidator],
    }),
    [isPropertyMeter, earlierThanFirstVerificationDateValidator, earlierThanInstallationValidator, meterNumberValidations, meterWithSameAccountNumberInOtherUnitValidation, requiredValidator, trimValidator, meterResourceOwnerValidation])

    const initialResourceValue = get(initialValues, ['resource', 'id'])
    const handleCancelModal = useCallback(() => () => setModalVisible(false), [])
    const handleInstallationDateChange = useCallback(value => setInstallationDate(value), [])
    const handleResourceChange = useCallback((form, resource) => {
        setIsTariffsCountHidden(resource !== ELECTRICITY_METER_RESOURCE_ID)
        form.setFieldsValue({ numberOfTariffs: null })
    }, [])

    const tariffOptions = useMemo(() => getTariffNumberSelectOptions(), [])

    const ErrorToFormFieldMsgMapping = {
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: {
            name: 'number',
            errors: [MeterWithSameNumberIsExistMessage],
        },
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: {
            name: 'accountNumber',
            errors: [AccountNumberIsExistInOtherUnitMessage],
        },
    }

    return (
        <>
            <BaseModalForm
                visible={isModalVisible}
                cancelModal={handleCancelModal}
                ModalTitleMsg={ModalTitleMsg}
                ModalSaveButtonLabelMsg={ModalSaveButtonLabelMsg}
                showCancelButton={false}
                validateTrigger={METER_MODAL_VALIDATE_TRIGGER}
                handleSubmit={handleSubmit}
                submitButtonProps={{
                    disabled: disabledFields,
                }}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                {...otherProps}
            >
                {
                    ({ form }) => (
                        <Row gutter={METER_MODAL_ROW_GUTTERS}>
                            <Col span={24}>
                                <Row justify='space-between' gutter={METER_MODAL_ROW_GUTTERS}>
                                    {!isPropertyMeter && (
                                        <Col span={24}>
                                            <BaseMeterModalAccountNumberField
                                                initialValues={initialValues}
                                                rules={validations.accountNumber}
                                                disabled={disabledFields}
                                                validateFirst
                                            />
                                        </Col>
                                    )}
                                    <Col span={24}>
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
                                            initialValue={initialValues.number}
                                            validateFirst
                                        >
                                            <Input disabled={disabledFields}/>
                                        </BaseMeterModalFormItem>
                                    </Col>
                                    {!isPropertyMeter && <Col span={METER_MODAL_FORM_ITEM_SPAN}>
                                        <BaseMeterModalFormItem
                                            label={MeterPlaceMessage}
                                            name='place'
                                            initialValue={initialValues.place}
                                        >
                                            <Input disabled={disabledFields}/>
                                        </BaseMeterModalFormItem>
                                    </Col>}
                                    {
                                        !isTariffsCountHidden ? (
                                            <Col span={24}>
                                                <BaseMeterModalFormItem
                                                    rules={validations.numberOfTariffs}
                                                    label={TariffsCountMessage}
                                                    name='numberOfTariffs'
                                                    initialValue={initialValues.numberOfTariffs}
                                                    validateFirst
                                                >
                                                    <Select disabled={disabledFields}>
                                                        {tariffOptions}
                                                    </Select>
                                                </BaseMeterModalFormItem>
                                            </Col>
                                        ) : null
                                    }
                                    {
                                        !isAdditionalFieldsCollapsed ? (
                                            <>
                                                <MeterModalDatePicker
                                                    label={InstallationDateMessage}
                                                    name='installationDate'
                                                    onChange={handleInstallationDateChange}
                                                    initialValue={initialValues.installationDate}
                                                    disabled={disabledFields}
                                                />
                                                <MeterModalDatePicker
                                                    label={CommissioningDateMessage}
                                                    name='commissioningDate'
                                                    rules={validations.commissioningDate}
                                                    dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                                    initialValue={initialValues.commissioningDate}
                                                    disabled={disabledFields}
                                                    validateFirst
                                                />
                                                <MeterModalDatePicker
                                                    label={SealingDateMessage}
                                                    name='sealingDate'
                                                    rules={validations.sealingDate}
                                                    dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                                    initialValue={initialValues.sealingDate}
                                                    disabled={disabledFields}
                                                    validateFirst
                                                />
                                                <MeterModalDatePicker
                                                    label={VerificationDateMessage}
                                                    name='verificationDate'
                                                    onChange={value => setVerificationDate(value)}
                                                    initialValue={initialValues.verificationDate}
                                                    disabled={disabledFields}
                                                />
                                                <MeterModalDatePicker
                                                    label={NextVerificationDateMessage}
                                                    name='nextVerificationDate'
                                                    rules={validations.nextVerificationDate}
                                                    dependencies={NEXT_VERIFICATION_DATE_FIELD_DEPENDENCIES}
                                                    initialValue={initialValues.nextVerificationDate}
                                                    disabled={disabledFields}
                                                    validateFirst
                                                />
                                                <MeterModalDatePicker
                                                    label={ControlReadingsDateMessage}
                                                    name='controlReadingsDate'
                                                    rules={validations.controlReadingsDate}
                                                    dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                                    initialValue={initialValues.controlReadingsDate}
                                                    disabled={disabledFields}
                                                    validateFirst
                                                />
                                            </>
                                        ) : null
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
            </BaseModalForm>
        </>
    )
}
