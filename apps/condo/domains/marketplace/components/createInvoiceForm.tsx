import { useLazyQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Col, Form, Row, RowProps, Input, AutoComplete, Select } from 'antd'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { PlusCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Alert, Button, Radio, RadioGroup, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import {
    INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_PUBLISHED,
    INVOICE_STATUS_PAID,
    INVOICE_STATUS_CANCELED,
    INVOICE_PAYMENT_TYPE_ONLINE,
    INVOICE_PAYMENT_TYPE_CASH,
} from '@condo/domains/marketplace/constants'
import { Invoice, InvoiceContext, MarketPriceScope } from '@condo/domains/marketplace/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { GET_RESIDENT_EXISTENCE_BY_PHONE_AND_ADDRESS_QUERY } from '@condo/domains/resident/gql'

import { BuildingUnitSubType } from '../../../schema'
import { Loader } from '../../common/components/Loader'
import { getClientSideSenderInfo } from '../../common/utils/userid.utils'
import { PropertyAddressSearchInput } from '../../property/components/PropertyAddressSearchInput'
import { UnitInfoMode } from '../../property/components/UnitInfo'
import { UnitNameInput, UnitNameInputOption } from '../../user/components/UnitNameInput'


const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']

const SCROLL_TO_FIRST_ERROR_CONFIG = { behavior: 'smooth', block: 'center' }
const OUTER_VERTICAL_GUTTER: RowProps['gutter'] = [0, 60]
const GROUP_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]

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

const ContactsInfoFocusContainer = styled(FocusContainer)`
  position: relative;
  left: ${({ padding }) => padding ? padding : '24px'};
  box-sizing: border-box;
  width: 100%;
`

const PropertyFormField = ({ organization, form, disabled }) => {
    const intl = useIntl()
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    
    const handlePropertySelectChange = useCallback(async (_, option) => {
        const newPropertyId = isEmpty(option) ? null : option.key
        const map = isEmpty(option) ? null : option.map

        form.setFieldsValue({
            unitName: null,
            unitType: null,
            propertyId: newPropertyId,
            map,
        })
    }, [form])
    
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
                includeMapInOptions
                disabled={disabled}
            />
        </Form.Item>
    )
}

const UnitNameFormField = ({ form, disabled }) => {
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
                dependencies={['propertyId']}
            >
                {
                    ({ getFieldValue }) => {
                        const propertyMap = getFieldValue('map')

                        return (
                            <UnitNameInput
                                property={{ map: propertyMap }}
                                allowClear
                                mode={UnitInfoMode.All}
                                onChange={onChange}
                                disabled={disabled}
                            />
                        )
                    }
                }
            </Form.Item>
            <Form.Item
                name='unitName'
                hidden
            />
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
                ({ getFieldValue }) => {
                    const property = getFieldValue('propertyId')
                    const unitName = getFieldValue('unitName')
                    const unitType = getFieldValue('unitType')

                    return (
                        <ContactsEditorComponent
                            form={form}
                            fields={{
                                id: 'contact',
                                phone: 'clientPhone',
                                name: 'clientName',
                            }}
                            value={{
                                id: null, phone: null, name: null,
                            }}
                            hasNotResidentTab={false}
                            hideFocusContainer
                            hideTabBar
                            property={property}
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

const PayerDataFields = ({ organization, form, role, disabled, initialFormValues }) => {
    const [hasPayerData, setHasPayerData] = useState<boolean>(initialFormValues.payerData)

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
                            label='Есть данные о плательщике'
                        />
                        <Radio
                            key='2'
                            value={false}
                            label='Нет данных'
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
                                                form={form}
                                                disabled={disabled}
                                            />
                                        </Col>
                                        <Col span={4}>
                                            <UnitNameFormField
                                                form={form}
                                                disabled={disabled}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
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

const getMoneyRender = (intl, currencyCode?: string) => {
    return function render (text: string, isMin: boolean) {
        const formattedParts = intl.formatNumberToParts(parseFloat(text),  currencyCode ? { style: 'currency', currency: currencyCode } : {})
        const formattedValue = formattedParts.map((part) => {
            return part.value
        }).join('')

        return isMin ? `от ${formattedValue}` : formattedValue
    }
}

const prepareTotalPriceFromInput = (count, rawPrice) => {
    if (!isNaN(+rawPrice)) {
        return { total: +rawPrice * count }
    }

    const splittedRawPrice = rawPrice.split(' ')

    if (splittedRawPrice.length === 2 && splittedRawPrice[0] === 'от' && !isNaN(+splittedRawPrice[1])) {
        return { isMin: true, total: +splittedRawPrice[1] * count }
    }

    return { error: true }
}

const StyledFormItem = styled(Form.Item)`
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

type MarketItemOptionType = {
    label: string, value: string, price: string, isMin: boolean, sku: string
}

const ServicesList = ({ organizationId, propertyId, form, currencySymbol }) => {
    const intl = useIntl()
    const ServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.service' })
    const QuntityLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.quantity' })
    const TotalPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.totalPrice' })
    const AddServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.addService' })
    const PriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.price' })

    const filterByProperty = useMemo(() => {
        const baseFilterByProperty = { property_is_null: true }

        return propertyId ? { OR: [{ property: { id: propertyId } }, baseFilterByProperty] } : baseFilterByProperty
    }, [propertyId])

    const { objs: marketPriceScopes, loading } = MarketPriceScope.useAllObjects({
        where: {
            AND: [
                { marketItemPrice: { marketItem: { organization: { id: organizationId } } } },
                { ...filterByProperty },
            ],
        },
    })

    const groups = []

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
            price, isMin, sku,
            key: marketItem.id,
        }

        const existedGroup = groups.find(group => group.key === key)
        if (existedGroup) {
            existedGroup.options.push(item)
        } else {
            groups.push({ key, label, options: [item] })
        }
    }

    groups.sort((a, b) => a.key > b.key ? 1 : -1)

    const moneyRender = getMoneyRender(intl)

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
                                            rules={[{ required: true, message: 'Пожалуйста, введите число' }]}
                                        >
                                            <AutoComplete
                                                allowClear
                                                options={groups}
                                                filterOption
                                                onSelect={(_, marketItem: MarketItemOptionType) => {
                                                    form.setFieldsValue({
                                                        rows: {
                                                            ...form.getFieldValue('rows'),
                                                            [marketItemForm.name]: {
                                                                ...form.getFieldValue(['rows', marketItemForm.name]),
                                                                price: marketItem.isMin ? `от ${marketItem.price}` : marketItem.price,
                                                                isMin: marketItem.isMin,
                                                                sku: marketItem.sku,
                                                            },
                                                        },
                                                    })

                                                    form.validateFields([['rows', marketItemForm.name, 'price']])
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
                                            rules={[{ required: true, message: 'Пожалуйста, введите число' }]}
                                            initialValue={1}
                                        >
                                            <Select options={[...Array(50).keys() ].map( i => ({
                                                label: `${i + 1}`,
                                                key: i + 1,
                                                value: i + 1,
                                            }))}/>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} lg={5}>
                                        <StyledFormItem
                                            label={PriceLabel}
                                            required
                                            name={[marketItemForm.name, 'price']}
                                            labelCol={{ span: 24 }}
                                            rules={[
                                                { required: true, message: 'Пожалуйста, введите число' },
                                                {
                                                    warningOnly: true,
                                                    validator: (_, value) => {
                                                        if (/^от (\d+|\d+,\d+)$/.test(value)) {
                                                            form.setFieldsValue({
                                                                disableCheckboxes: true,
                                                                status: INVOICE_STATUS_DRAFT,
                                                            })

                                                            return Promise.reject('Неточная цена может быть только у счёта в статусе «Черновик»')
                                                        }

                                                        form.setFieldsValue({
                                                            disableCheckboxes: false,
                                                        })

                                                        return Promise.resolve()
                                                    },
                                                },
                                                {
                                                    pattern: /^(от |)(\d+|\d+,\d+)$/,
                                                    message: 'Введите корректное число',
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder="Введите число или 'от <число>'"
                                                addonAfter={currencySymbol}
                                            />
                                        </StyledFormItem>
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
                                                    const rawPrice = getFieldValue(['rows', marketItemForm.name, 'price'])
                                                    const { error, isMin, total } = prepareTotalPriceFromInput(count, rawPrice)
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
                        <Typography.Text strong onClick={() => operation.add()}>
                            <Space size={4}>
                                <PlusCircle size='large'/>
                                {AddServiceLabel}
                            </Space>
                        </Typography.Text>
                    </Col>
                </Row>
            }
        </Form.List>
    )
}

const ResidentPaymentAlert = ({ propertyId, unitName, unitType, clientPhone }) => {
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
    }, [clientPhone, getResidentExistenceByPhoneAndAddress, propertyId, unitName, unitType])

    if (loading) return <Loader />
    if (!residentExistence) return null

    let type: 'warning' | 'info'
    let message
    let description

    if (residentExistence.hasResidentOnAddress) {
        type = 'info'
        message = 'Скорее всего, этот житель сможет оплатить счёт в приложении Дома'
        description = 'Этот житель точно устанавливал приложение. У него в приложении появится кнопка «Оплатить». Если он приложение уже удалил — передайте ему ссылку на оплату любым удобным вам способом.\n' +
            'Эта ссылка будет автоматически сгенерирована после сохранения счёта'
    } else if (residentExistence.hasResident) {
        type = 'warning'
        message = 'Скорее всего, этот житель сможет оплатить счёт в приложении Дома'
        description = 'Этот житель точно устанавливал приложение, правда не на этом адресе. Если он добавит этот адрес, то в приложении появится кнопка «Оплатить». Если он приложение уже удалил — передайте ему ссылку на оплату любым удобным вам способом.\n' +
            'Эта ссылка будет автоматически сгенерирована после сохранения счёта'
    } else {
        type = 'warning'
        message = 'Передайте ссылку на оплату жителю'
        description = 'У этого жителя не установлено приложение Дома или этот адрес не добавлен. Поэтому не забудьте передать ему ссылку на оплату, любым доступным вам способом.\n' +
            'Эта ссылка будет автоматически сгенерирована после сохранения счёта'
    }

    return <Alert
        type={type}
        message={message}
        description={description}
        showIcon
    />
}


export const CreateInvoiceForm = ({ isCreateFrom }) => {
    const intl = useIntl()
    const ServicesChosenLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.servicesChosen' })
    const TotalToPayLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.totalToPay' })
    const PaymentModeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.payment' })
    const PaymentOnlineLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.payment.online' })
    const PaymentCashLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.payment.cash' })
    const InvoiceStatusLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.invoiceStatus' })
    const InvoiceStatusDraftLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.invoiceStatus.draft' })
    const InvoiceStatusReadyLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.invoiceStatus.ready' })
    const InvoiceStatusPaidLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.invoiceStatus.paid' })
    const InvoiceStatusCancelledLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.invoiceStatus.cancelled' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization, link } = useOrganization()

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()
    // const validations = {
    //     property: [requiredValidator, addressValidator(selectedPropertyId, isMatchSelectedProperty)],
    // }

    const router = useRouter()

    const createInvoiceAction = Invoice.useCreate({
        //
    }, async () => {
        //
    })

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const currencyCode = get(invoiceContext, 'currencyCode')
    const parts = intl.formatNumberToParts('', { style: 'currency', currency: currencyCode })
    const currencySymbolObj = parts.find(part => part.type === 'currency')
    const currencySymbol = get(currencySymbolObj, 'value')
    // const moneyRender = getMoneyRender(intl, currencyCode)

    const handleSubmit = useCallback(async (values) => {
        console.log('handle submit', values)
        let newInvoiceData = {}

        const contact = get(values, 'contact')
        if (contact) {
            newInvoiceData = { ...newInvoiceData, contact: { connect: { id: contact } } }
        }
        const property = get(values, 'propertyId')
        if (property) {
            newInvoiceData = { ...newInvoiceData, property: { connect: { id: property } } }
        }

        const rawRows = get(values, 'rows', [])
        const vatPercent = invoiceContext.vatPercent
        const salesTaxPercent = invoiceContext.salesTaxPercent

        const rows = rawRows.map(row => ({
            name: row.name, toPay: row.price, count: row.count, sku: row.sku, isMin: row.isMin,
            currencyCode, vatPercent, salesTaxPercent,
        }))

        newInvoiceData = {
            ...newInvoiceData,
            context: { connect: { id: invoiceContext.id } },
            status: get(values, 'status'),
            paymentType: get(values, 'paymentType'),
            unitName: get(values, 'unitName'),
            unitType: get(values, 'unitType'),
            rows,
        }

        return await createInvoiceAction(newInvoiceData)
    }, [currencyCode, invoiceContext])

    const initialFormValues = useMemo(() =>
        ({ rows: [{ name: '', count: 1, price: 0 }], paymentType: INVOICE_PAYMENT_TYPE_ONLINE, status: INVOICE_STATUS_DRAFT, payerData: true }),
    [])

    const moneyRender = getMoneyRender(intl, currencyCode)

    return (
        <FormWithAction
            initialValues={initialFormValues}
            action={handleSubmit}
            layout='horizontal'
            colon={false}
            OnCompletedMsg={null}
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
                                            const isClientDataDisabled = status !== INVOICE_STATUS_DRAFT

                                            return <PayerDataFields
                                                organization={organization}
                                                form={form}
                                                role={link}
                                                disabled={isClientDataDisabled}
                                                initialFormValues={initialFormValues}
                                            />
                                        }
                                    }
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={20}>
                        <Row gutter={SMALL_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Typography.Title level={3}>Список услуг</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    dependencies={['propertyId']}
                                >
                                    {
                                        ({ getFieldValue }) => {
                                            const propertyId = getFieldValue('propertyId')

                                            return <ServicesList
                                                organizationId={organization.id}
                                                propertyId={propertyId}
                                                form={form}
                                                currencySymbol={currencySymbol}
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
                                        const rawPrice = row.price
                                        const count = row.count
                                        const { error, isMin, total } = prepareTotalPriceFromInput(count, rawPrice)
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
                                            <Col md={19}>
                                                <SubTotalInfo
                                                    label={ServicesChosenLabel}
                                                    total={totalCount}
                                                    totalTextType='primary'
                                                />
                                            </Col>
                                            <Col md={19}>
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
                    <Col md={20}>
                        <Form.Item
                            label={<Typography.Text strong>{PaymentModeLabel}</Typography.Text>}
                            name='paymentType'
                        >
                            <RadioGroup
                                onChange={() => form.setFieldsValue({ status: INVOICE_STATUS_DRAFT })}
                            >
                                <Space size={8} wrap direction='horizontal'>
                                    <Radio value={INVOICE_PAYMENT_TYPE_ONLINE}>
                                        <Typography.Text strong>{PaymentOnlineLabel}</Typography.Text>
                                    </Radio>
                                    <Radio value={INVOICE_PAYMENT_TYPE_CASH}>
                                        <Typography.Text strong>{PaymentCashLabel}</Typography.Text>
                                    </Radio>
                                </Space>
                            </RadioGroup>
                        </Form.Item>
                    </Col>
                    <Col md={20}>
                        <Form.Item
                            dependencies={['paymentType', 'status', 'payerData', 'propertyId', 'unitName', 'unitType', 'clientName', 'clientPhone', 'disableCheckboxes']}
                        >
                            {
                                ({ getFieldsValue }) => {
                                    const {
                                        paymentType, status, payerData, propertyId, unitName, unitType, clientName, clientPhone, disableCheckboxes,
                                    } = getFieldsValue(['paymentType', 'status', 'payerData', 'propertyId', 'unitName', 'unitType', 'clientName', 'clientPhone', 'disableCheckboxes'])

                                    const isNoPayerData = payerData && (!propertyId || !unitName || !unitType || !clientName || !clientPhone)
                                    const isOnlinePaymentType = paymentType === INVOICE_PAYMENT_TYPE_ONLINE

                                    const disabled = disableCheckboxes || isNoPayerData

                                    return (
                                        <Form.Item
                                            label={<Typography.Text strong>{InvoiceStatusLabel}</Typography.Text>}
                                            name='status'
                                        >
                                            <RadioGroup>
                                                <Space size={8} wrap direction='horizontal'>
                                                    <Radio value={INVOICE_STATUS_DRAFT}>
                                                        <Typography.Text strong>{InvoiceStatusDraftLabel}</Typography.Text>
                                                    </Radio>
                                                    <Radio value={INVOICE_STATUS_PUBLISHED} disabled={disabled}>
                                                        <Typography.Text type={status === INVOICE_STATUS_PUBLISHED ? 'warning' : 'primary'} disabled={disabled} strong>{InvoiceStatusReadyLabel}</Typography.Text>
                                                    </Radio>
                                                    <Radio value={INVOICE_STATUS_PAID} disabled={disabled || isOnlinePaymentType}>
                                                        <Typography.Text type={status === INVOICE_STATUS_PAID ? 'success' : 'primary'} disabled={disabled} strong>{InvoiceStatusPaidLabel}</Typography.Text>
                                                    </Radio>
                                                    <Radio value={INVOICE_STATUS_CANCELED} disabled={disabled || isCreateFrom}>
                                                        <div style={status === INVOICE_STATUS_CANCELED ? { color: colors.brown[5] } : {}}>
                                                            <Typography.Text type={status === INVOICE_STATUS_CANCELED ? 'inherit' : 'primary'} disabled={disabled} strong>{InvoiceStatusCancelledLabel}</Typography.Text>
                                                        </div>
                                                    </Radio>
                                                </Space>
                                            </RadioGroup>
                                        </Form.Item>
                                    )
                                }
                            }
                        </Form.Item>
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
                                                message='Ссылка на оплату будет готова после сохранения счёта'
                                                description='Её можно будет передать жителю любым удобным вам способом '
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
