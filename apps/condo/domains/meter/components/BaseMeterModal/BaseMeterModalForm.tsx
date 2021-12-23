import { Col, Input, Row, Select } from 'antd'
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'
import { useIntl } from '@core/next/intl'
import dayjs, { Dayjs } from 'dayjs'
import { MeterResource } from '@app/condo/schema'
import get from 'lodash/get'
import { Gutter } from 'antd/es/grid/row'

import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { ShowMoreFieldsButton } from '@condo/domains/common/components/ShowMoreFieldsButton'

import { useMeterValidations } from '../../hooks/useMeterValidations'
import { METER_MODAL_FORM_ITEM_SPAN } from '../../constants/constants'
import { MeterModalDatePicker } from './BaseMeterModalDatePicker'
import { BaseMeterModalAccountNumberField } from './BaseMeterModalAccountNumberField'
import { ELECTRICITY_METER_RESOURCE_ID } from '../../constants/constants'
import { searchMeterResources } from '../../utils/clientSchema/search'
import { BaseMeterModalFormItem } from './BaseMeterModalFormItem'

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
}

const BASE_MODAL_PROPS = { width: 600 }
const SUBMIT_BUTTON_PROPS = { type: 'sberDefaultGradient' }
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

export const BaseMeterModalForm: React.FC<BaseMeterModalFormProps> = ({ handleSubmit, initialValues, ModalSaveButtonLabelMsg, ModalTitleMsg, ...otherProps }) => {
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

    const { requiredValidator } = useValidations()
    const {
        meterWithSameNumberValidator,
        earlierThanInstallationValidator,
        earlierThanFirstVerificationDateValidator,
    } = useMeterValidations(installationDate, verificationDate)

    const initialMeterNumber = get(initialValues, ['number'])
    const meterNumberValidations = useMemo(() =>
        initialMeterNumber ? [requiredValidator] : [requiredValidator, meterWithSameNumberValidator],
    [initialMeterNumber, meterWithSameNumberValidator, requiredValidator])

    const validations = useMemo(() => ({
        number: meterNumberValidations,
        resource: [requiredValidator],
        numberOfTariffs: [requiredValidator],
        commissioningDate: [earlierThanInstallationValidator],
        sealingDate: [earlierThanInstallationValidator],
        nextVerificationDate: [earlierThanFirstVerificationDateValidator],
        controlReadingsDate: [earlierThanInstallationValidator],
    }),
    [earlierThanFirstVerificationDateValidator, earlierThanInstallationValidator, meterNumberValidations, requiredValidator])

    const initialResourceValue = get(initialValues, ['resource', 'id'])
    const handleCancelModal = useCallback(() => () => setModalVisible(false), [])
    const handleInstallationDateChange = useCallback(value => setInstallationDate(value), [])
    const handleResourceChange = useCallback((form, resource) => {
        setIsTariffsCountHidden(resource !== ELECTRICITY_METER_RESOURCE_ID)
        form.setFieldsValue({ numberOfTariffs: null })
    }, [])

    const tariffOptions = useMemo(() => getTariffNumberSelectOptions(), [])

    return (
        <BaseModalForm
            visible={isModalVisible}
            cancelModal={handleCancelModal}
            ModalTitleMsg={ModalTitleMsg}
            ModalSaveButtonLabelMsg={ModalSaveButtonLabelMsg}
            showCancelButton={false}
            validateTrigger={METER_MODAL_VALIDATE_TRIGGER}
            handleSubmit={handleSubmit}
            modalProps={BASE_MODAL_PROPS}
            submitButtonProps={SUBMIT_BUTTON_PROPS}
            {...otherProps}
        >
            {
                (form) => (
                    <Row gutter={METER_MODAL_ROW_GUTTERS}>
                        <Col span={24}>
                            <Row justify={'space-between'} gutter={METER_MODAL_ROW_GUTTERS}>
                                <Col span={24}>
                                    <BaseMeterModalAccountNumberField
                                        initialValues={initialValues}
                                    />
                                </Col>
                                <Col span={24}>
                                    <BaseMeterModalFormItem
                                        label={ResourceMessage}
                                        name={'resource'}
                                        rules={validations.resource}
                                        initialValue={initialResourceValue}
                                    >
                                        <GraphQlSearchInput
                                            onChange={resource => handleResourceChange(form, resource)}
                                            search={searchMeterResources}
                                        />
                                    </BaseMeterModalFormItem>
                                </Col>
                                <Col span={METER_MODAL_FORM_ITEM_SPAN}>
                                    <BaseMeterModalFormItem
                                        label={MeterNumberMessage}
                                        name='number'
                                        rules={validations.number}
                                        validateTrigger={METER_MODAL_VALIDATE_TRIGGER}
                                        initialValue={initialValues.number}
                                    >
                                        <Input />
                                    </BaseMeterModalFormItem>
                                </Col>
                                <Col span={METER_MODAL_FORM_ITEM_SPAN}>
                                    <BaseMeterModalFormItem
                                        label={MeterPlaceMessage}
                                        name='place'
                                        initialValue={initialValues.place}
                                    >
                                        <Input />
                                    </BaseMeterModalFormItem>
                                </Col>
                                {
                                    !isTariffsCountHidden ? (
                                        <Col span={24}>
                                            <BaseMeterModalFormItem
                                                rules={validations.numberOfTariffs}
                                                label={TariffsCountMessage}
                                                name='numberOfTariffs'
                                                initialValue={initialValues.numberOfTariffs}
                                            >
                                                <Select>
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
                                            />
                                            <MeterModalDatePicker
                                                label={CommissioningDateMessage}
                                                name='commissioningDate'
                                                rules={validations.commissioningDate}
                                                dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                                initialValue={initialValues.commissioningDate}
                                            />
                                            <MeterModalDatePicker
                                                label={SealingDateMessage}
                                                name='sealingDate'
                                                rules={validations.sealingDate}
                                                dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                                initialValue={initialValues.sealingDate}
                                            />
                                            <MeterModalDatePicker
                                                label={VerificationDateMessage}
                                                name='verificationDate'
                                                onChange={value => setVerificationDate(value)}
                                                initialValue={initialValues.verificationDate}
                                            />
                                            <MeterModalDatePicker
                                                label={NextVerificationDateMessage}
                                                name='nextVerificationDate'
                                                rules={validations.nextVerificationDate}
                                                dependencies={NEXT_VERIFICATION_DATE_FIELD_DEPENDENCIES}
                                                initialValue={initialValues.nextVerificationDate}
                                            />
                                            <MeterModalDatePicker
                                                label={ControlReadingsDateMessage}
                                                name='controlReadingsDate'
                                                rules={validations.controlReadingsDate}
                                                dependencies={DATE_FIELD_INSTALLATION_DATE_DEPENDENCY}
                                                initialValue={initialValues.controlReadingsDate}
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
    )
}