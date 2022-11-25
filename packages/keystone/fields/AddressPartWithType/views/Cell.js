/** @jsx jsx */
import { jsx } from '@emotion/react'

export default function AddressPartWithTypeCell ({ data = {} }) {
    const { name = '', typeShort = '', typeFull = '' } = JSON.parse(data || '{}')

    const typesStr = [typeFull, typeShort].filter(Boolean).join(' · ')

    return (
        <div>
            <div>{typesStr}</div>
            <div>{name}</div>
        </div>
    )
}
