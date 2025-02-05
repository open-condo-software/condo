import { MenuProps } from 'antd/lib/menu'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import type { TypographyTitleProps } from '@open-condo/ui'
import { Typography } from '@open-condo/ui'

import type { NavItem } from '@/domains/docs/utils/routing'

type TitleLevel = TypographyTitleProps['level']
type MenuItem = Required<MenuProps>['items'][number]

function getMenuItems (
    nav: Array<NavItem>,
    locale: string | undefined,
    currentRoute: string,
    entryEndpoint: string,
    currentTitleLevel: TitleLevel = 4,
    maxTitleLevel: TitleLevel = 5,
): Array<MenuItem> {
    const nextTitleLevel = Math.min(currentTitleLevel + 1, maxTitleLevel) as TitleLevel

    return nav
        .filter(item => !item.hidden)
        .map(item => {
            const route = `${entryEndpoint}/${item.route}`
            const isActive = route === currentRoute
            const textType = isActive ? 'success' : 'secondary'
            const children = item.children
                ? getMenuItems(item.children, locale, currentRoute, entryEndpoint, nextTitleLevel, maxTitleLevel)
                : undefined

            if (item.children) {
                return {
                    key: route,
                    label: (
                        <Typography.Title level={currentTitleLevel} type='secondary' ellipsis>
                            {item.label}
                        </Typography.Title>
                    ),
                    children,
                }
            }

            if (item.external) {
                return {
                    key: route,
                    label: (
                        <a href={item.route} target='_blank' rel='noreferrer'>
                            <Typography.Title level={currentTitleLevel} type='secondary' ellipsis>
                                {item.label}
                            </Typography.Title>
                        </a>
                    ),
                }
            }

            return {
                key: route,
                label: (
                    <Link href={route} locale={locale}>
                        <Typography.Title level={currentTitleLevel} type={textType} ellipsis>
                            {item.label}
                        </Typography.Title>
                    </Link>
                ),
            }
        })
}

export function useMenuItems (
    nav: Array<NavItem>,
    entryEndPoint: string,
    startTitleLevel: TitleLevel = 4,
    maxTitleLevel: TitleLevel = 5
): Array<MenuItem> {
    const { locale, asPath } = useRouter()
    const currentRoute = asPath.split(/[?#]/)[0]
    return useMemo(() => getMenuItems(nav, locale, currentRoute, entryEndPoint, startTitleLevel, maxTitleLevel),
        [currentRoute, entryEndPoint, locale, nav, startTitleLevel, maxTitleLevel])
}
