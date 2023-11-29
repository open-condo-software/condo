/** @jsx jsx */
import { MarketItem as MarketItemType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, Form, Input, Row, RowProps, Select } from 'antd'
import { Rule } from 'antd/lib/form'
import { FormProps } from 'antd/lib/form/Form'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useEffect, useMemo } from 'react'

import { PlusCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { InvoiceContext, MarketCategory, MarketItem } from '@condo/domains/marketplace/utils/clientSchema'
import {
    INITIAL_PRICE_FORM_VALUE,
    MarketItemFormValuesType,
    PriceType,
} from '@condo/domains/marketplace/utils/clientSchema/MarketItem'
import { searchOrganizationPropertyWithExclusion } from '@condo/domains/marketplace/utils/clientSchema/search'

import {
    BaseMarketItemFormContext,
    BaseMarketItemFormContextType,
    useMarketItemFormContext,
} from './BaseMarketItemFormContext'


const GROUP_OUTER_GUTTER: RowProps['gutter'] = [0, 40]
const GROUP_INNER_GUTTER: RowProps['gutter'] = [0, 40]

const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const FORM_LAYOUT_PROPS: FormProps = {
    labelCol: {
        md: 10,
        span: 24,
    },
    wrapperCol: {
        md: 14,
        span: 24,
    },
    layout: 'horizontal',
    labelAlign: 'left',
}

const MobilePreviewContainer = styled.div`
  width: 100%;
  max-width: 500px;
  max-height: 500px;
  background-color: ${colors.gray[1]};
  border-radius: 12px;
  padding: 40px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
`
const AppPreviewContainer = styled.div`
  margin-top: 24px;
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: start;
  background-image: url("/phoneNewsPreview.png");
  justify-content: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
  padding-top: 60px;
  padding-left: 22px;
  padding-right: 22px;
  min-height: 500px;
  max-width: 360px;

  & .ant-divider {
    margin: 12px;
  }
`

const MobilePreview = () => {
    return (
        <MobilePreviewContainer>
            <AppPreviewContainer/>
        </MobilePreviewContainer>
    )
}

const mapCategoryToOption = ({ name, id }) => ({ label: name, value: id })

const CategorySelectFields = ({ parentCategoryId, form }) => {
    const intl = useIntl()
    const CategoryFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.category' })
    const SubCategoryFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.subcategory' })

    const { requiredValidator } = useValidations()
    const { objs: marketCategories, loading } = MarketCategory.useAllObjects({})

    const parentCategoriesOptions = useMemo(
        () => marketCategories
            .filter(category => !category.parentCategory)
            .map(mapCategoryToOption),
        [marketCategories])

    const subCategoriesOptions = useMemo(() =>
        parentCategoryId ?
            marketCategories
                .filter(category => get(category, 'parentCategory.id') === parentCategoryId)
                .map(mapCategoryToOption)
            : [],
    [marketCategories, parentCategoryId])

    useEffect(() => {
        if (subCategoriesOptions.length === 1) {
            form.setFieldsValue({
                marketCategory: subCategoriesOptions[0].value,
            })
        }
    }, [form, subCategoriesOptions])

    const handleChangeParentCategory = useCallback(() => form.setFieldsValue({
        marketCategory: null,
    }), [form])

    return (
        <Row gutter={GROUP_INNER_GUTTER}>
            <Col span={24}>
                <Form.Item
                    name='parentCategory'
                    label={CategoryFieldMessage}
                    required
                    rules={[requiredValidator]}
                >
                    <Select
                        options={parentCategoriesOptions}
                        loading={loading}
                        allowClear
                        onChange={handleChangeParentCategory}
                        optionFilterProp='title'
                        showSearch
                    />
                </Form.Item>
            </Col>
            <Col span={24} hidden={subCategoriesOptions.length < 2}>
                <Form.Item
                    name='marketCategory'
                    label={SubCategoryFieldMessage}
                    required
                    rules={[requiredValidator]}
                >
                    <Select
                        options={subCategoriesOptions}
                        loading={loading}
                        allowClear
                    />
                </Form.Item>
            </Col>
        </Row>
    )
}

const TextAreaWithCounter = styled(Input.TextArea)`
  &.ant-input-textarea-show-count::after {
    position: relative;
    bottom: 36px;
    right: 10px;
    background-color: ${colors.gray[7]};
    color: ${colors.white};
    border-radius: 14px;
    padding: 2px 10px;
    font-weight: 600;
  }
`

const MarketItemFields = () => {
    const intl = useIntl()
    const NameFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.name' })
    const SkuFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.sku' })
    const SkuTooltipMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.sku.tooltip' })
    const DescriptionFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.description' })
    const MarketItemPhotoFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.marketItemPhoto' })

    const { organization } = useOrganization()
    const { refetch: fetchMarketItemsCount } = MarketItem.useCount({}, { skip: true })

    const { form, marketItemId } = useMarketItemFormContext()

    const { requiredValidator, maxLengthValidator } = useValidations()
    const uniqueSkuValidator: Rule = useMemo(() => ({
        validateTrigger: FORM_VALIDATE_TRIGGER,
        validator: async (_, value) => {
            const result = await fetchMarketItemsCount({
                where: {
                    id_not: marketItemId,
                    organization: { id: get(organization, 'id', null) },
                    sku: value,
                },
            })

            const marketItemsWithSameSkuCount = get(result, 'data.meta.count', 0)

            if (marketItemsWithSameSkuCount > 0) return Promise.reject(SkuTooltipMessage)
            return Promise.resolve()
        },
    }), [SkuTooltipMessage, fetchMarketItemsCount, marketItemId, organization])

    // до "Цена и видимость услуги"
    return (
        <Row gutter={GROUP_INNER_GUTTER}>
            <Col span={24}>
                <Form.Item
                    name='name'
                    label={NameFieldMessage}
                    required
                    rules={[requiredValidator]}
                >
                    <Input/>
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    name='sku'
                    label={SkuFieldMessage}
                    required
                    rules={[requiredValidator, uniqueSkuValidator, maxLengthValidator(50)]}
                    tooltip={SkuTooltipMessage}
                    validateTrigger={FORM_VALIDATE_TRIGGER}
                >
                    <Input/>
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    dependencies={['parentCategory']}
                    noStyle
                >
                    {
                        ({ getFieldValue }) => {
                            const parentCategoryId = getFieldValue('parentCategory')

                            return (
                                <CategorySelectFields
                                    parentCategoryId={parentCategoryId}
                                    form={form}
                                />
                            )
                        }
                    }
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    name='description'
                    label={DescriptionFieldMessage}
                >
                    <TextAreaWithCounter
                        autoSize={{ minRows: 4 }}
                        maxLength={800}
                        showCount={{
                            formatter: ({ value, count, maxLength }) => {
                                return `${count}/${maxLength}`
                            },
                        }}
                    />
                </Form.Item>
            </Col>
        </Row>
    )
}

const MarketPricePropertiesField = ({ priceFormDescription, priceFormsValue }) => {
    const intl = useIntl()
    const AddressesLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.addresses' })
    const CheckAllPropertiesLabel = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.chooseAllProperties' })

    const { requiredValidator } = useValidations()
    const { form, getUpdatedPricesField, isSmallScreen } = useMarketItemFormContext()
    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)
    const { breakpoints } = useLayoutContext()

    const priceFormName = useMemo(() => get(priceFormDescription, 'name'), [priceFormDescription])

    const hasAllPropertiesChecked = useMemo(() => {
        if (isEmpty(priceFormsValue) || isEmpty(priceFormDescription)) return false

        return priceFormsValue[priceFormDescription.name].hasAllProperties
    }, [priceFormDescription, priceFormsValue])

    const isCheckAllDisabled = useMemo(() => {
        if (isEmpty(priceFormsValue) || isEmpty(priceFormDescription)) return false

        return !priceFormsValue[priceFormDescription.name].hasAllProperties && priceFormsValue.some(form => form.hasAllProperties)
    }, [priceFormDescription, priceFormsValue])

    const propertySelectFormItemProps = useCallback((priceFormName) => ({
        label: AddressesLabel,
        required: true,
        name: [priceFormName, 'properties'],
        rules: hasAllPropertiesChecked ? [] : [requiredValidator],
    }), [AddressesLabel, hasAllPropertiesChecked, requiredValidator])

    const renderPropertyOptions = useCallback((excludedPropertyIds: Array<string>) => (options, renderOption) => {
        return options
            .filter(option => !excludedPropertyIds.includes(option.value))
            .map(renderOption)
    }, [])

    const propertySelectProps: (priceFormName: number) => InputWithCheckAllProps['selectProps'] = useCallback((priceFormName) => {
        const selectedPropertyIdsFromOtherPriceForms = priceFormsValue
            .filter((_, index) => index !== priceFormName)
            .flatMap(form => get(form, 'properties'))

        return {
            showArrow: false,
            infinityScroll: true,
            search: searchOrganizationPropertyWithExclusion(organizationId, selectedPropertyIdsFromOtherPriceForms),
            disabled: !organizationId,
            required: true,
            mode: 'multiple',
            renderOptions: renderPropertyOptions(selectedPropertyIdsFromOtherPriceForms),
        }
    }, [priceFormsValue, organizationId, renderPropertyOptions])

    const handleCheckAll = useCallback(() => {
        return getUpdatedPricesField(priceFormName, {
            properties: [],
            hasAllProperties: true,
        })
    }, [getUpdatedPricesField, priceFormName])

    return (
        <GraphQlSearchInputWithCheckAll
            selectFormItemProps={propertySelectFormItemProps(priceFormName)}
            selectProps={propertySelectProps(priceFormName)}
            checkAllFieldName={[priceFormName, 'hasAllProperties']}
            CheckAllMessage={CheckAllPropertiesLabel}
            form={form}
            checkBoxOffset={!breakpoints.TABLET_LARGE ? 0 : 10}
            checkAllInitialValue={false}
            mutationOfFormAfterCheckAll={handleCheckAll}
            checkboxDisabled={isCheckAllDisabled}
        />
    )
}

const MarketPriceForm = ({ priceFormDescription, removeOperation }) => {
    const intl = useIntl()
    const PriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType' })
    const PriceTypeTooltip = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.tooltip' })
    const ExactPriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.exactPrice' })
    const MinPriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.minPrice' })
    const ContractPriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.contractPrice' })
    const PriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.price' })
    const PriceTooltip = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.price.tooltip' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })

    const { requiredValidator, numberValidator } = useValidations()
    const { form, invoiceContext, getUpdatedPricesField } = useMarketItemFormContext()
    const currencyCode = get(invoiceContext, 'currencyCode')
    const parts = intl.formatNumberToParts('', { style: 'currency', currency: currencyCode })
    const currencySymbolObj = parts.find(part => part.type === 'currency')
    const currencySymbol = get(currencySymbolObj, 'value')
    const priceFormName = useMemo(() => get(priceFormDescription, 'name'), [priceFormDescription])

    const priceFormsValue = Form.useWatch('prices', form) || []
    const priceTypeFormValue = Form.useWatch(['prices', priceFormName, 'priceType'], form)
    const isContractPrice = useMemo(() => priceTypeFormValue === PriceType.Contract, [priceTypeFormValue])

    const handleContractPriceCheck = useCallback(async () => {
        form.setFieldsValue(getUpdatedPricesField(priceFormName, { price: null }))
        await form.validateFields(['prices', priceFormName, 'price'])
    }, [form, getUpdatedPricesField, priceFormName])

    return (
        <Row gutter={[0, 28]}>
            <Col span={24}>
                <MarketPricePropertiesField
                    priceFormDescription={priceFormDescription}
                    priceFormsValue={priceFormsValue}
                />
            </Col>
            <Col span={24}>
                <Form.Item
                    name={[priceFormName, 'priceType']}
                    required
                    label={PriceTypeLabel}
                    tooltip={PriceTypeTooltip}
                >
                    <RadioGroup>
                        <Space size={20} wrap direction='horizontal'>
                            <Radio value={PriceType.Exact}>
                                <Typography.Text>
                                    {ExactPriceTypeLabel}
                                </Typography.Text>
                            </Radio>
                            <Radio value={PriceType.Min}>
                                <Typography.Text>
                                    {MinPriceTypeLabel}
                                </Typography.Text>
                            </Radio>
                            <Radio value={PriceType.Contract} onChange={handleContractPriceCheck}>
                                <Typography.Text>
                                    {ContractPriceTypeLabel}
                                </Typography.Text>
                            </Radio>
                        </Space>
                    </RadioGroup>
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    name={[priceFormName, 'price']}
                    required
                    rules={isContractPrice ? [] : [requiredValidator, numberValidator]}
                    label={PriceLabel}
                    tooltip={PriceTooltip}
                    wrapperCol={{
                        span: 5,
                    }}
                >
                    <Input
                        addonAfter={currencySymbol}
                        disabled={isContractPrice}
                    />
                </Form.Item>
            </Col>
            {
                priceFormDescription.name !== 0 && (
                    <Col span={24}>
                        <Typography.Text
                            strong
                            onClick={() => {
                                removeOperation(priceFormDescription.name)
                            }}
                        >
                            <Space size={8}>
                                <Trash />
                                {CancelMessage}
                            </Space>
                        </Typography.Text>
                    </Col>
                )
            }
        </Row>
    )
}

const MarketPricesList = () => {
    const intl = useIntl()
    const PriceScopeGroupLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.section.priceScope' })
    const AddPriceScopeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.addPriceScope' })

    return (
        <Row gutter={GROUP_INNER_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{PriceScopeGroupLabel}</Typography.Title>
            </Col>
            <Col span={24}>
                <Form.List name='prices'>
                    {(priceForms, operation) => (
                        <Row gutter={GROUP_INNER_GUTTER}>
                            <Col span={24}>
                                <Row gutter={[0, 60]}>
                                    {
                                        priceForms.map((priceForm, index) => (
                                            <Col key={index} span={24}>
                                                <MarketPriceForm
                                                    priceFormDescription={priceForm}
                                                    removeOperation={operation.remove}
                                                />
                                            </Col>
                                        ))
                                    }
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Typography.Text strong onClick={() => operation.add(INITIAL_PRICE_FORM_VALUE)}>
                                    <Space size={4} direction='horizontal'>
                                        <PlusCircle />
                                        {AddPriceScopeLabel}
                                    </Space>
                                </Typography.Text>
                            </Col>
                        </Row>
                    )}
                </Form.List>
            </Col>
        </Row>
    )
}

type BaseMarketItemFormProps = {
    action: (values: MarketItemFormValuesType) => Promise<MarketItemType>
    initialValues?: MarketItemFormValuesType
}

export const BaseMarketItemForm: React.FC<BaseMarketItemFormProps> = (props) => {
    const { children, action, initialValues } = props
    const { breakpoints } = useLayoutContext()
    const { organization } = useOrganization()

    const marketItemId = get(initialValues, 'id')
    const isSmallScreen = !breakpoints.DESKTOP_SMALL

    const [form] = Form.useForm<MarketItemFormValuesType>()
    const getUpdatedPricesField = useCallback((priceFormName, newFields) => ({
        prices: {
            ...form.getFieldValue(['prices']),
            [priceFormName]: {
                ...form.getFieldValue(['prices', priceFormName]),
                ...newFields,
            },
        },
    }), [form])
    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: get(organization, 'id', null) },
        },
    })

    const formContextValue: BaseMarketItemFormContextType = useMemo(() => ({
        form,
        marketItemId,
        getUpdatedPricesField,
        isSmallScreen,
        invoiceContext,
    }), [form, getUpdatedPricesField, invoiceContext, isSmallScreen, marketItemId])

    return (
        <BaseMarketItemFormContext.Provider value={formContextValue}>
            <FormWithAction
                formInstance={form}
                validateTrigger={FORM_VALIDATE_TRIGGER}
                action={action}
                initialValues={initialValues}
                {...FORM_LAYOUT_PROPS}
            >
                {
                    ({ handleSave }) => (
                        <Row gutter={[0, 60]}>
                            <Col>
                                <Row gutter={isSmallScreen ? [0, 0] : [50, 0]}>
                                    <Col span={isSmallScreen ? 24 : 16}>
                                        <Row gutter={GROUP_OUTER_GUTTER}>
                                            <Col span={24}>
                                                <MarketItemFields/>
                                            </Col>
                                            <Col span={24}>
                                                <MarketPricesList/>
                                            </Col>
                                        </Row>
                                    </Col>
                                    {
                                        !isSmallScreen && (
                                            <Col span={8}>
                                                <MobilePreview/>
                                            </Col>
                                        )
                                    }
                                </Row>
                            </Col>
                            <Col span={24}>
                                {typeof children === 'function' ? children({ handleSave, form }) : children}
                            </Col>
                        </Row>
                    )
                }
            </FormWithAction>
        </BaseMarketItemFormContext.Provider>
    )
}