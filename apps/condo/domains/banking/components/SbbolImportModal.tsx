import styled from '@emotion/styled'
import { Row, Col, Form, Skeleton } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useState, useCallback, useEffect, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { PlusCircle, XCircle } from '@open-condo/icons'
import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, Select, Alert, Button, Typography, Space } from '@open-condo/ui'
import type { SelectProps } from '@open-condo/ui'

import { BankAccount as BankAccountGQL } from '@condo/domains/banking/gql'
import { BankAccount } from '@condo/domains/banking/utils/clientSchema'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { Property } from '@condo/domains/property/utils/clientSchema'


const MODAL_ROW_GUTTER: React.ComponentProps<typeof Row>['gutter'] = [16, 24]

const TextButton = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  & > span {
    margin-right: 8px;
  }
`

interface ISbbolImportModal {
    ({ propertyId, onComplete }: { propertyId: string, onComplete?: () => void }): React.ReactElement
}

const validateFormItems = (items: Array<{ property?: string, bankAccount?: string }>) => {
    const allValuesSet = items.every(item => get(item, 'bankAccount', false) && get(item, 'property', false))
    const bankAccounts = items.map(item => get(item, 'bankAccount'))
    const properties = items.map(item => get(item, 'property'))
    const allValuesUnique = bankAccounts.length === new Set(bankAccounts).size
        && properties.length === new Set(properties).size
    return allValuesSet && allValuesUnique
}

export const SbbolImportModal: ISbbolImportModal = ({ propertyId, onComplete }) => {
    const intl = useIntl()
    const SetupSyncTitle = intl.formatMessage({ id: 'pages.banking.report.accountSetupTitle' })
    const BankAccountNotFoundTitle = intl.formatMessage({ id: 'pages.banking.report.accountNotFound' })
    const AlertMessage = intl.formatMessage({ id: 'pages.banking.report.alertInfo.title' })
    const AlertDescription = intl.formatMessage({ id: 'pages.banking.report.alertInfo.description' })
    const BankAccountPlaceholder = intl.formatMessage({ id:'pages.banking.report.chooseBankAccountPlaceholder' })
    const PropertyPlaceholder = intl.formatMessage({ id:'pages.banking.report.choosePropertyPlaceholder' })
    const NotUniqueError = intl.formatMessage({ id: 'pages.banking.report.validation.notUnique' })
    const SaveTitle = intl.formatMessage({ id: 'Save' })
    const AddTitle = intl.formatMessage({ id: 'pages.banking.report.addAnotherBankAccount' })
    const CancelTitle = intl.formatMessage({ id: 'Cancel' })

    const { replace, asPath } = useRouter()
    const { organization } = useOrganization()
    const { objs: bankAccounts, loading: bankAccountsLoading } = BankAccount.useObjects({
        where: {
            organization: { id: get(organization, 'id') },
            property_is_null: true,
        },
    })
    const { objs: properties, loading: propertiesLoading } = Property.useObjects({
        where: { organization: { id: get(organization, 'id') } },
    }, { fetchPolicy: 'cache-first' })
    const [updateBankAccounts, { loading: updateActionLoading }] = useMutation(BankAccountGQL.UPDATE_OBJS_MUTATION)
    const { requiredValidator } = useValidations()
    const [form] = Form.useForm()
    const formWatch = Form.useWatch('items', form)

    const [isOpen, setIsOpen] = useState(true)
    const [isValid, setIsValid] = useState(false)

    useEffect(() => {
        if (!propertiesLoading && !bankAccountsLoading) {
            if (bankAccounts.length === 1) {
                form.setFieldValue(['items', 0, 'property'], propertyId)
                form.setFieldValue(['items', 0, 'bankAccount'], bankAccounts[0].id)
            } else if (bankAccounts.length > 1 && properties.length >= 1) {
                form.setFieldValue(['items', 0, 'property'], propertyId)
            }
        }
    }, [propertiesLoading, properties, bankAccountsLoading, bankAccounts, propertyId])
    useEffect(() => {
        if (formWatch && formWatch.length) {
            const validationResult = validateFormItems(formWatch)
            form.validateFields()
            setIsValid(validationResult)
        }
    }, [formWatch])

    const handleRemove = useCallback((remove) => {
        remove(formWatch.length - 1)
    }, [formWatch])
    const handleClose = useCallback(async () => {
        await replace(asPath.split('?')[0])
        setIsOpen(false)
    }, [asPath, replace])
    const handleSubmit = useCallback(async () => {
        if (formWatch && isValid) {
            const sender = getClientSideSenderInfo()

            await updateBankAccounts({
                variables: {
                    data: formWatch.map(item => ({
                        id: item.bankAccount,
                        data: {
                            dv: 1,
                            sender,
                            property: { connect: { id: item.property } },
                        },
                    })),
                },
            })

            if (onComplete) {
                onComplete()
            }
            await handleClose()
        }
    }, [formWatch, isValid, updateBankAccounts, handleClose, onComplete])
    const uniqueItemValidator = useCallback((itemKey: string, index: number) => ({
        message: NotUniqueError,
        validator: (_, value) => {
            const formValues = formWatch ? formWatch : []
            if (formValues.length - 1 !== index) return Promise.resolve()

            const selectedValues = formValues.map(item => get(item, itemKey))
            selectedValues.splice(index, 1)
            if (selectedValues.includes(value)) {
                return Promise.reject()
            }
            return Promise.resolve()
        },
    }), [NotUniqueError, formWatch])

    const hasBankAccounts = !bankAccountsLoading && bankAccounts.length
    const formValues = formWatch ? formWatch : []

    const modalFooter = useMemo(() => {
        if (!hasBankAccounts) return null
        return (
            <Button
                type='primary'
                loading={updateActionLoading}
                disabled={!isValid}
                onClick={handleSubmit}
            >
                {SaveTitle}
            </Button>
        )
    }, [hasBankAccounts, isValid, updateActionLoading, SaveTitle, handleSubmit])
    const bankAccountSelectOptions: SelectProps['options'] = useMemo(() => {
        return bankAccounts.map(bankAccount => ({
            key: bankAccount.id,
            value: bankAccount.id,
            label: get(bankAccount, 'number', ''),
        }))
    }, [bankAccounts])
    const propertySelectOptions: SelectProps['options'] = useMemo(() => {
        return properties.map(property => ({
            key: property.id,
            value: property.id,
            label: get(property, 'address', ''),
        }))
    }, [properties])

    const isLoading = bankAccountsLoading || propertiesLoading

    return (
        <Modal
            title={hasBankAccounts ? SetupSyncTitle : BankAccountNotFoundTitle}
            open={isOpen}
            onCancel={handleClose}
            footer={modalFooter}
        >
            <Row gutter={MODAL_ROW_GUTTER}>
                <Col span={24}>
                    <Alert type='info' message={AlertMessage} description={AlertDescription} showIcon />
                </Col>
                {isLoading
                    ? <Skeleton active loading round paragraph={{ rows: 5 }} />
                    : (
                        <>
                            <Col span={24} hidden={!hasBankAccounts}>
                                <Typography.Text>
                                    {intl.formatMessage(
                                        { id: 'pages.banking.report.importHelpText' }, { isSingular: bankAccounts.length })
                                    }
                                </Typography.Text>
                            </Col>
                            <Col span={24} hidden={!hasBankAccounts}>
                                <Form
                                    form={form}
                                    initialValues={{ items: [{ property: null, bankAccount: null }] }}
                                >
                                    <Form.List name='items'>
                                        {(fields, { add, remove }) => (
                                            <Row gutter={MODAL_ROW_GUTTER}>
                                                {fields.map(({ key, name, ...restField }, index) => (
                                                    <>
                                                        <Col span={14}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'property']}
                                                                rules={[
                                                                    requiredValidator,
                                                                    uniqueItemValidator('property', index),
                                                                ]}
                                                            >
                                                                <Select
                                                                    placeholder={PropertyPlaceholder}
                                                                    disabled={bankAccounts.length === 1 || index === 0}
                                                                    options={propertySelectOptions}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={10}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'bankAccount']}
                                                                rules={[
                                                                    uniqueItemValidator('bankAccount', index),
                                                                ]}
                                                            >
                                                                <Select
                                                                    placeholder={BankAccountPlaceholder}
                                                                    disabled={bankAccounts.length === 1}
                                                                    options={bankAccountSelectOptions}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                    </>
                                                ))}
                                                <Col
                                                    span={24}
                                                    hidden={bankAccounts.length === 1 || properties.length === 1}
                                                >
                                                    <Space size={40} direction='vertical'>
                                                        {formValues.length !== 1 && (
                                                            <TextButton onClick={() => handleRemove(remove)}>
                                                                <XCircle size='small' />
                                                                <Typography.Title level={5}>{CancelTitle}</Typography.Title>
                                                            </TextButton>
                                                        )}
                                                        {formValues.length < bankAccounts.length && (
                                                            <TextButton onClick={add}>
                                                                <PlusCircle size='small' />
                                                                <Typography.Title level={5}>{AddTitle}</Typography.Title>
                                                            </TextButton>
                                                        )}
                                                    </Space>
                                                </Col>
                                            </Row>
                                        )}
                                    </Form.List>
                                </Form>
                            </Col>
                        </>
                    )
                }
            </Row>
        </Modal>
    )
}
