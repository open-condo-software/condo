import { useGetAllDocumentCategoriesQuery } from '@app/condo/gql'
import { Form, FormInstance, Popover } from 'antd'
import React, { useMemo, useCallback } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { ChevronDown } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography, Select } from '@open-condo/ui'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'

import styles from './EditableDocumentDetails.module.css'


const DocumentDetailsDropdown: React.FC<any>  = ({
    loading,
    content,
    currentOption,
    placeholder,
}) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    return (
        <Popover
            open={loading ? false : undefined}
            showArrow={false}
            placement='bottomLeft'
            trigger='click'
            content={content}
        >
            <Space size={8} className={styles.documentDetailsDropdown}>
                <Typography.Text type={(currentOption || loading) ? 'secondary' : 'danger'} size='medium'>
                    {
                        loading
                            ? `${LoadingMessage}…`
                            : (currentOption?.label || placeholder)
                    }
                </Typography.Text>
                <ChevronDown size='small' />
            </Space>
        </Popover>
    )
}

const DocumentTypeSelect: React.FC<any> = ({ onSelect, currentDocument }) => {
    const intl = useIntl()
    const organizationMessage = intl.formatMessage({ id: 'documents.DocumentTypeSelect.organization' })
    const propertyMessage = intl.formatMessage({ id: 'documents.DocumentTypeSelect.property' })
    const documentTypeMessage = intl.formatMessage({ id: 'documents.DocumentTypeSelect.documentType' })

    const currentDocumentType = currentDocument?.documentType

    const typeOptions = useMemo(() => {
        return [
            {
                value: 'organization',
                label: organizationMessage,
            },
            {
                value: 'property',
                label: propertyMessage,
            },
        ]
    }, [organizationMessage, propertyMessage])

    const currentOption = typeOptions.find(option => option.value === currentDocumentType)

    return (
        <DocumentDetailsDropdown
            loading={false}
            content={<Select
                value={currentDocumentType}
                options={typeOptions}
                onChange={(value) => onSelect(value)}
                // @ts-ignore
                style={{ width: '340px' }}
            />}
            currentOption={currentOption}
            placeholder={documentTypeMessage}
        />
    )
}

const DocumentPropertySelect: React.FC<any> = ({ onSelect, currentDocument }) => {
    const intl = useIntl()
    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressDropdownMessage = intl.formatMessage({ id: 'documents.DocumentPropertySelect.address' })

    const { organization } = useOrganization()
    const organizationId = organization?.id || null

    const propertyId = currentDocument?.propertyId || null
    const propertyAddress = currentDocument?.propertyAddress || null

    const search = useMemo(() => {
        return searchOrganizationProperty(organizationId)
    }, [organizationId])

    const currentOption = useMemo(() => propertyId ? ({ label: propertyAddress }) : null, [propertyId, propertyAddress])

    return (
        <DocumentDetailsDropdown
            loading={false}
            content={<GraphQlSearchInput
                label={AddressPlaceholderMessage}
                showArrow={false}
                placeholder={AddressPlaceholderMessage}
                onChange={(value, option) => onSelect(value, option)}
                value={propertyId}
                initialValue={propertyId}
                search={search}
                searchMoreFirst={300}
                style={{ width: '340px' }}
            />}
            currentOption={currentOption}
            placeholder={AddressDropdownMessage}
        />
    )
}

const DocumentCategorySelect: React.FC<any> = ({ onSelect, currentDocument }) => {
    const intl = useIntl()
    const CategoryPlaceholder = intl.formatMessage({ id: 'documents.uploadDocumentsModal.category.placeholder' })
    const CategoryDropdownPlaceholder = intl.formatMessage({ id: 'documents.DocumentCategorySelect.category' })

    const currentCategoryId = currentDocument?.categoryId

    const { persistor } = useCachePersistor()
    const { data, loading } = useGetAllDocumentCategoriesQuery({
        skip: !persistor,
    })
    const documentCategories = useMemo(() => data?.categories?.filter(Boolean) || [], [data?.categories])

    const categoryOptions = useMemo(() => documentCategories.map(category =>
        ({ label: category?.name, value: category?.id })
    ), [documentCategories])
    const currentOption = categoryOptions?.find(option => option.value === currentCategoryId)

    return (
        <DocumentDetailsDropdown
            loading={loading}
            content={<Select
                value={currentCategoryId}
                options={categoryOptions}
                onChange={(value) => onSelect(value)}
                placeholder={CategoryPlaceholder}
                loading={loading}
                // @ts-ignore
                style={{ width: '340px' }}
            />}
            currentOption={currentOption}
            placeholder={CategoryDropdownPlaceholder}
        />
    )
}



export const EditableDocumentDetails: React.FC<{ form: FormInstance, editableDocumentId: string }> = ({
    form,
    editableDocumentId,
}) => {
    const files = Form.useWatch('files', form)

    const currentDocument = useMemo(() => (files || [])?.find(file => file.uid === editableDocumentId), [files, editableDocumentId])

    const currentDocumentType = currentDocument?.documentType
    const currentPropertyId = currentDocument?.propertyId
    const currentCategoryId = currentDocument?.categoryId

    const handleDocumentTypeSelect = useCallback((documentType) => {
        if (currentDocumentType === documentType) return

        const updatedFiles = files.map(file => ({
            ...file,
            documentType: file.uid === editableDocumentId ? documentType : file.documentType,
            categoryId: file.uid === editableDocumentId ? null : file.categoryId,
            propertyId: file.uid === editableDocumentId ? null : file.propertyId,
        }))
        form.setFieldValue('files', updatedFiles)
    }, [currentDocumentType, editableDocumentId, files, form])

    if (!currentDocument) return null

    return (
        <Space size={8} wrap={true}>
            <DocumentTypeSelect
                onSelect={handleDocumentTypeSelect}
                currentDocument={currentDocument}
            />

            {
                currentDocumentType === 'property' && (
                    <>
                        <DocumentPropertySelect
                            onSelect={(propertyId, option) => {
                                if (currentPropertyId === propertyId) return

                                const updatedFiles = files.map(file => ({
                                    ...file,
                                    propertyId: file.uid === editableDocumentId ? propertyId : file.propertyId,
                                    propertyAddress: file.uid === editableDocumentId ? option?.title : file.propertyAddress,
                                }))
                                form.setFieldValue('files', updatedFiles)
                            }}
                            currentDocument={currentDocument}
                        />

                        <DocumentCategorySelect
                            onSelect={(categoryId) => {
                                if (currentCategoryId === categoryId) return

                                const updatedFiles = files.map(file => ({
                                    ...file,
                                    categoryId: file.uid === editableDocumentId ? categoryId : file.categoryId,
                                }))
                                form.setFieldValue('files', updatedFiles)
                            }}
                            currentDocument={currentDocument}
                        />
                    </>
                )
            }
        </Space>
    )
}
