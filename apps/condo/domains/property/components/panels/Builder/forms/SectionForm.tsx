import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, InputNumber, Row } from 'antd'
import { debounce } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChevronDown, ChevronUp, QuestionCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Select, Space, Tooltip, Typography } from '@open-condo/ui'

import {
    MAX_PROPERTY_FLOORS_COUNT,
    MAX_PROPERTY_UNITS_COUNT_PER_FLOOR,
} from '@condo/domains/property/constants/property'

import {
    INPUT_STYLE,
    IPropertyMapModalForm,
    MODAL_FORM_BUTTON_GUTTER,
    MODAL_FORM_EDIT_GUTTER,
    MODAL_FORM_ROW_GUTTER,
} from './BaseUnitForm'

import { MapViewMode } from '../MapConstructor'

const AddSectionForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const SectionNameLabel = builder.viewMode === MapViewMode.parking ?
        intl.formatMessage({ id: 'pages.condo.property.parking.form.numberOfParkingSection' }) :
        intl.formatMessage({ id: 'pages.condo.property.section.form.numberOfSection' })
    const MinFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.minfloor' })
    const FloorCountLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.floorCount' })
    const UnitsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.unitsOnFloor' })
    const ParkingsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.parkingsOnFloor' })
    const CreateNewLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.mode.create' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })
    const CopyLabel = builder.viewMode === MapViewMode.parking ?
        intl.formatMessage({ id: 'pages.condo.property.parking.form.mode.copy' }) :
        intl.formatMessage({ id: 'pages.condo.property.section.form.mode.copy' })
    const AddLabel = intl.formatMessage({ id: 'Add' })
    const ShowMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.showMinFloor' })
    const HideMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.hideMinFloor' })

    const [minFloor, setMinFloor] = useState(1)
    const [floorCount, setFloorCount] = useState(null)
    const [unitsOnFloor, setUnitsOnFloor] = useState(null)
    const [copyId, setCopyId] = useState<string | null>(null)
    const [minFloorHidden, setMinFloorHidden] = useState<boolean>(true)
    const [sectionName, setSectionName] = useState<string>(builder.nextSectionName)
    const [unitType, setUnitType] = useState<BuildingUnitSubType>(builder.defaultUnitType)

    const resetForm = useCallback(() => {
        setMinFloor(1)
        setFloorCount(null)
        setUnitsOnFloor(null)
    }, [])

    const toggleMinFloorVisible = useCallback(() => {
        if (!minFloorHidden) {
            setMinFloor(1)
        }
        setMinFloorHidden(!minFloorHidden)
    }, [minFloorHidden])

    const setMinFloorValue = useCallback((value) => { setMinFloor(value) }, [])
    const setFloorCountValue = useCallback((value) => { setFloorCount(value) }, [])
    const maxFloorValue = useMemo(() => {
        if (floorCount === 1) return minFloor
        if (minFloor > 0) return floorCount + minFloor - 1
        return floorCount + minFloor
    }, [floorCount, minFloor])

    useEffect(() => {
        if (minFloor && floorCount && unitsOnFloor && sectionName) {
            builder.addPreviewSection({
                id: '',
                name: sectionName,
                minFloor,
                maxFloor: maxFloorValue,
                unitsOnFloor,
            }, unitType)
            refresh()
        } else {
            builder.removePreviewSection()
        }
    }, [minFloor, floorCount, unitsOnFloor, sectionName, unitType])

    useEffect(() => {
        if (copyId !== null) {
            builder.addPreviewCopySection(copyId)
        }
    }, [builder, copyId])

    const handleFinish = useCallback(() => {
        builder.removePreviewSection()
        if (copyId === null) {
            builder.addSection({ id: '', name: sectionName, minFloor, maxFloor: maxFloorValue, unitsOnFloor }, unitType)
            setSectionName(builder.nextSectionName)
        } else {
            builder.addCopySection(copyId)
        }

        refresh()
        resetForm()
    }, [refresh, resetForm, builder, sectionName, minFloor, unitsOnFloor, unitType, copyId, maxFloorValue])

    const setSectionNameValue = useCallback((value) => setSectionName(value ? value.toString() : ''), [])
    const isSubmitDisabled = copyId !== null ? false : !(minFloor && floorCount && unitsOnFloor)
    const isCreateColumnsHidden = copyId !== null
    const minFloorMargin = minFloorHidden ? '-20px' : 0

    const sectionOptions = useMemo(() => (
        [
            {
                key: CreateNewLabel,
                label: CreateNewLabel,
                value: null,
            },
            ...builder.sections.filter(section => !section.preview).map(section => ({
                key: `copy-${section.id}`,
                value: section.id,
                label: `${CopyLabel}${section.name}`,
                'data-cy': 'property-map__add-section-form__section-mode-select__copy-option',
            })),
        ]
    ), [CopyLabel, CreateNewLabel, builder.sections])

    const unitTypeOptions = useMemo(() => (
        builder.availableUnitTypes
            .map((unitType, key) => ({
                key: `${key}-${unitType}`,
                value: unitType,
                title: unitType,
                label: intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` }),
            }))
    ), [builder.availableUnitTypes, intl])

    return (
        <Row gutter={[0, 40]} data-cy='property-map__add-section-form'>
            <Col span={24}>
                <Row gutter={MODAL_FORM_ROW_GUTTER}>
                    <Col span={24}>
                        <Select
                            value={copyId}
                            onChange={(value) => setCopyId(value ? String(value) : null)}
                            disabled={builder.isEmptySections}
                            options={sectionOptions}
                            data-cy='property-map__add-section-form__section-mode-select'
                            id='property-map__add-section-form__section-mode-select'
                        />
                    </Col>
                    <Col span={24} hidden={isCreateColumnsHidden}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text type='secondary' size='medium'>{UnitTypeLabel}</Typography.Text>
                            <Select
                                value={unitType}
                                onChange={(value) => setUnitType(value as BuildingUnitSubType)}
                                options={unitTypeOptions}
                                data-cy='property-map__add-section-form__unit-type'
                                id='property-map__add-section-form__unit-type'
                            />
                        </Space>
                    </Col>
                    <Col span={24} hidden={isCreateColumnsHidden}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text type='secondary' size='medium'>{SectionNameLabel}</Typography.Text>
                            <InputNumber
                                value={sectionName}
                                min={1}
                                onChange={setSectionNameValue}
                                style={INPUT_STYLE}
                                type='number'
                                data-cy='property-map__add-section-form__section-name'
                            />
                        </Space>
                    </Col>
                    <Col span={24} hidden={isCreateColumnsHidden}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text type='secondary' size='medium'>{FloorCountLabel}</Typography.Text>
                            <InputNumber
                                value={floorCount}
                                onChange={setFloorCountValue}
                                min={1}
                                max={MAX_PROPERTY_FLOORS_COUNT}
                                style={INPUT_STYLE}
                                type='number'
                                data-cy='property-map__add-section-form__floor-count'
                            />
                        </Space>
                    </Col>
                    <Col span={24} hidden={isCreateColumnsHidden} style={{ marginTop: minFloorMargin }}>
                        <Space direction='vertical' size={8} width='100%'>
                            {
                                !minFloorHidden && (
                                    <>
                                        <Typography.Text type='secondary' size='medium'>{MinFloorLabel}</Typography.Text>
                                        <InputNumber
                                            value={minFloor}
                                            onChange={setMinFloorValue}
                                            style={INPUT_STYLE}
                                            type='number'
                                        />
                                    </>
                                )
                            }
                            <Typography.Text onClick={toggleMinFloorVisible} size='medium'>
                                <Space size={8} width='100%'>
                                    {
                                        minFloorHidden ? (
                                            <>
                                                {ShowMinFloor}
                                                <ChevronDown size='medium' />
                                            </>
                                        ) : (
                                            <>
                                                {HideMinFloor}
                                                <ChevronUp size='medium' />
                                            </>
                                        )
                                    }
                                </Space>
                            </Typography.Text>
                        </Space>
                    </Col>
                    <Col span={24} hidden={isCreateColumnsHidden}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>
                                {unitType === BuildingUnitSubType.Parking ? ParkingsOnFloorLabel : UnitsOnFloorLabel}
                            </Typography.Text>
                            <InputNumber
                                min={1}
                                max={MAX_PROPERTY_UNITS_COUNT_PER_FLOOR}
                                value={unitsOnFloor}
                                onChange={setUnitsOnFloor}
                                style={INPUT_STYLE}
                                type='number'
                                data-cy='property-map__add-section-form__units-on-floor'
                            />
                        </Space>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Button
                    block
                    key='submit'
                    onClick={handleFinish}
                    type='primary'
                    disabled={isSubmitDisabled}
                    data-cy='property-map__section-form__submit-button'
                >
                    {AddLabel}
                </Button>
            </Col>
        </Row>
    )
}


const DEBOUNCE_TIME = 300

type HasChangeValueType = {
    floorCount: number
    minFloor: number
    unitsOnFloor: number
}

const getSectionsKey = (sections): string => {
    return sections.map(s => s.id).sort().join('-')
}

const EditSectionForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const NamePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name.placeholder' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const RenameNextSectionsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextSections' })
    const RenameNextParkingsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextParking' })
    const MinFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.minfloor' })
    const FloorCountLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.floorCount' })
    const UnitsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.unitsOnFloor' })
    const ShowMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.showMinFloor' })
    const HideMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.hideMinFloor' })
    const RenameNextUnitsTooltip = intl.formatMessage({ id: 'pages.condo.property.modal.sections.RenameNextUnits.tooltip' })
    const RenameNextSectionsTooltip = intl.formatMessage({ id: 'pages.condo.property.modal.sections.RenameNextSections.tooltip' })
    const RenameNextUnitsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextUnits' })
    const initialSections = builder.sections
    const sections = builder.getSelectedSections()
    const section = sections?.[0]
    const canChangeName = sections.length < 2

    const SelectSectionsMessage = intl.formatMessage({ id: 'pages.condo.property.index.SelectSectionsLabel' }, {
        count: sections.length,
    })

    useEffect(() => {
        if (!section) {
            builder.editMode = null
            refresh()
        }
    }, [section, builder, refresh])

    const sectionIndex = useMemo(
        () => initialSections.findIndex(el => el.index === section?.index),
        [initialSections, section?.index]
    )

    const sectionMinFloor = useMemo(
        () => section && sectionIndex !== -1 ? builder.getSectionMinFloor(sectionIndex) : 1,
        [section, sectionIndex, builder]
    )

    const sectionMissingFloors = useMemo(
        () =>  builder.getSectionMissingFloorsCount(sectionIndex),
        [builder, sectionIndex]
    )

    console.log(sectionMissingFloors)
    console.log(section.floors.length)

    const sectionMaxUnitsPerFloor = useMemo(
        () => section ? builder.getMaxUnitsPerFloor(section.id) : 0,
        [section, builder]
    )

    const [name, setName] = useState<string>('')
    const renameNextSections = useRef(false)
    const renameNextUnits = useRef(false)
    const toggleRenameNextSections = useCallback((event) => { renameNextSections.current = event.target.checked }, [])
    const toggleRenameNextUnits = useCallback((event) => { renameNextUnits.current = event.target.checked }, [])
    const [minFloor, setMinFloor] = useState(sectionMinFloor)
    console.log('section.floors.length + sectionMissingFloors', section.floors.length + sectionMissingFloors)
    const [floorCount, setFloorCount] = useState(section ? section.floors.length + sectionMissingFloors : 0)
    const [unitsOnFloor, setUnitsOnFloor] = useState<number>(sectionMaxUnitsPerFloor)
    const [minFloorHidden, setMinFloorHidden] = useState<boolean>(true)
    const [hasChanges, setHasChanges] = useState<{ [key: string]: HasChangeValueType }>({})

    const oldSectionsIds = useRef(null)

    useEffect(() => {
        setName(section && sections.length === 1 ? section.name : '')
    }, [section, sections.length])

    const setNameValue = useCallback((value) => setName(value ? value.toString() : ''), [])

    const deleteSection = useCallback(() => {
        sections.forEach(section => {
            builder.removeSection(section.id, renameNextSections.current)
        })
        refresh()
    }, [builder, refresh, sections])

    const debouncedSetMinFloor = useCallback(debounce((value) => {
        setMinFloor(value)
        const key = getSectionsKey(sections)
        const newHasChanges = { ...hasChanges }
        newHasChanges[key] = { ...newHasChanges[key], minFloor: value }
        setHasChanges(newHasChanges)

    }, DEBOUNCE_TIME), [sections, hasChanges])

    const debouncedSetFloorCount = useCallback(debounce((value) => {
        setFloorCount(value)
        const key = getSectionsKey(sections)
        const newHasChanges = { ...hasChanges }
        newHasChanges[key] = { ...newHasChanges[key], floorCount: value }
        setHasChanges(newHasChanges)

    }, DEBOUNCE_TIME), [hasChanges, sections])

    const debouncedSetUnitsOnFloor = useCallback(debounce((value) => {
        setUnitsOnFloor(value)
        const key = getSectionsKey(sections)
        const newHasChanges = { ...hasChanges }
        newHasChanges[key] = { ...newHasChanges[key], unitsOnFloor: value }
        setHasChanges(newHasChanges)

    }, DEBOUNCE_TIME), [hasChanges, sections])

    const toggleMinFloorVisible = useCallback(() => {
        if (!minFloorHidden) {
            setMinFloor(1)
        }
        setMinFloorHidden(!minFloorHidden)
    }, [minFloorHidden])

    const minFloorMargin = minFloorHidden ? '-20px' : 0

    const resetForm = useCallback(() => {
        setMinFloor(1)
        setFloorCount(null)
        setUnitsOnFloor(null)
        setMinFloorHidden(true)
        setName(section?.name || '')
    }, [section?.name])

    useEffect(() => {
        const key = getSectionsKey(sections)

        const isMinFloorChanged = hasChanges[key]?.minFloor !== undefined
        const isFloorCountChanged = hasChanges[key]?.floorCount !== undefined
        const isUnitsOnFloorChanged = hasChanges[key]?.unitsOnFloor !== undefined

        const changesKeys = Object.keys(hasChanges)
        const lastChangesKey = changesKeys[changesKeys.length - 1]

        if (oldSectionsIds.current && JSON.stringify(changesKeys) === JSON.stringify(oldSectionsIds.current)) return

        if (isMinFloorChanged) {
            setMinFloor(hasChanges[key].minFloor)
        } else if (sections.length === 1) {
            setMinFloor(sectionMinFloor)
        } else {
            debouncedSetMinFloor(hasChanges[lastChangesKey]?.minFloor !== undefined ? hasChanges[lastChangesKey].minFloor : null)
        }

        if (isFloorCountChanged) {
            setFloorCount(hasChanges[key].floorCount)
        } else if (sections.length === 1) {
            setFloorCount(section ? section.floors.length + sectionMissingFloors : 0)
        } else {
            debouncedSetFloorCount(hasChanges[lastChangesKey]?.floorCount !== undefined ? hasChanges[lastChangesKey].floorCount : null)
        }

        if (isUnitsOnFloorChanged) {
            setUnitsOnFloor(hasChanges[key].unitsOnFloor)
        } else if (sections.length === 1) {
            setUnitsOnFloor(sectionMaxUnitsPerFloor)
        } else {
            debouncedSetUnitsOnFloor(hasChanges[lastChangesKey]?.unitsOnFloor !== undefined ? hasChanges[lastChangesKey].unitsOnFloor : null)
        }
    }, [sections, hasChanges, sectionMinFloor, section, sectionMissingFloors, sectionMaxUnitsPerFloor, debouncedSetMinFloor, debouncedSetFloorCount, debouncedSetUnitsOnFloor])

    useEffect(() => {
        const sectionsIds = sections.map(section => section.id)

        if (oldSectionsIds.current && JSON.stringify(sectionsIds) === JSON.stringify(oldSectionsIds.current)) return

        if (oldSectionsIds.current?.length !== sectionsIds.length) {
            const oldIds = oldSectionsIds.current || []
            const removedIds = oldIds.filter(id => !sectionsIds.includes(id))

            if (removedIds.length > 0) {
                const newHasChanges = { ...hasChanges }
                removedIds.forEach(id => {
                    delete newHasChanges[id]
                })
                setHasChanges(newHasChanges)
            }

            if (sections.length > 1 ) {
                setFloorCount(null)
                setUnitsOnFloor(null)
                setMinFloor(null)
            } else {
                setMinFloor(prev => prev || sectionMinFloor)
                setFloorCount(prev => prev || section ? section.floors.length + sectionMissingFloors : 1)
                setUnitsOnFloor(prev => prev || sectionMaxUnitsPerFloor)
            }
        }

        oldSectionsIds.current = sectionsIds
    }, [section, sectionMaxUnitsPerFloor, sectionMinFloor, sections, hasChanges, sectionMissingFloors])

    useEffect(() => {
        sections.forEach(section => {
            const sectionIndex = initialSections.findIndex(el => el.index === section?.index)
            const sectionMinFloor = builder.getSectionMinFloor(sectionIndex)
            const sectionMaxUnitsPerFloor = builder.getMaxUnitsPerFloor(section.id)

            const currentChangesKey = getSectionsKey(sections)
            const changesKeys = Object.keys(hasChanges)
            const lastChangesKey = changesKeys[changesKeys.length - 1]

            const minFloorChange = hasChanges[currentChangesKey]?.minFloor || hasChanges[lastChangesKey]?.minFloor
            const floorCountChange = hasChanges[currentChangesKey]?.floorCount || hasChanges[lastChangesKey]?.floorCount
            const unitsOnFloorChange = hasChanges[currentChangesKey]?.unitsOnFloor || hasChanges[lastChangesKey]?.unitsOnFloor

            const newMinFloor = minFloorChange !== undefined  && minFloorChange !== null ? minFloorChange : sectionMinFloor
            const misingFloors = builder.getSectionMissingFloorsCount(sectionIndex)

            const newMaxFloor = floorCountChange !== undefined && floorCountChange !== null ?
                floorCountChange - 1  + newMinFloor
                : section.floors.length + misingFloors - 1 + newMinFloor

            const newUnitsOnFloor = unitsOnFloorChange !== undefined && unitsOnFloorChange !== null ? unitsOnFloorChange : sectionMaxUnitsPerFloor

            builder.updatePreviewSection({
                ...section, 
                name,
                minFloor: newMinFloor,
                maxFloor: newMaxFloor,
                unitsOnFloor: newUnitsOnFloor,
            })
        })
    }, [builder, name, minFloor, unitsOnFloor, floorCount, canChangeName, sections, initialSections, hasChanges])

    const updateSection = useCallback(() => {
        sections.forEach(section => {
            builder.restoreSection(section.id)
        })

        sections.map(section => {
            const sectionIndex = initialSections.findIndex(el => el.index === section?.index)
            const sectionMinFloor = builder.getSectionMinFloor(sectionIndex)
            const sectionMaxUnitsPerFloor = builder.getMaxUnitsPerFloor(section.id)

            const currentChangesKey = getSectionsKey(sections)
            const changesKeys = Object.keys(hasChanges)
            const lastChangesKey = changesKeys[changesKeys.length - 1]

            const minFloorChange = hasChanges[currentChangesKey]?.minFloor || hasChanges[lastChangesKey]?.minFloor
            const floorCountChange = hasChanges[currentChangesKey]?.floorCount || hasChanges[lastChangesKey]?.floorCount
            const unitsOnFloorChange = hasChanges[currentChangesKey]?.unitsOnFloor || hasChanges[lastChangesKey]?.unitsOnFloor

            const newMinFloor = minFloorChange !== undefined  && minFloorChange !== null ? minFloorChange : sectionMinFloor
            const misingFloors = builder.getSectionMissingFloorsCount(sectionIndex)

            const newMaxFloor = floorCountChange !== undefined && floorCountChange !== null ?
                floorCountChange - 1 + newMinFloor
                : section.floors.length + misingFloors - 1 + newMinFloor

            const newUnitsOnFloor = unitsOnFloorChange !== undefined && unitsOnFloorChange !== null ? unitsOnFloorChange : sectionMaxUnitsPerFloor

            builder.updateSection({
                ...section,
                name,
                minFloor: newMinFloor,
                maxFloor: newMaxFloor,
                unitsOnFloor: newUnitsOnFloor,
            }, renameNextUnits.current, renameNextSections.current)}
        )

        refresh()
        resetForm()
    }, [sections, refresh, resetForm, builder, initialSections, name, hasChanges])

    const isSaveDisabled = useMemo(() => {
        if (isEmpty(section)) return true
        return !!(canChangeName && isEmpty(name))

    }, [section, canChangeName, name])

    useEffect(() => {
        return () => {
            debouncedSetMinFloor.cancel()
            debouncedSetFloorCount.cancel()
            debouncedSetUnitsOnFloor.cancel()
        }
    }, [debouncedSetMinFloor, debouncedSetFloorCount, debouncedSetUnitsOnFloor])

    return (
        <Row gutter={[0, 40]} data-cy='property-map__edit-section-form'>
            <Col span={24}>
                <Row gutter={MODAL_FORM_EDIT_GUTTER}>
                    {canChangeName && <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>{NameLabel}</Typography.Text>
                            <InputNumber
                                value={name}
                                min={1}
                                placeholder={NamePlaceholderLabel}
                                onChange={setNameValue}
                                style={INPUT_STYLE}
                            />
                        </Space>
                    </Col>}

                    {sections.length > 1 &&
                        <Col span={24}>
                            <Typography.Text>{SelectSectionsMessage}</Typography.Text>
                        </Col>
                    }

                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text type='secondary' size='medium'>{FloorCountLabel}</Typography.Text>
                            <InputNumber
                                value={floorCount}
                                onChange={(value) => debouncedSetFloorCount(value)}
                                min={1}
                                max={MAX_PROPERTY_FLOORS_COUNT}
                                style={INPUT_STYLE}
                                type='number'
                                data-cy='property-map__add-section-form__floor-count'
                            />
                        </Space>
                    </Col>
                    <Col span={24} style={{ marginTop: minFloorMargin }}>
                        <Space direction='vertical' size={8} width='100%'>
                            {
                                !minFloorHidden && (
                                    <>
                                        <Typography.Text type='secondary' size='medium'>{MinFloorLabel}</Typography.Text>
                                        <InputNumber
                                            value={minFloor}
                                            onChange={(value) => debouncedSetMinFloor(value)}
                                            style={INPUT_STYLE}
                                            type='number'
                                        />
                                    </>
                                )
                            }
                            <Typography.Text onClick={toggleMinFloorVisible} size='medium'>
                                <Space size={8} width='100%'>
                                    {
                                        minFloorHidden ? (
                                            <>
                                                {ShowMinFloor}
                                                <ChevronDown size='medium' />
                                            </>
                                        ) : (
                                            <>
                                                {HideMinFloor}
                                                <ChevronUp size='medium' />
                                            </>
                                        )
                                    }
                                </Space>
                            </Typography.Text>
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>
                                {UnitsOnFloorLabel}
                            </Typography.Text>
                            <InputNumber
                                min={1}
                                max={MAX_PROPERTY_UNITS_COUNT_PER_FLOOR}
                                value={unitsOnFloor}
                                onChange={(value) => debouncedSetUnitsOnFloor(value)}
                                style={INPUT_STYLE}
                                type='number'
                                data-cy='property-map__add-section-form__units-on-floor'
                            />
                        </Space>
                    </Col>

                    <Col span={24}>
                        <Checkbox onChange={toggleRenameNextUnits}>
                            <Space size={8}>
                                {RenameNextUnitsLabel}
                                <Tooltip title={RenameNextUnitsTooltip}>
                                    <Typography.Text type='secondary'>
                                        <QuestionCircle size='small'/>
                                    </Typography.Text>
                                </Tooltip>
                            </Space>
                        </Checkbox>
                    </Col>

                    {canChangeName &&
                        <Col span={24}>
                            <Checkbox onChange={toggleRenameNextSections}>
                                <Space size={8}>
                                    {builder.viewMode === MapViewMode.parking ? RenameNextParkingsLabel : RenameNextSectionsLabel}
                                    <Tooltip title={RenameNextSectionsTooltip}>
                                        <Typography.Text type='secondary'>
                                            <QuestionCircle size='small'/>
                                        </Typography.Text>
                                    </Tooltip>
                                </Space>
                            </Checkbox>
                        </Col>
                    }
                </Row>
            </Col>
            <Col span={24}>
                <Row gutter={MODAL_FORM_BUTTON_GUTTER}>
                    <Col span={24}>
                        <Button
                            block
                            onClick={updateSection}
                            type='primary'
                            disabled={isSaveDisabled}
                            data-cy='property-map__update-section-button'
                        >
                            {SaveLabel}
                        </Button>
                    </Col>
                    <Col span={24}>
                        <Button
                            danger
                            block
                            onClick={deleteSection}
                            type='secondary'
                            icon={<Trash />}
                            data-cy='property-map__remove-section-button'
                        >
                            {DeleteLabel}
                        </Button>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}


export { AddSectionForm, EditSectionForm }
