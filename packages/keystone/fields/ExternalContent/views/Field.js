/** @jsx jsx */
import { jsx } from '@emotion/react'
import { FieldContainer, FieldInput, FieldLabel } from '@open-arch-ui/fields'
import { useState, useEffect } from 'react'

import { parseExternalContentValue } from './utils'

const ExternalContentField = ({ onChange, field, errors, value = '{}', isDisabled, item }) => {
    let fileMeta = {}
    let isFileMetadata = false
    
    try {
        const parsed = parseExternalContentValue(value)
        fileMeta = parsed.fileMeta
        isFileMetadata = parsed.isFileMetadata
    } catch (err) {
        console.error('ExternalContent Field error:', err)
        fileMeta = { legacyContent: String(value || '') }
    }
    
    const { publicUrl, filename, originalFilename, legacyContent } = fileMeta
    const displayName = originalFilename || filename || legacyContent || 'No file'
    
    const isReadOnly = field.config?.adminConfig?.isReadOnly !== false
    
    // For editable mode: use resolved content if available (for file metadata)
    // Otherwise use legacy content or raw value
    const resolvedFieldName = `${field.path}Resolved`
    const resolvedContent = item?.[resolvedFieldName]
    
    // Determine initial value for textarea:
    // 1. Resolved content (for file metadata) - actual file content
    // 2. Legacy content (for legacy data) - raw XML/text or stringified JSON
    // 3. Raw value as fallback
    let initialEditValue = ''
    if (resolvedContent) {
        initialEditValue = typeof resolvedContent === 'string' ? resolvedContent : JSON.stringify(resolvedContent, null, 2)
    } else if (legacyContent) {
        initialEditValue = legacyContent
    } else if (typeof value === 'string') {
        initialEditValue = value
    } else if (value && typeof value === 'object') {
        initialEditValue = JSON.stringify(value, null, 2)
    }
    
    const [editValue, setEditValue] = useState(initialEditValue)
    
    // Update editValue when resolved content loads
    useEffect(() => {
        if (resolvedContent) {
            setEditValue(typeof resolvedContent === 'string' ? resolvedContent : JSON.stringify(resolvedContent, null, 2))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedContent])

    const canRead = errors.every(
        error => !(error instanceof Error && error.name === 'AccessDeniedError'),
    )
    const error = errors.find(error => error instanceof Error && error.name === 'AccessDeniedError')
    
    const handleChange = (e) => {
        const newValue = e.target.value
        setEditValue(newValue)
        onChange(newValue)
    }

    let fieldContent
    if (!canRead) {
        fieldContent = <div>{error?.message || 'Access denied'}</div>
    } else if (!isReadOnly) {
        // Editable mode - show textarea
        fieldContent = (
            <textarea
                value={editValue}
                onChange={handleChange}
                disabled={isDisabled}
                css={{
                    width: '100%',
                    minHeight: '200px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                }}
            />
        )
    } else if (isFileMetadata && publicUrl) {
        // Read-only mode with file metadata - show download link
        fieldContent = (
            <a
                href={publicUrl}
                target='_blank'
                rel='noopener noreferrer'
                css={{
                    color: '#0066cc',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                }}
            >
                {displayName}
            </a>
        )
    } else {
        // Read-only mode with legacy content - show as text
        fieldContent = <div>{displayName}</div>
    }

    return (
        <FieldContainer>
            <FieldLabel field={field} errors={errors}/>
            <FieldInput>
                {fieldContent}
            </FieldInput>
        </FieldContainer>
    )
}

export default ExternalContentField
