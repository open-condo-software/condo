/** @jsx jsx */
import React from 'react'
import { colors } from '../constants/style'
import { Col, ColProps } from 'antd'
import { css, jsx } from '@emotion/react'

const statsContainerCss = css`
  min-width: 175px;
  &:not(:last-of-type) {
    border-right: 1px solid ${colors.lightGrey[5]};
  }
`

export const StatsContainer: React.FC<ColProps> = (props) => {
    const { children, ...allProps } = props
    return <Col css={statsContainerCss} {...allProps}>{children}</Col>
}
