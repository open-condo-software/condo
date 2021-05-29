import React from 'react'
import { formatPhone } from '../utils/helpers'
import { normalizePhone } from '@condo/domains/common/utils/phone'

interface IPhoneLink {
    value: string
}

export const PhoneLink: React.FC<IPhoneLink> = ({ value }) => (
    <a href={`tel:${normalizePhone(value)}`}>
        {formatPhone(value)}
    </a>
)