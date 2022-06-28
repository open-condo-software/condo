import React, { CSSProperties, useMemo } from 'react'
import xss from 'xss'

type HtmlContentProps = {
    html: string
    style?: CSSProperties
    className?: string
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ html, style, className }) => {
    const htmlContent = useMemo(() => ({
        __html: xss(html),
    }), [html])

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={htmlContent}
            style={style}
        />
    )
}