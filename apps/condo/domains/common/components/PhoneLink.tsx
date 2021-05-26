import React from 'react'
import { formatPhone, stripPhone } from '../utils/helpers'
import { PHONE_CLEAR_REGEXP } from '../constants/regexps'

interface IPhoneLink {
    value: string
}

export const PhoneLink: React.FC<IPhoneLink> = ({ value }) => (
    <a href={`tel:${stripPhone(value)}`}>
        {formatPhone(value)}
    </a>
)

/**
 * Produces safe phone number string to insert into `href` attribute of `<a>` tag
 * @param phone
 */
export const normalizePhoneForHref = (phone?: string): string => (
    phone.replace(PHONE_CLEAR_REGEXP, '').replace(' ', '')
)