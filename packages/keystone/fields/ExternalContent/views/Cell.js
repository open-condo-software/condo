/** @jsx jsx */
import { jsx } from '@emotion/react'

export default function ExternalContentCell ({ data = '{}' }) {
    let fileMeta = {}
    try {
        fileMeta = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    } catch (err) {
        fileMeta = {}
    }

    const { publicUrl, filename, originalFilename } = fileMeta
    const displayName = originalFilename || filename || 'No file'

    return (
        <div>
            {publicUrl ? (
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
                <span>{displayName}</span>
            )}
        </div>
    )
}
