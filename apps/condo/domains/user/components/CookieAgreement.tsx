import styled from '@emotion/styled'
import cookie from 'js-cookie'
import React, { useState, useCallback } from 'react'

import { ChevronDown, ChevronUp } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Space } from '@open-condo/ui'

import { shadows } from '@condo/domains/common/constants/style'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'

const COOKIE_AGREEMENT_KEY = 'cookieAgreementAccepted'

const StyledFixedPanel = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 11;
  width: 100%;
  box-shadow: ${shadows.big};
  background: white;
  display: flex;
  justify-content: center;
`

const StyledFixedPanelContent = styled(Space)`
  justify-content: ${({ direction }) => direction === 'horizontal' ? 'space-between' : 'flex-start'};
  padding: ${({ direction }) => direction === 'horizontal' ? '12px 40px' : '16px 20px'};
  width: ${({ direction }) => direction === 'horizontal' ? '100%' : '640px'};
  align-items: center;
  box-sizing: border-box;
`

const toggleMoreTextStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
}

// When width will be less than this value, layout of auth-pages turns to vertical mode
const MIN_CONTENT_WIDTH_FOR_DESKTOP_MODE = 990

export const CookieAgreement: React.FC = () => {
    const intl = useIntl()
    const CookieAgreementTitleMsg = intl.formatMessage({ id: 'component.cookieAgreement.title' })
    const CookieAgreementDescriptionMsg = intl.formatMessage({ id: 'component.cookieAgreement.description' })
    const CookieExpandActionMsg = intl.formatMessage({ id: 'component.cookieAgreement.action.expand' })
    const CookieAcceptActionMsg = intl.formatMessage({ id: 'component.cookieAgreement.action.accept' })

    const [displayMore, setDisplayMore] = useState(false)
    const [accepted, setAccepted] = useState(cookie.get(COOKIE_AGREEMENT_KEY) || false)

    const [{ width: contentWidth }, setRef] = useContainerSize()

    const toggleMoreText = () => {
        setDisplayMore(prevState => !prevState)
    }

    const acceptCookieAgreement = useCallback(() => {
        cookie.set(COOKIE_AGREEMENT_KEY, true)
        setAccepted(true)
    }, [])

    if (accepted) {
        return null
    }

    const desktopMode = contentWidth > MIN_CONTENT_WIDTH_FOR_DESKTOP_MODE

    return (
        <StyledFixedPanel ref={setRef}>
            <StyledFixedPanelContent direction={desktopMode ? 'horizontal' : 'vertical'} size={desktopMode ? 20 : 16}>
                <Space direction='vertical' size={8} align={desktopMode ? 'start' : 'center'}>
                    <Space direction={desktopMode ? 'horizontal' : 'vertical'} align={desktopMode ? 'start' : 'center'} size={8}>
                        <Typography.Paragraph>{CookieAgreementTitleMsg}</Typography.Paragraph>
                        <Typography.Link
                            onClick={toggleMoreText}
                            style={toggleMoreTextStyle}
                            size='large'
                        >
                            {CookieExpandActionMsg}
                            {displayMore ? (
                                <ChevronUp size='small'/>
                            ) : (
                                <ChevronDown size='small'/>
                            )}
                        </Typography.Link>
                    </Space>
                    {displayMore &&
                        <Typography.Paragraph>
                            <Typography.Text type='secondary' size='medium'>{CookieAgreementDescriptionMsg}</Typography.Text>
                        </Typography.Paragraph>
                    }
                </Space>
                <Button type='primary' onClick={acceptCookieAgreement}>
                    {CookieAcceptActionMsg}
                </Button>
            </StyledFixedPanelContent>
        </StyledFixedPanel>
    )
}