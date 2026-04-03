/** @jsx jsx */
import { jsx } from '@emotion/react'
import { FieldContainer, FieldInput, FieldLabel } from '@open-arch-ui/fields'

const ExternalContentField = ({ onChange, field, errors, value = '{}', isDisabled }) => {
    let fileMeta = {}
    try {
        fileMeta = typeof value === 'string' ? JSON.parse(value) : (value || {})
    } catch (err) {
        fileMeta = {}
    }

    const { publicUrl, filename, originalFilename } = fileMeta
    const displayName = originalFilename || filename || 'No file'

    const canRead = errors.every(
        error => !(error instanceof Error && error.name === 'AccessDeniedError'),
    )
    const error = errors.find(error => error instanceof Error && error.name === 'AccessDeniedError')

    return (
        <FieldContainer>
            <FieldLabel field={field} errors={errors}/>
            <FieldInput>
                {!canRead ? (
                    <div>{error?.message || 'Access denied'}</div>
                ) : publicUrl ? (
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
                ) : (
                    <div>{displayName}</div>
                )}
            </FieldInput>
        </FieldContainer>
    )
}

export default ExternalContentField
