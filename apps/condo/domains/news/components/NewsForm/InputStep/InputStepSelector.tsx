import { useGetNewsSharingRecipientsLazyQuery } from '@app/condo/gql'
import {
    B2BAppNewsSharingConfig,
    Property as IProperty,
    NewsItem as INewsItem,
    B2BAppContext as IB2BAppContext,
} from '@app/condo/schema'
import { Col, Form, FormInstance, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import React, { useCallback, useMemo, useRef, ComponentProps } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Typography } from '@open-condo/ui'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { HiddenBlock, ScopeType } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { SectionNameInput } from '@condo/domains/user/components/SectionNameInput'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'


import { SharingAppValuesType } from '.'

const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]

export type Properties = {
    properties: Array<string>
}

interface InputStepSelectorProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharingStep: boolean
    form: FormInstance
    ctx: IB2BAppContext
    setSharingAppFormValues: React.Dispatch<React.SetStateAction<SharingAppValuesType>>
    scope: ScopeType
    setScope:  React.Dispatch<React.SetStateAction<ScopeType>>

    propertySelectProps: (form: FormInstance) => ComponentProps<typeof GraphQlSearchInput>
    selectedProperty: {
        loading: boolean
        objs:  Array<IProperty>
    }
    newsItemForOneProperty: boolean
    initialValues?: Partial<INewsItem> & { hasAllProperties?: boolean, hasAllCustom?: boolean }
    initialFormValues: Record<string, unknown> & Properties
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

    const onError = useMutationErrorHandler()
    const [getNewsSharingRecipients, { data }] = useGetNewsSharingRecipientsLazyQuery({
        onError: (error) => {
            console.error({ msg: 'Failed to load recipients counters', error })
            const message = error?.graphQLErrors?.[0]?.extensions?.messageForUser || ErrorLoadingMessage
            // @ts-ignore
            onError(message)
        },
    })

    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        required: true,
        name: 'properties',
        validateFirst: true,
    }), [PropertiesLabel])

    const customSelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        required: true,
        name: 'customSelect',
        validateFirst: true,
    }), [])

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharingStep
    const isCustomSelector = newsSharingConfig?.getRecipientsUrl
    const viewSelector = !isCustomForm && (!isSharingStep || isCustomSelector)

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
                    if (countPropertiesAvailableToSelect.current === 1 && selectedPropertiesId.length === 0 && !!onlyPropertyThatCanBeSelected?.current?.value) {
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
        if (initialFormValues?.property || initialFormValues?.properties?.length || initialFormValues?.hasAllProperties) return
        if (!newsItemForOneProperty) return
        if (data.length !== 1) return
        if (propertyIsAutoFilled.current) return

        propertyIsAutoFilled.current = true
        const propertyId = data?.[0]?.value
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
            const unitNamesKeys = options.map(option => option.key)
            setScope(prev=>({ ...prev, selectedUnitNameKeys: unitNamesKeys }))
        }
    }, [])

    const handleChangeSectionNameInput = useCallback((property) => {
        return (sections, options) => {
            if (!sections || sections.length === 0) {
                setScope(prev=>({ ...prev, selectedSectionKeys: [] }))
            } else {
                const sectionKeys = sections.map(section => section.key || section)
                setScope(prev=>({ ...prev, selectedSectionKeys: sectionKeys }))
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
                const message = error?.graphQLErrors?.[0]?.extensions?.messageForUser || ErrorLoadingMessage
                // @ts-ignore
                onError(message)
                return []
            }
        },
        required: true,
        showArrow:false,
        infinityScroll:true,
        placeholder:CustomSelectRecipientsPlaceholder,
        onChange:(propIds: Array<string>) => {
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
                                        checkAllInitialValue={!!initialValues?.hasAllProperties}
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
                                            label={selectedPropertiesLoading || !!scope.selectedSectionKeys?.length || !scope.selectedSectionKeys
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
                                                disabled={selectedPropertiesLoading || !!scope.selectedSectionKeys?.length || !scope.selectedSectionKeys}
                                                onChange={handleChangeUnitNameInput}/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={11} offset={2}>
                                        <Form.Item
                                            name='sectionIds'
                                            label={selectedPropertiesLoading || !!scope.selectedUnitNameKeys?.length || !scope.selectedSectionKeys
                                                ? (<LabelWithInfo
                                                    title={SectionsMessage}
                                                    message={SectionsLabel}/>)
                                                : SectionsLabel}
                                        >
                                            <SectionNameInput
                                                disabled={selectedPropertiesLoading || !!scope.selectedUnitNameKeys?.length || !scope.selectedSectionKeys}
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
                        <Row gutter={SMALL_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Typography.Title level={2}>{SelectAddressLabel}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <GraphQlSearchInputWithCheckAll
                                    CheckAllMessage={CheckAllLabel}
                                    checkAllFieldName='hasAllCustom'
                                    selectProps={customSelectProps}
                                    checkAllInitialValue={initialValues?.hasAllCustom}
                                    onCheckBoxChange={customCheckboxChange()}
                                    form={form}
                                    selectFormItemProps={customSelectFormItemProps}
                                />
                            </Col>
                        </Row>
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