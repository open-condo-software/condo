import { Button, Col, DatePickerProps, Form, Input, Row, Select, Space, Typography } from 'antd'
import React, { useState } from 'react'
import { useIntl } from '@core/next/intl'
import { ChevronIcon } from '@condo/domains/common/components/icons/ChevronIcon'
import { ELECTRICITY_METER_RESOURCE_ID } from '../../constants/constants'
import styled from '@emotion/styled'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { Rule } from 'rc-field-form/lib/interface'
import { useOrganization } from '@core/next/organization'
import { Meter } from '../../utils/clientSchema'
import { BaseModalForm } from '../../../common/components/containers/FormList'
import { GraphQlSearchInput } from '../../../common/components/GraphQlSearchInput'
import { searchMeterResources } from '../../utils/clientSchema/search'
import { Dayjs } from 'dayjs'

const { Option } = Select

const METER_INFO_INPUT_COL_SPAN = 11
const TARIFFS_NUMBER = 4

const getTariffNumberSelectOptions = () => {
    return Array.from({ length: TARIFFS_NUMBER }, (_, i) => i + 1)
        .map(number => (
            <Option key={number} value={number}>
                {number}
            </Option>
        ))
}

interface ICreateMeterModalDatePickerProps {
    label: string,
    name: string,
    rules?: Rule[],
    dependencies?: string[]
    onChange?: (value: Dayjs, dateString: string) => void
}

const CreateMeterModalDatePicker = ({ label, name, rules, dependencies, onChange }: ICreateMeterModalDatePickerProps) => {
    const intl = useIntl()
    const EnterDatePlaceHolder = intl.formatMessage({ id: 'EnterDate' })

    return (
        <Col span={METER_INFO_INPUT_COL_SPAN}>
            <Form.Item
                label={label}
                name={name}
                rules={rules}
                validateTrigger={['onBlur', 'onSubmit']}
                dependencies={dependencies}
            >
                <DatePicker
                    placeholder={EnterDatePlaceHolder}
                    format='DD.MM.YYYY'
                    style={{ width: '100%' }}
                    onChange={onChange}
                />
            </Form.Item>
        </Col>
    )
}

type ChevronIconWrapperProps = {
    direction: 'down' | 'up',
}

const ChevronIconWrapper = styled.div<ChevronIconWrapperProps>`
    transform: rotate(${props => props.direction === 'down' ? 0 : 180}deg);
    display: flex;
`

export const BaseMeterModalForm = ({ handleSubmit, ModalTitleMsg, ModalSaveButtonLabelMsg, ...otherProps }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const MeterPlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterPlace' })
    const MoreParametersMessage = intl.formatMessage({ id: 'MoreParameters' })
    const LessParametersMessage = intl.formatMessage({ id: 'LessParameters' })
    const TariffsCountMessage = intl.formatMessage({ id: 'pages.condo.meter.TariffsNumber' })
    const InstallationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.InstallationDate' })
    const CommissioningDateMessage = intl.formatMessage({ id: 'pages.condo.meter.CommissioningDate' })
    const SealingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.SealingDate' })
    const VerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const NextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.NextVerificationDate' })
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameNumberIsExist' })
    const ControlReadingsDateMessage = intl.formatMessage({ id: 'pages.condo.meter.ControlReadingsDate' })
    const CanNotBeEarlierThanInstallationMessage = intl.formatMessage({ id: 'pages.condo.meter.СanNotBeEarlierThanInstallation' })
    const CanNotBeEarlierThanFirstVerificationMessage = intl.formatMessage({ id: 'pages.condo.meter.CanNotBeEarlierThanFirstVerification' })
    const ResourceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })

    const { organization } = useOrganization()
    const { objs: metersWithSameNumber, refetch } = Meter.useObjects({
        where: {
            organization: null,
        },
    })

    const [isModalVisible, setModalVisible] = useState<boolean>(false)
    const [isTariffsContHidden, setIsTariffsCountHidden] = useState<boolean>(true)
    const [isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed] = useState<boolean>(true)
    const [installationDate, setInstallationDate] = useState<Dayjs>()
    const [verificationDate, setVerificationDate] = useState<Dayjs>()

    const earlierThanInstallationValidator: Rule = {
        validator: async (_, value) => {
            if (!value || !installationDate)
                return Promise.resolve()

            if (value.toDate() < installationDate.toDate()) {
                return Promise.reject(CanNotBeEarlierThanInstallationMessage)
            }

            return Promise.resolve()
        },
    }

    const earlierThanFirstVerificationDateValidator: Rule = {
        validator: async (_, value) => {
            if (!value || !verificationDate)
                return Promise.resolve()

            if (value.toDate() < installationDate.toDate()) {
                return Promise.reject(CanNotBeEarlierThanFirstVerificationMessage)
            }

            return Promise.resolve()
        },
    }

    const meterWithSameNumberValidator: Rule = {
        validator: async (_, value) => {
            await refetch({
                where: {
                    organization: { id: organization && organization.id },
                    number: value,
                },
            })

            if (metersWithSameNumber.length > 0)
                return Promise.reject(MeterWithSameNumberIsExistMessage)

            return Promise.resolve()
        },
    }

    const { requiredValidator } = useValidations()

    const validations = {
        number: [requiredValidator, meterWithSameNumberValidator],
        numberOfTariffs: [requiredValidator],
        commissioningDate: [earlierThanInstallationValidator],
        sealingDate: [earlierThanInstallationValidator],
        verificationDate: [earlierThanInstallationValidator],
        nextVerificationDate: [earlierThanInstallationValidator, earlierThanFirstVerificationDateValidator],
        controlReadingsDate: [earlierThanInstallationValidator],
    }

    return (
        <BaseModalForm
            visible={isModalVisible}
            cancelModal={() => setModalVisible(false)}
            ModalTitleMsg={ModalTitleMsg}
            ModalSaveButtonLabelMsg={ModalSaveButtonLabelMsg}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
            handleSubmit={handleSubmit}
            {...otherProps}
        >
            {
                (form) => (
                    <Row gutter={[0, 20]}>
                        <Col span={24}>
                            <Row justify={'space-between'} gutter={[0, 20]}>
                                <Col span={24}>
                                    <Form.Item label={AccountNumberMessage} required name={'accountNumber'}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={ResourceMessage}
                                        name={'resource'}
                                    >
                                        <GraphQlSearchInput
                                            onChange={resource => {
                                                setIsTariffsCountHidden(resource !== ELECTRICITY_METER_RESOURCE_ID)
                                                form.setFieldsValue({ numberOfTariffs: null })
                                            }}
                                            search={searchMeterResources}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={METER_INFO_INPUT_COL_SPAN}>
                                    <Form.Item
                                        label={MeterNumberMessage}
                                        name='number'
                                        rules={validations.number}
                                        validateTrigger={['onBlur', 'onSubmit']}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={METER_INFO_INPUT_COL_SPAN}>
                                    <Form.Item
                                        label={MeterPlaceMessage}
                                        name='place'
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                {
                                    !isTariffsContHidden ? (
                                        <Col span={24}>
                                            <Form.Item
                                                rules={validations.numberOfTariffs}
                                                label={TariffsCountMessage}
                                                name='numberOfTariffs'
                                            >
                                                <Select>
                                                    {getTariffNumberSelectOptions()}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    ) : null
                                }
                                {
                                    !isAdditionalFieldsCollapsed ? (
                                        <>
                                            <CreateMeterModalDatePicker
                                                label={InstallationDateMessage}
                                                name='installationDate'
                                                onChange={value => setInstallationDate(value)}
                                            />
                                            <CreateMeterModalDatePicker
                                                label={CommissioningDateMessage}
                                                name='commissioningDate'
                                                rules={validations.commissioningDate}
                                                dependencies={['installationDate']}
                                            />
                                            <CreateMeterModalDatePicker
                                                label={SealingDateMessage}
                                                name='sealingDate'
                                                rules={validations.sealingDate}
                                                dependencies={['installationDate']}
                                            />
                                            <CreateMeterModalDatePicker
                                                label={VerificationDateMessage}
                                                name='verificationDate'
                                                rules={validations.verificationDate}
                                                dependencies={['installationDate']}
                                                onChange={value => setVerificationDate(value)}
                                            />
                                            <CreateMeterModalDatePicker
                                                label={NextVerificationDateMessage}
                                                name='nextVerificationDate'
                                                rules={validations.nextVerificationDate}
                                                dependencies={['installationDate', 'verificationDate']}
                                            />
                                            <CreateMeterModalDatePicker
                                                label={ControlReadingsDateMessage}
                                                name='controlReadingsDate'
                                                rules={validations.controlReadingsDate}
                                                dependencies={['installationDate']}
                                            />
                                        </>
                                    ) : null
                                }
                            </Row>
                        </Col>
                        <Col>
                            <Button
                                type="text"
                                onClick={() => { setIsAdditionalFieldsCollapsed(prevState => !prevState) }}
                                style={{
                                    padding: 0,
                                }}
                            >
                                <Typography.Text type={'success'} strong>
                                    <Space direction={'horizontal'} align={'center'}>
                                        {isAdditionalFieldsCollapsed ? MoreParametersMessage : LessParametersMessage}
                                        <ChevronIconWrapper direction={isAdditionalFieldsCollapsed ? 'down' : 'up'}>
                                            <ChevronIcon />
                                        </ChevronIconWrapper>
                                    </Space>
                                </Typography.Text>
                            </Button>
                        </Col>
                    </Row>
                )
            }
        </BaseModalForm>
    )
}