import React, { useCallback, useState, useMemo } from 'react'

import { Copy, Check } from '@open-condo/icons'
import { Input } from '@open-condo/ui'

import styles from './CopyableInput.module.css'

type CopyableInputProps = {
    value?: string
}

export const CopyableInput: React.FC<CopyableInputProps> = ({ value }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(() => {
        if (value && typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [value])

    const Icon = useMemo(() => {
        if (copied) {
            return <Check size='small' color='var(--condo-global-color-green-7)'/>
        }

        return <Copy
            size='small'
            color='var(--condo-global-color-black)'
            className={styles.copyIcon}
            onClick={handleCopy}
        />
    }, [copied, handleCopy])

    return (
        <Input
            readOnly
            value={value}
            className={styles.copyableInput}
            // @ts-expect-error condo input supports only string suffix for now,
            // maybe think about copyable prop later or React.Node on suffix
            suffix={Icon}
        />
    )
}