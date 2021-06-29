/** @jsx jsx */
import React from 'react'
import { colors } from '../constants/style'
import { Col, ColProps } from 'antd'
import { css, jsx } from '@emotion/core'

const statsContainerCss = css`
  min-width: 160px;
  &:not(:last-of-type) {
    border-right: 1px solid ${colors.lightGrey[5]};
  }
  //&:nth-child(6n+1):nth-last-child(-n+6),
  //&:nth-child(6n+1):nth-last-child(-n+6) ~ & {
  //  border-right: none;
  //}
`

export const StatsContainer: React.FC<ColProps> = (props) => {
    const { children, ...allProps } = props
    return <Col css={statsContainerCss} {...allProps}>{children}</Col>
}
