import styled from '@emotion/styled'
import React, { CSSProperties, useMemo } from 'react'

import { colors } from '@condo/domains/common/constants/style'
import { sanitizeXss } from '@condo/domains/common/utils/xss'

export type HtmlContentProps = {
    html: string
    style?: CSSProperties
    className?: string
    css?
}

const StyledDiv = styled.div`
  overflow: hidden;
  word-break: break-word;
  position: relative;
  
  p {
    margin: 0;
  }

  a {
    color: ${colors.black};
    text-decoration: underline;
  }
`

export const HtmlContent = React.forwardRef<HTMLDivElement, HtmlContentProps>(({ html, style, className }, ref) => {
    const htmlContent = useMemo(() => ({
        __html: sanitizeXss(html),
    }), [html])

    return (
        <StyledDiv
            ref={ref}
            className={className}
            dangerouslySetInnerHTML={htmlContent}
            style={style}
        />
    )
})