import { MarketItem as MarketItemType, SortMarketCategoriesBy } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, Input, Row, RowProps, Select, Button as AntdButton } from 'antd'
import { Rule } from 'antd/lib/form'
import { FormProps } from 'antd/lib/form/Form'
import difference from 'lodash/difference'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useEffect, useMemo } from 'react'

import { PlusCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { ImagesUploadList, UploadFileType } from '@condo/domains/common/components/ImagesUploadList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import Prompt from '@condo/domains/common/components/Prompt'
import { DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { DEFAULT_INVOICE_CURRENCY_CODE, MIN_PRICE_VALUE } from '@condo/domains/marketplace/constants'
import {
    MarketCategory,
    MarketItem,
    MarketItemFile,
} from '@condo/domains/marketplace/utils/clientSchema'
import { getMoneyRender } from '@condo/domains/marketplace/utils/clientSchema/Invoice'
import {
    INITIAL_PRICE_FORM_VALUE,
    MarketItemFormValuesType,
    PriceType,
    PriceMeasuresType,
} from '@condo/domains/marketplace/utils/clientSchema/MarketItem'
import { searchOrganizationPropertyWithExclusion } from '@condo/domains/marketplace/utils/clientSchema/search'
import { Property } from '@condo/domains/property/utils/clientSchema'

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
  height: 621px;
  background-color: ${colors.gray[1]};
  border-radius: 12px;
  padding: 40px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
`
const AppPreviewContainer = styled.div`
  margin-top: 24px;
  position: relative;
  height: 100%;
  width: 274px;
  display: flex;
  flex-flow: column;
  justify-content: space-between;
  align-items: start;
  background-image: url("/phoneMarketItemPreview.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: top center;
  padding-top: 60px;
  padding-left: 28px;
  padding-right: 17px;
  overflow: hidden;

  & .mobile-content-wrapper {
    width: 100%;
    height: 90%;
    display: flex;
    flex-flow: column;
    align-items: start;
    justify-content: space-between;
    padding: 12px 20px;
    overflow: hidden;

    & .order-header .condo-typography {
      font-family: 'SF Pro Display', 'Wix Madefor Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif;
      font-style: normal;
      font-weight: 600;
      line-height: 1;
    }

    & .order-sku .condo-typography {
      font-family: 'SF Pro Text', 'Wix Madefor Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif;
      font-size: 10px;
      font-style: normal;
      font-weight: 400;
    }

    & .order-description .condo-typography {
      font-family: 'SF Pro Text', 'Wix Madefor Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 1.5;
    }

    & .order-button-wrapper {
      width: 100%;
      padding-right: 11px;
    }

    & .order-button {
      & .condo-typography {
        font-family: 'SF Pro Display', 'Wix Madefor Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif;
        font-size: 16px;
        font-style: normal;
        font-weight: 900;
        line-height: normal;
      }

      width: 100%;
      background-color: #4CD174;
      color: ${colors.white};
      height: 36px;
      padding: 0;
      border: none;
      border-radius: 11px !important;
    }
  }

  & .ant-divider {
    margin: 12px;
  }
`

interface IMobilePreviewProps {
    name: string
    price?: string
    priceType: PriceType
    sku: string
    description: string
    measure: PriceMeasuresType
    files?: UploadFileType[]
}

const MobilePreview: React.FC<IMobilePreviewProps> = ({ name, price, measure, priceType, sku, description, files }) => {
    const intl = useIntl()
    const MobilePreviewTitle = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.mobileAppPreview.title' })
    const ContractPrice = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.contractPrice' })
    const SkuMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.mobileAppPreview.sku' })
    const NameMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.mobileAppPreview.name' })
    const PriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.mobileAppPreview.price' })
    const OrderMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.mobileAppPreview.order' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.mobileAppPreview.description' })

    const { currencyCode } = useMarketItemFormContext()

    const moneyRender = getMoneyRender(intl, currencyCode)
    let resultPrice
    if (priceType === PriceType.Contract) {
        resultPrice = ContractPrice
    } else if (price) {
        resultPrice = moneyRender(price, priceType === PriceType.Min)
    }

    const showMeasureType = !!(measure)

    return (
        <MobilePreviewContainer>
            <div style={{ textAlign: 'center' }}>
                <Typography.Title type='secondary' level={3}>
                    {MobilePreviewTitle}
                </Typography.Title>
            </div>
            <AppPreviewContainer>
                <div className='mobile-content-wrapper'>
                    <Row gutter={[0, 15]} style={{ maxWidth: '100%' }}>
                        <Col span={24}>
                            <Row>
                                <Col span={24} className='order-header'>
                                    <Typography.Title level={3}>
                                        {name || NameMessage}
                                    </Typography.Title>
                                </Col>
                                <Col span={24} style={{ marginTop: '-0px' }} className='order-header'>
                                    <Typography.Title type='secondary' level={3}>
                                        {resultPrice || PriceMessage}{(showMeasureType && `/${intl.formatMessage({ id: `pages.condo.marketplace.measure.${measure}.short` })}`)}
                                    </Typography.Title>
                                </Col>
                                <Col span={24} style={{ marginTop: '-6px' }} className='order-sku'>
                                    <Typography.Text size='small' type='secondary'>
                                        {SkuMessage} {sku}
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24} style={{ marginTop: '-10px' }} className='order-description'>
                            <Typography.Paragraph ellipsis={{ 'rows': 5 }} size='medium'>
                                {description || DescriptionMessage}
                            </Typography.Paragraph>
                        </Col>
                        {
                            !isEmpty(files) && (
                                <Col span={24}>
                                    <ImagesUploadList
                                        type='view'
                                        hideArrows
                                        imageSize={50}
                                        fileList={files}
                                    />
                                </Col>
                            )
                        }
                    </Row>

                    <Space direction='vertical' size={8} className='order-button-wrapper'>
                        {
                            (showMeasureType && (
                                <div style={{
                                    'padding': '4px 9px',
                                    'display': 'flex',
                                    'justifyContent': 'space-between',
                                    'alignItems': 'center',
                                    'backgroundColor': colors.gray[1],
                                    width: '100%',
                                    borderRadius: DEFAULT_BORDER_RADIUS,
                                }}>
                                    <div style={{ 'marginTop': '-2px' }}>
                                        <Typography.Text size='small' type='secondary'>итого</Typography.Text>
                                        <div style={{ 'marginTop': '-6px' }}>
                                            <Typography.Text strong size='medium' type='inherit'>{resultPrice || PriceMessage}</Typography.Text>
                                        </div>
                                    </div>
                                    <div style={{ 'display':'flex', 'justifyContent':'space-between', 'alignItems':'center', 'padding': '2px 4px', 'backgroundColor': 'white', borderRadius: '4px' }}>
                                        <span>{`1${intl.formatMessage({ id: `pages.condo.marketplace.measure.${measure}.short` })}`}</span>
                                        <span style={{ 'marginLeft': '2px' }}>+</span>
                                    </div>
                                </div>)
                            )
                        }

                        <AntdButton className='order-button'>
                            <Typography.Text strong type='inherit'>{OrderMessage}</Typography.Text>
                        </AntdButton>
                    </Space>
                </div>
            </AppPreviewContainer>
        </MobilePreviewContainer>
    )
}

const mapCategoryToOption = ({ name, id }) => ({ label: name, value: id })

const CategorySelectFields = ({ parentCategoryId, form }) => {
    const intl = useIntl()
    const CategoryFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.parentCategory' })
    const SubCategoryFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.marketCategory' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })

    const { requiredValidator } = useValidations()
    const { objs: marketCategories, loading } = MarketCategory.useAllObjects({
        sortBy: [SortMarketCategoriesBy.OrderAsc, SortMarketCategoriesBy.NameAsc],
    })

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
            const parentCategoryOption = parentCategoriesOptions
                .find(({ value }) => value === parentCategoryId)

            form.setFieldsValue({
                marketCategory: subCategoriesOptions[0].value,
                marketCategoryName: get(parentCategoryOption, 'label'),
            })
        }
    }, [form, parentCategoriesOptions, parentCategoryId, subCategoriesOptions])

    const handleChangeParentCategory = useCallback(() => form.setFieldsValue({
        marketCategory: null,
        marketCategoryName: null,
    }), [form])

    const isSubCategoryHidden = useMemo(() => subCategoriesOptions.length < 2, [subCategoriesOptions])

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
                        optionFilterProp='label'
                        showSearch
                        placeholder={SelectMessage}
                    />
                </Form.Item>
            </Col>
            <Col span={24} hidden={isSubCategoryHidden}>
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
                        onChange={(_, option) => {
                            form.setFieldsValue({ marketCategoryName: get(option, 'label') })
                        }}
                        optionFilterProp='label'
                        showSearch
                        placeholder={SelectMessage}
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
    const UniqueNameErrorMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.name.uniqueError' })
    const SkuFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.sku' })
    const SkuTooltipMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.sku.tooltip' })
    const DescriptionFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.description' })
    const MarketItemPhotoFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.marketItemPhoto' })
    const DescriptionPlaceholderMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.description.placeholder' })
    const DescriptionTooltipMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.description.tooltip' })

    const { organization } = useOrganization()
    const { refetch: fetchMarketItemsCount } = MarketItem.useCount({}, { skip: true })
    const createFileAction = MarketItemFile.useCreate({})

    const { form, marketItemId, initialValues } = useMarketItemFormContext()

    const initialFileList = useMemo(() => get(initialValues, 'files'), [initialValues])

    const { requiredValidator, maxLengthValidator, minLengthValidator } = useValidations()
    const uniqueNameValidator: Rule = useMemo(() => ({
        validateTrigger: FORM_VALIDATE_TRIGGER,
        validator: async (_, value) => {
            if (!value) {
                return Promise.resolve()
            }

            const result = await fetchMarketItemsCount({
                where: {
                    id_not: marketItemId,
                    organization: { id: get(organization, 'id', null) },
                    name: value,
                },
            })

            const marketItemsWithSameSkuCount = get(result, 'data.meta.count', 0)

            if (marketItemsWithSameSkuCount > 0) return Promise.reject(UniqueNameErrorMessage)
            return Promise.resolve()
        },
    }), [UniqueNameErrorMessage, fetchMarketItemsCount, marketItemId, organization])
    const uniqueSkuValidator: Rule = useMemo(() => ({
        validateTrigger: FORM_VALIDATE_TRIGGER,
        validator: async (_, value) => {
            if (!value) {
                return Promise.resolve()
            }

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

    return (
        <Row gutter={GROUP_INNER_GUTTER}>
            <Col span={24}>
                <Form.Item
                    name='name'
                    label={NameFieldMessage}
                    required
                    rules={[requiredValidator, uniqueNameValidator, minLengthValidator(7)]}
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
                        ({ getFieldsValue }) => {
                            const { parentCategory } = getFieldsValue(['parentCategory'])

                            return (
                                <CategorySelectFields
                                    parentCategoryId={parentCategory}
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
                    tooltip={DescriptionTooltipMessage}
                >
                    <TextAreaWithCounter
                        autoSize={{ minRows: 4 }}
                        maxLength={800}
                        showCount={{
                            formatter: ({ count, maxLength }) => {
                                return `${count}/${maxLength}`
                            },
                        }}
                        placeholder={DescriptionPlaceholderMessage}
                    />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    name='files'
                    label={MarketItemPhotoFieldMessage}
                >
                    <ImagesUploadList
                        type='upload'
                        defaultFileList={initialFileList}
                        onFilesChange={(files) => {
                            if (files.some(file => file.status === 'uploading')) {
                                form.setFieldsValue({
                                    uploading: true,
                                })
                            } else {
                                form.setFieldsValue({
                                    uploading: false,
                                })
                            }

                            form.setFieldsValue({
                                files: [...files],
                            })
                        }}
                        createAction={createFileAction}
                    />
                </Form.Item>
            </Col>
        </Row>
    )
}

const MarketPricePropertiesField = ({ priceFormDescription, isHasAllPropertiesHidden, hasAllPropertiesChecked, organizationPropertiesCount, propertiesInOtherForms }) => {
    const intl = useIntl()
    const AddressesLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.addresses' })
    const CheckAllPropertiesLabel = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.chooseAllProperties' })

    const { requiredValidator } = useValidations()
    const { form, getUpdatedPricesField } = useMarketItemFormContext()
    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)
    const { breakpoints } = useLayoutContext()

    const priceFormName = useMemo(() => get(priceFormDescription, 'name'), [priceFormDescription])

    const propertySelectFormItemProps = useCallback((priceFormName) => ({
        label: AddressesLabel,
        required: true,
        name: [priceFormName, 'properties'],
        rules: hasAllPropertiesChecked ? [] : [requiredValidator],
    }), [AddressesLabel, hasAllPropertiesChecked, requiredValidator])

    const renderPropertyOptions = useCallback(() => (options, renderOption) => {
        return options
            .filter(option => !propertiesInOtherForms.includes(option.value))
            .map(renderOption)
    }, [propertiesInOtherForms])

    const search = useMemo(() => searchOrganizationPropertyWithExclusion(organizationId, propertiesInOtherForms),
        [organizationId, propertiesInOtherForms])

    const propertySelectProps: (priceFormName: number) => InputWithCheckAllProps['selectProps'] = useCallback((priceFormName) => ({
        showArrow: false,
        infinityScroll: true,
        search,
        disabled: !organizationId || hasAllPropertiesChecked,
        required: true,
        mode: organizationPropertiesCount === 1 ? null : 'multiple',
        renderOptions: renderPropertyOptions(),
    }), [search, organizationId, hasAllPropertiesChecked, organizationPropertiesCount, renderPropertyOptions])

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
            checkAllInitialValue={hasAllPropertiesChecked}
            mutationOfFormAfterCheckAll={handleCheckAll}
            checkboxHidden={isHasAllPropertiesHidden}
        />
    )
}

const MarketPriceForm = ({ priceFormDescription, removeOperation, organizationPropertiesCount, hasAllPropertiesChecked, formProperties = [] }) => {
    const intl = useIntl()
    const PriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType' })
    const PriceTypeTooltip = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.tooltip' })
    const ExactPriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.exactPrice' })
    const MinPriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.minPrice' })
    const ContractPriceTypeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.priceType.contractPrice' })
    const PriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.price' })
    const MeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.measure' })
    const PriceTooltip = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.price.tooltip' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })
    const MinPriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.price.minPriceMessage' })
    const PerItemPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.measure.perItem.full' })
    const PerMeterPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.measure.perMeter.full' })
    const PerHourPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.measure.perHour.full' })
    const NoPriceMeasureLabel = intl.formatMessage({ id: 'pages.condo.marketplace.noMeasure' })

    const { requiredValidator, numberValidator, lessThanValidator } = useValidations()
    const { form, currencyCode, getUpdatedPricesField } = useMarketItemFormContext()
    const parts = intl.formatNumberToParts(0, { style: 'currency', currency: currencyCode })
    const currencySymbolObj = parts.find(part => part.type === 'currency')
    const currencySymbol = get(currencySymbolObj, 'value')
    const priceFormName = useMemo(() => get(priceFormDescription, 'name'), [priceFormDescription])

    const priceFormsValue = Form.useWatch('prices', form) || []
    const priceTypeFormValue = Form.useWatch(['prices', priceFormName, 'priceType'], form)
    const priceHasAllPropertiesFormValue = Form.useWatch(['prices', priceFormName, 'hasAllProperties'], form)
    const propertiesInThisForm = Form.useWatch(['prices', priceFormName, 'properties'], form)
    const propertiesInOtherForms = useMemo(() =>
        formProperties.filter((form, index) => index !== priceFormName)
            .flat()
    , [formProperties, priceFormName])

    const isContractPrice = useMemo(() => priceTypeFormValue === PriceType.Contract, [priceTypeFormValue])
    const isHasAllPropertiesHidden = useMemo(
        () => difference(propertiesInOtherForms, propertiesInThisForm).length > 0 ||
            (priceFormsValue.some(price => price.hasAllProperties) && !priceHasAllPropertiesFormValue) ||
            organizationPropertiesCount === 1,
        [organizationPropertiesCount, priceFormsValue, priceHasAllPropertiesFormValue, propertiesInOtherForms, propertiesInThisForm])

    const handleContractPriceCheck = useCallback(async () => {
        form.setFieldsValue(getUpdatedPricesField(priceFormName, { price: null }))
        form.setFieldsValue(getUpdatedPricesField(priceFormName, { measure: undefined }))

        await form.validateFields(['prices', priceFormName, 'price'])
    }, [form, getUpdatedPricesField, priceFormName])

    const priceRules = useMemo(() => {
        if (isContractPrice) {
            return []
        }

        const rules = [requiredValidator, numberValidator]
        if (priceTypeFormValue === PriceType.Exact) {
            rules.push(lessThanValidator(MIN_PRICE_VALUE, `${MinPriceMessage} – ${MIN_PRICE_VALUE}${currencySymbol}`))
        }

        return rules
    }, [MinPriceMessage, currencySymbol, isContractPrice, lessThanValidator, numberValidator, priceTypeFormValue, requiredValidator])

    return (
        <Row gutter={[0, 28]}>
            <Col span={24}>
                <MarketPricePropertiesField
                    priceFormDescription={priceFormDescription}
                    hasAllPropertiesChecked={hasAllPropertiesChecked}
                    isHasAllPropertiesHidden={isHasAllPropertiesHidden}
                    organizationPropertiesCount={organizationPropertiesCount}
                    propertiesInOtherForms={propertiesInOtherForms}
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
                    required
                    name={[priceFormName, 'measure']}
                    label={MeasureLabel}
                    wrapperCol={{
                        span: 5,
                    }}
                >
                    <Select
                        defaultValue='perItem'
                        disabled={isContractPrice}
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
                            key={undefined}
                            value={undefined}
                        >
                            {NoPriceMeasureLabel}
                        </Select.Option>
                    </Select>
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    name={[priceFormName, 'price']}
                    required
                    rules={priceRules}
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
                                <Trash/>
                                {CancelMessage}
                            </Space>
                        </Typography.Text>
                    </Col>
                )
            }
        </Row>
    )
}

const MarketPricesList = ({ initialPrices }) => {
    const intl = useIntl()
    const PriceScopeGroupLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.section.priceScope' })
    const AddPriceScopeLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.addPriceScope' })

    const { organization, isLoading } = useOrganization()
    const { form } = useMarketItemFormContext()
    const prices = Form.useWatch('prices', form) || initialPrices

    const { count: organizationPropertiesCount } = Property.useCount({
        where: { organization: { id: get(organization, 'id') } },
    }, { skip: isLoading })

    const propertiesInForm = useMemo(() => prices.flatMap(price => get(price, 'properties')), [prices])
    const isAddButtonHidden = useMemo(
        () => propertiesInForm.length === organizationPropertiesCount || prices.some(price => price.hasAllProperties),
        [organizationPropertiesCount, prices, propertiesInForm.length]
    )

    const formProperties = useMemo(() => prices.map(price => get(price, 'properties')), [prices])
    const hasAllPropertiesChecked = useMemo(() => prices.some(price => price.hasAllProperties), [prices])

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
                                                    organizationPropertiesCount={organizationPropertiesCount}
                                                    formProperties={formProperties}
                                                    hasAllPropertiesChecked={hasAllPropertiesChecked}
                                                />
                                            </Col>
                                        ))
                                    }
                                </Row>
                            </Col>
                            {
                                !isAddButtonHidden && (
                                    <Col span={24}>
                                        <Typography.Text strong onClick={() => operation.add(INITIAL_PRICE_FORM_VALUE)}>
                                            <Space size={4} direction='horizontal'>
                                                <PlusCircle/>
                                                {AddPriceScopeLabel}
                                            </Space>
                                        </Typography.Text>
                                    </Col>
                                )
                            }
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
    const intl = useIntl()
    const SaveChangesModalTitle = intl.formatMessage({ id: 'form.prompt.title' })
    const SaveChangesModalMessage = intl.formatMessage({ id: 'form.prompt.message' })

    const { children, action, initialValues } = props
    const { breakpoints } = useLayoutContext()

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

    const formContextValue: BaseMarketItemFormContextType = useMemo(() => ({
        form,
        marketItemId,
        currencyCode: DEFAULT_INVOICE_CURRENCY_CODE,
        getUpdatedPricesField,
        initialValues,
    }), [form, getUpdatedPricesField, initialValues, marketItemId])

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
                        <>
                            <Prompt
                                title={SaveChangesModalTitle}
                                form={form}
                                handleSave={handleSave}
                            >
                                <Typography.Paragraph>
                                    {SaveChangesModalMessage}
                                </Typography.Paragraph>
                            </Prompt>
                            <Row gutter={[0, 60]}>
                                <Col>
                                    <Row gutter={isSmallScreen ? [0, 0] : [50, 0]}>
                                        <Col span={isSmallScreen ? 24 : 16}>
                                            <Row gutter={GROUP_OUTER_GUTTER}>
                                                <Col span={24}>
                                                    <MarketItemFields/>
                                                </Col>
                                                <Col span={24}>
                                                    <MarketPricesList
                                                        initialPrices={get(initialValues, 'prices')}
                                                    />
                                                </Col>
                                            </Row>
                                        </Col>
                                        {
                                            !isSmallScreen && (
                                                <Col span={8}>
                                                    <Form.Item
                                                        shouldUpdate
                                                        noStyle
                                                    >
                                                        {
                                                            ({ getFieldsValue }) => {
                                                                const {
                                                                    name,
                                                                    prices,
                                                                    sku,
                                                                    description,
                                                                    files,
                                                                } = getFieldsValue(
                                                                    ['name', 'prices', 'sku', 'description', 'files']
                                                                )

                                                                const price = get(prices, '0.price')
                                                                const priceType = get(prices, '0.priceType')
                                                                const measure = get(prices, '0.measure')

                                                                return (
                                                                    <MobilePreview
                                                                        name={name}
                                                                        price={price}
                                                                        priceType={priceType}
                                                                        measure={measure}
                                                                        sku={sku}
                                                                        description={description}
                                                                        files={files}
                                                                    />
                                                                )
                                                            }
                                                        }
                                                    </Form.Item>
                                                </Col>
                                            )
                                        }
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    {typeof children === 'function' ? children({ handleSave, form }) : children}
                                </Col>
                            </Row>
                        </>
                    )
                }
            </FormWithAction>
        </BaseMarketItemFormContext.Provider>
    )
}
