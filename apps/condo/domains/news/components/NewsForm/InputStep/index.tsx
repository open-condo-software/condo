/** @jsx jsx */
import {
    B2BApp, B2BAppNewsSharingConfig,  NewsItem as INewsItem,
    NewsItemScope as INewsItemScope,
    Property as IProperty,
} from '@app/condo/schema'
import { css, jsx } from '@emotion/react'
import { Col, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, ActionBar } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { TrackingEventType, useTracking } from '@condo/domains/common/components/TrackingContext'
import {
    getTypeAndNameByKey,
    getUnitNamesAndUnitTypes,
    SendPeriodType,
    ScopeType, TemplatesType,
} from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { NewsItemScopeNoInstanceType } from '@condo/domains/news/components/types'
import { searchOrganizationProperty } from '@condo/domains/scope/utils/clientSchema/search'

import { InputStepForm } from './InputStepForm'
import { InputStepPreview } from './InputStepPreview'
import { InputStepRecipientCounter } from './InputStepRecipientCounter'
import { InputStepSelector } from './InputStepSelector'

const BIG_MARGIN_BOTTOM_STYLE = css`margin-bottom: 60px`
const ACTIONS_STYLE = css`width: 100%`
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [50, 0]

export type SharingAppValuesType = {
    formValues: Record<string, unknown>
    preview: {
        renderedTitle: string
        renderedBody: string
    }
    isValid: boolean
}

export type NewsItemDataType = {
    type: string
    validBefore?: string
    title: string
    body: string
}

type NewsItemSharingFormProps = {
    sharingAppData?: {
        app: B2BApp
        id: string
        newsSharingConfig: B2BAppNewsSharingConfig
        ctx: any
    }
    onSubmit: (SharingAppValues: SharingAppValuesType) => void
    onSkip: (SharingAppValues: SharingAppValuesType) => void

    initialValues: SharingAppValuesType | undefined

    newsItemData: NewsItemDataType
}

export type BaseNewsFormProps = {
    organizationId: string
    initialValues?: Partial<INewsItem>
    & Partial<{
        newsItemScopes: Array<INewsItemScope>
        hasAllProperties: boolean
        sendPeriod: SendPeriodType
        properties?: IProperty[]
    }>
    templates: TemplatesType
    totalProperties: number
    autoFocusBody?: boolean
}

type InputStepProps = NewsItemSharingFormProps & BaseNewsFormProps & {
    form: FormInstance
    scope: ScopeType
    setScope: React.Dispatch<React.SetStateAction<ScopeType>>
    isSharingStep: boolean
    selectedProperty: {
        loading: boolean
        objs:  IProperty[]
    }
    initialPropertyIds: string[]
    initialFormValues: Record<string, unknown>
}

export const FormContainer: React.FC = ({ children }) => {
    return (
        <Col span={24} css={BIG_MARGIN_BOTTOM_STYLE}>
            <Row gutter={BIG_HORIZONTAL_GUTTER}>
                {children}
            </Row>
        </Col>
    )
}

export const InputStep: React.FC<InputStepProps> = ({
    form,
    scope,
    onSkip,
    onSubmit,
    setScope,
    templates,
    isSharingStep,
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
    const { app: sharingApp, id: sharingAppId } = sharingAppData ?? { id: null, app: null }
    const { id, newsSharingConfig } = sharingApp ?? { id: null, newsSharingConfig: null }
    const { title, body } = newsItemData
    const { loading: selectedPropertiesLoading, objs: selectedProperties } = selectedProperty

    const appName = newsSharingConfig?.name
    const appPreviewUrl = newsSharingConfig?.previewUrl

    const iFramePreviewRef = useRef(null)

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharingStep
    const isCustomPreview = !!newsSharingConfig?.previewUrl && isSharingStep

    const viewNewsSharingSubmit = isSharingStep

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL

    const intl = useIntl()
    const SelectAddressPlaceholder = intl.formatMessage({ id: 'global.select.address' })
    const NextStepShortMessage = intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelShort' })
    const NextStepMessage = intl.formatMessage({ id: 'pages.condo.news.steps.nextStep' })
    const NextStepLongMessage = intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelLong' }, { appName })
    const NextStepLabelMessage = isMediumWindow ? NextStepShortMessage : NextStepLongMessage

    const { logEvent, getEventName } = useTracking()
    const [templateId, setTemplateId] = useState<string | null>(null)

    const [selectedTitle, setSelectedTitle] = useState<string>(title)
    const [selectedBody, setSelectedBody] = useState<string>(body)

    const processedInitialValues = useMemo(()=> (initialValues && initialValues.formValues && initialValues.preview) ? initialValues : {
        formValues: {},
        preview: { renderedTitle: '', renderedBody: '' },
        isValid: false,
    }, [initialValues])

    const [sharingAppFormValues, setSharingAppFormValues] = useState<SharingAppValuesType>(processedInitialValues)


    const countPropertiesAvailableToSelect = useRef(null)

    const isOnlyOnePropertySelected: boolean = useMemo(() => (scope.selectedPropertiesId.length === 1), [scope.selectedPropertiesId.length])

    const newsItemForOneProperty = totalProperties === 1 && initialPropertyIds.length < 2

    const newsItemScopesNoInstance = useMemo<Array<NewsItemScopeNoInstanceType>>(() => {
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

    const propertySelectProps = useCallback((form) => {
        return {
            showArrow: false,
            infinityScroll: true,
            initialValue: initialPropertyIds,
            search: searchOrganizationProperty(organizationId),
            disabled: !organizationId,
            required: true,
            placeholder: SelectAddressPlaceholder,
            onChange: (propIds: string[]) => {
                setScope(prev=>({ ...prev, selectedPropertiesId: !Array.isArray(propIds) ? [propIds].filter(Boolean) : propIds }))

                form.setFieldsValue({ 'unitNames': [] })
                form.setFieldsValue({ 'sectionIds': [] })
                setScope(prev=>({ ...prev, selectedUnitNameKeys: [] }))
                setScope(prev=>({ ...prev, selectedSectionKeys: [] }))
            },
        }
    }, [initialPropertyIds, organizationId, SelectAddressPlaceholder])

    useEffect(() => {
        setSharingAppFormValues(processedInitialValues)
    }, [processedInitialValues])

    const handleSharingAppIFrameFormMessage = useCallback((event) => {
        const { handler, sharingAppId: eventsharingAppId, formValues, preview, isValid } = event.data

        if (handler === 'handleSharingAppIFrameFormMessage' && sharingAppId === eventsharingAppId) {
            setSharingAppFormValues({ formValues, preview, isValid })
        }
    }, [id])

    const handleTitleChange = useCallback((value) => {
        setSelectedTitle(value)
    }, [])

    const handleBodyChange = useCallback((value) => {
        setSelectedBody(value)
    }, [])

    const handleFormTitleChange = useCallback((value) => {
        if (isSharingStep){
            setSharingAppFormValues(prev=>({ ...prev,
                formValues: { body: prev.formValues.body, title: value },
                preview: { renderedBody: prev.preview.renderedBody, renderedTitle: value },
            }))
        }
        else handleTitleChange(value)
    }, [isSharingStep, sharingAppFormValues])

    const handleFormBodyChange = useCallback((value) => {
        if (isSharingStep){
            setSharingAppFormValues(prev=>({ ...prev,
                formValues: { title: prev.formValues.title, body: value },
                preview: { renderedTitle: prev.preview.renderedTitle, renderedBody: value },
            }))
        }
        else handleBodyChange(value)
    }, [isSharingStep, sharingAppFormValues])

    useEffect(() => {
        if (!iFramePreviewRef.current) return 
        
        const title = sharingAppFormValues?.preview.renderedTitle
        const body = sharingAppFormValues?.preview.renderedBody

        iFramePreviewRef.current.contentWindow.postMessage({
            handler: 'handleUpdateFromCondo',
            title,
            body,
        }, appPreviewUrl)
    }, [sharingAppFormValues, iFramePreviewRef, appPreviewUrl])

    useEffect(() => {
        if (!title.length) return

        const renderedTitle = sharingAppFormValues?.preview.renderedTitle
        const finalTitle = isSharingStep && (isCustomForm || (!isCustomForm && renderedTitle)) ? renderedTitle : title

        handleFormTitleChange(finalTitle)
        form.setFieldsValue({ title: finalTitle })
    }, [title, form, isSharingStep, isCustomForm])

    useEffect(() => {
        if (!body.length) return

        const renderedBody = sharingAppFormValues?.preview.renderedBody
        const finalBody = isSharingStep && (isCustomForm || (!isCustomForm && renderedBody)) ? renderedBody : body

        handleFormBodyChange(finalBody)
        form.setFieldsValue({ body: finalBody })
    }, [body, form, isSharingStep, isCustomForm])

    useEffect(() => {
        if (!isCustomForm && !isCustomPreview) return

        window.addEventListener('message', handleSharingAppIFrameFormMessage)
        return () => window.removeEventListener('message', handleSharingAppIFrameFormMessage)
    }, [handleSharingAppIFrameFormMessage, isCustomForm])

    const handleTemplateChange = useCallback((form) => (value: string) => {
        setTemplateId(value)

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

        form.setFieldValue('body', body)
        setSelectedBody(body)
    }, [templates])

    return (
        <>
            <FormContainer>
                <InputStepForm
                    template={{ id: templateId, ...templates[templateId] }}
                    sharingAppId={sharingAppId}
                    newsSharingConfig={newsSharingConfig}
                    isSharingStep={isSharingStep}
                    selectedTitle={selectedTitle}
                    selectedBody={selectedBody}
                    newsItemData={newsItemData}
                    templates={templates}
                    processedInitialValues={processedInitialValues}
                    form={form}
                    autoFocusBody={autoFocusBody}
                    handleTemplateChange={handleTemplateChange}
                    handleFormTitleChange={handleFormTitleChange}
                    handleFormBodyChange={handleFormBodyChange}
                />

                <InputStepPreview
                    newsSharingConfig={newsSharingConfig}
                    isSharingStep={isSharingStep}
                    sharingAppFormValues={sharingAppFormValues}
                    newsItemData={newsItemData}
                    iFramePreviewRef={iFramePreviewRef}
                    selectedBody={selectedBody}
                    selectedTitle={selectedTitle}
                    sharingAppId={sharingAppId}
                />
            </FormContainer>

            <FormContainer>
                <InputStepSelector
                    ctx={sharingAppData?.ctx}
                    setSharingAppFormValues={setSharingAppFormValues}
                    newsSharingConfig={newsSharingConfig}
                    isSharingStep={isSharingStep}
                    scope={scope}
                    propertySelectProps={propertySelectProps}
                    form={form}
                    selectedProperty={selectedProperty}
                    setScope={setScope}
                    newsItemForOneProperty={newsItemForOneProperty}
                    initialValues={initialValues}
                    initialFormValues={initialFormValues}
                />

                <InputStepRecipientCounter
                    sharingAppId={sharingAppId}
                    newsSharingConfig={newsSharingConfig}
                    isSharingStep={isSharingStep}
                    newsItemScopesNoInstance={newsItemScopesNoInstance}
                />
            </FormContainer>

            {viewNewsSharingSubmit && (
                <Row css={ACTIONS_STYLE}>
                    <Col span={24}>
                        <ActionBar
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
                                    children={NextStepLabelMessage}
                                    onClick={() => onSkip(sharingAppFormValues)}
                                />,
                            ]}
                        />
                    </Col>
                </Row>
            )}
        </>)
}



