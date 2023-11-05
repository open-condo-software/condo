
import { Col, Form, Input, Row, RowProps, Typography } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { PlusCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Radio, RadioGroup, Select, Space } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors/'

import { Button as ButtonOld } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { INVOICE_STATUSES } from '@condo/domains/marketplace/constants'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'

import { Invoice } from '../utils/clientSchema'


const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const PAYMENT_MODE_ONLINE = 'online'
const PAYMENT_MODE_CASH = 'cash'
const [ INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_PUBLISHED,
    INVOICE_STATUS_PAID,
    INVOICE_STATUS_CANCELLED] = INVOICE_STATUSES

const SCROLL_TO_FIRST_ERROR_CONFIG = { behavior: 'smooth', block: 'center' }
const VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const ADD_BUTTON_STYLES = { display:'flex', alignItems:'center', gap: '4px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', width: 'fit-content' }


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

const SubTotalInfo = ({ label, total, size = 'medium' }) => {
    return (
        <Row align='bottom' justify='space-between' gutter={[8, 0]}>
            <Col>
                {size === 'large' ? (
                    <Typography.Title level={2}>{label}</Typography.Title>
                ) : (
                    <Typography.Text>{label}</Typography.Text>
                )}
            </Col>
            <Col style={{ borderBottom: `1px solid ${colors.gray[3]}`, flex: '1' }} />
            <Col>
                {size === 'large' ? (
                    <Typography.Title level={2}>{total}</Typography.Title>
                ) : (
                    <Typography.Text>{total}</Typography.Text>
                )}
            </Col>
        </Row>
    )
}


export const CreateInvoiceForm = () => {
    const intl = useIntl()
    const ServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.service' })
    const QuntityLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.quantity' })
    const PriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.price' })
    const TotalPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.totalPrice' })
    const AddServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.form.addService' })
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

    const emptyService = { service: '', quantity: 1, price: 0, totalPrice: 0 }
    const [services, setServices] = useState<Array<ServiceType>>([emptyService])
    const [paymentMode, setPaymentMode] = useState(PAYMENT_MODE_ONLINE)
    const [invoiceStatus, setInvoiceStatus] = useState(INVOICE_STATUS_DRAFT)

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const handleAddService = () => {
        setServices([...services, emptyService])
    }

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()
    const validations = {
        property: [requiredValidator, addressValidator(selectedPropertyId, isMatchSelectedProperty)],
    }

    const router = useRouter()

    const createInvoiceAction = Invoice.useCreate({
        //
    }, async () => {
        //
    })

    const handleSubmit = useCallback(async (values) => {
        return 
    }, [])

    const getHandleSelectPropertyAddress = useCallback((form) => (_, option) => {
        setSelectedPropertyId(String(option.key))
    }, [])

    const handleRemoveService = (index) => {
        const updatedServices = [...services]
        updatedServices.splice(index, 1)
        setServices(updatedServices)
    }

    const handlePaymentTypeChange = useCallback((form) => (e) => {
        setPaymentMode(e.target.value)
    }, [])

    const handleStatusChange = useCallback((form) => (e) => {
        setPaymentMode(e.target.value)
    }, [])


    return (

        <FormWithAction
            initialValues={{ services: [{ service: '', quantity: 1, price: 0, totalPrice: 0 }] }}
            // form={form}
            action={handleSubmit}
            layout='horizontal'
            // onValuesChange={handleValuesChange}
            // onChange={handleValuesChange}
            colon={false}
            OnCompletedMsg={null}
            scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
            validateTrigger={FORM_VALIDATE_TRIGGER}
            children={({ handleSave, form }) => (
                <Row gutter={VERTICAL_GUTTER}>
                    <Col md={20}>
                        <Row gutter={SMALL_VERTICAL_GUTTER}>
                            {services.map((service, index) => {
                                return <>
                                    <Col md={6} xs={24}>
                                        <Form.Item
                                            label={ServiceLabel}
                                            name={[index, 'service']}
                                            required
                                            labelCol={{ span: 24 }}
                                            labelAlign='left'
                                            // rules={numberValidator}
                                        >
                                            <Input/>

                                        </Form.Item>

                                    </Col>
                                    <Col md={{ span: 2, offset: 1 }} xs={24}>
                                        <Form.Item
                                            label={QuntityLabel}
                                            name={[index, 'quantity']}
                                            required
                                            labelCol={{ span: 24 }}
                                            labelAlign='left'>
                                            <Select options={[...Array(50).keys() ].map( i => ({
                                                label: `${i + 1}`,
                                                key: i + 1,
                                                value: i + 1,
                                            }))}/>
                                        </Form.Item>
                                    </Col>
                                    <Col md={{ span: 4, offset: 1 }} xs={24}>
                                        <Form.Item
                                            label={PriceLabel}
                                            required
                                            labelCol={{ span: 24 }}
                                            name={[index, 'price']}
                                        >
                                            <Input addonAfter='₽' type='number' />
                                        </Form.Item>
                                    </Col>
                                    <Col md={{ span: 4, offset: 1 }} xs={24}>
                                        <Form.Item
                                            label={TotalPriceLabel}
                                            required
                                            labelCol={{ span: 24 }}
                                            name={[index, 'totalPrice']}
                                            initialValue={service.quantity * service.price}
                                        >
                                            <Input type='total' addonAfter='₽' disabled />
                                        </Form.Item>
                                    </Col>
                                    {services.length > 1 && index !== 0 &&  (
                                        <Col md={{ span: 3, offset: 1 }} xs={24}>
                                            <Form.Item label=' '>
                                                <ButtonOld type='text' icon={<Trash />} onClick={()=>handleRemoveService(index)} />
                                            </Form.Item>

                                        </Col>
                                    )}
                                </>
                            })}
                            <Col span={24}>
                                <Typography.Text style={ADD_BUTTON_STYLES} onClick={()=>handleAddService()}>
                                    <PlusCircle size='medium'/>  {AddServiceLabel}
                                </Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={20}>
                        <Row gutter={[0, 12]}>
                            <Col md={19}>
                                <SubTotalInfo label={ServicesChosenLabel} total={services.length}/>
                            </Col>
                            <Col md={19}>
                                <SubTotalInfo
                                    label={TotalToPayLabel}
                                    size='large'
                                    total={`${services.reduce((a, b) => a + b.totalPrice, 0)} ₽`}/>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={20}>
                        <Form.Item
                            label={PaymentModeLabel}
                            name='paymentMode'
                        >
                            <RadioGroup onChange={handlePaymentTypeChange(form)}>
                                <Space size={8} wrap direction='horizontal'>
                                    <Radio value={PAYMENT_MODE_ONLINE}>
                                        {PaymentOnlineLabel}
                                    </Radio>
                                    <Radio value={PAYMENT_MODE_CASH}>
                                        {PaymentCashLabel}
                                    </Radio>
                                </Space>
                            </RadioGroup>
                        </Form.Item>
                    </Col>

                    <Col md={20}>
                        <Form.Item
                            label={InvoiceStatusLabel}
                            name='status'
                        >
                            <RadioGroup onChange={handlePaymentTypeChange(form)}>
                                <Space size={8} wrap direction='horizontal'>
                                    <Radio value={INVOICE_STATUS_DRAFT}>
                                        {InvoiceStatusDraftLabel}
                                    </Radio>
                                    <Radio value={INVOICE_STATUS_PUBLISHED}>
                                        {InvoiceStatusReadyLabel}
                                    </Radio>
                                    <Radio value={INVOICE_STATUS_PAID}>
                                        {InvoiceStatusPaidLabel}
                                    </Radio>
                                    <Radio value={INVOICE_STATUS_CANCELLED}>
                                        {InvoiceStatusCancelledLabel}
                                    </Radio>
                                </Space>
                            </RadioGroup>
                        </Form.Item>
                    </Col>
                </Row>
            )}/>
    )
}
