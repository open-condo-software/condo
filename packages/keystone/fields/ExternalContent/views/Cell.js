/** @jsx jsx */
import { jsx } from '@emotion/react'

import { parseExternalContentValue } from './utils'

export default function ExternalContentCell ({ data = '{}' }) {
    const { fileMeta, isFileMetadata } = parseExternalContentValue(data)
    const { publicUrl, filename, originalFilename, legacyContent } = fileMeta
    const displayName = originalFilename || filename || legacyContent || 'No file'

    return (
        <div>
            {isFileMetadata && publicUrl ? (
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
