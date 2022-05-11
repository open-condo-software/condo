import React from 'react'

import { DocIcon } from '@condo/domains/common/components/icons/DocIcon'
import { ImageIcon } from '@condo/domains/common/components/icons/ImageIcon'
import { VideoIcon } from '@condo/domains/common/components/icons/VideoIcon'

export const getIconByMimetype = (mimetype) => {
    if (mimetype.startsWith('image')) return <ImageIcon />
    if (mimetype.startsWith('video')) return <VideoIcon />

    return <DocIcon />
}