import { UserOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Menu, Avatar } from 'antd'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Modal } from '@open-condo/ui'

import { Button } from '@condo/domains/common/components/Button'
import { colors } from '@condo/domains/common/constants/style'

import { ModalWrapper } from './styles'

function goToSignin () {
    Router.push('/auth/signin')
}

// TODO(Dimitreee):refactor later
export const StyledMenu = styled(Menu)`
  padding: 20px;
  width: 210px;
  box-sizing: border-box;
  border-radius: 8px;
  transform: translate(-5%, 10px);
`

const StyledModal = styled(Modal)`
  .condo-modal-header, .condo-modal-close {
    display: none;
  }

  .condo-modal-content {
    background-color: transparent;
    box-shadow: none;
  }
`

export const MobileUserMenu: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const ProfileMessage = intl.formatMessage({ id: 'profile' })

    const auth = useAuth()

    const [showModal, setShowModal] = useState(false)

    const router = useRouter()

    const onProfileItemClick = useCallback(() => {
        setShowModal(false)
        router.push('/user')
    }, [router, setShowModal])

    const onSignOutItemClick = useCallback(() => {
        setShowModal(false)
        auth.signout()
    }, [auth, setShowModal])

    return (
        auth.isAuthenticated
            ? (
                <>
                    <Button
                        type='inlineLink'
                        icon={<Avatar size={40} icon={<UserOutlined/>}/>}
                        onClick={() => setShowModal(true)}
                    />
                    <StyledModal
                        open={showModal}
                        onCancel={() => setShowModal(false)}
                    >
                        <ModalWrapper>
                            <Button color={colors.white} onClick={onProfileItemClick}
                                eventName='MenuClickProfile'>{ProfileMessage}</Button>
                            <Button color={colors.white} onClick={onSignOutItemClick}
                                eventName='MenuClickSignout'>{SignOutMessage}</Button>
                        </ModalWrapper>
                    </StyledModal>
                </>
            )
            : <Button type='inlineLink' onClick={goToSignin}>{SignInMessage}</Button>
    )
}
