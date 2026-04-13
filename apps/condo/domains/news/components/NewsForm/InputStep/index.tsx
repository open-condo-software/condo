import { GetNewsSharingRecipientsQuery } from '@app/condo/gql'
import {
    B2BApp, B2BAppContext as IB2BAppContext, B2BAppNewsSharingConfig, NewsItem as INewsItem,
    NewsItemScope as INewsItemScope,
    Property as IProperty,
} from '@app/condo/schema'
import { Col, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import debounce from 'lodash/debounce'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, ActionBar } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import {
    getTypeAndNameByKey,
    getUnitNamesAndUnitTypes,
    SendPeriodType,
    ScopeType, TemplatesType,
} from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { NewsItemScopeNoInstanceType } from '@condo/domains/news/components/types'
import { searchOrganizationProperty } from '@condo/domains/scope/utils/clientSchema/search'

import { InputStepFilesSelector, useReuploadNewsItemFiles } from './InputStepFilesSelector'
import { InputStepForm } from './InputStepForm'
import { InputStepPreview } from './InputStepPreview'
import { InputStepRecipientCounter } from './InputStepRecipientCounter'
import { InputStepSelector, Properties } from './InputStepSelector'

import { Action, convertFilesToUploadType, UploadFileType } from '../../FilesUploadList'


const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

export type SharingAppValuesType = {
    formValues: Record<string, unknown>
    preview: {
        renderedTitle: string
        renderedBody: string
    }
    isAllChecked?: boolean
    scope?: GetNewsSharingRecipientsQuery['recipients']
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
        ctx: IB2BAppContext
    }
    onSubmit: (SharingAppValues: SharingAppValuesType) => void
    onSkip: (SharingAppValues: SharingAppValuesType) => void

    initialValues?: SharingAppValuesType

    newsItemData: NewsItemDataType
}

export type BaseNewsFormProps = {
    organizationId: string
    initialValues?: Partial<INewsItem>
    & Partial<{
        newsItemScopes: Array<INewsItemScope>
        hasAllProperties: boolean
        sendPeriod: SendPeriodType
        properties?: Array<IProperty>
    }>
    templates: TemplatesType
    totalProperties: number
    autoFocusBody?: boolean
}

type InputStepProps = NewsItemSharingFormProps & BaseNewsFormProps & {
    form: FormInstance
    scope: ScopeType
    setScope: React.Dispatch<React.SetStateAction<ScopeType>>
    files: Array<UploadFileType>
    setFiles: React.Dispatch<React.SetStateAction<Array<UploadFileType>>>
    modifyFiles: React.Dispatch<Action>
    newsItemIdForReuploadFiles?: string
    isSharingStep: boolean
    selectedProperty: {
        loading: boolean
        objs: Array<IProperty>
    }
    initialPropertyIds: Array<string>
    initialFormValues: Record<string, unknown> & Properties
}

const debouncedPostMessage = debounce((iframeRef, url, title, body, scope) => {
    if (!iframeRef.current) return

    iframeRef.current.contentWindow.postMessage({
        handler: 'handleUpdateFromCondo',
        title,
        body,
        scope: JSON.stringify(scope),
    }, url)
}, 300)

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
    files,
    setFiles,
    modifyFiles,
    newsItemIdForReuploadFiles,
}
) => {
    const intl = useIntl()
    const SelectAddressPlaceholder = intl.formatMessage({ id: 'global.select.address' })
    const NextStepShortMessage = intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelShort' })
    const NextStepMessage = intl.formatMessage({ id: 'pages.condo.news.steps.nextStep' })

    const { app: sharingApp, id: sharingAppId } = sharingAppData ?? { id: null, app: null }
    const { newsSharingConfig } = sharingApp ?? { id: null, newsSharingConfig: null }
    const { title, body } = newsItemData
    const { loading: selectedPropertiesLoading, objs: selectedProperties } = selectedProperty

    const appName = newsSharingConfig?.name

    const NextStepLongMessage = intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelLong' }, { appName })

    const appPreviewUrl = newsSharingConfig?.previewUrl

    const iFramePreviewRef = useRef(null)

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharingStep
    const isCustomPreview = !!newsSharingConfig?.previewUrl && isSharingStep

    const viewNewsSharingSubmit = isSharingStep

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const NextStepLabelMessage = isMediumWindow ? NextStepShortMessage : NextStepLongMessage

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
            search: searchOrganizationProperty(organizationId, selectedProperties),
            disabled: !organizationId,
            required: true,
            placeholder: SelectAddressPlaceholder,
            onChange: (propIds: string[]) => {
                const selectedPropertiesId = !Array.isArray(propIds) ? [propIds].filter(Boolean) : propIds
                setScope(prev=>({ ...prev, selectedPropertiesId:  selectedPropertiesId }))

                form.setFieldsValue({ 'unitNames': [] })
                form.setFieldsValue({ 'sectionIds': [] })
                form.setFieldsValue({ 'properties': selectedPropertiesId })
                setScope(prev=>({ ...prev, selectedUnitNameKeys: [] }))
                setScope(prev=>({ ...prev, selectedSectionKeys: [] }))
            },
        }
    }, [initialPropertyIds, organizationId, SelectAddressPlaceholder, setScope, selectedProperties])

    useEffect(() => {
        setSharingAppFormValues(processedInitialValues)
    }, [processedInitialValues])

    const handleSharingAppIFrameFormMessage = useCallback((event) => {
        const { handler, ctxId: eventCtxId, formValues, preview, isValid } = event.data

        if (handler === 'handleSharingAppIFrameFormMessage' && sharingAppId === eventCtxId) {
            setSharingAppFormValues(prev => ({ ...prev, formValues, preview, isValid }))
        }
    }, [sharingAppId])

    const handleFormTitleChange = useCallback((form) => (value: string) => {
        if (isSharingStep){
            setSharingAppFormValues(prev=>({ ...prev,
                formValues: { body: prev.formValues.body, title: value },
                preview: { renderedBody: prev.preview.renderedBody, renderedTitle: value },
            }))
        }

        setSelectedTitle(value)
        form.setFieldsValue({ title: value })
        if (form.isFieldTouched('title')) form.validateFields(['title'])
    }, [isSharingStep])

    const handleFormBodyChange = useCallback((form) => (value: string) => {
        if (isSharingStep){
            setSharingAppFormValues(prev=>({ ...prev,
                formValues: { title: prev.formValues.title, body: value },
                preview: { renderedTitle: prev.preview.renderedTitle, renderedBody: value },
            }))
        }

        setSelectedBody(value)
        form.setFieldsValue({ body: value })
        if (form.isFieldTouched('body')) form.validateFields(['body'])
    }, [isSharingStep])

    useEffect(() => {
        if (!isSharingStep) return

        const title = sharingAppFormValues?.preview.renderedTitle || selectedTitle
        const body = sharingAppFormValues?.preview.renderedBody || selectedBody
        const scope = sharingAppFormValues?.scope

        debouncedPostMessage(iFramePreviewRef, appPreviewUrl, title, body, scope)

        return () => {
            debouncedPostMessage.cancel()
        }
    }, [sharingAppFormValues, iFramePreviewRef, appPreviewUrl, selectedTitle, selectedBody, isSharingStep])

    useEffect(() => {
        if (!isCustomForm && !isCustomPreview) return

        window.addEventListener('message', handleSharingAppIFrameFormMessage)
        return () => window.removeEventListener('message', handleSharingAppIFrameFormMessage)
    }, [handleSharingAppIFrameFormMessage, isCustomForm, isCustomPreview])

    const handleTemplateChange = useCallback((form) => (value: string) => {
        setTemplateId(value)

        const templateId = value
        const title = templateId !== 'emptyTemplate' ? templates[templateId].title : ''
        const body = templateId !== 'emptyTemplate' ? templates[templateId].body : ''

        form.setFieldValue('title', title)
        setSelectedTitle(title)

        form.setFieldValue('body', body)
        setSelectedBody(body)

        form.validateFields(['title', 'body'])
    }, [templates])

    const { isLoading, reuploadFiles } = useReuploadNewsItemFiles()

    useEffect(() => {
        if (files?.length > 0) return
        if (!newsItemIdForReuploadFiles) return
        if (isLoading) return

        const tryReuploadFiles = async () => {
            const reuploadedNewsItemFiles = await reuploadFiles(newsItemIdForReuploadFiles)

            if (!Array.isArray(reuploadedNewsItemFiles) || reuploadedNewsItemFiles.length < 1) return

            const converted = convertFilesToUploadType(reuploadedNewsItemFiles)

            setFiles(converted)
            form.setFieldsValue({ 'files': setFiles })
            reuploadedNewsItemFiles.forEach((newsItemFile) => {
                modifyFiles({ type: 'add', payload: newsItemFile })
            })
        }
        tryReuploadFiles()
    }, [newsItemIdForReuploadFiles, isLoading])

    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    return (
        <Row gutter={[50, 60]}>
            <Col span={formFieldsColSpan}>
                <Row gutter={BIG_VERTICAL_GUTTER}>
                    <InputStepForm
                        template={{ id: templateId, ...templates?.[templateId] }}
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

                    {
                        (!newsItemIdForReuploadFiles || (newsItemIdForReuploadFiles && !isLoading)) ? (
                            <InputStepFilesSelector
                                onChange={(fileList) => {
                                    form.setFieldsValue({ 'files': fileList })
                                    setFiles(fileList)
                                }}
                                files={files}
                                modifyFiles={modifyFiles}
                            />
                        ) : <span>LOADING!!!</span>
                    }

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
                </Row>
            </Col>
            <Col span={formInfoColSpan}>
                <Row gutter={BIG_VERTICAL_GUTTER}>
                    <InputStepPreview
                        newsSharingConfig={newsSharingConfig}
                        isSharingStep={isSharingStep}
                        sharingAppFormValues={sharingAppFormValues}
                        newsItemData={newsItemData}
                        iFramePreviewRef={iFramePreviewRef}
                        selectedBody={selectedBody}
                        selectedTitle={selectedTitle}
                        sharingAppId={sharingAppId}
                        selectedFiles={files}
                    />

                    <InputStepRecipientCounter
                        sharingAppId={sharingAppId}
                        newsSharingConfig={newsSharingConfig}
                        isSharingStep={isSharingStep}
                        newsItemScopesNoInstance={newsItemScopesNoInstance}
                        newsSharingScope={sharingAppFormValues?.scope}
                    />
                </Row>
            </Col>

            {viewNewsSharingSubmit && (
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
            )}
        </Row>
    )
}
