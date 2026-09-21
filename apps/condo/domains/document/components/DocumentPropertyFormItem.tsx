import { Form } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'


type DocumentPropertyFormItemProps = {
    initialValue?: string
    onSelect: (id) => void
    onClear: () => void
}

const AddressSearchInput = (props) => {
    const { organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization?.id])

    return (
        <PropertyAddressSearchInput
            organizationId={organizationId}
            {...props}
        />
    )
}

export const DocumentPropertyFormItem: React.FC<DocumentPropertyFormItemProps> = ({ initialValue, onSelect, onClear }) => {
    const intl = useIntl()
    const PropertyTitle = intl.formatMessage({ id: 'documents.uploadDocumentsModal.property.title' })
    const PropertyPlaceholder = intl.formatMessage({ id: 'documents.uploadDocumentsModal.property.placeholder' })

    const { requiredValidator } = useValidations()
    const propertyValidators = useMemo(() => [requiredValidator], [requiredValidator])

    return (
        <Form.Item
            label={PropertyTitle}
            name='property'
            required
            labelCol={{ span: 24 }}
            initialValue={initialValue}
            rules={propertyValidators}
        >
            <AddressSearchInput
                onSelect={(_, option) => {
                    onSelect(option?.key)
                }}
                onClear={onClear}
                placeholder={PropertyPlaceholder}
            />
        </Form.Item>
    )
}