import { Col, Form, Input, Row, RowProps } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Radio, RadioGroup, Select, SelectProps, Space } from '@open-condo/ui'

import { BankAccount } from '@condo/domains/banking/utils/clientSchema'
import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { useBankAccountValidation } from '@condo/domains/common/utils/clientSchema/bankAccountValidationUtils'
import {
    TAX_REGIME_GENEGAL,
    TAX_REGIME_SIMPLE,
    VAT_OPTIONS,
    INVOICE_CONTEXT_STATUS_INPROGRESS,
} from '@condo/domains/marketplace/constants'
import { InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'


const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const LABEL_COL = { lg: 10 }

const TAX_PERCENT_OPTIONS: SelectProps['options'] = VAT_OPTIONS.map((option) => ({
    label: `${option} %`,
    key: option,
    value: option,
}))

const getOptions = (items, fieldName) => (items.map((item) => {
    const field = get(item, fieldName, null)
    return {
        label: field,
        key: field,
        value: field,
    }
}))

export const RequisitesSetup = () => {
    const intl = useIntl()
    const { numberValidator, routingNumberValidator } = useBankAccountValidation({ country: RUSSIA_COUNTRY })

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

    const [selectedTaxType, setSelectedTaxType] = useState<typeof TAX_REGIME_GENEGAL | typeof TAX_REGIME_SIMPLE>(TAX_REGIME_GENEGAL)
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const [form] = Form.useForm()
    const router = useRouter()

    const { obj: invoiceContext, loading: invoiceContextLoading, error: invoiceContextError } = InvoiceContext.useObject({
        where: {
            organization: { id: orgId },
        },
    })

    const { objs: bankAccounts, loading: bankAccountsLoading, error: bankAccountsError } = BankAccount.useObjects({
        where: {
            organization: { id: orgId },
        },
    })

    const createAction = InvoiceContext.useCreate({
        status: INVOICE_CONTEXT_STATUS_INPROGRESS,
        settings: { dv: 1 },
    })

    const handleTypeChange = useCallback((form) => (e) => {
        setSelectedTaxType(e.target.value)
    }, [])

    const [noTaxOption]: SelectProps['options'] = [{ label: NoTax, key: NoTax, value: null }]

    const bankAccountOptions: SelectProps['options'] = getOptions(bankAccounts, 'number')
    const bicOptions: SelectProps['options'] = getOptions(bankAccounts, 'routingNumber')
    const invoiceContextId = get(invoiceContext, 'id', null)

    useEffect(()=> {
        form.resetFields(['taxPercent'])
    }, [selectedTaxType])

    useEffect(()=> {
        if (!bankAccountsLoading && !bankAccountsError && bankAccounts) {
            form.setFieldValue('bic', get(bankAccounts[0], 'routingNumber', null))
            form.setFieldValue('account', get(bankAccounts[0], 'number', null))
        }
    }, [bankAccounts, bankAccountsError, bankAccountsLoading])

    // NOTE: If invoice context is already connected with status inProgress = skip to final step
    useEffect(() => {
        if (!invoiceContextLoading && !invoiceContextError && invoiceContextId) {
            router.replace({ query: { ...router.query, step: 1 } })
        }
    }, [router, invoiceContextLoading, invoiceContextError, invoiceContextId])


    const handleFormSubmit = useCallback(async (values) => {
        setError(null)
        setIsLoading(true)
        createAction({
            status: INVOICE_CONTEXT_STATUS_INPROGRESS,
            organization: { connect: { id: orgId } },
            recipient: {
                tin: get(organization, 'tin'),
                bic: values.bic,
                bankAccount: values.account,
            },
            taxRegime: values.taxType,
            vatPercent: String(values.taxPercent),
            currencyCode: 'RUB',
        }).then(()=>{
            router.replace({ query: { step: 1 } })
        })

        setIsLoading(false)
    }, [createAction, orgId, organization, router])


    return (
        <Row gutter={VERTICAL_GUTTER}>
            {error ? (
                <Col sm={13} span={24}>
                    <Row>
                        <Alert
                            showIcon
                            type='error'
                            message={RecipientErrorTitle}
                            description={error}
                        />
                    </Row>
                </Col>) : null}
            <Col sm={13} span={24}>
                <Form
                    initialValues={{
                        tin: '',
                        bic: '',
                        account: '',
                        taxType: selectedTaxType,
                        taxPercent: selectedTaxType === TAX_REGIME_GENEGAL ? VAT_OPTIONS[VAT_OPTIONS.length - 1] : null,
                    }}
                    form={form}
                    onFinish={handleFormSubmit}
                    layout='horizontal'
                    colon={false}
                    validateTrigger={FORM_VALIDATE_TRIGGER}
                    children={({ form }) => (
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
                                    {!bankAccountsLoading && !bankAccountsError && bankAccounts.length > 1 ? (
                                        <Select
                                            options={bankAccountOptions}
                                        />
                                    ) : <Input/>}
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={TINLabel}
                                    name='tin'
                                    required
                                    labelCol={LABEL_COL}
                                    labelAlign='left'
                                >
                                    <Col lg={12}>
                                        <Input disabled value={get(organization, 'tin')}/>
                                    </Col>
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
                                    <Col lg={12}>
                                        {!bankAccountsLoading && !bankAccountsError && bankAccounts.length > 1 ? (
                                            <Select
                                                placeholder={bicOptions[0].label}
                                                options={bicOptions}
                                            />
                                        ) : <Input/>}
                                    </Col>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={TaxTypeLabel}
                                    name='taxType'
                                    required
                                    labelCol={LABEL_COL}
                                    labelAlign='left'
                                >
                                    <RadioGroup onChange={handleTypeChange(form)}>
                                        <Space size={8} wrap direction='vertical'>
                                            <Radio value={TAX_REGIME_GENEGAL}>
                                                {TaxTypeCommonLabel}
                                            </Radio>
                                            <Radio value={TAX_REGIME_SIMPLE}>
                                                {TaxTypeSimpleLabel}
                                            </Radio>
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
                                >
                                    <Select
                                        placeholder={selectedTaxType === TAX_REGIME_GENEGAL ? TAX_PERCENT_OPTIONS[TAX_PERCENT_OPTIONS.length - 1].label : noTaxOption.label}
                                        options={selectedTaxType === TAX_REGIME_GENEGAL ? [noTaxOption, ...TAX_PERCENT_OPTIONS] : [noTaxOption, ...TAX_PERCENT_OPTIONS.slice(1)]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Row justify='start'>
                                    <Space size={16}>
                                        <Button type='primary' key='submit' htmlType='submit' loading={loading}>
                                            {NextButtonLabel}
                                        </Button>
                                    </Space>
                                </Row>
                            </Col>
                        </Row>
                    )}/>
            </Col>
        </Row>
    )
}