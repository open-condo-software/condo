import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, InputNumber, Row } from 'antd'
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

const EditSectionForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh, setDuplicatedUnitIds }) => {
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

    const section = builder.getSelectedSection()
    const sectionIdRef = useRef<string | null>(null)

    const renameNextSections = useRef(false)
    const renameNextUnits = useRef(false)

    const [name, setName] = useState<string>('')
    const [minFloor, setMinFloor] = useState(1)
    const [floorCount, setFloorCount] = useState(0)
    const [unitsOnFloor, setUnitsOnFloor] = useState<number>(0)
    const [showMinFloor, setShowMinFloor] = useState(false)

    const sectionData = useMemo(() => {
        if (!section) return null

        const initialSections = builder.sections
        const sectionIndex = initialSections.findIndex(el => el.index === section.index)
        const sectionMinFloor = sectionIndex !== -1 ? builder.getSectionMinFloor(sectionIndex) : 1
        const sectionMissingFloors = builder.getSectionMissingFloorsCount(sectionIndex)
        const sectionMaxUnitsPerFloor = builder.getMaxUnitsPerFloor(section.id)

        return {
            sectionIndex,
            sectionMinFloor,
            sectionMissingFloors,
            sectionMaxUnitsPerFloor,
        }
    }, [builder, section])

    useEffect(() => {
        if (!section) {
            builder.editMode = null
            refresh()
            return
        }

        if (sectionIdRef.current !== section.id) {
            sectionIdRef.current = section.id
            renameNextSections.current = false
            renameNextUnits.current = false
            setShowMinFloor(false)
        }

        if (sectionData) {
            setName(section.name || '')
            setFloorCount(section.floors.length + sectionData.sectionMissingFloors)
            setUnitsOnFloor(sectionData.sectionMaxUnitsPerFloor)
            setMinFloor(sectionData.sectionMinFloor || 1)
        }
    }, [section, builder, refresh, sectionData])

    const updatePreview = useCallback(() => {
        if (!section) return

        setDuplicatedUnitIds([])

        builder.updatePreviewSection({
            id: section.id,
            minFloor: minFloor,
            maxFloor: floorCount + minFloor - 1,
            unitsOnFloor: unitsOnFloor,
        })
    }, [builder, section, minFloor, floorCount, unitsOnFloor, setDuplicatedUnitIds])

    useEffect(() => {
        const timeoutId = setTimeout(updatePreview, DEBOUNCE_TIME)
        return () => clearTimeout(timeoutId)
    }, [updatePreview])

    useEffect(() => {
        return () => {
            if (section) {
                builder.restoreSection(section.id)
            }
        }
    }, [builder, section])

    const setNameValue = useCallback((value) => setName(value ? value.toString() : ''), [])

    const toggleRenameNextSections = useCallback((event) => {
        renameNextSections.current = event.target.checked
    }, [])

    const toggleRenameNextUnits = useCallback((event) => {
        renameNextUnits.current = event.target.checked
    }, [])

    const deleteSection = useCallback(() => {
        if (section) {
            builder.removeSection(section.id, renameNextSections.current)
        }
        refresh()
    }, [builder, refresh, section])

    const toggleMinFloorVisible = useCallback(() => {
        setShowMinFloor(prev => !prev)
    }, [])

    const handleFinish = useCallback(() => {
        if (!section) return

        const validateResult = builder.getNonUniquePreviewUnitIds()

        if (validateResult.nonUniqueUnitIds.length > 0 && (!renameNextUnits.current || validateResult.nonUniqueIdBeforeCurrentSection)) {
            setDuplicatedUnitIds(validateResult.nonUniqueUnitIds)
            return
        }

        builder.restoreSection(section.id)

        const maxFloor = floorCount + minFloor - 1

        builder.updateSection({
            id: section.id,
            name: name,
            minFloor,
            maxFloor,
            unitsOnFloor,
        }, renameNextUnits.current, renameNextSections.current)

        setDuplicatedUnitIds([])

        refresh()
    }, [builder, name, section, refresh, floorCount, minFloor, unitsOnFloor, setDuplicatedUnitIds])

    if (!section) return null

    const minFloorMargin = showMinFloor ? 0 : '-20px'

    return (
        <Row gutter={[0, 40]} data-cy='property-map__edit-section-form'>
            <Col span={24}>
                <Row gutter={MODAL_FORM_EDIT_GUTTER}>
                    <Col span={24}>
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
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text type='secondary' size='medium'>{FloorCountLabel}</Typography.Text>
                            <InputNumber
                                value={floorCount}
                                onChange={value => setFloorCount(value)}
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
                            {showMinFloor && (
                                <>
                                    <Typography.Text type='secondary' size='medium'>{MinFloorLabel}</Typography.Text>
                                    <InputNumber
                                        value={minFloor}
                                        onChange={value => setMinFloor(value)}
                                        style={INPUT_STYLE}
                                        type='number'
                                    />
                                </>
                            )}
                            <Typography.Text onClick={toggleMinFloorVisible} size='medium'>
                                <Space size={8} width='100%'>
                                    {showMinFloor ? (
                                        <>
                                            {HideMinFloor}
                                            <ChevronUp size='medium' />
                                        </>
                                    ) : (
                                        <>
                                            {ShowMinFloor}
                                            <ChevronDown size='medium' />
                                        </>
                                    )}
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
                                onChange={value => setUnitsOnFloor(value)}
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
                </Row>
            </Col>
            <Col span={24}>
                <Row gutter={MODAL_FORM_BUTTON_GUTTER}>
                    <Col span={24}>
                        <Button
                            block
                            key='submit'
                            onClick={handleFinish}
                            type='primary'
                            disabled={isEmpty(name) || floorCount === null || unitsOnFloor === null || minFloor === null}
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
