import styled from '@emotion/styled'
import { Tag } from 'antd'

import { fontSizes } from '@condo/domains/common/constants/style'

export const TicketTag = styled(Tag)`
  &.ant-tag {
    border-radius: 100px;
  }
  
  font-size: ${fontSizes.label};
  line-height: 24px;
`