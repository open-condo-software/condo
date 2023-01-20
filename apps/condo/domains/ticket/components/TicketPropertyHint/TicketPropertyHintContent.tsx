import styled from '@emotion/styled'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { HtmlContent, HtmlContentProps } from '@condo/domains/common/components/HtmlContent'
import { colors, fontSizes } from '@condo/domains/common/constants/style'

type TicketPropertyHintContentProps = HtmlContentProps & {
    linkToHint?: string
}

const StyledLink = styled.a`
  color: ${colors.black};
  &:hover {
    color: ${colors.black};
  }

  display: block;
  width: min-content;
  margin-top: 14px;
  font-size: ${fontSizes.content};
  text-decoration: none;
  border-bottom: 1px solid ${colors.lightGrey[6]};
`

export const TicketPropertyHintContent = (props: TicketPropertyHintContentProps) => {
    const intl = useIntl()
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

    const ref = React.createRef<HTMLDivElement>()
    const [isContentOverflow, setIsContentOverflow] = React.useState(false)

    React.useLayoutEffect(() => {
        if (ref.current) {
            setIsContentOverflow(ref.current.clientHeight + 10 < ref.current.scrollHeight)
        }
    }, [ref])

    return (
        <>
            <HtmlContent {...props} ref={ref}/>
            {
                isContentOverflow && props.linkToHint && (
                    <StyledLink href={props.linkToHint} target='_blank' rel='noreferrer'>
                        {ExtraTitleMessage}
                    </StyledLink>
                )
            }
        </>
    )
}