/** @jsx jsx */

import React from 'react'
import { Image, Row, RowProps, Typography } from 'antd'
import { jsx, css, keyframes } from '@emotion/core'
import { useIntl } from 'react-intl'

const WelcomeKeyFrames = keyframes`
      0% {opacity: 0; transform: translate(-20px)}
      40% {opacity: 1; transform: translate(-20px)}
      100% {transform: translate(0px)}
  `


const WelcomeAnimation = css`
  animation: ${WelcomeKeyFrames} 1s ease 1;
`

const ManKeyPictureFrames = keyframes`
    0% {opacity: 0}
    60% {transform: translate(-30px); opacity: 0}
    100% {
      transform: translate(0);
      opacity: 1
    }
`


const ManPictureCSS = css`
  animation: ${ManKeyPictureFrames} 1s ease 1;
  width: 80%
`

const WomanPictureKeyFrames = keyframes`
      0% {opacity: 0}
      60% {transform: translate(-35px); opacity: 0}
      100% {
        transform: translate(0);
        opacity: 1
      }
`


const WomanPictureCSS = css`
  animation: ${WomanPictureKeyFrames} 1.1s ease 1;
  width: 80%
`

const ITEMS_HEADER_GUTTER: RowProps['gutter'] = [5, 0]

export const WelcomeHeaderTitle: React.FC = () => {
    const intl = useIntl()
    const WelcomeTitleMessage = intl.formatMessage({ id: 'pages.auth.IAmCustomer' })
    return (
        <Row style={{ display: 'inline-flex' }} gutter={ITEMS_HEADER_GUTTER}>
            <Image src={'/WomanHeaderWelcome.png'} css={WomanPictureCSS}/>
            <Image src={'/ManHeaderWelcome.png'} css={ManPictureCSS}/>
            <Typography.Text css={WelcomeAnimation} underline>{WelcomeTitleMessage}</Typography.Text>
        </Row>
    )
}
