import React, { CSSProperties, useMemo } from 'react'
import xss from 'xss'

type HtmlContentProps = {
    html: string
    style?: CSSProperties
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ html, style }) => {
    const htmlContent = useMemo(() => ({
        __html: xss(html),
    }), [html])

    return (
        <div
            dangerouslySetInnerHTML={htmlContent}
            style={style}
        />
    )
}