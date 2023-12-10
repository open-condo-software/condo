import { AcquiringIntegrationContext, BankAccount } from '@app/condo/schema'
import { AutoComplete, Col, Form, Input, Row, RowProps } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Radio, RadioGroup, Select, SelectProps, Space } from '@open-condo/ui'

import { VAT_OPTIONS, TAX_REGIME_GENEGAL, TAX_REGIME_SIMPLE, CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/acquiring/constants/context'
import { useAcquiringIntegrationContext } from '@condo/domains/acquiring/hooks/useAcquiringIntegrationContext'
import { AcquiringIntegrationContext as AcquiringIntegrationContextApi } from '@condo/domains/acquiring/utils/clientSchema'
import { BankAccount as BankAccountApi } from '@condo/domains/banking/utils/clientSchema'
import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { useBankAccountValidation } from '@condo/domains/common/utils/clientSchema/bankAccountValidationUtils'
import {
    ERROR_BANK_NOT_FOUND,
    ERROR_ORGANIZATION_NOT_FOUND,
} from '@condo/domains/marketplace/constants'

const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const LABEL_COL = { lg: 10 }

const TAX_PERCENT_OPTIONS: SelectProps['options'] = VAT_OPTIONS.map((option: number) => ({
    label: `${option} %`,
    key: `vat_percent_${option}`,
    value: String(option),
}))

const getOptions = (items: BankAccount[], fieldName: string): SelectProps['options'] => (items.map((item) => {
    const field = get(item, fieldName, null)
    return { label: field, value: field }
}))

export const RequisitesSetup: React.FC = () => {
    const intl = useIntl()
    const { numberValidator, routingNumberValidator } = useBankAccountValidation({ country: RUSSIA_COUNTRY })
    const { requiredValidator } = useValidations()

    const AccountLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.field.account' })
    const TINLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.field.tin' })
    const BICLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.field.bic' })
    const TaxTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.field.tax' })
    const TaxPercentLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.field.taxPercent' })
    const NextButtonLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.button.next' })
    const TaxTypeCommonLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.radio.tax.common' })
    const TaxTypeSimpleLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.radio.tax.simple' })
    const NoTax = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.noTax' })
    const RecipientErrorTitle = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.error' })

    const [error, setError] = useState<string | null>(null)
    const [loading, setIsLoading] = useState<boolean>(false)
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const [form] = Form.useForm()
    const router = useRouter()

    const {
        acquiringIntegration: acquiring,
        acquiringIntegrationContext: acquiringContext,
        loading: acquiringContextLoading,
        error: acquiringContextError,
    } = useAcquiringIntegrationContext()

    const { objs: bankAccounts } = BankAccountApi.useObjects({
        where: {
            organization: { id: orgId },
        },
    })

    const [submittable, setSubmittable] = React.useState(false)
    const values = Form.useWatch([], form)
    useEffect(() => {
        form.validateFields({ validateOnly: true }).then(
            () => setSubmittable(true),
            () => setSubmittable(false),
        )
    }, [form, values])

    const acquiringId = get(acquiring, 'id', null)

    const createAction = AcquiringIntegrationContextApi.useCreate({
        invoiceStatus: CONTEXT_IN_PROGRESS_STATUS,
        settings: { dv: 1 },
        state: { dv: 1 },
    })
    const updateAction = AcquiringIntegrationContextApi.useUpdate({ status: CONTEXT_IN_PROGRESS_STATUS })

    const noTaxOption = useMemo<SelectProps['options'][number]>(() => ({
        label: NoTax,
        key: NoTax,
        value: '',
    }), [NoTax])

    const account = Form.useWatch('account', form)
    const bic = Form.useWatch('bic', form)
    const selectedTaxType = Form.useWatch<typeof TAX_REGIME_GENEGAL | typeof TAX_REGIME_SIMPLE>('taxType', form)

    const bankAccountOptions = useMemo<SelectProps['options']>(() => getOptions(bic ? bankAccounts.filter(({ routingNumber }) => routingNumber === bic) : bankAccounts, 'number'), [bankAccounts, bic])
    const bicOptions = useMemo<SelectProps['options']>(() => getOptions(account ? bankAccounts.filter(({ number }) => number === account) : bankAccounts, 'routingNumber'), [bankAccounts, account])
    const taxPercentOptions = useMemo<SelectProps['options']>(() => selectedTaxType === TAX_REGIME_GENEGAL ? [noTaxOption, ...TAX_PERCENT_OPTIONS] : [noTaxOption, ...TAX_PERCENT_OPTIONS.slice(1)], [noTaxOption, selectedTaxType])
    const possibleVatOptionsValues: string[] = useMemo(() => {
        if (!selectedTaxType) return []
        return ['', ...selectedTaxType === TAX_REGIME_GENEGAL ? VAT_OPTIONS : VAT_OPTIONS.filter((v: number) => v !== 0)].map((option) => String(option))
    }, [selectedTaxType])

    useEffect(() => {
        const taxPercent = form.getFieldValue('taxPercent')
        if (!possibleVatOptionsValues.includes(taxPercent)) {
            form.setFieldValue('taxPercent', '')
        }
    }, [form, possibleVatOptionsValues, selectedTaxType])

    useEffect(() => {
        if (!acquiringContextLoading && !acquiringContextError && !!acquiringContext) {
            form.setFieldsValue({
                bic: get(acquiringContext, ['invoiceRecipient', 'bic'], ''),
                account: get(acquiringContext, ['invoiceRecipient', 'bankAccount'], ''),
                taxType: get(acquiringContext, 'invoiceTaxRegime'),
                taxPercent: get(acquiringContext, 'invoiceVatPercent'),
            })
        }
    }, [form, acquiringContext, acquiringContextError, acquiringContextLoading])

    const errorHandler = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [ERROR_BANK_NOT_FOUND]: 'bic',
            [ERROR_ORGANIZATION_NOT_FOUND]: 'tin',
        },
    })

    const handleFormSubmit = useCallback(async (values) => {
        if (!acquiringContextLoading && !acquiringContextError && !!acquiringId) {
            setError(null)
            setIsLoading(true)
            let promise: Promise<AcquiringIntegrationContext>
            if (acquiringContext) {
                promise = updateAction({
                    invoiceRecipient: {
                        tin: get(organization, 'tin'),
                        bic: values.bic,
                        bankAccount: values.account,
                    },
                    invoiceTaxRegime: values.taxType,
                    invoiceVatPercent: values.taxPercent,
                }, { id: acquiringContext.id })
            } else {
                promise = createAction({
                    integration: { connect: { id: acquiringId } },
                    invoiceStatus: CONTEXT_IN_PROGRESS_STATUS,
                    organization: { connect: { id: orgId } },
                    invoiceRecipient: {
                        tin: get(organization, 'tin'),
                        bic: values.bic,
                        bankAccount: values.account,
                    },
                    invoiceTaxRegime: values.taxType,
                    invoiceVatPercent: values.taxPercent,
                })
            }

            promise.then(() => {
                router.replace({ query: { step: 1 } })
            }).catch(errorHandler)

            setIsLoading(false)
        }
    }, [acquiringContextLoading, acquiringContextError, acquiringId, acquiringContext, errorHandler, updateAction, organization, createAction, orgId, router])

    return (
        <Row gutter={VERTICAL_GUTTER}>
            {error && (
                <Col sm={13} span={24}>
                    <Row>
                        <Alert showIcon type='error' message={RecipientErrorTitle} description={error}/>
                    </Row>
                </Col>
            )}
            <Col sm={13} span={24}>
                <Form
                    initialValues={{ tin: get(organization, 'tin'), bic: '', account: '', taxPercent: null }}
                    form={form}
                    onFinish={handleFormSubmit}
                    layout='horizontal'
                    colon={false}
                    validateTrigger={FORM_VALIDATE_TRIGGER}
                >
                    <Row gutter={VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Form.Item
                                label={AccountLabel}
                                name='account'
                                required
                                labelCol={LABEL_COL}
                                labelAlign='left'
                                rules={numberValidator}
                            >
                                <AutoComplete allowClear filterOption options={bankAccountOptions}/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label={TINLabel}
                                name='tin'
                                required
                                labelCol={LABEL_COL}
                                labelAlign='left'
                                rules={[requiredValidator]}
                            >
                                <Input disabled/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label={BICLabel}
                                name='bic'
                                required
                                labelCol={LABEL_COL}
                                labelAlign='left'
                                rules={routingNumberValidator}
                            >
                                <AutoComplete allowClear filterOption options={bicOptions}/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label={TaxTypeLabel}
                                name='taxType'
                                required
                                labelCol={LABEL_COL}
                                labelAlign='left'
                                rules={[requiredValidator]}
                            >
                                <RadioGroup>
                                    <Space size={8} wrap direction='vertical'>
                                        <Radio value={TAX_REGIME_GENEGAL}>{TaxTypeCommonLabel}</Radio>
                                        <Radio value={TAX_REGIME_SIMPLE}>{TaxTypeSimpleLabel}</Radio>
                                    </Space>
                                </RadioGroup>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label={TaxPercentLabel}
                                name='taxPercent'
                                required
                                labelCol={LABEL_COL}
                                labelAlign='left'
                                rules={[{
                                    validator: (rule, value) => possibleVatOptionsValues.includes(value) ? Promise.resolve() : Promise.reject(),
                                }]}
                            >
                                <Select disabled={!selectedTaxType} options={taxPercentOptions}/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Row justify='start'>
                                <Space size={16}>
                                    <Button type='primary' key='submit' htmlType='submit' loading={loading}
                                        disabled={!submittable}>
                                        {NextButtonLabel}
                                    </Button>
                                </Space>
                            </Row>
                        </Col>
                    </Row>
                </Form>
            </Col>
        </Row>
    )
}
