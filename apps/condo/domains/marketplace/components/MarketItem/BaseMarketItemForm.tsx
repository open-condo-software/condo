/** @jsx jsx */
import { MarketItem as MarketItemType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, Form, Input, Row, RowProps } from 'antd'
import { Rule } from 'antd/lib/form'
import { FormProps } from 'antd/lib/form/Form'
import get from 'lodash/get'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Select, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MarketCategory, MarketItem } from '@condo/domains/marketplace/utils/clientSchema'
import { MarketItemFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'


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

const MarketItemFields = ({ form, marketItemId }) => {
    const intl = useIntl()
    const NameFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.name' })
    const SkuFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.sku' })
    const SkuTooltipMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.sku.tooltip' })
    const DescriptionFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.description' })
    const MarketItemPhotoFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.marketItemPhoto' })

    const { organization } = useOrganization()
    const { refetch: fetchMarketItemsCount } = MarketItem.useCount({}, { skip: true })

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

const MarketPricesList = () => {
    const intl = useIntl()
    const PriceScopeGroupLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.section.priceScope' })

    return (
        <Row gutter={GROUP_INNER_GUTTER}>
            <Col>
                <Typography.Title level={3}>{PriceScopeGroupLabel}</Typography.Title>
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

    const marketItemId = get(initialValues, 'id')
    const isSmallScreen = !breakpoints.DESKTOP_SMALL

    return (
        <FormWithAction
            validateTrigger={FORM_VALIDATE_TRIGGER}
            action={action}
            initialValues={initialValues}
            {...FORM_LAYOUT_PROPS}
        >
            {
                ({ handleSave, form }) => (
                    <Row gutter={isSmallScreen ? [0, 0] : [50, 0]}>
                        <Col span={isSmallScreen ? 24 : 16}>
                            <Row gutter={GROUP_OUTER_GUTTER}>
                                <Col span={24}>
                                    <MarketItemFields
                                        form={form}
                                        marketItemId={marketItemId}
                                    />
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
                        {typeof children === 'function' ? children({ handleSave, form }) : children}
                    </Row>
                )
            }
        </FormWithAction>
    )
}