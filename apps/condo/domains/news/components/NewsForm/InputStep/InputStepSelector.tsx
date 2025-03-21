/** @jsx jsx */
import { useGetNewsSharingRecipientsLazyQuery } from '@app/condo/gql'
import { B2BAppNewsSharingConfig, Property as IProperty,  NewsItem as INewsItem } from '@app/condo/schema'
import { css, jsx } from '@emotion/react'
import { Col, Form, FormInstance, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import has from 'lodash/has'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useMemo, useRef } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Typography } from '@open-condo/ui'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { HiddenBlock, ScopeType } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { SectionNameInput } from '@condo/domains/user/components/SectionNameInput'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'

const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const FORM_FILED_COL_PROPS = css`width: 100%; padding: 0; height: 44px`

interface InputStepSelectorProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharingStep: boolean
    form: FormInstance
    ctx: any
    setSharingAppFormValues: any
    scope: ScopeType
    setScope:  React.Dispatch<React.SetStateAction<ScopeType>>

    propertySelectProps: (form: FormInstance) => any
    selectedProperty: {
        loading: boolean
        objs:  IProperty[]
    }
    newsItemForOneProperty: boolean
    initialValues?: Partial<INewsItem>
    initialFormValues: Record<string, unknown>
}

export const InputStepSelector: React.FC<InputStepSelectorProps> = ({
    ctx,
    setSharingAppFormValues,
    newsSharingConfig,
    isSharingStep,
    scope,
    propertySelectProps,
    form,
    selectedProperty,
    setScope,
    newsItemForOneProperty,
    initialValues,
    initialFormValues,
}) => {
    const intl = useIntl()
    const { loading: selectedPropertiesLoading, objs: selectedProperties } = selectedProperty

    const { requiredValidator } = useValidations()

    const SelectAddressLabel = intl.formatMessage({ id: 'news.fields.address.label' })
    const CheckAllLabel = intl.formatMessage({ id: 'global.checkAll' })
    const UnitsLabel = intl.formatMessage({ id: 'news.fields.units.label' })
    const UnitsMessage = intl.formatMessage({ id: 'news.fields.units.message' })
    const SectionsLabel = intl.formatMessage({ id: 'news.fields.sections.label' })
    const SectionsMessage = intl.formatMessage({ id: 'news.fields.sections.message' })
    const RecipientsLabelMessage = intl.formatMessage({ id: 'pages.condo.news.steps.sharingApp.recipientsLabel' })
    const RecipientsAlertTextMessage = intl.formatMessage({ id: 'pages.condo.news.steps.sharingApp.recipientsAlert' })
    const PropertiesLabel = intl.formatMessage({ id: 'field.Address' })
    const ErrorLoadingMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.error.loading' })
    const CustomSelectRecipientsPlaceholder = intl.formatMessage({ id: 'global.select.recipients' })
    const CustomSelectLabel = intl.formatMessage({ id: 'field.Recipients' })

    const [getNewsSharingRecipients, { data }] = useGetNewsSharingRecipientsLazyQuery({
        onError: (error) => {
            console.error({ msg: 'Failed to load recipients counters', error })
            const message = error?.graphQLErrors?.[0]?.extensions?.messageForUser || ErrorLoadingMessage
            notification.error({ message })
        },
    })

    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        labelCol: { css: FORM_FILED_COL_PROPS },
        required: true,
        name: 'properties',
        validateFirst: true,
    }), [PropertiesLabel])

    const customSelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: CustomSelectLabel,
        labelCol: { css: FORM_FILED_COL_PROPS },
        required: true,
        name: 'customSelect',
        validateFirst: true,
    }), [CustomSelectLabel])

    const isCustomSelector = newsSharingConfig?.getRecipientsUrl
    const viewSelector = !isSharingStep || isCustomSelector

    const isOnlyOnePropertySelected: boolean = useMemo(() => (scope.selectedPropertiesId.length === 1), [scope.selectedPropertiesId.length])

    const countPropertiesAvailableToSelect = useRef(null)
    const onlyPropertyThatCanBeSelected = useRef(null)
    const propertyIsAutoFilled = useRef(false)

    const propertyCheckboxChange = (form) => {
        return (value) => {
            if (value) setScope(
                prev => {
                    const selectedPropertiesId = prev.selectedPropertiesId

                    if (countPropertiesAvailableToSelect.current === 1 && selectedPropertiesId.length === 1)
                        return prev
                    if (countPropertiesAvailableToSelect.current === 1 && selectedPropertiesId.length === 0 && has(onlyPropertyThatCanBeSelected, 'current.value')) {
                        return { ...prev, selectedPropertiesId:  [onlyPropertyThatCanBeSelected.current.value] }
                    }
                    return { ...prev, selectedPropertiesId: [] }
                }
            )

            if (countPropertiesAvailableToSelect.current === 1 && !value) {
                setScope(prev=>({ ...prev, selectedPropertiesId: [] }))
            }

            setScope(prev=>({ ...prev, isAllPropertiesChecked: value }))
            form.setFieldsValue({ 'unitNames': [] })
            form.setFieldsValue({ 'sectionIds': [] })
            setScope(prev=>({ ...prev, selectedUnitNameKeys: [] }))
            setScope(prev=>({ ...prev, selectedSectionKeys: [] }))
        }
    }

    const customCheckboxChange = () => {
        return (value) => {
            if (value)
                setSharingAppFormValues(prev=>({ ...prev, scope: data?.recipients.map(elem=>elem.id), isAllChecked: value }))
            else
                setSharingAppFormValues(prev=>({ ...prev, scope: prev.isAllChecked ? [] : prev.scope }))
        }
    }

    const handleAllPropertiesLoading = useCallback((form: FormInstance) => (data) => {
        if (!isEmpty(get(initialFormValues, 'property')) || !isEmpty(get(initialFormValues, 'properties')) || get(initialFormValues, 'hasAllProperties')) return
        if (!newsItemForOneProperty) return
        if (data.length !== 1) return
        if (propertyIsAutoFilled.current) return

        propertyIsAutoFilled.current = true
        const propertyId = get(data, '0.value')
        if (propertyId) {
            setScope(prev=>({ ...prev, selectedPropertiesId: [propertyId] }))
            form.setFieldsValue({
                property: propertyId,
                'properties': [propertyId],
                hasAllProperties: true,
            })
        }
    }, [initialFormValues, newsItemForOneProperty])

    const handleAllPropertiesDataLoading = useCallback((data) => {
        countPropertiesAvailableToSelect.current = data.length
        if (data.length === 1) {
            onlyPropertyThatCanBeSelected.current = data[0]
        }
    }, [])

    const handleChangeUnitNameInput = useCallback((_, options: UnitNameInputOption[]) => {
        if (!options) {
            setScope(prev=>({ ...prev, selectedUnitNameKeys: null }))
        } else {
            const unitNamesKeys = options.map(option => get(option, 'key'))
            setScope(prev=>({ ...prev, selectedUnitNameKeys: unitNamesKeys }))
        }
    }, [])

    const handleChangeSectionNameInput = useCallback((property) => {
        return (sections, options) => {
            if (!isEmpty(sections)) {
                const sectionKeys = options.map(option => get(option, 'key'))
                setScope(prev=>({ ...prev, selectedSectionKeys: sectionKeys }))
            } else {
                setScope(prev=>({ ...prev, selectedSectionKeys: [] }))
            }
        }
    }, [])

    const customSelectProps = {
        search: async ()=> {
            try {
                const data = await getNewsSharingRecipients({
                    variables: {
                        data: {
                            b2bAppContext: { id: ctx?.id },
                            dv: 1,
                            sender: getClientSideSenderInfo(),
                        },
                    },
                })

                return data.data.recipients.map(el => ({ text: el.name, value: el.id }))
            }
            catch (error) {
                console.error('error: ', error)
                notification.error({ message: ErrorLoadingMessage })
                return []
            }
        },
        required: true,
        showArrow:false,
        infinityScroll:true,
        placeholder:CustomSelectRecipientsPlaceholder,
        onChange:(propIds: string[]) => {
            setSharingAppFormValues(prev=>({ ...prev, scope: propIds, isAllChecked: false }))
        },
    }

    return (
        <Col span={14}>
            {viewSelector ? (
                <Row>
                    {!isCustomSelector ? (
                        <>
                            <Col span={24}>
                                <Typography.Title level={2}>{SelectAddressLabel}</Typography.Title>
                            </Col>
                            <Col span={24} data-cy='news__create-property-search'>
                                {newsItemForOneProperty && (
                                    <Form.Item
                                        {...propertySelectFormItemProps}
                                        name='property'
                                        rules={[requiredValidator]}
                                    >
                                        <GraphQlSearchInput
                                            {...propertySelectProps(form)}
                                            onAllDataLoading={handleAllPropertiesLoading(form)}/>
                                    </Form.Item>
                                )}
                                <HiddenBlock hide={newsItemForOneProperty}>
                                    <GraphQlSearchInputWithCheckAll
                                        checkAllFieldName='hasAllProperties'
                                        checkAllInitialValue={get(initialValues, 'hasAllProperties', false)}
                                        selectFormItemProps={propertySelectFormItemProps}
                                        selectProps={propertySelectProps(form)}
                                        onCheckBoxChange={propertyCheckboxChange(form)}
                                        CheckAllMessage={CheckAllLabel}
                                        onDataLoaded={handleAllPropertiesDataLoading}
                                        form={form}/>
                                </HiddenBlock>
                            </Col>
                            {isOnlyOnePropertySelected && (
                                <>
                                    <Col span={11}>
                                        <Form.Item
                                            name='unitNames'
                                            label={selectedPropertiesLoading || !isEmpty(scope.selectedSectionKeys)
                                                ? (
                                                    <LabelWithInfo
                                                        title={UnitsMessage}
                                                        message={UnitsLabel}
                                                    />
                                                )
                                                : UnitsLabel}
                                        >
                                            <UnitNameInput
                                                multiple={true}
                                                property={selectedProperties[0]}
                                                loading={selectedPropertiesLoading}
                                                disabled={selectedPropertiesLoading || !isEmpty(scope.selectedSectionKeys)}
                                                onChange={handleChangeUnitNameInput}/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={11} offset={2}>
                                        <Form.Item
                                            name='sectionIds'
                                            label={selectedPropertiesLoading || !isEmpty(scope.selectedUnitNameKeys)
                                                ? (<LabelWithInfo
                                                    title={SectionsMessage}
                                                    message={SectionsLabel}/>)
                                                : SectionsLabel}
                                        >
                                            <SectionNameInput
                                                disabled={selectedPropertiesLoading || !isEmpty(scope.selectedUnitNameKeys)}
                                                property={selectedProperties[0]}
                                                onChange={handleChangeSectionNameInput(selectedProperties[0])}
                                                mode='multiple'
                                                data-cy='news__create-property-section-search'/>
                                        </Form.Item>
                                    </Col>
                                </>
                            )}
                        </>
                    ) : (
                        <GraphQlSearchInputWithCheckAll
                            CheckAllMessage={CheckAllLabel}
                            checkAllFieldName='hasAllCustom'
                            selectProps={customSelectProps}
                            checkAllInitialValue={get(initialValues, 'hasAllCustom', false)}
                            onCheckBoxChange={customCheckboxChange()}
                            form={form}
                            selectFormItemProps={customSelectFormItemProps}
                        />
                    )}
                </Row>
            ) : (
                <Row gutter={SMALL_VERTICAL_GUTTER}>
                    <Col span={24}>
                        <Typography.Title level={2}>{RecipientsLabelMessage}</Typography.Title>
                    </Col>

                    <Col span={24}>
                        <Alert
                            type='info'
                            showIcon
                            description={RecipientsAlertTextMessage}
                        />
                    </Col>
                </Row>
            )}
        </Col>
    )
}