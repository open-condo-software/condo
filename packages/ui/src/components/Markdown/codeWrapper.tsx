import React, { useCallback, useRef, useState } from 'react'

import { Copy, Check } from '@open-condo/icons'
import { colors } from '@open-condo/ui/src/colors'

import { Tag } from '../Tag'

export const CodeWrapper: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ className, children, ...restProps }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [copied, setCopied] = useState(false)
    const firstChild = React.Children.toArray(children)[0]
    const childClassName = React.isValidElement<{ className?: string }>(firstChild)
        ? firstChild.props.className
        : undefined
    const classNames = [className, childClassName].filter(Boolean).join(' ')
    const languageClass = classNames.split(' ').find(name => name.startsWith('language-'))
    const language = languageClass ? languageClass.replace('language-', '') : ''

    const handleCopy = useCallback(() => {
        if (ref.current && ref.current.textContent && typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(ref.current.textContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [])

    const Icon = copied ? Check : Copy

    return (
        <pre className={className} {...restProps}>
            {Boolean(language) && (
                <Tag textColor={colors.white} bgColor={colors.brandGradient['5']}>{language}</Tag>
            )}
            <div className='code-container' ref={ref}>
                {children}
            </div>
            <Icon size='medium' color={colors.gray['7']} className='copy-text-icon' onClick={handleCopy}/>
        </pre>
    )
}
