import { Form, Popover } from 'antd'
import React, { useMemo, useCallback } from 'react'

import { ChevronDown } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography, Select } from '@open-condo/ui'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { DocumentCategory } from '@condo/domains/document/utils/clientSchema'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'


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
            <Space size={8}>
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
    const currentDocumentType = currentDocument?.documentType

    const typeOptions = useMemo(() => {
        return [
            {
                value: 'organization',
                label: 'Организация',
            },
            {
                value: 'property',
                label: 'Дома',
            },
        ]
    }, [])

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
            placeholder='Тип документа'
        />
    )
}

const DocumentPropertySelect: React.FC<any> = ({ onSelect, currentDocument }) => {
    const intl = useIntl()
    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })

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
            placeholder='Адрес'
        />
    )
}

const DocumentCategorySelect: React.FC<any> = ({ onSelect, currentDocument }) => {
    const intl = useIntl()
    const CategoryPlaceholder = intl.formatMessage({ id: 'documents.uploadDocumentsModal.category.placeholder' })

    const currentCategoryId = currentDocument?.categoryId

    // TODO(DOMA-13466): change to new utils
    const { objs: categories, allDataLoaded: allCategoriesLoaded } = DocumentCategory.useAllObjects({})

    const categoryOptions = useMemo(() => categories.map(category =>
        ({ label: category?.name, value: category?.id })
    ), [categories])
    const currentOption = categoryOptions?.find(option => option.value === currentCategoryId)

    const loading = !allCategoriesLoaded

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
            placeholder='Категория'
        />
    )
}



export const EditableDocumentDetails: React.FC<any> = ({ form, editableDocumentId }) => {
    const files = Form.useWatch('files', form)

    const currentDocument = useMemo(() => (files || [])?.find(file => file.uid === editableDocumentId), [files, editableDocumentId])

    const currentDocumentType = currentDocument?.documentType
    const currentPropertyId = currentDocument?.propertyId
    const currentCategoryId = currentDocument?.categoryId

    console.log('renderDocumentDetailsEditable', {
        editableDocumentId, files, currentDocument,
    })

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
                                console.log({
                                    propertyId, currentPropertyId, option,
                                })
                                if (currentPropertyId === propertyId) return

                                const updatedFiles = files.map(file => ({
                                    ...file,
                                    propertyId: file.uid === editableDocumentId ? propertyId : file.propertyId,
                                    propertyAddress: file.uid === editableDocumentId ? option?.title : file.propertyAddress,
                                }))
                                form.setFieldValue('files', updatedFiles)

                                console.log({
                                    propertyId, currentPropertyId,
                                    updatedFiles,
                                    files,
                                })
                            }}
                            currentDocument={currentDocument}
                        />

                        <DocumentCategorySelect
                            onSelect={(categoryId) => {
                                console.log({
                                    categoryId, currentCategoryId,
                                })
                                if (currentCategoryId === categoryId) return

                                const updatedFiles = files.map(file => ({
                                    ...file,
                                    categoryId: file.uid === editableDocumentId ? categoryId : file.categoryId,
                                }))
                                form.setFieldValue('files', updatedFiles)

                                console.log({
                                    categoryId, currentCategoryId,
                                    updatedFiles,
                                    files,
                                })
                            }}
                            currentDocument={currentDocument}
                        />
                    </>
                )
            }
        </Space>
    )
}