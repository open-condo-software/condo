import styled from '@emotion/styled'

import { colors } from '@condo/domains/common/constants/style'
import { HtmlContent } from '@condo/domains/common/components/HtmlContent'

export const TicketPropertyHintContent = styled(HtmlContent)`
  overflow: hidden;
  word-break: break-word;
  
  a {
    color: ${colors.black};
    text-decoration: underline;
  }
`