import styled from '@emotion/styled'
import { Menu, Avatar, Modal } from 'antd'
import { colors } from '@condo/domains/common/constants/style'
import React, { ComponentProps, useCallback, useState } from 'react'
import Router, { useRouter } from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { UserOutlined } from '@ant-design/icons'
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

const modalStyle: ComponentProps<typeof Modal>['style'] = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'initial',
    top: 'initial',
}

const ModalView: React.FC = () => {
    const intl = useIntl()
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const ProfileMessage = intl.formatMessage({ id: 'profile' })

    const auth = useAuth()
    const router = useRouter()

    const onUserIconClick = useCallback(() => router.push('/user'), [])

    return (
        <ModalWrapper>
            <Button color={colors.white} onClick={onUserIconClick}>{ProfileMessage}</Button>
            <Button color={colors.white} onClick={auth.signout}>{SignOutMessage}</Button>
        </ModalWrapper>
    )
}


export const MobileUserMenu: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })

    const auth = useAuth()

    const [showModal, setShowModal] = useState(false)

    const hideModal = useCallback(() => setShowModal(false), [])

    return (
        auth.isAuthenticated
            ? (

                <>
                    <Button 
                        type={'inlineLink'} 
                        icon={<Avatar size={40} icon={<UserOutlined />} />} 
                        onClick={() => setShowModal(true)} 
                    />
                    <Modal 
                        centered 
                        onCancel={hideModal} 
                        visible={showModal} 
                        modalRender={ModalView} 
                        style={modalStyle} 
                    />
                </>
            )
            : <Button type='inlineLink' onClick={goToSignin}>{SignInMessage}</Button>
    )
}
