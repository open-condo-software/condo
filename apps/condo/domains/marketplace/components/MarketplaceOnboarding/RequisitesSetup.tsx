import { AcquiringIntegrationContext, BankAccount } from '@app/condo/schema'
import { AutoComplete, Col, Form, Input, Row, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Radio, RadioGroup, Select, SelectProps, Space } from '@open-condo/ui'

import { TAX_REGIME_GENEGAL, TAX_REGIME_SIMPLE, CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext as AcquiringIntegrationContextApi, AcquiringIntegration as AcquiringIntegrationApi } from '@condo/domains/acquiring/utils/clientSchema'
import { BankAccount as BankAccountApi } from '@condo/domains/banking/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
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
    const TinTooltipLabel = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.field.tin.tooltip' })

    const [error, setError] = useState<string | null>(null)
    const [loading, setIsLoading] = useState<boolean>(false)
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const [form] = Form.useForm()
    const router = useRouter()

    // NOTE: On practice there's only 1 acquiring and there's no plans to change it soon
    const { objs: acquiring, loading: acquiringLoading, error: acquiringError } = AcquiringIntegrationApi.useObjects({
        where: {
            isHidden: false,
            setupUrl_not: null,
        },
    })

    const {
        obj: acquiringContext,
        loading: acquiringContextLoading,
        error: acquiringContextError,
    } = AcquiringIntegrationContextApi.useObject({
        where: {
            organization: { id: orgId },
        },
    })

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

    const acquiringId = get(acquiring, [0, 'id'], null)

    const createAction = AcquiringIntegrationContextApi.useCreate({
        invoiceStatus: CONTEXT_IN_PROGRESS_STATUS,
        settings: { dv: 1 },
        state: { dv: 1 },
    })
    const updateAction = AcquiringIntegrationContextApi.useUpdate({ invoiceStatus: CONTEXT_IN_PROGRESS_STATUS })

    const noTaxOption = useMemo<SelectProps['options'][number]>(() => ({
        label: NoTax,
        key: NoTax,
        value: null,
    }), [NoTax])

    const account = Form.useWatch('account', form)
    const bic = Form.useWatch('bic', form)
    const selectedTaxType = Form.useWatch<typeof TAX_REGIME_GENEGAL | typeof TAX_REGIME_SIMPLE>('taxType', form)

    const bankAccountOptions = useMemo<SelectProps['options']>(() => getOptions(bic ? bankAccounts.filter(({ routingNumber }) => routingNumber === bic) : bankAccounts, 'number'), [bankAccounts, bic])
    const bicOptions = useMemo<SelectProps['options']>(() => getOptions(account ? bankAccounts.filter(({ number }) => number === account) : bankAccounts, 'routingNumber'), [bankAccounts, account])
    const taxPercentOptions = useMemo<SelectProps['options']>(() => {
        if (acquiringLoading || acquiringError) {
            return [noTaxOption]
        }

        const options = (get(acquiring, [0, 'vatPercentOptions']) || '').split(',').filter((option)=> {
            return Boolean(option) && (selectedTaxType === TAX_REGIME_GENEGAL || (selectedTaxType === TAX_REGIME_SIMPLE && option !== '0'))
        }).map((option) => ({
            label: `${option} %`,
            key: `vat_percent_${option}`,
            value: option,
        }))

        return [noTaxOption, ...options]
    }, [acquiring, acquiringError, acquiringLoading, noTaxOption, selectedTaxType])

    const possibleVatOptionsValues: string[] = useMemo(() => {
        if (!selectedTaxType) return []

        if (acquiringLoading || acquiringError) {
            return [null]
        }
        const vatOptions = (get(acquiring, [0, 'vatPercentOptions']) || '').split(',').filter(Boolean)

        return [null, ...selectedTaxType === TAX_REGIME_GENEGAL ? vatOptions : vatOptions.filter((v: string) => v !== '0')]
    }, [acquiring, acquiringError, acquiringLoading, selectedTaxType])

    useEffect(() => {
        const taxPercent = form.getFieldValue('taxPercent')
        if (!possibleVatOptionsValues.includes(taxPercent)) {
            form.setFieldValue('taxPercent', null)
        }
    }, [form, possibleVatOptionsValues, selectedTaxType])

    useEffect(() => {
        if (acquiringContext && !acquiringLoading && !!acquiring) {
            const invoiceVatPercent = get(acquiringContext, 'invoiceVatPercent') || null
            form.setFieldsValue({
                bic: get(acquiringContext, ['invoiceRecipient', 'bic'], ''),
                account: get(acquiringContext, ['invoiceRecipient', 'bankAccount'], ''),
                taxType: get(acquiringContext, 'invoiceTaxRegime'),
                taxPercent: invoiceVatPercent ? Number(invoiceVatPercent).toString() : null,
            })
        }
    }, [form, acquiringContext, acquiringLoading, acquiring])

    const errorHandler = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [ERROR_BANK_NOT_FOUND]: 'bic',
            [ERROR_ORGANIZATION_NOT_FOUND]: 'tin',
        },
    })

    const handleFormSubmit = useCallback(async (values) => {
        if (acquiringId && !acquiringLoading && !acquiringError) {
            setError(null)
            setIsLoading(true)
            let promise: Promise<AcquiringIntegrationContext>
            if (acquiringContext) {
                promise = updateAction({
                    invoiceRecipient: {
                        name: get(organization, 'name'),
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
                        name: get(organization, 'name'),
                        tin: get(organization, 'tin'),
                        bic: values.bic,
                        bankAccount: values.account,
                    },
                    invoiceTaxRegime: values.taxType,
                    invoiceVatPercent: values.taxPercent,
                })
            }

            promise.then(async () => {
                await router.replace({ query: { step: 1 } })
            }).catch(errorHandler)

            setIsLoading(false)
        }
    }, [acquiringId, acquiringLoading, acquiringError, acquiringContext, errorHandler, updateAction, organization, createAction, orgId, router])

    if (acquiringContextLoading || acquiringContextError) {
        return <LoadingOrErrorPage loading={acquiringContextLoading} error={acquiringContextError}/>
    }

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
                    initialValues={{ tin: get(organization, 'tin'), bic: '', account: '', taxType: TAX_REGIME_GENEGAL, taxPercent: null }}
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
                                <Input title={TinTooltipLabel} disabled/>
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
