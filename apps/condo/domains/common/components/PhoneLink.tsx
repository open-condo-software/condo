import React from 'react'

import { normalizePhone } from '@condo/domains/common/utils/phone'

interface IPhoneLink {
    value: string
}

const LINK_STYLE: React.CSSProperties = { color: 'inherit', textDecoration: 'underline' }

export const PhoneLink: React.FC<IPhoneLink> = ({ value }) => (
    <a href={`tel:${normalizePhone(value)}`} style={LINK_STYLE}>
        {value}
    </a>
)