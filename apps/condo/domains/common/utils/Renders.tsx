import Link from 'next/link'
import React from 'react'


export const renderPhone = (value) => {
    if (value) {
        return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)} ${value.slice(8, 10)} ${value.slice(10, 12)}`
    }
}


type renderLinkType = (content: JSX.Element | string, href: string) => React.ReactElement

const handleStopPropagation = (e) => e.stopPropagation()
export const renderLink: renderLinkType = (content, href) => (
    <Link href={href}>
        <a onClick={handleStopPropagation}>
            {content}
        </a>
    </Link>
)
