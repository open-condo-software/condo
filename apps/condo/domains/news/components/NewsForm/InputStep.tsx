import { Col, Form, FormInstance, Row } from 'antd'
import get from 'lodash/get'
import has from 'lodash/has'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import transform from 'lodash/transform'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Typography, ActionBar as UIActionBar } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import {
    BIG_HORIZONTAL_GUTTER,
    BIG_MARGIN_BOTTOM_STYLE,
    FORM_FILED_COL_PROPS, getBodyTemplateChangedRule, getTitleTemplateChangedRule,
    getTypeAndNameByKey,
    getUnitNamesAndUnitTypes,
    HiddenBlock,
    MARGIN_BOTTOM_10_STYLE,
    MARGIN_BOTTOM_32_STYLE,
    NO_RESIZE_STYLE, SendPeriodType, SMALL_VERTICAL_GUTTER, TScope,
} from './BaseNewsForm'

import {
    B2BApp, B2BAppNewsSharingConfig,  NewsItem as INewsItem,
    NewsItemScope as INewsItemScope,
    Property as IProperty,
} from '../../../../schema'
import Input from '../../../common/components/antd/Input'
import { GraphQlSearchInput } from '../../../common/components/GraphQlSearchInput'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '../../../common/components/GraphQlSearchInputWithCheckAll'
import { LabelWithInfo } from '../../../common/components/LabelWithInfo'
import { useLayoutContext } from '../../../common/components/LayoutContext'
import { TrackingEventType, useTracking } from '../../../common/components/TrackingContext'
import { useInputWithCounter } from '../../../common/hooks/useInputWithCounter'
import { useValidations } from '../../../common/hooks/useValidations'
import { IFrame } from '../../../miniapp/components/IFrame'
import { NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS } from '../../../miniapp/constants'
import { searchOrganizationProperty } from '../../../ticket/utils/clientSchema/search'
import { SectionNameInput } from '../../../user/components/SectionNameInput'
import { UnitNameInput, UnitNameInputOption } from '../../../user/components/UnitNameInput'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '../../constants/newsTypes'
import { MemoizedCondoNewsPreview, MemoizedSharingNewsPreview } from '../NewsPreview'
import { MemoizedNewsSharingRecipientCounter, MemoizedRecipientCounter } from '../RecipientCounter'
import { TemplatesSelect } from '../TemplatesSelect'
import { NewsItemScopeNoInstanceType } from '../types'

const buildCounterStyle = (textLength: number, type: 'Body' | 'Title'): React.CSSProperties => {
    const style: React.CSSProperties = {
        position: 'absolute',
        right: 0,
        margin: '12px',
        padding: '2px 10px',
        borderRadius: '100px',
        backgroundColor: `${colors.gray[7]}`,
    }

    if (textLength > 0) {
        style.backgroundColor = `${colors.black}`
    }

    if (type === 'Body') {
        style.bottom = '12px'
    }
    if (type === 'Title') {
        style.bottom = '12px'
    }

    return style
}

export type SharingAppValues = {
    formValues: Record<string, unknown>
    preview: {
        renderedTitle: string
        renderedBody: string
    }
    isValid: boolean
}

interface INewsItemSharingForm {
    sharingAppData?: {
        app: B2BApp
        id: string
        newsSharingConfig: B2BAppNewsSharingConfig
    }
    onSubmit: (SharingAppValues) => void
    onSkip: (SharingAppValues) => void

    initialValues: SharingAppValues | undefined

    newsItemData: {
        type: string
        validBefore?: string
        title: string
        body: string
    }
}

export type BaseNewsFormProps = {
    organizationId: string
    initialValues?: Partial<INewsItem>
    & Partial<{
        newsItemScopes: INewsItemScope[]
        hasAllProperties: boolean
        sendPeriod: SendPeriodType
        properties?: IProperty[]
    }>
    templates: { [key: string]: {
        title: string
        body: string
        type: string | null
        id?: string
        label?: string
        category?: string
    } }
    totalProperties: number
    autoFocusBody?: boolean
}

type TInputStepProps = INewsItemSharingForm & BaseNewsFormProps & {
    form: any
    scope: TScope
    setScope:  React.Dispatch<React.SetStateAction<TScope>>
    isSharing: boolean
    selectedProperty: {
        loading: boolean
        objs:  IProperty[]
    }
    initialPropertyIds: string[]
    initialFormValues: Record<string, unknown>
}

export const FormContainerContainer: React.FC = ({ children }) => {
    return (
        <Col span={24} style={BIG_MARGIN_BOTTOM_STYLE}>
            <Row gutter={BIG_HORIZONTAL_GUTTER}>
                {children}
            </Row>
        </Col>
    )
}

export const InputStep: React.FC<TInputStepProps> = ({
    form,
    scope,
    onSkip,
    onSubmit,
    setScope,
    templates,
    isSharing,
    newsItemData,
    initialValues,
    autoFocusBody,
    sharingAppData,
    organizationId,
    totalProperties,
    selectedProperty,
    initialPropertyIds,
    initialFormValues,
}
) => {
    const intl = useIntl()
    const { app: sharingApp, id: ctxId } = sharingAppData ?? { ctxId: null, sharingApp: null }
    const { id, newsSharingConfig } = sharingApp ?? { id: null, newsSharingConfig: null }
    const { type: selectedType, validBefore: selectedValidBeforeText, title: title, body: body } = newsItemData
    const { loading: selectedPropertiesLoading, objs: selectedProperties } = selectedProperty

    const MakeTextLabel = intl.formatMessage({ id: 'news.fields.makeText.label' })
    const SelectTextLabel = intl.formatMessage({ id: 'news.fields.text.label' })
    const SelectAddressLabel = intl.formatMessage({ id: 'news.fields.address.label' })
    const TitleLabel = intl.formatMessage({ id: 'news.fields.title.label' })
    const TitlePlaceholderMessage = intl.formatMessage({ id: 'news.fields.title.placeholder' })
    const BodyLabel = intl.formatMessage({ id: 'news.fields.body.label' })
    const BodyPlaceholderMessage = intl.formatMessage({ id: 'news.fields.body.placeholder' })
    const CheckAllLabel = intl.formatMessage({ id: 'global.checkAll' })
    const UnitsLabel = intl.formatMessage({ id: 'news.fields.units.label' })
    const UnitsMessage = intl.formatMessage({ id: 'news.fields.units.message' })
    const SectionsLabel = intl.formatMessage({ id: 'news.fields.sections.label' })
    const SectionsMessage = intl.formatMessage({ id: 'news.fields.sections.message' })
    const TemplateBlanksNotFilledErrorMessage = intl.formatMessage({ id: 'news.fields.template.blanksNotFilledError' })
    const PropertiesLabel = intl.formatMessage({ id: 'field.Address' })
    const SelectAddressPlaceholder = intl.formatMessage({ id: 'global.select.address' })
    const TitleErrorMessage = intl.formatMessage({ id: 'news.fields.title.error.length' })
    const BodyErrorMessage = intl.formatMessage({ id: 'news.fields.body.error.length' })
    const NextStepShortMessage = intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelShort' })
    const RecipientsLabelMessage = intl.formatMessage({ id: 'pages.condo.news.steps.sharingApp.recipientsLabel' })
    const RecipientsAlertTextMessage = intl.formatMessage({ id: 'pages.condo.news.steps.sharingApp.recipientsAlert' })
    const NextStepMessage = intl.formatMessage({ id: 'pages.condo.news.steps.nextStep' })

    const { logEvent, getEventName } = useTracking()

    const { breakpoints } = useLayoutContext()
    const { requiredValidator } = useValidations()

    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const onlyPropertyThatCanBeSelected = useRef(null)
    const countPropertiesAvailableToSelect = useRef(null)

    const Title = useInputWithCounter(Input.TextArea, 150)
    const Body = useInputWithCounter(Input.TextArea, 800)

    const isOnlyOnePropertySelected: boolean = useMemo(() => (scope.selectedPropertiesId.length === 1), [scope.selectedPropertiesId.length])

    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        labelCol: FORM_FILED_COL_PROPS,
        required: true,
        name: 'properties',
        validateFirst: true,
    }), [PropertiesLabel])

    const propertyIsAutoFilled = useRef(false)
    const newsItemForOneProperty = totalProperties === 1 && initialPropertyIds.length < 2

    const newsItemScopesNoInstance = useMemo<NewsItemScopeNoInstanceType[]>(() => {
        if (scope.isAllPropertiesChecked && countPropertiesAvailableToSelect.current !== 1) {
            return [{ property: null, unitType: null, unitName: null }]
        }

        if (selectedPropertiesLoading || scope.selectedPropertiesId.length === 0) {
            return []
        }

        if (isOnlyOnePropertySelected) {
            if (!isEmpty(scope.selectedUnitNameKeys)) {
                return scope.selectedUnitNameKeys.map((unitKey) => {
                    const { name: unitName, type: unitType } = getTypeAndNameByKey(unitKey)
                    return { property: selectedProperties[0], unitType: unitType, unitName: unitName }
                })
            }
            if (!isEmpty(scope.selectedSectionKeys)) {
                const { unitNames, unitTypes } = getUnitNamesAndUnitTypes(selectedProperties[0], scope.selectedSectionKeys)
                return unitNames.map((unitName, i) => {
                    return { property: selectedProperties[0], unitType: unitTypes[i], unitName: unitName }
                })
            }
            if (isEmpty(scope.selectedUnitNameKeys) && isEmpty(scope.selectedSectionKeys)) {
                return [{ property: selectedProperties[0], unitType: null, unitName: null }]
            }

            return []
        } else if (!isEmpty(selectedProperties)) {
            return selectedProperties.map(property => {
                return { property: property, unitType: null, unitName: null }
            })
        }

        return []
    }, [scope, isOnlyOnePropertySelected, selectedProperties, selectedPropertiesLoading])

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

    const handleChangeUnitNameInput = useCallback((_, options: UnitNameInputOption[]) => {
        if (!options) {
            setScope(prev=>({ ...prev, selectedUnitNameKeys: null }))
        } else {
            const unitNamesKeys = options.map(option => get(option, 'key'))
            setScope(prev=>({ ...prev, selectedUnitNameKeys: unitNamesKeys }))
        }
    }, [])

    const propertySelectProps = (form) => {
        return {
            showArrow: false,
            infinityScroll: true,
            initialValue: initialPropertyIds,
            search: searchOrganizationProperty(organizationId),
            disabled: !organizationId,
            required: true,
            placeholder: SelectAddressPlaceholder,
            onChange: (propIds: string[]) => {
                setScope(prev=>({ ...prev, selectedPropertiesId: !isArray(propIds) ? [propIds].filter(Boolean) : propIds }))

                form.setFieldsValue({ 'unitNames': [] })
                form.setFieldsValue({ 'sectionIds': [] })
                setScope(prev=>({ ...prev, selectedUnitNameKeys: [] }))
                setScope(prev=>({ ...prev, selectedSectionKeys: [] }))
            },
        }
    }

    const handleAllPropertiesDataLoading = useCallback((data) => {
        countPropertiesAvailableToSelect.current = data.length
        if (data.length === 1) {
            onlyPropertyThatCanBeSelected.current = data[0]
        }
    }, [])

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

    const commonTemplates = useMemo(() => {
        return transform(templates, (result, value, key) => {
            if (value.type === NEWS_TYPE_COMMON || isNull(value.type)) {
                result[key] = value
            }
        }, {})
    }, [templates])

    const emergencyTemplates = useMemo(() => {
        return transform(templates, (result, value, key) => {
            if (value.type === NEWS_TYPE_EMERGENCY || isNull(value.type)) {
                result[key] = value
            }
        }, {})
    }, [templates])

    const emergencyTemplatesTabsProps = useMemo(() => Object.keys(emergencyTemplates).map(id => ({
        key: id,
        label: emergencyTemplates[id].label || emergencyTemplates[id].title,
        category: emergencyTemplates[id].category,
    })), [emergencyTemplates])

    const commonTemplatesTabsProps = useMemo(() => Object.keys(commonTemplates).map(id => ({
        key: id,
        label: commonTemplates[id].label || emergencyTemplates[id].title,
        category: commonTemplates[id].category,
    })), [commonTemplates])

    const titleRule = useMemo(() => ({
        whitespace: true,
        required: true,
        message: TitleErrorMessage,
    }), [TitleErrorMessage])
    const MemoizedTitleTemplateChangedRule = useMemo(() => getTitleTemplateChangedRule(TemplateBlanksNotFilledErrorMessage), [TemplateBlanksNotFilledErrorMessage])
    const bodyRule = useMemo(() => ({
        whitespace: true,
        required: true,
        message: BodyErrorMessage,
    }), [BodyErrorMessage])
    const MemoizedBodyTemplateChangedRule = useMemo(() => getBodyTemplateChangedRule(TemplateBlanksNotFilledErrorMessage), [TemplateBlanksNotFilledErrorMessage])

    const previewHasPush = useMemo(() =>
        (newsSharingConfig?.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ENABLED) ||
            (newsSharingConfig?.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ONLY_EMERGENCY && newsItemData.type === NEWS_TYPE_EMERGENCY),
    [newsSharingConfig, newsItemData, NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS])

    const appName = newsSharingConfig?.name
    const appIcon = get(newsSharingConfig, ['icon', 'publicUrl'])
    const appPreviewUrl = newsSharingConfig?.previewUrl

    const iFramePreviewRef = useRef(null)

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharing
    const isCustomPreview = !!newsSharingConfig?.previewUrl && isSharing
    const isCustomRecipientCounter = !!newsSharingConfig?.getRecipientsCountersUrl && isSharing
    const isCustomSelector = newsSharingConfig?.getRecipientsUrl
    const viewSelector = !isSharing || isCustomSelector

    const viewNewsSharingSubmit = isSharing

    const processedInitialValues = useMemo(()=> (initialValues && initialValues.formValues && initialValues.preview) ? initialValues : {
        formValues: {},
        preview: { renderedTitle: '', renderedBody: '' },
        isValid: false,
    }, [initialValues])

    const [sharingAppFormValues, setSharingAppFormValues] = useState<SharingAppValues>(processedInitialValues)

    useEffect(() => {
        setSharingAppFormValues(processedInitialValues)
    }, [processedInitialValues])

    const handleSharingAppIFrameFormMessage = useCallback((event) => {
        const { handler, ctxId: eventCtxId, formValues, preview, isValid } = event.data
        if (handler === 'handleSharingAppIFrameFormMessage' && id === eventCtxId) {
            setSharingAppFormValues({ formValues, preview, isValid })
        }
    }, [id])

    const handleFormTitleChange = useCallback((value) => {
        if (isSharing){
            setSharingAppFormValues(prev=>({ ...prev,
                formValues: { body: prev.formValues.body, title: value },
                preview: { renderedBody: prev.preview.renderedBody, renderedTitle: value },
                isValid:  body.length > 3 && value.length > 3,
            }))
        }
        else handleTitleChange(value)
    }, [isSharing, sharingAppFormValues])

    const handleFormBodyChange = useCallback((value) => {
        if (isSharing){
            setSharingAppFormValues(prev=>({ ...prev,
                formValues: { title: prev.formValues.title, body: value },
                preview: { renderedTitle: prev.preview.renderedTitle, renderedBody: value },
                isValid:  title.length > 3 && value.length > 3,
            }))
        }
        else handleBodyChange(value)
    }, [isSharing, sharingAppFormValues])

    const newsSharingRecipientCounter = useMemo(() => <>{newsSharingConfig?.getRecipientsCountersUrl && (
        <MemoizedNewsSharingRecipientCounter
            contextId={ctxId}
            newsItemScopes={newsItemScopesNoInstance}
        />
    )}</>, [newsSharingConfig, newsItemData])

    const [selectedTitle, setSelectedTitle] = useState<string>(title)
    const [selectedBody, setSelectedBody] = useState<string>(body)

    useEffect(() => {
        const title = get(sharingAppFormValues, ['preview', 'renderedTitle'])
        const body = get(sharingAppFormValues, ['preview', 'renderedBody'])

        if (iFramePreviewRef.current) {
            iFramePreviewRef.current.contentWindow.postMessage({
                handler: 'handleUpdateFromCondo',
                title,
                body,
            }, appPreviewUrl)
        }
    }, [sharingAppFormValues, iFramePreviewRef, appPreviewUrl])

    useEffect(() => {
        if (!title.length) return

        const renderedTitle = get(sharingAppFormValues, ['preview', 'renderedTitle'])
        const finalTitle = isSharing && (isCustomForm || (!isCustomForm && renderedTitle)) ? renderedTitle : title

        handleFormTitleChange(finalTitle)
        form.setFieldsValue({ title: finalTitle })
        Title.setTextLength(finalTitle.length)

        if (!body.length) return

        const renderedBody = get(sharingAppFormValues, ['preview', 'renderedBody'])
        const finalBody = isSharing && (isCustomForm || (!isCustomForm && renderedBody)) ? renderedBody : body

        handleFormBodyChange(finalBody)
        form.setFieldsValue({ body: finalBody })
        Body.setTextLength(finalBody.length)
    }, [title, body, form, isSharing, isCustomForm])


    const handleTitleChange = useCallback((value) => {
        setSelectedTitle(value)
    }, [])

    const handleBodyChange = useCallback((value) => {
        setSelectedBody(value)
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined' && isCustomForm) {
            window.addEventListener('message', handleSharingAppIFrameFormMessage)
            return () => window.removeEventListener('message', handleSharingAppIFrameFormMessage)
        }
    }, [handleSharingAppIFrameFormMessage, isCustomForm])

    const handleTemplateChange = useCallback((form) => (value) => {
        const templateId = value
        const title = templateId !== 'emptyTemplate' ? templates[templateId].title : ''
        const body = templateId !== 'emptyTemplate' ? templates[templateId].body : ''

        const eventName = getEventName(TrackingEventType.Click)
        const eventProperties = {
            components: { value: { title, body } },
        }
        logEvent({ eventName, eventProperties })

        form.setFieldValue('title', title)
        setSelectedTitle(title)
        Title.setTextLength(title.length)

        form.setFieldValue('body', body)
        setSelectedBody(body)
        Body.setTextLength(body.length)
    }, [Body, Title, templates])

    return (
        <>
            <FormContainerContainer>
                {
                    isCustomForm ? (
                        <Col style={{ marginLeft: '-10px', minHeight: '500px' }} span={formFieldsColSpan}>
                            <IFrame
                                src={
                                    `${newsSharingConfig.customFormUrl}?ctxId=${id}&title=${selectedTitle}&body=${selectedBody}&type=${newsItemData.type}&initialValues=${JSON.stringify(processedInitialValues)}`
                                }
                                reloadScope='organization'
                                withLoader
                                withPrefetch
                                withResize
                            />
                        </Col>
                    ) : (
                        <Col span={formFieldsColSpan}>
                            <Row>
                                <Col span={24} style={MARGIN_BOTTOM_32_STYLE}>
                                    <Typography.Title level={2}>
                                        {MakeTextLabel}
                                    </Typography.Title>
                                </Col>

                                {templates && (
                                    <Col span={24} style={BIG_MARGIN_BOTTOM_STYLE}>
                                        <Form.Item
                                            name='template'
                                        >
                                            {selectedType === NEWS_TYPE_COMMON && (
                                                <TemplatesSelect
                                                    onChange={handleTemplateChange(form)}
                                                    items={commonTemplatesTabsProps}
                                                    hasCategories
                                                />
                                            )}
                                            {selectedType === NEWS_TYPE_EMERGENCY && (
                                                <TemplatesSelect
                                                    onChange={handleTemplateChange(form)}
                                                    items={emergencyTemplatesTabsProps}
                                                    hasCategories
                                                />
                                            )}
                                        </Form.Item>
                                    </Col>
                                )}

                                <Col span={24}>
                                    <Col span={24} style={MARGIN_BOTTOM_10_STYLE}>
                                        <Typography.Title level={4}>{SelectTextLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={TitleLabel}
                                            labelCol={FORM_FILED_COL_PROPS}
                                            name='title'
                                            required
                                            rules={[titleRule, MemoizedTitleTemplateChangedRule]}
                                            validateFirst={true}
                                            data-cy='news__create-title-input'
                                        >
                                            <Title.InputWithCounter
                                                style={NO_RESIZE_STYLE}
                                                rows={4}
                                                placeholder={TitlePlaceholderMessage}
                                                onChange={e=>handleFormTitleChange(e.target.value)}
                                            />
                                        </Form.Item>
                                        <Col style={buildCounterStyle(Title.textLength, 'Title')}>
                                            <Title.Counter type='inverted'/>
                                        </Col>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={BodyLabel}
                                            labelCol={FORM_FILED_COL_PROPS}
                                            name='body'
                                            required
                                            rules={[bodyRule, MemoizedBodyTemplateChangedRule]}
                                            validateFirst={true}
                                            data-cy='news__create-body-input'
                                        >
                                            <Body.InputWithCounter
                                                autoFocus={autoFocusBody}
                                                style={NO_RESIZE_STYLE}
                                                rows={7}
                                                placeholder={BodyPlaceholderMessage}
                                                onChange={e=>handleFormBodyChange(e.target.value)}
                                            />
                                        </Form.Item>
                                        <Col style={buildCounterStyle(Body.textLength, 'Body')}>
                                            <Body.Counter type='inverted'/>
                                        </Col>
                                    </Col>
                                </Col>
                            </Row>
                        </Col>
                    )
                }

                {isCustomPreview ? (
                    <Col span={formInfoColSpan}>
                        {(!!get(sharingAppFormValues, ['preview', 'renderedTitle']) || !!get(sharingAppFormValues, ['preview', 'renderedBody'])) && (
                            <MemoizedSharingNewsPreview
                                hasPush={previewHasPush}

                                appName={appName}
                                appIcon={appIcon}
                                iFrameUrl={appPreviewUrl}
                                iFrameRef={iFramePreviewRef}
                                title = {get(sharingAppFormValues, ['preview', 'renderedTitle'])}
                                body = {get(sharingAppFormValues, ['preview', 'renderedBody'])}

                                validBefore={newsItemData.type === NEWS_TYPE_EMERGENCY ? newsItemData.validBefore : null}
                            />
                        )}
                    </Col>) : (
                    <>
                        { !!formInfoColSpan && (!!selectedBody || !!selectedTitle) && (
                            <Col span={formInfoColSpan}>
                                <MemoizedCondoNewsPreview
                                    body={selectedBody}
                                    title={selectedTitle}
                                    validBefore={selectedType === NEWS_TYPE_EMERGENCY ? selectedValidBeforeText : null}
                                />
                            </Col>
                        )}
                    </>
                )}
            </FormContainerContainer>

            
            <FormContainerContainer>
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
                                //TODO use custom selector with getRecipientCounter
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

                <Col span={formInfoColSpan}>
                    <Row>
                        {isCustomRecipientCounter ? newsSharingRecipientCounter : (
                            <HiddenBlock hide={newsItemScopesNoInstance.length <= 0}>
                                <MemoizedRecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                            </HiddenBlock>
                        )}
                    </Row>
                </Col>
            </FormContainerContainer>

            {viewNewsSharingSubmit && (
                <Row style={{ width: '100%' }}>
                    <Col span={24}>
                        <UIActionBar
                            actions={[
                                <Button
                                    key='submit'
                                    type='primary'
                                    children={NextStepMessage}
                                    onClick={() => onSubmit(sharingAppFormValues)}
                                    disabled={!sharingAppFormValues.isValid}
                                />,
                                <Button
                                    key='submit'
                                    type='secondary'
                                    children={isMediumWindow ? NextStepShortMessage : intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelLong' }, { appName })}
                                    onClick={() => onSkip(sharingAppFormValues)}
                                />,
                            ]}
                        />
                    </Col>
                </Row>
            )}
        </>)
}

