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
    transformOrigin: 'initial',
    maxWidth: '100%',
}

type ModalViewProps = {
    setShowModal: (state: boolean) => void
}

const ModalView: React.FC<ModalViewProps> = ({ setShowModal }: ModalViewProps) => {
    const intl = useIntl()
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const ProfileMessage = intl.formatMessage({ id: 'profile' })

    const auth = useAuth()
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
        <ModalWrapper>
            <Button color={colors.white} onClick={onProfileItemClick} eventName={'MenuClickProfile'}>{ProfileMessage}</Button>
            <Button color={colors.white} onClick={onSignOutItemClick} eventName={'MenuClickSignout'}>{SignOutMessage}</Button>
        </ModalWrapper>
    )
}


export const MobileUserMenu: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })

    const auth = useAuth()

    const [showModal, setShowModal] = useState(false)

    const modalView = useCallback(() => <ModalView setShowModal={setShowModal} />, [setShowModal])

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
                        transitionName=""
                        centered
                        visible={showModal}
                        modalRender={modalView}
                        style={modalStyle}
                        onCancel={()=> setShowModal(false)}
                    />
                </>
            )
            : <Button type='inlineLink' onClick={goToSignin}>{SignInMessage}</Button>
    )
}
