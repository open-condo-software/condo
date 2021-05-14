import styled from '@emotion/styled'
import get from 'lodash/get'
import React from 'react'
import { useAuth } from '@core/next/auth'
import { orange } from '@ant-design/colors'
import { colors } from '@condo/domains/common/constants/style'

interface IResponsiveAvatarProps {
    src: string
    borderRadius: number
}

const ResponsiveAvatar = styled.div<IResponsiveAvatarProps>`
  ${(props) => `background-image: ${props.src};`}
  width: 100%;
  height: auto;
  border-radius: 24px;
  background-position: center center;
  background-size: contain;
  ${({ borderRadius }) => `border-radius: ${borderRadius}px;`}
`

const DefaultAvatarSvg = () => (
    <svg
        viewBox="64 64 896 896"
        focusable="false"
        data-icon="gitlab"
        width="100%"
        height="100%"
        aria-hidden="true"
        fill={colors.white}
    >
        <path d="M910.5 553.2l-109-370.8c-6.8-20.4-23.1-34.1-44.9-34.1s-39.5 12.3-46.3 32.7l-72.2 215.4H386.2L314 181.1c-6.8-20.4-24.5-32.7-46.3-32.7s-39.5 13.6-44.9 34.1L113.9 553.2c-4.1 13.6 1.4 28.6 12.3 36.8l385.4 289 386.7-289c10.8-8.1 16.3-23.1 12.2-36.8z"/>
    </svg>
)

interface DefaultAvatarContainerProps {
    borderRadius: number
}

const DefaultAvatarContainer = styled.div<DefaultAvatarContainerProps>`
  background-color: ${orange[4]};
  width: 100%;
  padding-top: 100%;
  position: relative;
  ${({ borderRadius }) => `border-radius: ${borderRadius}px;`}
`

const AvatarWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`

interface IUserAvatar {
    borderRadius?: number
}

export const UserAvatar: React.FC<IUserAvatar> = (props) => {
    const auth = useAuth()
    const avatarUrl = get(auth, ['user', 'avatar', 'publicUrl'])
    const borderRadius = get(props, 'borderRadius', 8)

    return avatarUrl
        ? <ResponsiveAvatar src={avatarUrl} borderRadius={borderRadius}/>
        : <DefaultAvatarContainer borderRadius={borderRadius}>
            <AvatarWrapper>
                <DefaultAvatarSvg/>
            </AvatarWrapper>
        </DefaultAvatarContainer>

}
