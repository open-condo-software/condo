import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import sortBy from 'lodash/sortBy'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import Select from '@condo/domains/common/components/antd/Select'
import { PARKING_SECTION_TYPE, SECTION_SECTION_TYPE } from '@condo/domains/property/constants/common'

const BASE_UNIT_NAME_INPUT_OPTION_STYLE: React.CSSProperties = { paddingLeft: '12px' }

const getOptionGroupBySectionType = (sections, sectionType, groupLabel) => {
    if (isEmpty(sections)) return null

    const sortedSections = sortBy(sections, 'name')

    const options = sortedSections.map(
        (section) => (
            <Select.Option
                key={`${sectionType}-${section.name}`}
                value={`${sectionType}-${section.name}`}
                data-sectionType={sectionType}
                data-sectionName={String(section.name)}
                data-sectionId={String(section.id)}
                title={String(section.name)}
                style={BASE_UNIT_NAME_INPUT_OPTION_STYLE}
            >
                {section.name}
            </Select.Option>
        )
    )

    return !isEmpty(options) && (
        <Select.OptGroup label={groupLabel}>
            {options}
        </Select.OptGroup>
    )
}

export const SectionNameInput = (props) => {
    const intl = useIntl()
    const SectionGroupLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const ParkingGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.parking' })

    const { placeholder, property, loading, ...restInputProps } = props

    const sections = get(property, 'map.sections', [])
    const parking = get(property, 'map.parking', [])

    return (
        <Select
            allowClear
            showSearch
            placeholder={placeholder}
            optionFilterProp='title'
            loading={loading}
            disabled={loading}
            autoClearSearchValue
            {...restInputProps}
        >
            {getOptionGroupBySectionType(sections, SECTION_SECTION_TYPE, SectionGroupLabel)}
            {getOptionGroupBySectionType(parking, PARKING_SECTION_TYPE, ParkingGroupLabel)}
        </Select>
    )
}