import {
    B2BApp, B2BAppNewsSharingConfig,  NewsItem as INewsItem,
    NewsItemScope as INewsItemScope,
    Property as IProperty,
} from '@app/condo/schema'
import { Col, Input, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, ActionBar as UIActionBar } from '@open-condo/ui'

import { useLayoutContext } from '@app/condo/domains/common/components/LayoutContext'
import { TrackingEventType, useTracking } from '@app/condo/domains/common/components/TrackingContext'
import { useInputWithCounter } from '@app/condo/domains/common/hooks/useInputWithCounter'
import { searchOrganizationProperty } from '@app/condo/domains/scope/utils/clientSchema/search'

import { InputStepForm } from './InputStepForm'
import { InputStepPreview } from './InputStepPreview'
import { InputStepRecipientCounter } from './InputStepRecipientCounter'
import { InputStepSelector } from './InputStepSelector'


import { NewsItemScopeNoInstanceType } from '../../types'
import {
    getTypeAndNameByKey,
    getUnitNamesAndUnitTypes,
    SendPeriodType,
    ScopeType,
} from '../BaseNewsForm'

const BIG_MARGIN_BOTTOM_STYLE: React.CSSProperties = { marginBottom: '60px' }
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [50, 0]

export type SharingAppValuesType = {
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
    onSubmit: (SharingAppValues: SharingAppValuesType) => void
    onSkip: (SharingAppValues: SharingAppValuesType) => void

    initialValues: SharingAppValuesType | undefined

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
    scope: ScopeType
    setScope:  React.Dispatch<React.SetStateAction<ScopeType>>
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
    const { title: title, body: body } = newsItemData
    const { loading: selectedPropertiesLoading, objs: selectedProperties } = selectedProperty

    const SelectAddressPlaceholder = intl.formatMessage({ id: 'global.select.address' })
    const NextStepShortMessage = intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelShort' })
    const NextStepMessage = intl.formatMessage({ id: 'pages.condo.news.steps.nextStep' })

    const { logEvent, getEventName } = useTracking()

    const { breakpoints } = useLayoutContext()

    const isMediumWindow = !breakpoints.DESKTOP_SMALL

    const countPropertiesAvailableToSelect = useRef(null)

    const Title = useInputWithCounter(Input.TextArea, 150)
    const Body = useInputWithCounter(Input.TextArea, 800)

    const isOnlyOnePropertySelected: boolean = useMemo(() => (scope.selectedPropertiesId.length === 1), [scope.selectedPropertiesId.length])

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
    const appName = newsSharingConfig?.name
    const appPreviewUrl = newsSharingConfig?.previewUrl

    const iFramePreviewRef = useRef(null)

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharing

    const viewNewsSharingSubmit = isSharing

    const processedInitialValues = useMemo(()=> (initialValues && initialValues.formValues && initialValues.preview) ? initialValues : {
        formValues: {},
        preview: { renderedTitle: '', renderedBody: '' },
        isValid: false,
    }, [initialValues])

    const [sharingAppFormValues, setSharingAppFormValues] = useState<SharingAppValuesType>(processedInitialValues)

    useEffect(() => {
        setSharingAppFormValues(processedInitialValues)
    }, [processedInitialValues])

    const handleSharingAppIFrameFormMessage = useCallback((event) => {
        const { handler, ctxId: eventCtxId, formValues, preview, isValid } = event.data
        if (handler === 'handleSharingAppIFrameFormMessage' && ctxId === eventCtxId) {
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
                <InputStepForm
                    TitleInput={Title}
                    BodyInput={Body}
                    ctxId={ctxId}
                    newsSharingConfig={newsSharingConfig}
                    isSharing={isSharing}
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
                    isSharing={isSharing}
                    sharingAppFormValues={sharingAppFormValues}
                    newsItemData={newsItemData}
                    iFramePreviewRef={iFramePreviewRef}
                    selectedBody={selectedBody}
                    selectedTitle={selectedTitle}
                />
            </FormContainerContainer>

            <FormContainerContainer>
                <InputStepSelector
                    newsSharingConfig={newsSharingConfig}
                    isSharing={isSharing}
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
                    ctxId={ctxId}
                    newsSharingConfig={newsSharingConfig}
                    isSharing={isSharing}
                    newsItemScopesNoInstance={newsItemScopesNoInstance}
                />
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



