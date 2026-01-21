import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { FormattedMessage } from 'react-intl'

import { Typography } from '@open-condo/ui'

import type { MenuProps } from 'antd'

type MenuItem = Required<MenuProps>['items'][number]

const AVAILABLE_SECTIONS = [
    'info',
    'oidc',
    'publishing',
] as const

export type SectionType = typeof AVAILABLE_SECTIONS[number]

type CamelSectionType<S extends string> = S extends `${infer T}-${infer U}`
    ? `${T}${Capitalize<CamelSectionType<U>>}`
    : S

function _camelize (s: SectionType): CamelSectionType<SectionType> {
    return s.replace(/-./g, x => x[1].toUpperCase()) as CamelSectionType<SectionType>
}

export function getCurrentSection (querySection?: string | Array<string>): SectionType {
    if (!querySection || Array.isArray(querySection)) {
        return AVAILABLE_SECTIONS[0]
    }
    const idx = (AVAILABLE_SECTIONS as ReadonlyArray<string>).indexOf(querySection.toLowerCase())

    return AVAILABLE_SECTIONS[Math.max(idx, 0)]
}

export function useB2BMenuItems (): [SectionType, Array<MenuItem>] {
    const router = useRouter()
    const { section } = router.query
    const currentSection = getCurrentSection(section)

    const menuItems: Array<MenuItem> = useMemo(() => {
        return AVAILABLE_SECTIONS.map(section => {
            const isActive = currentSection === section
            const textType = isActive ? 'success' : 'secondary'
            return {
                key: section,
                label: (
                    <Typography.Title level={4} ellipsis type={textType}>
                        <FormattedMessage
                            id={`pages.apps.b2b.id.sections.${_camelize(section)}.title`}
                        />
                    </Typography.Title>
                ),
            }
        })
    }, [currentSection])

    return [currentSection, menuItems]
}