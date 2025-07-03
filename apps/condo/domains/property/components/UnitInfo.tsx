import { GetPropertyByIdQueryHookResult } from '@app/condo/gql'
import { BuildingFloor, BuildingSection, BuildingUnitSubType, MeterUnitTypeType } from '@app/condo/schema'
import { Col, Form, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { FormItemTooltipWrapper } from '@condo/domains/common/components/Form/FormItemTooltipWrapper'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PARKING_SECTION_TYPE, SECTION_SECTION_TYPE } from '@condo/domains/property/constants/common'
import { TicketFormItem } from '@condo/domains/ticket/components/BaseTicketForm'
import { FloorNameInput } from '@condo/domains/user/components/FloorNameInput'
import { SectionNameInput } from '@condo/domains/user/components/SectionNameInput'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'


interface IGetSectionAndFloorByUnit {
    (unitName: string, sections: BuildingSection[], unitType: BuildingUnitSubType): {
        sectionName: null | string, floorName: null | string
    }
}

const getSectionAndFloorByUnit: IGetSectionAndFloorByUnit = (unitName, sections, unitType = BuildingUnitSubType.Flat) => {
    const sectionAndFloor = { sectionName: null, floorName: null }

    if (sections) {
        for (const section of sections) {
            for (const floor of section.floors) {
                const floorUnits = floor.units.filter((unit) => {
                    if (unitType === BuildingUnitSubType.Flat) {
                        return unit.unitType === null || unit.unitType === BuildingUnitSubType.Flat
                    }
                    return unit.unitType === unitType
                })
                for (const unit of floorUnits) {
                    if (unit.label === unitName) {
                        sectionAndFloor.sectionName = section.name
                        sectionAndFloor.floorName = floor.name
                    }
                }
            }
        }
    }

    return sectionAndFloor
}

export function getFloorsBySection (selectedSectionName, sections: BuildingSection[]): BuildingFloor[] {
    if (!isEmpty(selectedSectionName)) {
        const section = sections.find(section => section.name === selectedSectionName)

        return get(section, 'floors', [])
    }

    return []
}

export enum UnitInfoMode {
    Unit = 'unit',
    All = 'all',
}

type InitialUnitInfoType = {
    sectionName?: string
    floorName?: string
    unitName?: string
    unitType?: string
}

interface IUnitInfo {
    property: GetPropertyByIdQueryHookResult['data']['properties'][number]
    form: FormInstance
    loading: boolean
    setSelectedUnitName: React.Dispatch<React.SetStateAction<string>>
    setSelectedUnitType?: React.Dispatch<React.SetStateAction<BuildingUnitSubType | MeterUnitTypeType>>
    selectedUnitName?: string
    mode?: UnitInfoMode
    initialValues?: InitialUnitInfoType
    selectedSectionType?: string
    setSelectedSectionType?: React.Dispatch<React.SetStateAction<string>>
    disabled?: boolean
    required?: boolean
    showUnitNotFoundLink?: boolean
}

const UNIT_FIELDS_GUTTER: [Gutter, Gutter] = [40, 0]

export const UnitInfo: React.FC<IUnitInfo> = (props) => {
    const intl = useIntl()
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorNameLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const SectionAndFloorTooltipTitle = intl.formatMessage({ id: 'pages.condo.property.section.Name.tooltip.title' })
    const SectionAndFloorTooltipButtonLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name.tooltip.button' })

    const {
        initialValues = {},
        property,
        loading,
        setSelectedUnitName,
        form,
        setSelectedUnitType,
        selectedUnitName,
        mode = UnitInfoMode.Unit,
        selectedSectionType,
        setSelectedSectionType,
        disabled,
        required,
        showUnitNotFoundLink = true,
    } = props

    const [selectedSectionName, setSelectedSectionName] = useState<string>(get(initialValues, 'sectionName'))
    const [selectedFloorName, setSelectedFloorName] = useState<string>(get(initialValues, 'floorName'))

    const propertyId = useMemo(() => property?.id, [property?.id])
    const isInitialPropertySet = useRef<boolean>(false)

    // Reset unit/section/floor data when property is changed
    useEffect(() => {
        if (propertyId && !isInitialPropertySet.current) {
            isInitialPropertySet.current = true
            return
        }
        if (!isInitialPropertySet.current) {
            return
        }

        setSelectedUnitName(null)
        setSelectedSectionName(null)
        setSelectedFloorName(null)

        if (setSelectedUnitType) {
            setSelectedUnitType(null)
        }
        if (setSelectedSectionType) {
            setSelectedSectionType(null)
        }

        form.setFieldsValue({ unitName: null, unitType: null, sectionName: null, sectionType: null, floorName: null })
    }, [form, propertyId, setSelectedSectionType, setSelectedUnitName, setSelectedUnitType])

    const sections = useMemo(() => get(property, ['map', 'sections'], []), [property])
    const parking = useMemo(() => get(property, ['map', 'parking'], []), [property])
    const selectedSections = useMemo(() => {
        if (selectedSectionName) {
            return selectedSectionType === SECTION_SECTION_TYPE ? sections : parking
        }
    }, [parking, sections, selectedSectionName, selectedSectionType])
    const floors = useMemo(() =>
        getFloorsBySection(selectedSectionName, selectedSections)
    , [selectedSectionName, selectedSections])

    const { requiredValidator } = useValidations()

    const setUnitFormFields = useCallback(({ unitFromSections, unitName, unitType, sectionType }) => {
        if (setSelectedUnitType) setSelectedUnitType(unitType)
        if (setSelectedSectionType) setSelectedSectionType(sectionType)
        return form.setFieldsValue({
            sectionName: unitFromSections.sectionName,
            sectionType,
            floorName: unitFromSections.floorName,
            unitType,
            unitName,
        })
    }, [form, setSelectedSectionType, setSelectedUnitType])

    const updateSectionAndFloor = useCallback((form, unitName: string, unitType = BuildingUnitSubType.Flat) => {
        if (unitName) {
            const sections = property?.map?.sections || []
            const unitFromSections = getSectionAndFloorByUnit(unitName, sections, unitType)
            if (unitFromSections.sectionName && unitFromSections.floorName) {
                return setUnitFormFields({
                    unitFromSections,
                    unitName,
                    unitType,
                    sectionType: SECTION_SECTION_TYPE,
                })
            }

            const parking = property?.map?.parking || []
            const unitFromParking = getSectionAndFloorByUnit(unitName, parking, unitType)
            if (unitFromParking.sectionName && unitFromParking.floorName) {
                return setUnitFormFields({
                    unitFromSections: unitFromParking,
                    unitName,
                    unitType,
                    sectionType: PARKING_SECTION_TYPE,
                })
            }
        }

        form.setFieldsValue({ sectionName: null, sectionType: null, floorName: null, unitType: null })
    }, [property?.map?.parking, property?.map?.sections, setUnitFormFields])

    useDeepCompareEffect(() => {
        const initialUnitName = get(initialValues, 'unitName')
        const initialUnitType = get(initialValues, 'unitType')

        if (initialUnitName) {
            updateSectionAndFloor(form, initialUnitName, initialUnitType)
        }
    }, [form, initialValues, updateSectionAndFloor])

    const handleUnitNameInputChange = useCallback((_, option: UnitNameInputOption) => {
        if (!option) {
            setSelectedUnitName(null)
            if (setSelectedUnitType) setSelectedUnitType(null)
            updateSectionAndFloor(form, null)

            setSelectedFloorName(null)
            setSelectedSectionName(null)
            if (setSelectedSectionType) setSelectedSectionType(null)
        } else {
            const unitType = get(option, 'data-unitType', BuildingUnitSubType.Flat)
            const unitName = get(option, 'data-unitName')
            setSelectedUnitType && setSelectedUnitType(unitType)
            setSelectedUnitName(unitName)
            updateSectionAndFloor(form, unitName, unitType)
        }
    }, [form, setSelectedSectionType, setSelectedUnitName, setSelectedUnitType, updateSectionAndFloor])

    const inputColSpan = 8

    const disableFloorInputCondition = mode === UnitInfoMode.Unit || isEmpty(selectedSectionName) || selectedUnitName
    const disableSectionInputCondition = mode === UnitInfoMode.Unit || selectedUnitName

    const handleChangeSectionNameInput = useCallback((section, option) => {
        if (!isEmpty(section)) {
            const sectionName = get(option, 'data-sectionName')
            const sectionType = get(option, 'data-sectionType')

            setSelectedSectionName(sectionName)
            if (setSelectedSectionType) setSelectedSectionType(sectionType)
            setSelectedFloorName(null)

            form.setFieldsValue({ sectionName, sectionType, floorName: null })
        } else {
            setSelectedFloorName(null)
            setSelectedSectionName(null)
            if (setSelectedSectionType) setSelectedSectionType(null)

            form.setFieldsValue({ sectionName: null, sectionType: null, floorName: null })
        }
    }, [form, setSelectedSectionType])

    const handleChangeFloorNameInput = useCallback((floor) => {
        if (!isEmpty(floor)) {
            setSelectedFloorName(floor)
        } else {
            setSelectedFloorName(null)
            form.setFieldsValue({ floorName: null })
        }
    }, [form])

    const SectionAndFloorTooltip = useMemo(() => (
        <FormItemTooltipWrapper>
            <Typography.Text size='small'>
                {SectionAndFloorTooltipTitle}
            </Typography.Text>
            <Typography.Link
                target='_blank'
                href={`/property/${get(property, 'id')}/map/update`}
                size='medium'
            >
                {SectionAndFloorTooltipButtonLabel}
            </Typography.Link>
        </FormItemTooltipWrapper>
    ), [SectionAndFloorTooltipButtonLabel, SectionAndFloorTooltipTitle, property])

    return (
        <Col span={24} md={20} xl={18} xxl={16}>
            <Row gutter={UNIT_FIELDS_GUTTER}>
                <Form.Item name='unitType' hidden />
                <Col span={inputColSpan} data-cy='unit-name-input-item'>
                    <TicketFormItem
                        name='unitName'
                        label={FlatNumberLabel}
                        required={required}
                        initialValue={get(initialValues, 'unitName')}
                        rules={required && [requiredValidator]}
                    >
                        <UnitNameInput
                            property={property}
                            loading={loading}
                            allowClear
                            onChange={handleUnitNameInputChange}
                            mode={mode}
                            selectedSections={selectedSections}
                            selectedSectionName={selectedSectionName}
                            selectedFloorName={selectedFloorName}
                            disabled={disabled}
                            showUnitNotFoundLink={showUnitNotFoundLink}
                        />
                    </TicketFormItem>
                </Col>
                <Col span={inputColSpan}>
                    <TicketFormItem
                        name='sectionName'
                        label={SectionNameLabel}
                        tooltip={SectionAndFloorTooltip}
                    >
                        <SectionNameInput
                            disabled={disableSectionInputCondition}
                            property={property}
                            onChange={handleChangeSectionNameInput}
                        />
                    </TicketFormItem>
                </Col>
                <Col span={inputColSpan}>
                    <TicketFormItem
                        name='floorName'
                        label={FloorNameLabel}
                        tooltip={SectionAndFloorTooltip}
                    >
                        <FloorNameInput
                            disabled={disableFloorInputCondition}
                            property={property}
                            floors={floors}
                            onChange={handleChangeFloorNameInput}
                        />
                    </TicketFormItem>
                </Col>
            </Row>
        </Col>
    )
}
