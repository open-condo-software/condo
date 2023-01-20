import styled from '@emotion/styled'
import { Typography } from 'antd'
import { SizeType } from 'antd/es/config-provider/SizeContext'

import { colors } from '@condo/domains/common/constants/style'

export const SubText = styled(Typography.Text)<{ size: SizeType }>`
  color: ${colors.lightGrey[7]};
  ${({ size }) => {
        if (size === 'large') return ('font-size: 14px;')
        if (size === 'middle') return ('font-size: 12px;')
        return ('font-size: 10px;')
    }}
`