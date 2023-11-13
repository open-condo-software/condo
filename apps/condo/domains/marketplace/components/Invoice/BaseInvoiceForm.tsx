import { PlusCircleOutlined } from '@ant-design/icons'
import { useLazyQuery } from '@apollo/client'
import {
    BuildingUnitSubType,
    Organization,
    OrganizationEmployeeRole,
    Invoice,
    Property as PropertyType,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, Row, RowProps, Input, AutoComplete, Select } from 'antd'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Alert, Button, Modal, Radio, RadioGroup, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { Button as OldButton } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Loader } from '@condo/domains/common/components/Loader'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import {
    INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_PUBLISHED,
    INVOICE_STATUS_PAID,
    INVOICE_STATUS_CANCELED,
    INVOICE_PAYMENT_TYPE_ONLINE,
    INVOICE_PAYMENT_TYPE_CASH,
    INVOICE_STATUSES,
    INVOICE_PAYMENT_TYPES,
} from '@condo/domains/marketplace/constants'
import { InvoiceContext, MarketPriceScope } from '@condo/domains/marketplace/utils/clientSchema'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitInfoMode } from '@condo/domains/property/components/UnitInfo'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { GET_RESIDENT_EXISTENCE_BY_PHONE_AND_ADDRESS_QUERY } from '@condo/domains/resident/gql'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'


const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']

const SCROLL_TO_FIRST_ERROR_CONFIG = { behavior: 'smooth', block: 'center' }
const OUTER_VERTICAL_GUTTER: RowProps['gutter'] = [0, 60]
const GROUP_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const CONTACT_FORM_FIELDS = {
    id: 'contact',
    phone: 'clientPhone',
    name: 'clientName',
}
const PLUS_BUTTON_ICON_STYLE: CSSProperties = {
    color: colors.black,
    fontSize: 20,
    position: 'relative',
    top: '2px',
}
const PLUS_BUTTON_STYLE: CSSProperties = {
    color: colors.black,
    paddingLeft: '5px',
}
const ContactsInfoFocusContainer = styled(FocusContainer)`
  position: relative;
  left: ${({ padding }) => padding ? padding : '24px'};
  box-sizing: border-box;
  width: 100%;
`
const FormItemWithCustomWarningColor = styled(Form.Item)`
    .ant-input-status-warning {
      &:focus {
        box-shadow: 0 0 0 1px ${colors.red[5]} !important;
      }
      
      border-color: ${colors.red[5]} !important;;
    }

    .ant-input-group-wrapper-status-warning .ant-input-group-addon {
      color: ${colors.red[5]};
      border-color: ${colors.red[5]};
    }
  
    .ant-form-item-explain-warning {
      color: ${colors.red[5]};
    }
`
const getMoneyRender = (intl, fromMessage, currencyCode?: string) => {
    return function render (text: string, isMin: boolean) {
        const formattedParts = intl.formatNumberToParts(parseFloat(text),  currencyCode ? { style: 'currency', currency: currencyCode } : {})
        const formattedValue = formattedParts.map((part) => {
            return part.value
        }).join('')

        return isMin ? `${fromMessage} ${formattedValue}` : formattedValue
    }
}
const prepareTotalPriceFromInput = (count, rawPrice, fromMessage) => {
    if (!rawPrice) {
        return { total: 0 }
    }
    if (!isNaN(+rawPrice)) {
        return { total: +rawPrice * count }
    }

    const splittedRawPrice = rawPrice.split(' ')
    if (splittedRawPrice.length === 2 && splittedRawPrice[0] === fromMessage && !isNaN(+splittedRawPrice[1])) {
        return { isMin: true, total: +splittedRawPrice[1] * count }
    }

    return { error: true }
}

const SubTotalInfo = ({ label, total, large = false, totalTextType }) => {
    return (
        <Row align='bottom' justify='space-between' gutter={[8, 0]}>
            <Col>
                {large ? (
                    <Typography.Title level={4}>{label}</Typography.Title>
                ) : (
                    <Typography.Text size='medium'>{label}</Typography.Text>
                )}
            </Col>
            <Col style={{ borderBottom: `1px solid ${colors.gray[3]}`, flex: '1' }} />
            <Col>
                {large ? (
                    <Typography.Title level={4} type={totalTextType}>{total}</Typography.Title>
                ) : (
                    <Typography.Text size='medium' type={totalTextType}>{total}</Typography.Text>
                )}
            </Col>
        </Row>
    )
}

const PropertyFormField = ({ organization, form, disabled, setSelectedPropertyId }) => {
    const intl = useIntl()
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    
    const handlePropertySelectChange = useCallback(async (_, option) => {
        const newPropertyId = isEmpty(option) ? null : option.key

        form.setFieldsValue({
            unitName: null,
            unitType: null,
            propertyId: newPropertyId,
        })

        setSelectedPropertyId(newPropertyId)
    }, [form, setSelectedPropertyId])
    
    return (
        <Form.Item
            label={AddressLabel}
            labelCol={{ span: 24 }}
            required
            name='propertyId'
        >
            <PropertyAddressSearchInput
                organization={organization}
                onChange={handlePropertySelectChange}
                placeholder={AddressPlaceholder}
                notFoundContent={AddressNotFoundContent}
                disabled={disabled}
            />
        </Form.Item>
    )
}

const UnitNameFormField = ({ form, property, disabled }) => {
    const intl = useIntl()
    const UnitNameLabel = intl.formatMessage({ id: 'field.FlatNumber' })

    const onChange = useCallback((_, option: UnitNameInputOption) => {
        if (isEmpty(option)) {
            return form.setFieldsValue({
                unitName: null,
                unitType: null,
            })
        }

        const unitType = get(option, 'data-unitType', BuildingUnitSubType.Flat)
        const unitName = get(option, 'data-unitName')

        form.setFieldsValue({
            unitName,
            unitType,
        })
    }, [form])

    return (
        <>
            <Form.Item
                label={UnitNameLabel}
                required
                labelCol={{ span: 24 }}
                name='unitName'
            >
                <UnitNameInput
                    property={property}
                    allowClear
                    mode={UnitInfoMode.All}
                    onChange={onChange}
                    disabled={disabled}
                />
            </Form.Item>
            <Form.Item
                name='unitType'
                hidden
            />
        </>
    )
}

const ContactFormField = ({ role, organizationId, form, disabled }) => {
    const { ContactsEditorComponent } = useContactsEditorHook({
        role,
        initialQuery: { organization: { id: organizationId } },
    })

    return (
        <Form.Item
            dependencies={['propertyId', 'unitName', 'unitType']}
        >
            {
                ({ getFieldsValue }) => {
                    const {
                        propertyId, unitName, unitType, contact, clientName, clientPhone,
                    } = getFieldsValue(['propertyId', 'unitName', 'unitType', 'contact', 'clientName', 'clientPhone'])

                    const value = {
                        id: contact,
                        phone: clientPhone,
                        name: clientName,
                    }

                    return (
                        <ContactsEditorComponent
                            form={form}
                            fields={CONTACT_FORM_FIELDS}
                            value={value}
                            hasNotResidentTab={false}
                            hideFocusContainer
                            hideTabBar
                            property={propertyId}
                            unitName={unitName}
                            unitType={unitType}
                            contactFormItemProps={{ required: true, labelCol: { span: 24 } }}
                            newContactFormItemProps={{ labelCol: { span: 24 } }}
                            disabled={disabled}
                        />
                    )
                }
            }
        </Form.Item>
    )
}

const PayerDataFields = ({ organization, form, role, disabled, initialValues }) => {
    const intl = useIntl()
    const HasPayerDataMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payerData' })
    const NoPayerDataMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payerNoData' })


    const [hasPayerData, setHasPayerData] = useState<boolean>(get(initialValues, 'payerData'))
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(get(initialValues, 'propertyId'))
    const [property, setProperty] = useState<PropertyType>()

    const { refetch } = Property.useObject(
        {}, { skip: true }
    )

    useEffect(() => {
        if (selectedPropertyId && refetch) {
            refetch({ where: { id: selectedPropertyId } })
                ?.then(result => {
                    const { data: { objs } } = result
                    setProperty(objs[0])
                })
        }
    }, [refetch, selectedPropertyId])

    return (
        <Row gutter={GROUP_VERTICAL_GUTTER}>
            <Col span={24}>
                <Form.Item
                    name='payerData'
                >
                    <RadioGroup
                        optionType='button'
                        disabled={disabled}
                        onChange={(event) => {
                            const value = event.target.value
                            setHasPayerData(value)

                            if (!value) {
                                form.setFieldsValue({
                                    propertyId: null,
                                    unitName: null,
                                    unitType: null,
                                    contact: null,
                                    clientName: null,
                                    clientPhone: null,
                                })
                            }
                        }}
                    >
                        <Radio
                            key='1'
                            value={true}
                            label={HasPayerDataMessage}
                        />
                        <Radio
                            key='2'
                            value={false}
                            label={NoPayerDataMessage}
                        />
                    </RadioGroup>
                </Form.Item>
            </Col>
            {
                hasPayerData && (
                    <Col span={24}>
                        <ContactsInfoFocusContainer>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Row gutter={[50, 0]}>
                                        <Col span={20}>
                                            <PropertyFormField
                                                organization={organization}
                                                setSelectedPropertyId={setSelectedPropertyId}
                                                form={form}
                                                disabled={disabled}
                                            />
                                        </Col>
                                        <Col span={4}>
                                            <UnitNameFormField
                                                property={property}
                                                form={form}
                                                disabled={disabled}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <ContactFormField
                                role={role}
                                organizationId={organization.id}
                                form={form}
                                disabled={disabled}
                            />
                        </ContactsInfoFocusContainer>
                    </Col>
                )
            }
        </Row>
    )
}

type MarketItemOptionType = {
    label: string, value: string, toPay: string, isMin: boolean, sku: string
}

const ServicesList = ({ organizationId, propertyId, form, currencySymbol, disabled, setStatus }) => {
    const intl = useIntl()
    const ServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.service' })
    const QuntityLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.quantity' })
    const TotalPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.totalPrice' })
    const AddServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.addService' })
    const PriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.price' })
    const NumberIsNotValidMessage = intl.formatMessage({ id: 'NumberIsNotValid' })
    const ServicePlaceholder = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.service.placeholder' })
    const MinPriceValidationMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.minPriceValidation' })
    const FromMessage = intl.formatMessage({ id: 'global.from' }).toLowerCase()

    const { requiredValidator } = useValidations()

    const filterByProperty = useMemo(() => {
        const baseFilterByProperty = { property_is_null: true }

        return propertyId ? { OR: [{ property: { id: propertyId } }, baseFilterByProperty] } : baseFilterByProperty
    }, [propertyId])

    const { objs: marketPriceScopes } = MarketPriceScope.useAllObjects({
        where: {
            AND: [
                { marketItemPrice: { marketItem: { organization: { id: organizationId } } } },
                { ...filterByProperty },
            ],
        },
    })

    const marketItemGroups = []
    for (const scope of marketPriceScopes) {
        const category = scope.marketItemPrice.marketItem.marketCategory
        const key = category.parentCategory ? category.parentCategory.id + category.id : category.id
        const label = category.parentCategory ? `${category.parentCategory.name} / ${category.name}` : category.name

        const marketItem = get(scope, 'marketItemPrice.marketItem')
        const name = get(marketItem, 'name')
        const sku = get(marketItem, 'sku')

        const pricesArray = get(scope, 'marketItemPrice.price')
        const priceObj = get(pricesArray, '0')
        const price = get(priceObj, 'price')
        const isMin = get(priceObj, 'isMin')

        const item = {
            label: name,
            value: name,
            toPay: price, isMin, sku,
            key: marketItem.id,
        }

        const existedGroup = marketItemGroups.find(group => group.key === key)
        if (existedGroup) {
            existedGroup.options.push(item)
        } else {
            marketItemGroups.push({ key, label, options: [item] })
        }
    }
    marketItemGroups.sort((a, b) => a.key > b.key ? 1 : -1)

    const moneyRender = useMemo(() => getMoneyRender(intl, FromMessage), [])

    return (
        <Form.List name='rows'>
            {(marketItemForms, operation) =>
                <Row gutter={SMALL_VERTICAL_GUTTER}>
                    {
                        marketItemForms.map((marketItemForm, index) => (
                            <Col span={24} key={marketItemForm.name}>
                                <Row gutter={[50, 12]} align='top'>
                                    <Col xs={24} lg={8}>
                                        <Form.Item
                                            label={ServiceLabel}
                                            name={[marketItemForm.name, 'name']}
                                            required
                                            labelAlign='left'
                                            labelCol={{ span: 24 }}
                                            rules={[requiredValidator]}
                                        >
                                            <AutoComplete
                                                allowClear
                                                disabled={disabled}
                                                placeholder={ServicePlaceholder}
                                                options={marketItemGroups}
                                                filterOption
                                                onSelect={(_, option: MarketItemOptionType) => {
                                                    form.setFieldsValue({
                                                        rows: {
                                                            ...form.getFieldValue('rows'),
                                                            [marketItemForm.name]: {
                                                                ...form.getFieldValue(['rows', marketItemForm.name]),
                                                                toPay: option.isMin ? `${FromMessage} ${option.toPay}` : option.toPay,
                                                                isMin: option.isMin,
                                                                sku: option.sku,
                                                            },
                                                        },
                                                    })

                                                    form.validateFields([['rows', marketItemForm.name, 'toPay']])
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} lg={4}>
                                        <Form.Item
                                            label={QuntityLabel}
                                            name={[marketItemForm.name, 'count']}
                                            required
                                            labelAlign='left'
                                            labelCol={{ span: 24 }}
                                            rules={[requiredValidator]}
                                            initialValue={1}
                                        >
                                            <Select
                                                disabled={disabled}
                                                options={[...Array(50).keys() ].map( i => ({
                                                    label: `${i + 1}`,
                                                    key: i + 1,
                                                    value: i + 1,
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} lg={5}>
                                        <FormItemWithCustomWarningColor
                                            label={PriceLabel}
                                            required
                                            name={[marketItemForm.name, 'toPay']}
                                            labelCol={{ span: 24 }}
                                            rules={[
                                                requiredValidator,
                                                {
                                                    warningOnly: true,
                                                    validator: (_, value) => {
                                                        if (new RegExp(`^${FromMessage} (\\d+|\\d+,\\d+)$`).test(value)) {
                                                            form.setFieldsValue({
                                                                hasIsMinPrice: true,
                                                                status: INVOICE_STATUS_DRAFT,
                                                            })
                                                            setStatus(INVOICE_STATUS_DRAFT)

                                                            return Promise.reject(MinPriceValidationMessage)
                                                        }

                                                        form.setFieldsValue({
                                                            hasIsMinPrice: false,
                                                        })

                                                        return Promise.resolve()
                                                    },
                                                },
                                                {
                                                    pattern: new RegExp(`^(${FromMessage} |)(\\d+|\\d+,\\d+)$`),
                                                    message: NumberIsNotValidMessage,
                                                },
                                            ]}
                                        >
                                            <Input
                                                disabled={disabled}
                                                addonAfter={currencySymbol}
                                                onChange={e => {
                                                    const value = get(e, 'target.value')
                                                    if (!value) return

                                                    const splittedValue = value.split(' ')
                                                    const isMin = splittedValue.length === 2 && splittedValue[0] === FromMessage

                                                    form.setFieldsValue({
                                                        rows: {
                                                            ...form.getFieldValue('rows'),
                                                            [marketItemForm.name]: {
                                                                ...form.getFieldValue(['rows', marketItemForm.name]),
                                                                isMin,
                                                            },
                                                        },
                                                    })
                                                }}
                                            />
                                        </FormItemWithCustomWarningColor>
                                    </Col>
                                    <Col xs={24} lg={5}>
                                        <Form.Item
                                            label={TotalPriceLabel}
                                            required
                                            labelCol={{ span: 24 }}
                                            shouldUpdate
                                        >
                                            {
                                                ({ getFieldValue }) => {
                                                    const count = getFieldValue(['rows', marketItemForm.name, 'count'])
                                                    const rawPrice = getFieldValue(['rows', marketItemForm.name, 'toPay'])
                                                    const { error, isMin, total } = prepareTotalPriceFromInput(count, rawPrice, FromMessage)
                                                    const value = error ? '' : moneyRender(String(total), isMin)

                                                    return <Input type='total' addonAfter={currencySymbol} disabled value={value} />
                                                }
                                            }
                                        </Form.Item>
                                    </Col>
                                    {
                                        index !== 0 && (
                                            <Col xs={24} md={2}>
                                                <Typography.Text onClick={() => operation.remove(marketItemForm.name)}>
                                                    <div style={{ paddingTop: '62px' }}>
                                                        <Trash size='large' />
                                                    </div>
                                                </Typography.Text>
                                            </Col>
                                        )
                                    }
                                </Row>
                            </Col>
                        ))
                    }
                    <Col span={24}>
                        <OldButton
                            type='link'
                            style={PLUS_BUTTON_STYLE}
                            onClick={() => operation.add()}
                            icon={<PlusCircleOutlined style={PLUS_BUTTON_ICON_STYLE}/>}
                            disabled={disabled}
                        >
                            <Typography.Text strong>{AddServiceLabel}</Typography.Text>
                        </OldButton>
                    </Col>
                </Row>
            }
        </Form.List>
    )
}

const ResidentPaymentAlert = ({ propertyId, unitName, unitType, clientPhone, isCreatedByResident }) => {
    const intl = useIntl()
    const CreatedByResidentMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.createdByResident' })
    const CreatedByResidentDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.createdByResident' })
    const HasAppMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.hasApp' })
    const LinkWillBeGeneratedMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.linkWillBeGeneratedMessage' })
    const HasAppOnAddressMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.hasAppOnAddress' })
    const HasAppOnOtherAddressMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.hasAppOnOtherAddress' })
    const PassPaymentLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.passLinkToResident' })
    const NoAppMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.hasNotApp' })

    const [residentExistence, setResidentExistence] = useState<{ hasResident: boolean, hasResidentOnAddress: boolean }>()

    const [getResidentExistenceByPhoneAndAddress, { loading }] = useLazyQuery(
        GET_RESIDENT_EXISTENCE_BY_PHONE_AND_ADDRESS_QUERY,
        {
            onCompleted: (data) => {
                const { result: { hasResident, hasResidentOnAddress } } = data
                setResidentExistence({ hasResident, hasResidentOnAddress })
            },
        },
    )

    useEffect(() => {
        if (isCreatedByResident) return

        const sender = getClientSideSenderInfo()
        const meta = { dv: 1, sender }

        getResidentExistenceByPhoneAndAddress({
            variables: {
                data: {
                    propertyId,
                    unitName,
                    unitType,
                    phone: clientPhone,
                    ...meta,
                },
            },
        })
    }, [clientPhone, getResidentExistenceByPhoneAndAddress, isCreatedByResident, propertyId, unitName, unitType])

    if (loading) return <Loader />
    if (!residentExistence && !isCreatedByResident) return null

    let type: 'warning' | 'info'
    let message
    let description

    if (isCreatedByResident) {
        type = 'info'
        message = CreatedByResidentMessage
        description = CreatedByResidentDescription
    } else if (residentExistence.hasResidentOnAddress) {
        type = 'info'
        message = HasAppMessage
        description = (
            <>
                <Typography.Paragraph size='medium'>
                    {HasAppOnAddressMessage}
                </Typography.Paragraph>
                <Typography.Paragraph size='medium'>
                    {LinkWillBeGeneratedMessage}
                </Typography.Paragraph>
            </>
        )
    } else if (residentExistence.hasResident) {
        type = 'warning'
        message = HasAppMessage
        description = (
            <>
                <Typography.Paragraph size='medium'>
                    {HasAppOnOtherAddressMessage}
                </Typography.Paragraph>
                <Typography.Paragraph size='medium'>
                    {LinkWillBeGeneratedMessage}
                </Typography.Paragraph>
            </>
        )
    } else {
        type = 'warning'
        message = PassPaymentLinkMessage
        description = (
            <>
                <Typography.Paragraph size='medium'>
                    {NoAppMessage}
                </Typography.Paragraph>
                <Typography.Paragraph size='medium'>
                    {LinkWillBeGeneratedMessage}
                </Typography.Paragraph>
            </>
        )
    }

    return <Alert
        type={type}
        message={message}
        description={description}
        showIcon
    />
}

const StatusRadioGroup = ({ isAllFieldsDisabled, isNotDraftStatusesDisabled, paymentType, isCreateForm, form, status, setStatus }) => {
    const intl = useIntl()
    const InvoiceStatusLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.invoiceStatus' })
    const InvoiceStatusDraftLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.invoiceStatus.draft' })
    const InvoiceStatusReadyLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.invoiceStatus.ready' })
    const InvoiceStatusPaidLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.invoiceStatus.paid' })
    const InvoiceStatusCancelledLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.invoiceStatus.cancelled' })
    const CancelInvoiceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.cancelInvoiceMessage' })
    const CancelInvoiceDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.cancelInvoiceDescription' })
    const CancelInvoiceButtonMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.cancelInvoiceButton' })

    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)

    const handleValueChange = useCallback((e) => {
        const value = get(e, 'target.value')

        if (value === INVOICE_STATUS_CANCELED) {
            setIsCancelModalOpen(true)
            return false
        }

        form.setFieldsValue({
            status: value,
        })
        setStatus(value)
    }, [form, setStatus])

    const isOnlinePaymentType = paymentType === INVOICE_PAYMENT_TYPE_ONLINE

    return (
        <>
            <Form.Item
                label={<Typography.Text strong>{InvoiceStatusLabel}</Typography.Text>}
                labelCol={{
                    style: { marginRight: '24px' },
                }}
            >
                <RadioGroup value={status} onChange={handleValueChange} disabled={isAllFieldsDisabled}>
                    <Space size={24} wrap direction='horizontal'>
                        <Radio value={INVOICE_STATUS_DRAFT}>
                            <Typography.Text strong disabled={isAllFieldsDisabled}>{InvoiceStatusDraftLabel}</Typography.Text>
                        </Radio>
                        <Radio value={INVOICE_STATUS_PUBLISHED} disabled={isNotDraftStatusesDisabled}>
                            <Typography.Text type={status === INVOICE_STATUS_PUBLISHED ? 'warning' : 'primary'} disabled={isNotDraftStatusesDisabled} strong>{InvoiceStatusReadyLabel}</Typography.Text>
                        </Radio>
                        <Radio value={INVOICE_STATUS_PAID} disabled={isNotDraftStatusesDisabled || isOnlinePaymentType}>
                            <Typography.Text type={status === INVOICE_STATUS_PAID ? 'success' : 'primary'} disabled={isNotDraftStatusesDisabled} strong>{InvoiceStatusPaidLabel}</Typography.Text>
                        </Radio>
                        <Radio
                            value={INVOICE_STATUS_CANCELED}
                            disabled={isNotDraftStatusesDisabled || isCreateForm}
                        >
                            <div style={status === INVOICE_STATUS_CANCELED ? { color: colors.brown[5] } : {}}>
                                <Typography.Text type={status === INVOICE_STATUS_CANCELED ? 'inherit' : 'primary'} disabled={isNotDraftStatusesDisabled} strong>{InvoiceStatusCancelledLabel}</Typography.Text>
                            </div>
                        </Radio>
                    </Space>
                </RadioGroup>
            </Form.Item>
            <Form.Item
                name='status'
                hidden
            />
            <Modal
                title={CancelInvoiceMessage}
                open={isCancelModalOpen}
                onCancel={() => setIsCancelModalOpen(false)}
                footer={[
                    <Button
                        onClick={() => {
                            form.setFieldsValue({
                                status: INVOICE_STATUS_CANCELED,
                            })
                            setStatus(INVOICE_STATUS_CANCELED)
                            setIsCancelModalOpen(false)
                        }}
                        key='submit'
                        type='primary'
                        color={colors.red[5]}
                    >
                        {CancelInvoiceButtonMessage}
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary'>
                    {CancelInvoiceDescription}
                </Typography.Text>
            </Modal>
        </>
    )
}

type InvoiceRowType = {
    count: number
    isMin: boolean
    name: string
    toPay: string
    sku?: string
}

type InvoiceFormValuesType = {
    payerData: boolean
    rows: InvoiceRowType[]
    paymentType: typeof INVOICE_PAYMENT_TYPES[number]
    status: typeof INVOICE_STATUSES[number]
    clientName?: string
    clientPhone?: string
    contact?: string
    propertyId?: string
    unitName?: string
    unitType?: string
}

type BaseInvoiceFormProps = {
    action: (values: InvoiceFormValuesType) => Promise<Invoice>
    organization: Organization
    role: OrganizationEmployeeRole
    isCreateForm?: boolean
    isCreatedByResident?: boolean
    initialValues?: InvoiceFormValuesType
    OnCompletedMsg?
}

export const BaseInvoiceForm: React.FC<BaseInvoiceFormProps> = ({ isCreateForm, isCreatedByResident, action, organization, role, initialValues, OnCompletedMsg }) => {
    const intl = useIntl()
    const ServicesChosenLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.servicesChosen' })
    const TotalToPayLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.totalToPay' })
    const PaymentModeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payment' })
    const PaymentOnlineLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payment.online' })
    const PaymentCashLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payment.cash' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const ServicesListMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.servicesList' })
    const NoPayerDataAlertMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.noPayerData' })
    const NoPayerDataAlertDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.noPayerData' })
    const FromMessage = intl.formatMessage({ id: 'global.from' }).toLowerCase()

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const [status, setStatus] = useState<typeof INVOICE_STATUSES[number]>(get(initialValues, 'status'))
    const [paymentType, setPaymentType] = useState<typeof INVOICE_PAYMENT_TYPES[number]>(get(initialValues, 'paymentType'))

    const isAllFieldsDisabled = status === INVOICE_STATUS_CANCELED ||
        (paymentType === INVOICE_PAYMENT_TYPE_ONLINE && status === INVOICE_STATUS_PAID)

    const currencyCode = get(invoiceContext, 'currencyCode')
    const parts = intl.formatNumberToParts('', { style: 'currency', currency: currencyCode })
    const currencySymbolObj = parts.find(part => part.type === 'currency')
    const currencySymbol = get(currencySymbolObj, 'value')
    const moneyRender = useMemo(() => getMoneyRender(intl, FromMessage, currencyCode), [FromMessage, currencyCode, intl])

    return (
        <FormWithAction
            initialValues={initialValues}
            action={action}
            layout='horizontal'
            colon={false}
            OnCompletedMsg={OnCompletedMsg}
            scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
            validateTrigger={FORM_VALIDATE_TRIGGER}
            children={({ handleSave, form }) => (
                <Row gutter={OUTER_VERTICAL_GUTTER}>
                    <Col span={20}>
                        <Row gutter={GROUP_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Form.Item
                                    dependencies={['status']}
                                >
                                    {
                                        ({ getFieldValue }) => {
                                            const status = getFieldValue('status')
                                            const disabled = isAllFieldsDisabled || status !== INVOICE_STATUS_DRAFT || isCreatedByResident

                                            return <PayerDataFields
                                                organization={organization}
                                                form={form}
                                                role={role}
                                                disabled={disabled}
                                                initialValues={initialValues}
                                            />
                                        }
                                    }
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={22}>
                        <Row>
                            <Col span={24}>
                                <Typography.Title level={3}>{ServicesListMessage}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    dependencies={['propertyId', 'status']}
                                >
                                    {
                                        ({ getFieldsValue }) => {
                                            const { propertyId } = getFieldsValue(['propertyId'])
                                            const disabled = isAllFieldsDisabled || isCreatedByResident ||
                                                (!isCreateForm && status !== INVOICE_STATUS_DRAFT)

                                            return <ServicesList
                                                organizationId={organization.id}
                                                propertyId={propertyId}
                                                form={form}
                                                currencySymbol={currencySymbol}
                                                disabled={disabled}
                                                setStatus={setStatus}
                                            />
                                        }
                                    }
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={20}>
                        <Form.Item
                            shouldUpdate
                        >
                            {
                                ({ getFieldValue }) => {
                                    const rows = getFieldValue('rows').filter(Boolean)

                                    const totalCount = rows.reduce((acc, row) => acc + row.count, 0)

                                    let hasMinPrice
                                    let hasError
                                    const totalPrice = rows.reduce((acc, row) => {
                                        const rawPrice = row.toPay
                                        const count = row.count
                                        const { error, isMin, total } = prepareTotalPriceFromInput(count, rawPrice, FromMessage)
                                        if (!hasError && error) {
                                            hasError = true
                                        }
                                        if (!hasMinPrice && isMin) {
                                            hasMinPrice = true
                                        }

                                        return acc + total
                                    }, 0)

                                    return (
                                        <Row gutter={[0, 12]}>
                                            <Col md={24}>
                                                <SubTotalInfo
                                                    label={ServicesChosenLabel}
                                                    total={totalCount}
                                                    totalTextType='primary'
                                                />
                                            </Col>
                                            <Col md={24}>
                                                <SubTotalInfo
                                                    label={TotalToPayLabel}
                                                    total={moneyRender(totalPrice, hasMinPrice)}
                                                    large
                                                    totalTextType={hasMinPrice ? 'danger' : 'primary'}
                                                />
                                            </Col>
                                        </Row>
                                    )
                                }
                            }
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Row gutter={[0, 40]}>
                            <Col md={20}>
                                <Form.Item
                                    label={<Typography.Text strong>{PaymentModeLabel}</Typography.Text>}
                                    name='paymentType'
                                    labelCol={{
                                        style: { marginRight: '24px' },
                                    }}
                                >
                                    <RadioGroup
                                        onChange={(e) => {
                                            const value = get(e, 'target.value')
                                            setPaymentType(value)

                                            setStatus(INVOICE_STATUS_DRAFT)
                                            form.setFieldsValue({ status: INVOICE_STATUS_DRAFT })
                                        }}
                                        disabled={isAllFieldsDisabled}
                                    >
                                        <Space size={24} wrap direction='horizontal'>
                                            <Radio value={INVOICE_PAYMENT_TYPE_ONLINE}>
                                                <Typography.Text disabled={isAllFieldsDisabled} strong>{PaymentOnlineLabel}</Typography.Text>
                                            </Radio>
                                            <Radio value={INVOICE_PAYMENT_TYPE_CASH}>
                                                <Typography.Text disabled={isAllFieldsDisabled} strong>{PaymentCashLabel}</Typography.Text>
                                            </Radio>
                                        </Space>
                                    </RadioGroup>
                                </Form.Item>
                            </Col>
                            <Col md={20}>
                                <Form.Item
                                    dependencies={['paymentType', 'payerData', 'propertyId', 'unitName', 'unitType', 'clientName', 'clientPhone', 'hasIsMinPrice']}
                                >
                                    {
                                        ({ getFieldsValue }) => {
                                            const {
                                                payerData, propertyId, unitName, unitType, clientName, clientPhone, hasIsMinPrice,
                                            } = getFieldsValue(['payerData', 'propertyId', 'unitName', 'unitType', 'clientName', 'clientPhone', 'hasIsMinPrice'])
                                            const isNoPayerData = payerData && (!propertyId || !unitName || !unitType || !clientName || !clientPhone)
                                            const isNotDraftStatusesDisabled = isAllFieldsDisabled || hasIsMinPrice || isNoPayerData

                                            return <StatusRadioGroup
                                                paymentType={paymentType}
                                                isAllFieldsDisabled={isAllFieldsDisabled}
                                                isNotDraftStatusesDisabled={isNotDraftStatusesDisabled}
                                                isCreateForm={isCreateForm}
                                                form={form}
                                                status={status}
                                                setStatus={setStatus}
                                            />
                                        }
                                    }
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Form.Item
                        dependencies={['paymentType', 'status', 'payerData', 'propertyId', 'unitName', 'unitType', 'clientName']}
                        noStyle
                    >
                        {
                            ({ getFieldsValue }) => {
                                const {
                                    status, paymentType, payerData, propertyId, unitName, unitType, clientPhone,
                                } = getFieldsValue(['status', 'paymentType', 'payerData', 'propertyId', 'unitName', 'unitType', 'clientPhone'])

                                if (status !== INVOICE_STATUS_PUBLISHED || paymentType !== INVOICE_PAYMENT_TYPE_ONLINE) {
                                    return
                                }

                                if (!payerData) {
                                    return (
                                        <Col md={20}>
                                            <Alert
                                                type='info'
                                                message={NoPayerDataAlertMessage}
                                                description={NoPayerDataAlertDescription}
                                                showIcon
                                            />
                                        </Col>
                                    )
                                }

                                if (!propertyId || !unitName || !unitType || !clientPhone) {
                                    return
                                }

                                return (
                                    <Col md={20}>
                                        <ResidentPaymentAlert
                                            propertyId={propertyId}
                                            unitName={unitName}
                                            unitType={unitType}
                                            clientPhone={clientPhone}
                                            isCreatedByResident={isCreatedByResident}
                                        />
                                    </Col>
                                )
                            }
                        }
                    </Form.Item>
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='primary'
                                >
                                    {SaveLabel}
                                </Button>,
                            ]}
                        />
                    </Col>
                </Row>
            )}/>
    )
}
