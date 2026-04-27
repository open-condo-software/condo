import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { FormattedMessage } from 'react-intl'

import { Typography } from '@open-condo/ui'

import type { MenuProps } from 'antd'

import { B2CAppTypeType, useGetB2CAppQuery } from '@/gql'

type MenuItem = Required<MenuProps>['items'][number]

const AVAILABLE_SECTIONS = [
    'info',
    'builds',
    'properties',
    'oidc',
    'permissions',
    'service-user',
    'publishing',
] as const

export type SectionType = typeof AVAILABLE_SECTIONS[number]

type CamelSectionType<S extends string> = S extends `${infer T}-${infer U}`
    ? `${T}${Capitalize<CamelSectionType<U>>}`
    : S

function _camelize (s: SectionType): CamelSectionType<SectionType> {
    return s.replace(/-./g, x => x[1].toUpperCase()) as CamelSectionType<SectionType>
}

function _getSectionsByAppType (appType?: B2CAppTypeType | null) {
    if (appType === B2CAppTypeType.Web) {
        return AVAILABLE_SECTIONS.filter(s => s !== 'builds')
    }

    return AVAILABLE_SECTIONS
}

export function getCurrentSection (querySection?: string | Array<string>, appType?: B2CAppTypeType | null): SectionType {
    const sections = _getSectionsByAppType(appType)
    if (!querySection || Array.isArray(querySection)) {
        return sections[0]
    }

    const idx = (sections as ReadonlyArray<string>).indexOf(querySection.toLowerCase())

    return sections[Math.max(idx, 0)]
}

export function useB2CMenuItems (): [SectionType, Array<MenuItem>] {
    const router = useRouter()
    const { section, id } = router.query
    const { data } = useGetB2CAppQuery({
        variables: { id: id && !Array.isArray(id) ? id : '' },
        skip: !id || Array.isArray(id),
    })

    const currentSection = useMemo(() => getCurrentSection(section, data?.app?.type), [data?.app?.type, section])

    const menuItems: Array<MenuItem> = useMemo(() => {
        const sections = _getSectionsByAppType(data?.app?.type)
        return sections.map(section => {
            const isActive = currentSection === section
            const textType = isActive ? 'success' : 'secondary'
            return {
                key: section,
                label: (
                    <Typography.Title level={4} ellipsis type={textType}>
                        <FormattedMessage
                            id={`pages.apps.b2c.id.sections.${_camelize(section)}.title`}
                        />
                    </Typography.Title>
                ),
            }
        })
    }, [currentSection, data?.app?.type])

    return [currentSection, menuItems]
}