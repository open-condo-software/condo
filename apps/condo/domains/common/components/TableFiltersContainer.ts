import styled from '@emotion/styled'

import { colors, DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'

export const TableFiltersContainer = styled.div`
  max-width: calc(100% + 48px);
  border-radius: ${DEFAULT_BORDER_RADIUS};
  padding: 16px;
  background-color: ${colors.backgroundLightGrey};

  &.disabled {
    opacity: 0.5;
    pointer-events: none;  
  }
`
