/** @jsx jsx */
import { jsx } from '@emotion/react'

export default function AddressPartWithTypeCell ({ data }) {
    const { name = '', typeShort = '', typeFull = '' } = JSON.parse(data)

    return (
        <div>
            <div>{typeFull} · {typeShort}</div>
            <div>{name}</div>
        </div>
    )
}
