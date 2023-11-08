
import styled from '@emotion/styled'
import { Col, Form, Row, RowProps, Input, InputNumber, AutoComplete } from 'antd'
import { gql } from 'graphql-tag'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PlusCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Alert, Button, Radio, RadioGroup, Select, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors/'

import { Button as ButtonOld } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { GraphQlSearchInput, SearchComponentType } from '@condo/domains/common/components/GraphQlSearchInput'
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
import { Invoice, MarketPriceScope } from '@condo/domains/marketplace/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'

import { BuildingUnitSubType } from '../../../schema'
import { PropertyAddressSearchInput } from '../../property/components/PropertyAddressSearchInput'
import { UnitInfoMode } from '../../property/components/UnitInfo'
import { Property } from '../../property/utils/clientSchema'
import { UnitNameInput, UnitNameInputOption } from '../../user/components/UnitNameInput'


const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']

const SCROLL_TO_FIRST_ERROR_CONFIG = { behavior: 'smooth', block: 'center' }
const OUTER_VERTICAL_GUTTER: RowProps['gutter'] = [0, 60]
const GROUP_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

type ServiceType = {
    service: string
    quantity: number
    price: number
    totalPrice: number
}

const SubTotalInfo = ({ label, total, large = false }) => {
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
                    <Typography.Title level={4}>{total}</Typography.Title>
                ) : (
                    <Typography.Text size='medium'>{total}</Typography.Text>
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

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

const GET_ALL_MARKET_ITEMS_QUERY = gql`
    query selectMarketItems ($where: MarketItemWhereInput, $orderBy: String, $first: Int, $skip: Int) {
        objs: allMarketItems(where: $where, orderBy: $orderBy, first: $first, skip: $skip) {
            id
            name
        }
    }
`

function searchMarketItems (organizationId) {
    if (!organizationId) return

    return async function (client, value, query = {}, first, skip) {
        const where = {
            organization: { id: organizationId },
            name_contains_i: value,
            ...query,
        }
        const { data, error } = await _search(client, GET_ALL_MARKET_ITEMS_QUERY, { where, first, skip })

        const marketItems = data.objs

        if (error) console.warn(error)

        return marketItems
            .map(marketItem => ({
                value: marketItem.name,
                text: marketItem.name,
            }))
    }
}

const PropertyFormField = ({ organization, form }) => {
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
                autoFocus
                onChange={handlePropertySelectChange}
                placeholder={AddressPlaceholder}
                notFoundContent={AddressNotFoundContent}
                includeMapInOptions
            />
        </Form.Item>
    )
}

const UnitNameFormField = ({ form }) => {
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

const ContactFormField = ({ role, organizationId, form }) => {
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
                        />
                    )
                }
            }
        </Form.Item>
    )
}

const ClientDataFields = ({ organization, form, role }) => {
    return (
        <ContactsInfoFocusContainer>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Row gutter={[50, 0]}>
                        <Col span={20}>
                            <PropertyFormField
                                organization={organization}
                                form={form}
                            />
                        </Col>
                        <Col span={4}>
                            <UnitNameFormField
                                form={form}
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
            />
        </ContactsInfoFocusContainer>
    )
}

const ServicesList = ({ organizationId, propertyId, form }) => {
    const intl = useIntl()
    const ServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.service' })
    const QuntityLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.quantity' })
    const PriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.price' })
    const TotalPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.totalPrice' })
    const AddServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.addService' })

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

    const marketItemOptions = marketPriceScopes.map(scope => {
        const marketItem = get(scope, 'marketItemPrice.marketItem')
        const name = get(marketItem, 'name')
        const sku = get(marketItem, 'sku')

        const pricesArray = get(scope, 'marketItemPrice.price')
        const priceObj = get(pricesArray, '0')
        const price = get(priceObj, 'price')
        const salesTaxPercent = get(priceObj, 'salesTaxPercent')
        const vatPercent = get(priceObj, 'vatPercent')
        const isMin = get(priceObj, 'isMin')


        return {
            label: name,
            value: name,
            price, isMin, sku,
            salesTaxPercent, vatPercent,
        }
    })

    return (
        <Form.List name='rows'>
            {(marketItemForms, operation) =>
                <Row gutter={SMALL_VERTICAL_GUTTER}>
                    {
                        marketItemForms.map((marketItemForm, index) => (
                            <Col span={24} key={marketItemForm.name}>
                                <Row gutter={[50, 12]} align='bottom'>
                                    <Col xs={24} lg={8}>
                                        <Form.Item
                                            label={ServiceLabel}
                                            name={[marketItemForm.name, 'name']}
                                            required
                                            labelAlign='left'
                                            labelCol={{ span: 24 }}
                                        >
                                            <AutoComplete
                                                allowClear
                                                options={marketItemOptions}
                                                onSelect={(_, marketItem) => {
                                                    form.setFieldsValue({
                                                        rows: {
                                                            ...form.getFieldValue('rows'),
                                                            [marketItemForm.name]: {
                                                                ...form.getFieldValue(['rows', [marketItemForm.name]]),
                                                                price: marketItem.price,
                                                            },
                                                        },
                                                    })
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
                                        >
                                            <Select options={[...Array(50).keys() ].map( i => ({
                                                label: `${i + 1}`,
                                                key: i + 1,
                                                value: i + 1,
                                            }))}/>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} lg={5}>
                                        <Form.Item
                                            label={PriceLabel}
                                            required
                                            name={[marketItemForm.name, 'price']}
                                            labelCol={{ span: 24 }}
                                        >
                                            <Input addonAfter='₽' />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} lg={5}>
                                        <Form.Item
                                            label={TotalPriceLabel}
                                            required
                                            // name={[marketItemForm.name, 'totalPrice']}
                                            labelCol={{ span: 24 }}
                                            shouldUpdate
                                        >
                                            {
                                                ({ getFieldValue }) => {
                                                    let value
                                                    const count = getFieldValue(['rows', marketItemForm.name, 'count'])
                                                    const rawPrice = getFieldValue(['rows', marketItemForm.name, 'price'])

                                                    if (count && rawPrice) {
                                                        const price = rawPrice.startsWith('от') ? rawPrice.split(' ')[1] : rawPrice

                                                        value = count * +price
                                                    }

                                                    return <Input type='total' addonAfter='₽' disabled value={value} />
                                                }
                                            }
                                        </Form.Item>
                                    </Col>
                                    {
                                        index !== 0 && (
                                            <Col xs={24} md={2}>
                                                <Typography.Text onClick={() => operation.remove(marketItemForm.name)}>
                                                    <div style={{ paddingBottom: '10px' }}>
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


export const CreateInvoiceForm = () => {
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

    const handleSubmit = useCallback(async (values) => {
        console.log('values', values)
        return
    }, [])

    const initialFormValues = useMemo(() =>
        ({ rows: [{ name: '', count: 1, price: 0 }], paymentType: INVOICE_PAYMENT_TYPE_ONLINE, status: INVOICE_STATUS_DRAFT, payerData: true }),
    [])

    const [hasPayerData, setHasPayerData] = useState<boolean>(initialFormValues.payerData)

    return (
        <FormWithAction
            initialValues={initialFormValues}
            action={handleSubmit}
            layout='horizontal'
            // onValuesChange={handleValuesChange}
            // onChange={handleValuesChange}
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
                                    name='payerData'
                                >
                                    <RadioGroup
                                        optionType='button'
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
                                        <ClientDataFields
                                            organization={organization}
                                            form={form}
                                            role={link}
                                        />
                                    </Col>
                                )
                            }
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
                                    const totalPrice = rows.reduce((acc, row) => acc + row.price * row.count, 0)

                                    return (
                                        <Row gutter={[0, 12]}>
                                            <Col md={19}>
                                                <SubTotalInfo
                                                    label={ServicesChosenLabel}
                                                    total={totalCount}
                                                />
                                            </Col>
                                            <Col md={19}>
                                                <SubTotalInfo
                                                    label={TotalToPayLabel}
                                                    total={`${totalPrice} ₽`}
                                                    large
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
                            <RadioGroup>
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
                            dependencies={['paymentType', 'status']}
                        >
                            {
                                ({ getFieldValue }) => {
                                    const paymentType = getFieldValue('paymentType')
                                    const disabledTerminalStatuses = paymentType === INVOICE_PAYMENT_TYPE_ONLINE
                                    const status = getFieldValue('status')

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
                                                    <Radio value={INVOICE_STATUS_PUBLISHED}>
                                                        <Typography.Text type={status === INVOICE_STATUS_PUBLISHED ? 'warning' : 'primary'} strong>{InvoiceStatusReadyLabel}</Typography.Text>
                                                    </Radio>
                                                    <Radio value={INVOICE_STATUS_PAID} disabled={disabledTerminalStatuses}>
                                                        <Typography.Text strong disabled={disabledTerminalStatuses}>{InvoiceStatusPaidLabel}</Typography.Text>
                                                    </Radio>
                                                    <Radio value={INVOICE_STATUS_CANCELED} disabled={disabledTerminalStatuses}>
                                                        <Typography.Text strong disabled={disabledTerminalStatuses}>{InvoiceStatusCancelledLabel}</Typography.Text>
                                                    </Radio>
                                                </Space>
                                            </RadioGroup>
                                        </Form.Item>
                                    )
                                }
                            }
                        </Form.Item>
                    </Col>
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
