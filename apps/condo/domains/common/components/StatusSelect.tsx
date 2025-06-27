import styled from '@emotion/styled'

import { colors } from '@open-condo/ui/colors'

import Select from '@condo/domains/common/components/antd/Select'
import { transitions } from '@condo/domains/common/constants/style'

interface IStatusSelect {
    color: string
    backgroundColor: string
    minWidth?: number
}

export const StatusSelect = styled(Select)<IStatusSelect>`
  min-width: ${({ minWidth }) => minWidth ? `${minWidth}px` : '175px'};
  font-weight: 700;
  border-radius: 8px;
  color: ${({ color }) => color};
  background-color: ${({ backgroundColor }) => backgroundColor};
  transition: ${transitions.easeInOut};

  &.ant-select-disabled .ant-select-selector .ant-select-selection-item {
    color: ${({ color }) => color};
  }

  &.ant-select-open .ant-select-selector .ant-select-selection-item {
    color: ${({ color }) => color};
  }

  .ant-select-selector .ant-select-selection-item {
    font-weight: 600;
    color: ${colors.white};
    transition: ${transitions.easeInOut};
  }
  
  .ant-select-arrow svg {
    fill: ${({ color }) => color};
    transition: ${transitions.easeInOut};
  }
`