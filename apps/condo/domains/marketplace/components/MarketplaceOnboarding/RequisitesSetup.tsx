import { Col, Form, Input, Row, RowProps } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { getOrganizationInfo, getBankInfo } from '@open-condo/clients/finance-info-client'
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

    // TODO: can't import finance-info-client (no loader to process this file)
    const validateRecipient = async (routingNumber, tin)=> {
        const { error: getBankError, result: routingNumberMeta  } = await getBankInfo(routingNumber)
        const { error: getOrganizationError, result: tinMeta } = await getOrganizationInfo(tin)

        return { routingNumberMeta, tinMeta, getBankError, getOrganizationError }
    }

    const [error, setError] = useState<string | null>(null)
    const [loading, setIsLoading] = useState<boolean>(false)

    const [selectedTaxType, setSelectedTaxType] = useState<typeof TAX_REGIME_GENEGAL | typeof TAX_REGIME_SIMPLE>(TAX_REGIME_GENEGAL)
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const [form] = Form.useForm()
    const router = useRouter()

    const { obj: invoiceContext, loading: invoiceContextLoading, error: invoiceContextError, refetch: refetchInvoiceContext } = InvoiceContext.useObject({
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
    const taxPercentOptions: SelectProps['options'] = VAT_OPTIONS.map((option) => ({
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

    // NOTE: If already connected invoice context with status inProgress = skip to final step
    useEffect(() => {
        if (!invoiceContextLoading && !invoiceContextError && invoiceContextId) {
            router.replace({ query: { ...router.query, step: 1 } })
        }
    }, [router, invoiceContextLoading, invoiceContextError, invoiceContextId])


    const handleFormSubmit = useCallback(async (values) => {
        setError(null)
        setIsLoading(true)
        // TODO: fix import of module
        const { routingNumberMeta, tinMeta, getBankError, getOrganizationError } = await validateRecipient(values.bic, get(organization, 'tin'))
        if ( getBankError || getOrganizationError) {
            const BankAccountValidationErrorMessage = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.error.text' }, {
                number: values.number,
                routingNumber: values.bic,
            })
            setError(BankAccountValidationErrorMessage)
            setIsLoading(false)
            return
        }
        const bankName = get(routingNumberMeta, 'bankName', null)
        const offsettingAccount = get(routingNumberMeta, 'offsettingAccount', null)
        const name = get(tinMeta, 'name', null)
        const iec = get(tinMeta, 'iec', null)
        const bic = get(routingNumberMeta, 'routingNumber', null)
        const territoryCode = get(tinMeta, 'territoryCode', null)
        createAction({
            status: INVOICE_CONTEXT_STATUS_INPROGRESS,
            organization: { connect: { id: orgId } },
            recipient: {
                name,
                bankName,
                territoryCode,
                offsettingAccount,
                tin: get(organization, 'tin'),
                iec,
                bic,
                bankAccount: values.account,
            },
            taxRegime: values.taxType,
            // vatPercent: parseInt(values.taxPercent), TODO: can't create history record
            currencyCode: 'RUB',

        }).then(()=>{
            router.replace({ query: { step: 1 } })
        })

        setIsLoading(false)
    }, [intl])


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
                                    labelCol={{ lg: 10 }}
                                    labelAlign='left'
                                    rules={numberValidator}
                                >
                                    {!bankAccountsLoading && !bankAccountsError && bankAccounts ? (
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
                                    labelCol={{ lg: 10 }}
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
                                    labelCol={{ lg: 10 }}
                                    labelAlign='left'
                                    rules={routingNumberValidator}
                                >
                                    <Col lg={12}>
                                        {!bankAccountsLoading && !bankAccountsError && bankAccounts ? (
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
                                    labelCol={{ lg: 10 }}
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
                                    labelCol={{ lg: 10 }}
                                    labelAlign='left'
                                >
                                    <Select
                                        placeholder={selectedTaxType === TAX_REGIME_GENEGAL ? taxPercentOptions[taxPercentOptions.length - 1].label : noTaxOption.label}
                                        options={selectedTaxType === TAX_REGIME_GENEGAL ? [noTaxOption, ...taxPercentOptions] : [noTaxOption, ...taxPercentOptions.slice(1)]}
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