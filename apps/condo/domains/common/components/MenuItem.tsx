import styled from '@emotion/styled'
import { Typography } from 'antd'
import classnames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React  from 'react'
import { useIntl } from '@core/next/intl'
import { colors } from '../constants/style'
import { transitions } from '@condo/domains/common/constants/style'
import { ClientRenderedIcon } from './icons/ClientRenderedIcon'

const IconWrapper = styled.div``

const MenuItemWrapper = styled.span`
  cursor: pointer;
  padding: 16px 0;
  display: flex;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  vertical-align: center;
  
  .label {
    font-size: 16px;
    transition: ${transitions.allDefault};
  }

  .icon {
    color: ${colors.lightGrey[5]};
    font-size: 20px;
    margin-right: 20px;
    transition: ${transitions.allDefault};
  }

  &:hover {
    .icon {
      color: ${colors.black};
    }
  }

  &.active {
    .label {
      font-weight: 700;
    }

    .icon {
      color: ${colors.black};
    }
  }
  
  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
`

interface IMenuItemProps {
    path: string
    icon: React.ElementType
    label: string
    disabled?: boolean
    hideInMenu?: boolean
}

export const MenuItem: React.FC<IMenuItemProps> = (props) => {
    const { path, icon, label, hideInMenu, disabled } = props
    const { route } = useRouter()
    const intl = useIntl()

    if (hideInMenu) {
        return null
    }

    const menuItemClassNames = classnames({
        'active': path === '/' ? route === path : route.includes(path),
        'disabled': disabled,
    })

    return (
        <Link href={path}>
            <MenuItemWrapper className={menuItemClassNames}>
                <IconWrapper className='icon'>
                    <ClientRenderedIcon icon={icon}/>
                </IconWrapper>
                <Typography.Text className='label'>
                    {intl.formatMessage({ id: label })}
                </Typography.Text>
            </MenuItemWrapper>
        </Link>
    )
}
