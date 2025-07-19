import styled from '@emotion/styled'

import { colors, DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'

export const PaymentsSumTable = styled.div`
  max-width: calc(100% + 48px);
  border: 1px solid ${colors.lightGrey[5]};
  border-radius: ${DEFAULT_BORDER_RADIUS};
  padding: 25px;
  background-color: ${colors.white};
`
