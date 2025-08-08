import { PlusCircleOutlined } from '@ant-design/icons'
import {
    BuildingUnitSubType,
    Invoice,
    Property as PropertyType,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, Row, RowProps, Input, AutoComplete, Select, FormInstance } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import React, { ComponentProps, CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Card, Button, Modal, Radio, RadioGroup, Space, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { Button as OldButton } from '@condo/domains/common/components/Button'
import {
    BaseModalForm,
    FormWithAction,
    IFormWithActionChildren,
} from '@condo/domains/common/components/containers/FormList'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import Prompt from '@condo/domains/common/components/Prompt'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { NEW_CONTACT_PHONE_FORM_ITEM_NAME, NEW_CONTACT_NAME_FORM_ITEM_NAME } from '@condo/domains/contact/components/ContactsEditor/NewContactFields'
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
    INITIAL_ROWS_VALUE,
    DEFAULT_INVOICE_CURRENCY_CODE,
    MIN_PRICE_VALUE,
} from '@condo/domains/marketplace/constants'
import { useCancelStatusModal } from '@condo/domains/marketplace/hooks/useCancelStatusModal'
import { MarketCategory, MarketPriceScope } from '@condo/domains/marketplace/utils/clientSchema'
import { calculateRowsTotalPrice, InvoiceFormValuesType, prepareTotalPriceFromInput, getMoneyRender } from '@condo/domains/marketplace/utils/clientSchema/Invoice'
import { PriceMeasuresType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'
import { searchOrganizationProperty } from '@condo/domains/marketplace/utils/clientSchema/search'
import { UnitInfoMode } from '@condo/domains/property/components/UnitInfo'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'

import { ResidentPaymentAlert } from './ResidentPaymentAlert'



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

const ServiceFormItem = styled(Form.Item)`
  & .ant-form-item-label {
    padding-bottom: 8px;

    & > .ant-form-item-no-colon {
      height: 22px;
    }
  }
`
const FormItemWithCustomWarningColor = styled(ServiceFormItem)`
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

const emptyContactValues = {
    clientName: null,
    clientPhone: null,
    contact: null,
    [NEW_CONTACT_PHONE_FORM_ITEM_NAME]: null,
    [NEW_CONTACT_NAME_FORM_ITEM_NAME]: null,
}

const PropertyFormField = ({ organizationId, form, disabled, selectedPropertyId, setSelectedPropertyId }) => {
    const intl = useIntl()
    const AddressPlaceholder = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.property' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const ChangeAddressAlertTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.changeAddressAlert.title' })
    const ChangeAddressAlertMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.changeAddressAlert.message' })
    const ChangeAddressAlertButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.changeAddressAlert.button' })

    const { requiredValidator } = useValidations()
    const rows = Form.useWatch('rows', form)

    const [changeAddressModalOpen, setChangeAddressModalOpen] = useState<boolean>(false)
    const [propertyIdToSelect, setPropertyIdToSelect] = useState<string>(null)

    const changePropertyId = useCallback((newPropertyId) => {
        form.setFieldsValue({
            unitName: null,
            unitType: null,
            property: newPropertyId,
            rows: INITIAL_ROWS_VALUE,
            ...emptyContactValues,
        })

        setPropertyIdToSelect(null)
        setChangeAddressModalOpen(false)
        setSelectedPropertyId(newPropertyId)
    }, [form, setSelectedPropertyId])

    const handlePropertySelectChange = useCallback(async (_, option) => {
        const newPropertyId = get(option, 'value', null)
        setPropertyIdToSelect(newPropertyId)

        if (selectedPropertyId && !isEqual(rows, INITIAL_ROWS_VALUE)) {
            setChangeAddressModalOpen(true)
        } else {
            changePropertyId(newPropertyId)
        }
    }, [changePropertyId, selectedPropertyId, rows])

    const handleCancel = useCallback(() => {
        setPropertyIdToSelect(null)
        setChangeAddressModalOpen(false)

        form.setFieldsValue({
            property: selectedPropertyId,
        })
    }, [form, selectedPropertyId])

    return (
        <>
            <Form.Item
                label={AddressLabel}
                labelCol={{ span: 24 }}
                required
                rules={[requiredValidator]}
            >
                <GraphQlSearchInput
                    value={selectedPropertyId}
                    placeholder={AddressPlaceholder}
                    notFoundContent={AddressNotFoundContent}
                    search={searchOrganizationProperty(organizationId)}
                    onChange={handlePropertySelectChange}
                    disabled={disabled}
                />
            </Form.Item>
            <Form.Item
                hidden
                noStyle
                name='property'
            />
            <Modal
                open={changeAddressModalOpen}
                title={ChangeAddressAlertTitle}
                onCancel={handleCancel}
                footer={[
                    <Button
                        key='submit'
                        type='primary'
                        onClick={() => changePropertyId(propertyIdToSelect)}
                    >
                        {ChangeAddressAlertButtonText}
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary'>
                    {ChangeAddressAlertMessage}
                </Typography.Text>
            </Modal>
        </>
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
                ...emptyContactValues,
            })
        }

        const unitType = get(option, 'data-unitType', BuildingUnitSubType.Flat)
        const unitName = get(option, 'data-unitName')

        form.setFieldsValue({
            unitName,
            unitType,
            ...emptyContactValues,
        })
    }, [form])

    return (
        <>
            <Form.Item
                label={UnitNameLabel}
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

const ContactFormField = ({ organizationId, form, disabled }) => {
    const { ContactsEditorComponent } = useContactsEditorHook({
        initialQuery: { organization: { id: organizationId } },
    })

    return (
        <>
            <Form.Item
                dependencies={['property', 'unitName', 'unitType']}
            >
                {
                    ({ getFieldsValue }) => {
                        const {
                            property, unitName, unitType, contact, clientName, clientPhone,
                        } = getFieldsValue(['property', 'unitName', 'unitType', 'contact', 'clientName', 'clientPhone'])

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
                                property={property}
                                unitName={unitName}
                                unitType={unitType}
                                contactFormItemProps={{ labelCol: { span: 24 } }}
                                newContactPhoneFormItemProps={{ labelCol: { span: 24 } }}
                                newContactNameFormItemProps={{ labelCol: { span: 24 }, name: NEW_CONTACT_NAME_FORM_ITEM_NAME }}
                                disabled={disabled}
                            />
                        )
                    }
                }
            </Form.Item>
        </>
    )
}

const PayerDataFields = ({ organizationId, form, disabled, initialValues }) => {
    const intl = useIntl()
    const HasPayerDataMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payerData' })
    const NoPayerDataMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payerNoData' })

    const [hasPayerData, setHasPayerData] = useState<boolean>(get(initialValues, 'payerData'))
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(get(initialValues, 'property'))
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
                                setSelectedPropertyId(null)
                                form.setFieldsValue({
                                    property: null,
                                    unitName: null,
                                    unitType: null,
                                    ...emptyContactValues,
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
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row gutter={[50, 0]}>
                                    <Col span={24} lg={20}>
                                        <PropertyFormField
                                            organizationId={organizationId}
                                            selectedPropertyId={selectedPropertyId}
                                            setSelectedPropertyId={setSelectedPropertyId}
                                            form={form}
                                            disabled={disabled}
                                        />
                                    </Col>
                                    <Col span={24} lg={4}>
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
                            organizationId={organizationId}
                            form={form}
                            disabled={disabled}
                        />
                    </Col>
                )
            }
        </Row>
    )
}

type MarketItemOptionType = {
    label: string
    value: string
    toPay: string
    isMin: boolean
    sku: string
    measure?: string
}

const ServicesList = ({ organizationId, propertyId, form, currencySymbol, disabled, setStatus, isModalForm }) => {
    const intl = useIntl()
    const ServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.name' })
    const QuantityLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.count' })
    const TotalPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.totalPrice' })
    const AddServiceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.addService' })
    const PriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.toPay' })
    const MeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.measure' })
    const PerItemPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.measure.perItem.full' })
    const PerMeterPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.measure.perMeter.full' })
    const PerHourPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.measure.perHour.full' })
    const NoPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.noMeasure' })
    const NumberIsNotValidMessage = intl.formatMessage({ id: 'NumberIsNotValid' })
    const ServicePlaceholder = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.service.placeholder' })
    const MinPriceValidationMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.minPriceValidation' })
    const FromMessage = intl.formatMessage({ id: 'global.from' }).toLowerCase()
    const ContractPriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.contractPrice' }).toLowerCase()
    const MinPriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.price.minPriceMessage' })

    const { requiredValidator, minLengthValidator } = useValidations()
    const { breakpoints } = useLayoutContext()

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

    const { objs: marketCategories } = MarketCategory.useAllObjects({
        where: {},
    })
    const categoriesWithOneSubCategory = useMemo(() => marketCategories.map(category => {
        const categoriesWithParent = marketCategories.filter(otherCategory =>
            get(otherCategory, 'parentCategory.id') === category.id
        )

        if (categoriesWithParent.length === 1) {
            return category.id
        }
    }).filter(Boolean), [marketCategories])

    const filteredPriceScopes = useMemo(() => marketPriceScopes
        .filter(scope => {
            if (!scope.marketItemPrice) return false

            if (!scope.property) {
                const marketItemId = get(scope, 'marketItemPrice.marketItem.id')
                const scopeWithSameMarketItemWithProperty = marketPriceScopes.find(
                    scope => get(scope, 'marketItemPrice.marketItem.id') === marketItemId && scope.property
                )

                return !scopeWithSameMarketItemWithProperty
            }

            return true
        })
    , [marketPriceScopes])

    const marketItemGroups = useMemo(() => {
        const marketItemGroups = []

        for (const scope of filteredPriceScopes) {
            const category = get(scope, 'marketItemPrice.marketItem.marketCategory')
            const key = get(category, 'parentCategory.id', get(category, 'id'))
            const label = get(category, 'parentCategory.name')

            const marketItem = get(scope, 'marketItemPrice.marketItem')
            const name = get(marketItem, 'name')
            const pricesArray = get(scope, 'marketItemPrice.price')
            const priceObj = get(pricesArray, '0')
            const price = get(priceObj, 'price')
            const isMin = get(priceObj, 'isMin')
            const measure = get(priceObj, 'measure') || undefined
            const sku = get(marketItem, 'sku')

            const marketItemOption = {
                label: name,
                value: name,
                toPay: price,
                isMin,
                sku,
                measure,
                key: get(category, 'id') + get(marketItem, 'id'),
                order: get(category, 'order'),
                labelForSort: get(category, 'name') + get(marketItem, 'name'),
            }

            const isSingleSubCategory = categoriesWithOneSubCategory.includes(get(category, 'parentCategory.id'))
            const existedGroup = marketItemGroups.find(group => group.key === key)

            if (existedGroup) {
                existedGroup.options.push(marketItemOption)

                if (
                    !isSingleSubCategory &&
                    !existedGroup.options.find(option => option.key === get(category, 'id'))
                ) {
                    const subCategoryOption = {
                        label: get(category, 'name'),
                        disabled: true,
                        key: get(category, 'id'),
                        className: 'category-option',
                        order: get(category, 'order'),
                        labelForSort: get(category, 'name'),
                    }

                    existedGroup.options.push(subCategoryOption)
                }
            } else {
                const options = []

                if (!isSingleSubCategory) {
                    options.push({
                        label: get(category, 'name'),
                        disabled: true,
                        key: get(category, 'id'),
                        className: 'category-option',
                        order: get(category, 'order'),
                        labelForSort: get(category, 'name'),
                    })
                }
                options.push(marketItemOption)

                marketItemGroups.push({ key, label, options: options, order: get(category, 'parentCategory.order') })
            }
        }

        marketItemGroups
            .sort((a, b) => a.label > b.label ? 1 : -1)
            .sort((a, b) => a.order > b.order ? 1 : -1)
        marketItemGroups.forEach(group => {
            group.options
                .sort((a, b) => a.labelForSort > b.labelForSort ? 1 : -1)
                .sort((a, b) => {
                    if (a.order > b.order) return 1
                    else if (a.order < b.order) return -1

                    return 0
                })
        })

        return marketItemGroups
    }, [categoriesWithOneSubCategory, filteredPriceScopes])

    const flatMarketOptions = useMemo(() => marketItemGroups.flatMap(group => group.options), [marketItemGroups])

    const moneyRender = useMemo(() => getMoneyRender(intl), [intl])
    const gutter: RowProps['gutter'] = useMemo(() => isModalForm ? [46, 24] : [50, 24], [isModalForm])

    const updateRowFields = useCallback((formName, newFields = {}) => {
        form.setFieldsValue({
            rows: {
                ...form.getFieldValue('rows'),
                [formName]: {
                    ...form.getFieldValue(['rows', formName]),
                    ...newFields,
                },
            },
        })
    }, [form])

    return (
        <Form.List name='rows'>
            {(marketItemForms, operation) =>
                <Row gutter={SMALL_VERTICAL_GUTTER}>
                    {
                        marketItemForms.map((marketItemForm, index) => (
                            <Card key={marketItemForm.name} hoverable={false}>
                                <Row gutter={gutter} align='top'>
                                    <Col xs={24} lg={16}>
                                        <ServiceFormItem
                                            label={ServiceLabel}
                                            name={[marketItemForm.name, 'name']}
                                            required
                                            labelAlign='left'
                                            labelCol={{ span: 24 }}
                                            rules={[requiredValidator, minLengthValidator(7)]}
                                        >
                                            <AutoComplete
                                                allowClear
                                                disabled={disabled}
                                                placeholder={ServicePlaceholder}
                                                options={marketItemGroups}
                                                filterOption
                                                onClear={() => {
                                                    form.setFieldsValue({
                                                        rows: {
                                                            ...form.getFieldValue('rows'),
                                                            [marketItemForm.name]: {
                                                                count: 1,
                                                                toPay: null,
                                                                isMin: false,
                                                                sku: null,
                                                            },
                                                        },
                                                    })
                                                }}
                                                onSelect={(_, option: MarketItemOptionType) => {
                                                    let toPayValue
                                                    if (option.isMin) {
                                                        toPayValue = option.toPay === '0' ? ContractPriceMessage : `${FromMessage} ${option.toPay}`
                                                    } else {
                                                        toPayValue = option.toPay
                                                    }

                                                    updateRowFields(marketItemForm.name, {
                                                        toPay: toPayValue,
                                                        isMin: option.isMin,
                                                        measure: option.measure ? option.measure : undefined,
                                                    })

                                                    form.validateFields([['rows', marketItemForm.name, 'toPay']])
                                                }}
                                                onChange={text => {
                                                    const existedMarketItem = flatMarketOptions.find(marketItem => marketItem.label === text)
                                                    const sku = existedMarketItem ? existedMarketItem.sku : null

                                                    updateRowFields(marketItemForm.name, {
                                                        sku,
                                                    })
                                                }}
                                            />
                                        </ServiceFormItem>
                                    </Col>
                                    <Col xs={24} lg={8}>
                                        <ServiceFormItem
                                            label={MeasureLabel}
                                            name={[marketItemForm.name, 'measure']}
                                            labelAlign='left'
                                            labelCol={{ span: 24 }}
                                        >
                                            <Select
                                                defaultValue={PriceMeasuresType.PerItem}
                                                onSelect={newPriceMeasure => {
                                                    updateRowFields(marketItemForm.name, {
                                                        measure: newPriceMeasure,
                                                        ...(newPriceMeasure === null && { count: 1 }),
                                                    })
                                                }}
                                            >
                                                <Select.Option
                                                    key={PriceMeasuresType.PerItem}
                                                    value={PriceMeasuresType.PerItem}
                                                >
                                                    { PerItemPriceMeasureLabel }
                                                </Select.Option>
                                                <Select.Option
                                                    key={PriceMeasuresType.PerHour}
                                                    value={PriceMeasuresType.PerHour}
                                                >
                                                    { PerHourPriceMeasureLabel }
                                                </Select.Option>
                                                <Select.Option
                                                    key={PriceMeasuresType.PerMeter}
                                                    value={PriceMeasuresType.PerMeter}
                                                >
                                                    { PerMeterPriceMeasureLabel }
                                                </Select.Option>
                                                <Select.Option
                                                    key='NoValue'
                                                    value={null}
                                                >
                                                    { NoPriceMeasureLabel }
                                                </Select.Option>
                                            </Select>
                                        </ServiceFormItem>
                                    </Col>
                                </Row>
                                <Row style={{ paddingTop: 24 }} gutter={gutter} align='top'>
                                    <Col xs={24} lg={6}>
                                        <FormItemWithCustomWarningColor
                                            label={PriceLabel}
                                            required
                                            name={[marketItemForm.name, 'toPay']}
                                            labelCol={{ span: 24 }}
                                            validateFirst
                                            rules={[
                                                requiredValidator,
                                                {
                                                    warningOnly: true,
                                                    validator: (_, value) => {
                                                        if (
                                                            new RegExp(`^${FromMessage} (\\d+|\\d+(,|.)\\d+)$`).test(value) ||
                                                            value === ContractPriceMessage
                                                        ) {
                                                            form.setFieldsValue({
                                                                hasIsMinPrice: true,
                                                                status: INVOICE_STATUS_DRAFT,
                                                            })
                                                            setStatus(INVOICE_STATUS_DRAFT)

                                                            return Promise.reject(MinPriceValidationMessage)
                                                        }

                                                        const rows = form.getFieldValue('rows')
                                                        if (!rows.some(row => row.isMin)) {
                                                            form.setFieldsValue({
                                                                hasIsMinPrice: false,
                                                            })
                                                        }

                                                        return Promise.resolve()
                                                    },
                                                },
                                                {
                                                    validator: (_, value) => {
                                                        if (
                                                            new RegExp(`^(${FromMessage} |)(\\d+|\\d+(,|.)\\d+)$`).test(value) ||
                                                            value === ContractPriceMessage
                                                        ) {
                                                            return Promise.resolve()
                                                        }

                                                        return Promise.reject(NumberIsNotValidMessage)
                                                    },
                                                },
                                                {
                                                    validator: (_, value) => {
                                                        if (new RegExp('^(?:\\d+(?:\\.\\d+)?|\\d+(?:,\\d+)?)$').test(value)) {
                                                            const numberValue = Number(value.replace(',', '.'))

                                                            if (numberValue < MIN_PRICE_VALUE) {
                                                                return Promise.reject(`${MinPriceMessage} – ${MIN_PRICE_VALUE}${currencySymbol}`)
                                                            }
                                                        }

                                                        return Promise.resolve()
                                                    },
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
                                                    const isMin = (splittedValue.length === 2 && splittedValue[0] === FromMessage) ||
                                                        (splittedValue.length === 1 && splittedValue[0] === ContractPriceMessage)

                                                    updateRowFields(marketItemForm.name, {
                                                        isMin,
                                                    })
                                                }}
                                            />
                                        </FormItemWithCustomWarningColor>
                                    </Col>
                                    <Col xs={24} lg={4}>
                                        <ServiceFormItem
                                            label={QuantityLabel}
                                            name={[marketItemForm.name, 'count']}
                                            required
                                            labelAlign='left'
                                            labelCol={{ span: 24 }}
                                            rules={[requiredValidator]}
                                            initialValue={1}
                                            shouldUpdate
                                        >
                                            <Select
                                                disabled={disabled || form.getFieldValue(['rows', marketItemForm.name, 'measure']) === null}
                                                options={[...Array(50).keys() ].map( i => ({
                                                    label: `${i + 1}`,
                                                    key: i + 1,
                                                    value: i + 1,
                                                }))}
                                                onSelect={(value) => {
                                                    updateRowFields(marketItemForm.name, {
                                                        count: value,
                                                    })
                                                }}
                                                onClear={() => {
                                                    updateRowFields(marketItemForm.name, {
                                                        count: null,
                                                    })
                                                }}
                                            />
                                        </ServiceFormItem>
                                    </Col>
                                    <Col xs={24} lg={6}>
                                        <ServiceFormItem
                                            label={TotalPriceLabel}
                                            required
                                            labelCol={{ span: 24 }}
                                            shouldUpdate
                                        >
                                            {
                                                ({ getFieldValue }) => {
                                                    const count = getFieldValue(['rows', marketItemForm.name, 'count'])
                                                    const rawPrice = getFieldValue(['rows', marketItemForm.name, 'toPay'])
                                                    const { error, isMin, total } = prepareTotalPriceFromInput(intl, count, rawPrice)

                                                    let value
                                                    if (error) {
                                                        value = ''
                                                    } else if (isMin && total === 0) {
                                                        value = ContractPriceMessage
                                                    } else {
                                                        value = moneyRender(String(total), isMin)
                                                    }

                                                    return <Input type='total' addonAfter={currencySymbol} disabled value={value} />
                                                }
                                            }
                                        </ServiceFormItem>
                                    </Col>
                                    <Col xs={24} lg={2}>
                                        { index !== 0 && (
                                            <Typography.Text disabled={disabled} onClick={() => {
                                                if (disabled) return
                                                operation.remove(marketItemForm.name)
                                            }}>
                                                <div style={{ paddingTop: `${breakpoints.DESKTOP_SMALL ? '42px' : '12px'}` }}>
                                                    <Trash size='large' />
                                                </div>
                                            </Typography.Text>
                                        )}
                                    </Col>
                                </Row>
                            </Card>
                        ))
                    }
                    <Col span={24} hidden={disabled}>
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

const StatusRadioGroup = ({
    isNoPayerData,
    isAllFieldsDisabled,
    onlyStatusTransitionsActive,
    isNotDraftStatusesDisabled,
    paymentType,
    isCreateForm,
    form,
    status,
    setStatus,
}) => {
    const intl = useIntl()
    const InvoiceStatusLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.invoiceStatus' })
    const InvoiceStatusDraftLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.invoiceStatus.draft' }).toLowerCase()
    const InvoiceStatusReadyLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.invoiceStatus.published' }).toLowerCase()
    const InvoiceStatusPaidLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.invoiceStatus.paid' }).toLowerCase()
    const InvoiceStatusCancelledLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.invoiceStatus.canceled' }).toLowerCase()
    const NoPayerDataTooltipTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.disabledTooltip.noPayerData' })
    const DisabledPaidForOnlineTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.disabledTooltip.disabledPaidForOnline' })
    const DisabledCanceledForCreateTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.disabledTooltip.disabledCanceledForCreate' })

    const { CancelStatusModal, setIsCancelModalOpen } = useCancelStatusModal()

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
    }, [form, setIsCancelModalOpen, setStatus])

    const isOnlinePaymentType = paymentType === INVOICE_PAYMENT_TYPE_ONLINE

    return (
        <>
            <Form.Item
                label={<Typography.Title level={3}>{InvoiceStatusLabel}</Typography.Title>}
                labelCol={{
                    span: 24,
                }}
            >
                <RadioGroup value={status} onChange={handleValueChange}>
                    <Space size={24} wrap direction='horizontal'>
                        <Radio value={INVOICE_STATUS_DRAFT} disabled={onlyStatusTransitionsActive || isAllFieldsDisabled}>
                            <Typography.Text disabled={onlyStatusTransitionsActive || isAllFieldsDisabled}>
                                {InvoiceStatusDraftLabel}
                            </Typography.Text>
                        </Radio>
                        <Tooltip title={isNoPayerData && NoPayerDataTooltipTitle}>
                            <Radio value={INVOICE_STATUS_PUBLISHED} disabled={isAllFieldsDisabled || isNotDraftStatusesDisabled}>
                                <Typography.Text
                                    type={status === INVOICE_STATUS_PUBLISHED ? 'warning' : 'primary'}
                                    disabled={isAllFieldsDisabled || isNotDraftStatusesDisabled}
                                >
                                    {InvoiceStatusReadyLabel}
                                </Typography.Text>
                            </Radio>
                        </Tooltip>
                        <Tooltip title={paymentType === INVOICE_PAYMENT_TYPE_ONLINE && DisabledPaidForOnlineTitle}>
                            <Radio
                                value={INVOICE_STATUS_PAID}
                                disabled={isAllFieldsDisabled || isNotDraftStatusesDisabled || isOnlinePaymentType}
                            >
                                <Typography.Text
                                    type={status === INVOICE_STATUS_PAID ? 'success' : 'primary'}
                                    disabled={isAllFieldsDisabled || isNotDraftStatusesDisabled || isOnlinePaymentType}
                                >
                                    {InvoiceStatusPaidLabel}
                                </Typography.Text>
                            </Radio>
                        </Tooltip>
                        <Tooltip title={isCreateForm && DisabledCanceledForCreateTitle}>
                            <Radio
                                value={INVOICE_STATUS_CANCELED}
                                disabled={isAllFieldsDisabled || isNotDraftStatusesDisabled || isCreateForm}
                            >
                                <div style={status === INVOICE_STATUS_CANCELED ? { color: colors.brown[5] } : {}}>
                                    <Typography.Text
                                        type={status === INVOICE_STATUS_CANCELED ? 'inherit' : 'primary'}
                                        disabled={isAllFieldsDisabled || isNotDraftStatusesDisabled || isCreateForm}
                                    >
                                        {InvoiceStatusCancelledLabel}
                                    </Typography.Text>
                                </div>
                            </Radio>
                        </Tooltip>
                    </Space>
                </RadioGroup>
            </Form.Item>
            <Form.Item
                name='status'
                hidden
            />
            <CancelStatusModal
                onButtonClick={() => {
                    form.setFieldsValue({
                        status: INVOICE_STATUS_CANCELED,
                    })
                    setStatus(INVOICE_STATUS_CANCELED)
                }}
            />
        </>
    )
}

type BaseInvoiceFormProps = {
    action: (values: InvoiceFormValuesType) => Promise<Invoice | void>
    organizationId: string
    initialValues?: InvoiceFormValuesType
    OnCompletedMsg?: ComponentProps<typeof FormWithAction>['OnCompletedMsg']
    isCreateForm?: boolean
    isCreatedByResident?: boolean
    modalFormProps?: ComponentProps<typeof BaseModalForm>
    isAllFieldsDisabled?: boolean
    isContactsFieldsDisabled?: boolean
    formInstance?: FormInstance
    children: React.ReactNode | IFormWithActionChildren
}

export const BaseInvoiceForm: React.FC<BaseInvoiceFormProps> = (props) => {
    const intl = useIntl()
    const ServicesChosenLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.servicesChosen' })
    const TotalToPayLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.totalToPay' })
    const PaymentModeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payment' })
    const PaymentOnlineLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payment.online' })
    const PaymentCashLabel = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.payment.cash' })
    const ServicesListMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.servicesList' })
    const NoPayerDataAlertMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.noPayerData' })
    const NoPayerDataAlertDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.noPayerData' })
    const EmptyPayerDataAlertMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.passLinkToResident' })
    const EmptyPayerDataAlertDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.emptyPayerData' })
    const NegotiatedPriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.contractPrice' }).toLowerCase()
    const SaveChangesModalTitle = intl.formatMessage({ id: 'form.prompt.title' })
    const SaveChangesModalMessage = intl.formatMessage({ id: 'form.prompt.message' })
    const SuggestQrMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.orSuggestQR' })
    const PayByQrMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.payByQrMessage' })

    const {
        children,
        action,
        organizationId,
        initialValues,
        OnCompletedMsg,
        isCreateForm,
        isCreatedByResident,
        modalFormProps,
        isAllFieldsDisabled,
        isContactsFieldsDisabled,
        formInstance,
    } = props

    const [status, setStatus] = useState<typeof INVOICE_STATUSES[number]>(get(initialValues, 'status'))
    const [paymentType, setPaymentType] = useState<typeof INVOICE_PAYMENT_TYPES[number]>(get(initialValues, 'paymentType'))

    const onlyStatusTransitionsActive = get(initialValues, 'status') !== INVOICE_STATUS_DRAFT

    const currencyCode = DEFAULT_INVOICE_CURRENCY_CODE
    const parts = intl.formatNumberToParts(0, { style: 'currency', currency: currencyCode })
    const currencySymbolObj = parts.find(part => part.type === 'currency')
    const currencySymbol = get(currencySymbolObj, 'value')
    const moneyRender = useMemo(() => getMoneyRender(intl, currencyCode), [currencyCode, intl])

    const isModalForm = useMemo(() => !isEmpty(modalFormProps), [modalFormProps])
    const colSpan = useMemo(() => isModalForm ? 24 : 22, [isModalForm])

    const FormContainer = useMemo(
        () => isModalForm ? BaseModalForm : FormWithAction,
        [isModalForm])

    const [innerForm] = Form.useForm()
    const form = useMemo(() => formInstance ? formInstance : innerForm, [formInstance, innerForm])

    useEffect(() => {
        if (!isCreateForm) {
            const rows = form.getFieldValue('rows')
            form.validateFields(rows.map((_, index) => ['rows', index, 'toPay']))
        }
    }, [form, isCreateForm])


    return (
        <FormContainer
            initialValues={initialValues}
            action={action}
            layout='horizontal'
            colon={false}
            formInstance={form}
            OnCompletedMsg={OnCompletedMsg}
            scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
            validateTrigger={FORM_VALIDATE_TRIGGER}
            {...modalFormProps}
            children={({ handleSave, form }) => (
                <>
                    <Prompt
                        title={SaveChangesModalTitle}
                        form={form}
                        handleSave={handleSave}
                        ignoreFormFields={[NEW_CONTACT_PHONE_FORM_ITEM_NAME]}
                    >
                        <Typography.Paragraph>
                            {SaveChangesModalMessage}
                        </Typography.Paragraph>
                    </Prompt>

                    <Row gutter={OUTER_VERTICAL_GUTTER}>
                        <Col span={24} md={colSpan} hidden={isModalForm}>
                            <Form.Item
                                dependencies={['status']}
                            >
                                {
                                    ({ getFieldValue }) => {
                                        const status = getFieldValue('status')
                                        const disabled = isContactsFieldsDisabled || isAllFieldsDisabled || onlyStatusTransitionsActive ||
                                            status !== INVOICE_STATUS_DRAFT || isCreatedByResident

                                        if (isModalForm) {
                                            return null
                                        }

                                        return (
                                            <PayerDataFields
                                                organizationId={organizationId}
                                                form={form}
                                                disabled={disabled}
                                                initialValues={initialValues}
                                            />
                                        )
                                    }
                                }
                            </Form.Item>
                        </Col>

                        <Col md={isModalForm ? 24 : 22}>
                            <Row gutter={SMALL_VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <Typography.Title level={3}>{ServicesListMessage}</Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        dependencies={['property', 'status']}
                                    >
                                        {
                                            ({ getFieldsValue }) => {
                                                const { property } = getFieldsValue(['property'])
                                                const disabled = isAllFieldsDisabled ||
                                                    onlyStatusTransitionsActive ||
                                                    (!isCreateForm && status !== INVOICE_STATUS_DRAFT)

                                                return (
                                                    <ServicesList
                                                        organizationId={organizationId}
                                                        propertyId={property}
                                                        form={form}
                                                        currencySymbol={currencySymbol}
                                                        disabled={disabled}
                                                        setStatus={setStatus}
                                                        isModalForm={isModalForm}
                                                    />
                                                )
                                            }
                                        }
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        <Form.Item
                            dependencies={['rows']}
                            noStyle
                        >
                            {
                                ({ getFieldValue }) => {
                                    const rows = getFieldValue('rows')
                                    const filledRow = rows.find(row =>
                                        get(row, 'name.length', 0) > 6 &&
                                        get(row, 'toPay.length', 0) > 0 &&
                                        get(row, 'count', 0) > 0
                                    )

                                    return filledRow && (
                                        <>
                                            <Col
                                                span={24}
                                                md={colSpan}
                                            >
                                                <Form.Item
                                                    shouldUpdate
                                                >
                                                    {
                                                        ({ getFieldValue }) => {
                                                            const rows = getFieldValue('rows').filter(Boolean)
                                                            const totalCount = rows.reduce((acc) => acc + 1, 0)
                                                            const { totalPrice, hasMinPrice, hasError } = calculateRowsTotalPrice(intl, rows)
                                                            const isNegotiatedToPay = hasMinPrice && totalPrice === 0

                                                            let value
                                                            if (hasError) {
                                                                value = ''
                                                            } else if (isNegotiatedToPay) {
                                                                value = NegotiatedPriceMessage
                                                            } else {
                                                                value = moneyRender(totalPrice, hasMinPrice)
                                                            }

                                                            return (
                                                                <Row gutter={[0, 12]}>
                                                                    <Col span={24}>
                                                                        <SubTotalInfo
                                                                            label={ServicesChosenLabel}
                                                                            total={totalCount}
                                                                            totalTextType='primary'
                                                                        />
                                                                    </Col>
                                                                    <Col span={24}>
                                                                        <SubTotalInfo
                                                                            label={TotalToPayLabel}
                                                                            total={value}
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
                                                <Row gutter={[0, 16]}>
                                                    <Col md={colSpan}>
                                                        <Form.Item
                                                            label={<Typography.Title level={3}>{PaymentModeLabel}</Typography.Title>}
                                                            name='paymentType'
                                                            labelCol={{
                                                                span: 24,
                                                            }}
                                                        >
                                                            <RadioGroup
                                                                onChange={(e) => {
                                                                    const value = get(e, 'target.value')
                                                                    setPaymentType(value)

                                                                    setStatus(INVOICE_STATUS_DRAFT)
                                                                    form.setFieldsValue({ status: INVOICE_STATUS_DRAFT })
                                                                }}
                                                                disabled={isAllFieldsDisabled || onlyStatusTransitionsActive}
                                                            >
                                                                <Space size={24} wrap direction='horizontal'>
                                                                    <Radio value={INVOICE_PAYMENT_TYPE_ONLINE}>
                                                                        <Typography.Text disabled={isAllFieldsDisabled || onlyStatusTransitionsActive}>
                                                                            {PaymentOnlineLabel}
                                                                        </Typography.Text>
                                                                    </Radio>
                                                                    <Radio value={INVOICE_PAYMENT_TYPE_CASH}>
                                                                        <Typography.Text disabled={isAllFieldsDisabled || onlyStatusTransitionsActive}>
                                                                            {PaymentCashLabel}
                                                                        </Typography.Text>
                                                                    </Radio>
                                                                </Space>
                                                            </RadioGroup>
                                                        </Form.Item>
                                                    </Col>
                                                    <Col md={colSpan}>
                                                        <Form.Item
                                                            dependencies={['paymentType', 'payerData', 'property', 'unitName', 'unitType', 'clientName', 'clientPhone', 'hasIsMinPrice']}
                                                        >
                                                            {
                                                                ({ getFieldsValue }) => {
                                                                    const {
                                                                        payerData, property, hasIsMinPrice,
                                                                    } = getFieldsValue(['payerData', 'property', 'hasIsMinPrice'])
                                                                    const isNoPayerData = payerData && !property
                                                                    const initialStatus = get(initialValues, 'status')
                                                                    const isNotDraftStatusesDisabled = hasIsMinPrice || isNoPayerData ||
                                                                        initialStatus === INVOICE_STATUS_CANCELED || initialStatus === INVOICE_STATUS_PAID

                                                                    return (
                                                                        <StatusRadioGroup
                                                                            isNoPayerData={isNoPayerData}
                                                                            paymentType={paymentType}
                                                                            isAllFieldsDisabled={isAllFieldsDisabled}
                                                                            onlyStatusTransitionsActive={onlyStatusTransitionsActive}
                                                                            isNotDraftStatusesDisabled={isNotDraftStatusesDisabled}
                                                                            isCreateForm={isCreateForm}
                                                                            form={form}
                                                                            status={status}
                                                                            setStatus={setStatus}
                                                                        />
                                                                    )
                                                                }
                                                            }
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Col>
                                            <Form.Item
                                                dependencies={['paymentType', 'status', 'payerData', 'property', 'unitName', 'unitType', 'clientName']}
                                                noStyle
                                            >
                                                {
                                                    ({ getFieldsValue }) => {
                                                        const {
                                                            status, paymentType, payerData, property, unitName, unitType, clientPhone,
                                                        } = getFieldsValue(['status', 'paymentType', 'payerData', 'property', 'unitName', 'unitType', 'clientPhone'])

                                                        if (status !== INVOICE_STATUS_PUBLISHED || paymentType !== INVOICE_PAYMENT_TYPE_ONLINE || isAllFieldsDisabled) {
                                                            return
                                                        }

                                                        if (!payerData) {
                                                            return (
                                                                <Col md={colSpan}>
                                                                    <Alert
                                                                        type='info'
                                                                        message={NoPayerDataAlertMessage}
                                                                        description={NoPayerDataAlertDescription}
                                                                        showIcon
                                                                    />
                                                                </Col>
                                                            )
                                                        }

                                                        if (!property || !unitName || !unitType || !clientPhone) {
                                                            const message = isModalForm ? `${EmptyPayerDataAlertMessage} ${SuggestQrMessage}` : EmptyPayerDataAlertMessage

                                                            return (
                                                                <Col md={colSpan}>
                                                                    <Alert
                                                                        type='warning'
                                                                        message={message}
                                                                        description={(
                                                                            <>
                                                                                <Typography.Paragraph size='medium'>
                                                                                    {EmptyPayerDataAlertDescription}
                                                                                </Typography.Paragraph>
                                                                                {
                                                                                    isModalForm && (
                                                                                        <Typography.Paragraph size='medium'>
                                                                                            {PayByQrMessage}
                                                                                        </Typography.Paragraph>
                                                                                    )
                                                                                }
                                                                            </>
                                                                        )}
                                                                        showIcon
                                                                    />
                                                                </Col>
                                                            )
                                                        }

                                                        return (
                                                            <Col md={colSpan}>
                                                                <ResidentPaymentAlert
                                                                    propertyId={property}
                                                                    unitName={unitName}
                                                                    unitType={unitType}
                                                                    clientPhone={clientPhone}
                                                                    isCreatedByResident={isCreatedByResident}
                                                                    isModalForm={isModalForm}
                                                                />
                                                            </Col>
                                                        )
                                                    }
                                                }
                                            </Form.Item>
                                        </>
                                    )
                                }
                            }
                        </Form.Item>
                        {typeof children === 'function' ? children({ handleSave, form }) : children}
                    </Row>
                </>
            )}/>
    )
}