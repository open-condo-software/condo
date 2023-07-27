/** @jsx jsx */

import { jsx, css, keyframes } from '@emotion/react'
import { Image, Row, RowProps, Typography } from 'antd'
import Router from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'


const WelcomeKeyFrames = keyframes`
  0% {
    opacity: 0;
    transform: translate(-20px)
  }
  40% {
    opacity: 1;
    transform: translate(-20px)
  }
  100% {
    transform: translate(0px)
  }
`


const WelcomeTypographyCSS = css`
  animation: ${WelcomeKeyFrames} 1s ease 1;
  cursor: pointer;
`

const ManKeyPictureFrames = keyframes`
  0% {
    opacity: 0
  }
  60% {
    transform: translate(-30px);
    opacity: 0
  }
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
  0% {
    opacity: 0
  }
  60% {
    transform: translate(-35px);
    opacity: 0
  }
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
const LANDING_PAGE_ADDRESS = 'https://doma.ai/app_landing'
const ROW_TITLE_STYLE: React.CSSProperties = { display: 'inline-flex' }

export const WelcomeHeaderTitle: React.FC = () => {
    const intl = useIntl()
    const WelcomeTitleMessage = intl.formatMessage({ id: 'auth.iAmResident' })

    return (
        <Row style={ROW_TITLE_STYLE} gutter={ITEMS_HEADER_GUTTER}>
            <Image
                preview={false}
                src='/WomanHeaderWelcome.png'
                css={WomanPictureCSS}
            />
            <Image
                preview={false}
                src='/ManHeaderWelcome.png'
                css={ManPictureCSS}
            />
            <Typography.Text
                onClick={() => Router.push(LANDING_PAGE_ADDRESS)}
                css={WelcomeTypographyCSS}
                underline
            >
                {WelcomeTitleMessage}
            </Typography.Text>
        </Row>
    )
}
