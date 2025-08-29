import {
    BuildingFloor,
    BuildingFloorType,
    BuildingMap,
    BuildingMapEntityType,
    BuildingMapType,
    BuildingSection,
    BuildingSectionType,
    BuildingUnit,
    BuildingUnitSubType,
    BuildingUnitType,
} from '@app/condo/schema'
import Ajv from 'ajv'
import cloneDeep from 'lodash/cloneDeep'
import compact from 'lodash/compact'
import find from 'lodash/find'
import get from 'lodash/get'
import has from 'lodash/has'
import invert from 'lodash/invert'
import isEmpty from 'lodash/isEmpty'
import isObjectEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import isNull from 'lodash/isNull'
import last from 'lodash/last'
import uniq from 'lodash/uniq'

import { PARKING_UNIT_TYPES, SECTION_UNIT_TYPES } from '@condo/domains/property/constants/common'
import { buildingEmptyMapJson } from '@condo/domains/property/constants/property'
import { NUMERIC_REGEXP } from '@condo/domains/property/constants/regexps'
import { getUniqUnits, getUnitsFromSections } from '@condo/domains/property/utils/helpers'

import MapSchemaJSON from './MapJsonSchema.json'


const ajv = new Ajv()
const validator = ajv.compile(MapSchemaJSON)

type Maybe<T> = T | null

export type BuildingSectionArg =  BuildingSection & {
    minFloor?: number
    maxFloor?: number
    unitsOnFloor?: number
    name?: string
    hasChanges?: boolean
}

export type BuildingUnitArg = BuildingUnit & {
    name?: string
    floor?: string
    section?: string
    parking?: string
    sectionIndex?: number
    unitType?: BuildingUnitSubType
}

export type BuildingFloorArg = Omit<BuildingFloor, 'id' | 'type' | '__typename' | 'units' | 'name'> & {
    section: number
    unitCount: number
    startUnitIndex?: number
    unitType?: BuildingUnitSubType
}

type BuildingSelectOption = {
    id: string
    label: string
}

type IndexLocation = {
    section: number
    floor: number
    unit: number
}

export enum MapViewMode {
    'section',
    'parking',
}

export enum MapEditMode {
    AddSection = 'addSection',
    EditSection = 'editSection',
    AddParking = 'addParking',
    EditParking = 'editParking',
    AddUnit = 'addUnit',
    EditUnit = 'editUnit',
    EditUnits = 'editUnits',
    AddParkingUnit = 'addParkingUnit',
    AddParkingFacilityUnit = 'addParkingFacilityUnit',
    EditParkingUnit = 'editParkingUnit',
    EditParkingUnits = 'editParkingUnits',
    EditParkingFacilityUnit = 'editParkingFacilityUnit',
    AddSectionFloor = 'addSectionFloor',
    AddParkingFloor = 'addParkingFloor',
}


// TODO(DOMA-1755): refactor the data structure in such a way that changes in one element occur independently of other elements
class Map {
    public isMapValid: boolean
    public validationErrors: null | string[]

    protected autoincrement: number

    constructor (public map: Maybe<BuildingMap>) {
        this.map = map ? cloneDeep(map) : cloneDeep(buildingEmptyMapJson) as BuildingMap
        this.autoincrement = 0
        this.isMapValid = this.validate()
        if (!this.isMapValid) {
            this.repairMapStructure()
            this.isMapValid = this.validate()
        }
        this.setAutoincrement()
    }

    get sectionIds (): string[] {
        return this.map.sections.map(section => section.id)
    }

    get floorIds (): string[] {
        return this.map.sections
            .map(section => section.floors
                .map(floor => floor.id))
            .flat()
    }

    get unitIds (): string[] {
        return this.map.sections
            .map(section => section.floors
                .map(floor => floor.units
                    .map(unit => unit.id)))
            .flat(2)
    }

    public getMap (): BuildingMap {
        return this.map
    }

    public validateSchema (): boolean {
        // TODO(zuch): check if json schema can validate unique id field
        this.validationErrors = null
        const check = validator(this.map)
        if (!check){
            this.validationErrors = validator.errors.map(err => JSON.stringify(err, null, 2))
            return false
        }
        return true
    }

    public validate (): boolean {
        return this.validateSchema() && this.validateUniqueIds() && this.validateUniqueUnits()
    }

    public validateUniqueIds (): boolean {
        const ids = this.sectionIds.concat(this.floorIds).concat(this.unitIds)
        const uniqArray = uniq(compact(ids))
        if (ids.length !== uniqArray.length){
            this.validationErrors = ['ID field must be unique']
            return false
        }
        return true
    }
    public validateUniqueUnits (): boolean {
        const units = [
            ...getUnitsFromSections(this.map.sections),
            ...getUnitsFromSections(this.map.parking),
        ]
        const notUniqUnitLabels = units.length !== getUniqUnits(units).length
        if (notUniqUnitLabels) {
            this.validationErrors = ['Name of unit label must be unique']
            return false
        }
        return true
    }

    private setAutoincrement () {
        const getSectionUnitIds = mapSection => mapSection.map(section => section.floors
            .map(floor => floor.units.map(unit => !isNaN(Number(unit.id)) ? Number(unit.id) : 0)))
            .flat(2)
        this.autoincrement = Math.max(0, ...getSectionUnitIds(this.map.sections), ...getSectionUnitIds(this.map.parking)) + 1
    }

    private repairMapStructure (): void {
        this.autoincrement = 0
        if (!has(this.map, 'dv')) {
            this.map.dv = 1
        }
        if (!has(this.map, 'type')) {
            this.map.type = BuildingMapType.Building
        }
        this.map.sections.forEach((section, sectionIndex) => {
            section.type = BuildingSectionType.Section
            section.id = String(++this.autoincrement)
            section.index = sectionIndex
            if (has(section, 'preview')) {
                delete section.preview
            }
            if (!has(section, 'name')) {
                section.name = String(section.index)
            }
            section.floors.forEach((floor, floorIndex) => {
                floor.type = BuildingFloorType.Floor
                floor.id = String(++this.autoincrement)
                if (!has(floor, 'index')) {
                    floor.index = floorIndex
                }
                if (!has(floor, 'name')) {
                    floor.name = String(floorIndex)
                }
                floor.units.forEach(unit => {
                    unit.type = BuildingUnitType.Unit
                    if (!has(unit, 'unitType') || isNil(unit.unitType)) {
                        unit.unitType = BuildingUnitSubType.Flat
                    }
                    unit.id = String(++this.autoincrement)
                    if (has(unit, 'preview')) {
                        delete unit.preview
                    }
                    if (has(unit, 'name') && unit.name === null) {
                        delete unit.name
                    }
                    if (!has(unit, 'label')) {
                        unit.label = has(unit, 'name') ? unit.name : ''
                    }
                })
            })
        })

        if (isNil(this.map.parking)) {
            this.map.parking = []
        }
        this.map.parking.forEach((parkingSection, parkingSectionIndex) => {
            parkingSection.type = BuildingSectionType.Section
            parkingSection.id = String(++this.autoincrement)
            parkingSection.index = parkingSectionIndex

            if (has(parkingSection, 'preview')) delete parkingSection.preview
            if (!has(parkingSection, 'name')) {
                parkingSection.name = String(parkingSectionIndex)
            }

            parkingSection.floors.forEach((floor, floorIndex) => {
                floor.type = BuildingFloorType.Floor
                floor.id = String(++this.autoincrement)

                if (!has(floor, 'index')) {
                    floor.index = floorIndex
                }
                if (!has(floor, 'name')) {
                    floor.name = String(floorIndex)
                }

                floor.units.forEach(unit => {
                    unit.type = BuildingUnitType.Unit
                    unit.unitType = BuildingUnitSubType.Parking
                    unit.id = String(++this.autoincrement)
                    if (has(unit, 'preview')) {
                        delete unit.preview
                    }
                    if (has(unit, 'name') && unit.name === null) {
                        delete unit.name
                    }
                    if (!has(unit, 'label')) {
                        unit.label = has(unit, 'name') ? unit.name : ''
                    }
                })
            })
        })
    }
}


class MapView extends Map {
    constructor (map: Maybe<BuildingMap>) {
        super(map)
        if (!this.isMapValid) {
            console.log('Invalid JSON for property:map', this.validationErrors)
        }

        if (this.isEmptySections && !this.isEmptyParking) {
            this.viewMode = MapViewMode.parking
        }
    }

    public viewMode: MapViewMode = MapViewMode.section
    // view or hide sections
    public visibleSections: string | null = null

    public getMaxUnitsPerFloor (sectionId: string): number | null {
        const section = this.sections.find(s => s.id === sectionId)
        if (!section || section.floors.length === 0) return 0

        const firstFloorUnitsCount = section.floors[0].units.length

        const allFloorsHaveSameUnits = section.floors.every(
            floor => floor.units.length === firstFloorUnitsCount
        )

        return allFloorsHaveSameUnits ? firstFloorUnitsCount : null
    }
    
    public getSectionMaxFloor (sectionIdx: number): number {
        return Math.max(...this.sections[sectionIdx].floors.map(floor => floor.index))
    }

    public getSectionMinFloor (sectionIdx: number): number {
        return Math.min(...this.sections[sectionIdx].floors.map(floor => floor.index))
    }

    get maxFloor (): number {
        return Math.max(...this.sections
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        )
    }

    get minFloor (): number {
        return Math.min(...this.sections
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        )
    }

    get possibleFloors (): number[] {
        const floors = []
        for (let floorIndex = this.minFloor; floorIndex <= this.maxFloor; floorIndex++) {
            if (floorIndex !== 0) {
                floors.unshift(floorIndex)
            }
        }
        return floors
    }

    get possibleChosenFloors (): number[] {
        const allIndexes = this.sections
            .filter(section => this.visibleSections === null || this.visibleSections === section.id)
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        return [...new Set(allIndexes)].sort((a, b) => (b - a))
    }

    get isEmptyCurrentModeSections (): boolean {
        return isObjectEmpty(this.sections)
    }

    get isEmptySections (): boolean {
        return isObjectEmpty(this.map.sections)
    }

    get isEmptyParking (): boolean {
        return isObjectEmpty(this.map.parking)
    }

    get isEmpty (): boolean {
        return this.isEmptySections && this.isEmptyParking
    }

    public setVisibleSections (id: string | null): void {
        this.visibleSections = id
    }

    public isSectionVisible (id: string | null): boolean {
        return this.visibleSections === null || this.visibleSections === id
    }

    get sections (): BuildingSection[] {
        if (this.viewMode === MapViewMode.section) {
            return this.map.sections
        } else if (this.viewMode === MapViewMode.parking) {
            return this.map.parking
        }

        return []
    }

    get defaultUnitType (): BuildingUnitSubType {
        if (this.viewMode === MapViewMode.section) {
            return BuildingUnitSubType.Flat
        } else if (this.viewMode === MapViewMode.parking) {
            return BuildingUnitSubType.Parking
        }

        return BuildingUnitSubType.Flat
    }

    get availableUnitTypes (): BuildingUnitSubType[] {
        if (this.viewMode === MapViewMode.section) {
            return SECTION_UNIT_TYPES as BuildingUnitSubType[]
        } else if (this.viewMode === MapViewMode.parking) {
            return PARKING_UNIT_TYPES as BuildingUnitSubType[]
        }

        return SECTION_UNIT_TYPES as BuildingUnitSubType[]
    }

    get lastSectionIndex (): number {
        return Math.max(...this.sections.map(section => section.index))
    }

    public getUnitInfo (id: string): BuildingUnitArg {
        const newUnit: BuildingUnitArg = {
            id: '',
            label: '',
            floor: '',
            section: '',
            type: BuildingUnitType.Unit,
            unitType: this.defaultUnitType,
        }
        if (!id) {
            return newUnit
        }
        const unitIndex = this.getUnitIndex(id)
        if (unitIndex.unit === -1) {
            return newUnit
        }
        const {
            label,
            type,
            unitType,
        } = this.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit]

        return {
            id,
            label,
            type,
            section: this.sections[unitIndex.section].id,
            sectionIndex: this.sections[unitIndex.section].index,
            floor: this.sections[unitIndex.section].floors[unitIndex.floor].id,
            unitType,
        }
    }

    public getSectionOptions (): BuildingSelectOption[] {
        return this.sections.map(section => ({ id: section.id, label: section.name }))
    }

    public getSectionFloorOptions (id: string): BuildingSelectOption[] {
        const foundSection = this.sections.find(section => section.id === id)
        if (!foundSection) {
            return []
        }
        return foundSection.floors.map(floor => ({ id: floor.id, label: floor.name }))
    }

    public getUnitTypeOptions (): BuildingUnitSubType[] {
        return [
            ...new Set(this.sections.map(
                section => section.floors.map(
                    floor => floor.units
                        .map(unit => unit.unitType)
                        .filter(unitType => unitType && unitType !== this.defaultUnitType)
                )
            ).flat(2)
            ),
        ].sort((a, b) => a.localeCompare(b))
    }

    protected getUnitIndex (unitId: string): IndexLocation {
        const result = { section: -1, floor: -1, unit: -1 }
        this.sections.forEach((section, sectionIdx) => {
            section.floors.forEach((floor, floorIdx) => {
                const unitIdx = floor.units.findIndex(unit => unit.id === unitId)
                if (unitIdx !== -1) {
                    result.section = sectionIdx
                    result.floor = floorIdx
                    result.unit = unitIdx
                }
            })
        })
        return result
    }

    protected restoreViewMode (): void {
        if (!this.isEmptySections && !this.isEmptyParking) return
        if (this.isEmptySections && !this.isEmptyParking) {
            this.viewMode = MapViewMode.parking
        } else {
            this.viewMode = MapViewMode.section
        }
    }
}


class MapEdit extends MapView {
    private _previewSectionId: string | null = null
    private _previewSectionFloor: number | null = null
    private _previewUnitId: string | null = null
    private _duplicatedUnits: string[] | null = []
    private selectedSection: BuildingSection | null = null
    private selectedFloorSectionIndex: number | null = null
    private sectionFloorMap: Record<number, number> = {}
    private selectedUnits: BuildingUnit[] = []
    private sectionBackups: Record<string, BuildingSection> = {}
    private mode = null

    constructor (map: Maybe<BuildingMap>, private updateMap?: Maybe<(map: BuildingMap) => void>) {
        super(map)
    }

    get previewUnitId (): string | null {
        return this._previewUnitId
    }
    get duplicatedUnits (): string[] | null {
        return this._duplicatedUnits
    }
    get nextUnitNumber (): number {
        return Math.max(0, ...this.sections
            .map(section => section.floors
                .map(floor => floor.units
                    .map(unit => !isNaN(Number(unit.label)) ? Number(unit.label) : 0)))
            .flat(2)) + 1
    }
    get nextSectionName (): string {
        if (this.isEmptyCurrentModeSections) return '1'
        if (!this.isEmptyCurrentModeSections && this.sections.filter(section => !section.preview).length === 0) return '1'

        const maxSectionNumber = Math.max(...this.sections
            .filter(section => !section.preview)
            .map(section => Number(section.name)))
        return String(maxSectionNumber + 1)
    }

    get editMode (): MapEditMode | null {
        return this.mode
    }

    set editMode (mode: string | null) {
        switch (mode) {
            case 'addSection':
            case 'addParking':
                this.restoreSections()
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedUnits = []
                break
            case 'editSection':
            case 'editParking':
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedUnits = []
                break
            case 'addUnit':
            case 'addParkingUnit':
            case 'addParkingFacilityUnit':
                this.restoreSections()
                this.removePreviewSection()
                this.selectedUnits = []
                break
            case 'editUnit':
            case 'editUnits':
            case 'editParkingUnit':
            case 'editParkingUnits':
            case 'editParkingFacilityUnit':
                this.restoreSections()
                this.removePreviewUnit()
                this.removePreviewSection()
                break
            case 'addSectionFloor':
            case 'addParkingFloor':
                this.removePreviewSectionFloor()
                break
            default:
                this.selectedUnits = []
                this.restoreSections()
                this.removePreviewUnit()
                this.removePreviewSection()
                this.removePreviewSectionFloor()
                this.restoreViewMode()
                this.mode = null
        }

        this.mode = mode
    }

    get hasPreviewComponents (): boolean {
        return !isNull(this._previewSectionId)
            || !isNull(this._previewUnitId)
            || !isNull(this._previewSectionFloor)
    }

    public validateInputUnitLabel (selectedUnit: BuildingUnit = null, newLabel = '', unitType: BuildingUnit['unitType']): boolean {
        const units = [...this.map.sections, ...this.map.parking]
            ?.map((section) => section.floors
                ?.map(floor => floor.units
                    ?.map(unit => unit)
                    .filter(unit => {
                        if (unit.preview) return
                        else if (unit.id !== selectedUnit?.id) return unit.label
                    }))
            ).flat(2)

        this._duplicatedUnits = []
        const notUniqSectionLabels = units && !isEmpty(units.filter(unit => {
            if (unit.label === newLabel && unit.unitType === unitType) {
                this._duplicatedUnits.push(unit.id)
                return unit
            }
        }))
        if (notUniqSectionLabels) {
            this.validationErrors = ['Name of unit label must be unique']
            return false
        }
        return true
    }

    public setSelectedSection (section: BuildingSection): void {
        const isAlreadySelected = this.selectedSection && this.selectedSection.id === section.id

        if (isAlreadySelected) {
            this.selectedSection = null
        } else {
            this.selectedSection = section
        }

        if (this.selectedSection) {
            this.editMode = this.viewMode === MapViewMode.section ? 'editSection' : 'editParking'
        } else {
            this.editMode = null
        }
    }

    public getSelectedSection (): BuildingSection | null {
        return this.selectedSection
    }

    public isSectionSelected (id: string): boolean {
        return this.selectedSection && this.selectedSection.id === id
    }

    public setSelectedUnit (unit: BuildingUnit): void {
        if (this.isUnitSelected(unit.id)) {
            this.selectedUnits = this.selectedUnits.filter(selectedUnit => selectedUnit.id !== unit.id)

            if (this.selectedUnits.length === 0) {
                return this.editMode = null
            }
        } else {
            this.selectedUnits.push(unit)
        }

        if (this.selectedUnits.length > 1) {
            if (this.viewMode === MapViewMode.section) {
                this.editMode = 'editUnits'
            } else if (this.viewMode === MapViewMode.parking) {
                this.editMode = 'editParkingUnits'
            }
            return
        }

        if (this.viewMode === MapViewMode.section) {
            this.editMode = 'editUnit'
        } else if (this.viewMode === MapViewMode.parking) {
            this.editMode = unit.unitType === BuildingUnitSubType.Parking ? 'editParkingUnit' : 'editParkingFacilityUnit'
        }
    }

    public getSelectedUnits (): BuildingUnitArg[] {
        if (!Array.isArray(this.selectedUnits)) {
            return []
        }

        return this.selectedUnits.map(unit => this.getUnitInfo(unit.id))
    }

    public isUnitSelected (id: string): boolean {
        return Array.isArray(this.selectedUnits) && !!this.selectedUnits.find(unit => unit.id === id)
    }

    public removePreviewSection (): void {
        if (this._previewSectionId) {
            const sectionPreviewIndex = this.sections.findIndex(mapSection => mapSection.id === this._previewSectionId)
            this.sections.splice(sectionPreviewIndex, 1)
            this._previewSectionId = null
            this.notifyUpdater()
        }
    }

    public removePreviewUnit (renameNextUnits = true): void {
        if (this._previewUnitId) {
            this.removeUnit(this._previewUnitId, renameNextUnits)
            this._previewUnitId = null
        }
    }

    public removePreviewSectionFloor (): void {
        if (this.selectedFloorSectionIndex !== null && this._previewSectionFloor !== null) {
            this.removeFloor(this.selectedFloorSectionIndex, this._previewSectionFloor)

            this.selectedFloorSectionIndex = null
            this._previewSectionFloor = null
            this.sectionFloorMap = {}
        }
    }

    public addPreviewSection (section: Partial<BuildingSectionArg>, unitType: BuildingUnitSubType = this.defaultUnitType): void {
        this.removePreviewSection()
        const newSection = this.generateSection(section, unitType)
        newSection.preview = true
        newSection.floors.forEach(floor => floor.units.map(unit => {
            unit.preview = true
            return unit
        }))
        this._previewSectionId = newSection.id
        this.sections.push(newSection)
        this.notifyUpdater()
    }

    public addSection (section: Partial<BuildingSectionArg>, unitType: BuildingUnitSubType = this.defaultUnitType): void {
        const newSection = this.generateSection(section, unitType)
        this.sections.push(newSection)
        this.removePreviewUnit()
        this.selectedUnits = []
        this.selectedSection = null
        this.mode = null
        this.notifyUpdater()
    }

    public addPreviewSectionFloor (floor: BuildingFloorArg): void {
        this.removePreviewSectionFloor()
        this.selectedFloorSectionIndex = floor.section
        const newSectionFloor = this.generateFloor(floor, true)
        this.insertFloor(newSectionFloor, floor.section)
    }

    public getNonUniquePreviewUnitIds () {
        const result = {
            nonUniqueUnitIds: [],
            nonUniqueIdBeforeCurrentSection: false,
        }

        if (!this.selectedSection) return result

        const selectedPreviewUnitLabels = new Set<string>()

        for (const floor of this.selectedSection.floors) {
            for (const unit of floor.units) {
                selectedPreviewUnitLabels.add(unit.label)
            }
        }

        if (selectedPreviewUnitLabels.size === 0) return result

        for (const section of this.sections) {
            if (section.id === this.selectedSection.id) continue

            for (const floor of section.floors) {
                for (const unit of floor.units) {
                    if (selectedPreviewUnitLabels.has(unit.label)) {
                        result.nonUniqueUnitIds.push(unit.id)
                        selectedPreviewUnitLabels.delete(unit.label)

                        if (section.index < this.selectedSection.index) {
                            result.nonUniqueIdBeforeCurrentSection = true
                        }

                        if (selectedPreviewUnitLabels.size === 0) {
                            return result
                        }
                    }
                }
            }
        }

        return result
    }

    public addSectionFloor (floor: BuildingFloorArg, renameNextUnits = true): void {
        this.removePreviewSectionFloor()
        const newSectionFloor = this.generateFloor(floor)
        const floorIndex = this.insertFloor(newSectionFloor, floor.section)

        let nextFloorIndex = floorIndex
        if (floorIndex < this.sections[floor.section].floors.length - 1) {
            nextFloorIndex++
        }

        if (renameNextUnits && floor.section === 0 && floor.index === 1) {
            const hasNegativeFloors = Object.keys(this.sectionFloorMap).some(floorLabel => Number(floorLabel) < 0)
            const updateIndex = hasNegativeFloors ? floorIndex : nextFloorIndex
            this.updateUnitNumbers(this.sections[0].floors[updateIndex].units[0])
            return
        }

        const previousUnit = last(this.sections[floor.section].floors[nextFloorIndex].units)
        if (renameNextUnits && previousUnit && Number(get(invert(this.sectionFloorMap), floorIndex, -1)) > 0) {
            this.updateUnitNumbers(previousUnit)
        }

        this._previewSectionFloor = null
        this.notifyUpdater()
    }

    public addPreviewCopySection (sectionId: string): void {
        this.removePreviewSection()
        const newSection = cloneDeep(find(this.sections, section => section.id === sectionId))
        newSection.preview = true

        newSection.id = String(++this.autoincrement)
        newSection.index = this.sections.length + 1
        newSection.name = this.nextSectionName

        let unitNumber = this.nextUnitNumber
        newSection.floors.reduceRight((_, floor) => {
            floor.id = String(++this.autoincrement)

            floor.units.forEach((unit) => {
                unit.id = String(++this.autoincrement)
                unit.label = String(unitNumber)
                unit.preview = true
                unitNumber++
            })
            return floor
        }, newSection.floors[0])

        this._previewSectionId = newSection.id
        this.sections.push(newSection)
        this.notifyUpdater()
    }

    public addCopySection (sectionId: string): void {
        const newSection = cloneDeep(find(this.sections, section => section.id === sectionId))

        newSection.id = String(++this.autoincrement)
        newSection.index = this.sections.length + 1
        newSection.name = this.nextSectionName

        let unitNumber = this.nextUnitNumber
        newSection.floors.reduceRight((_, floor) => {
            floor.id = String(++this.autoincrement)

            floor.units.forEach((unit) => {
                unit.id = String(++this.autoincrement)
                unit.label = String(unitNumber)
                unitNumber++
            })
            return floor
        }, newSection.floors[0])

        this.sections.push(newSection)
        this.notifyUpdater()
    }

    public backupSection (sectionId: string): void {
        if (this.sectionBackups[sectionId]) return

        const section = this.sections.find(s => s.id === sectionId)
        if (!section) return

        this.sectionBackups[sectionId] = cloneDeep(section)
    }

    public updatePreviewSection (sectionUpdate: Partial<BuildingSectionArg>): void {
        const sectionId = sectionUpdate.id
        if (!sectionId) return

        if (!this.sectionBackups[sectionId]) {
            this.backupSection(sectionId)
        }

        if (sectionUpdate.maxFloor < sectionUpdate.minFloor) {
            return
        }
        const sectionIndex = this.sections.findIndex(s => s.id === sectionId)
        if (sectionIndex === -1) return

        if (sectionUpdate.unitsOnFloor !== undefined && sectionUpdate.unitsOnFloor !== null) {
            this.updateUnitsPerFloor(sectionIndex, sectionUpdate.unitsOnFloor, true)
        }

        if (
            (sectionUpdate.minFloor !== undefined &&
                sectionUpdate.minFloor !== null &&
                Number.isFinite(sectionUpdate.minFloor)) ||
            (sectionUpdate.maxFloor !== undefined &&
                sectionUpdate.maxFloor !== null &&
                Number.isFinite(sectionUpdate.maxFloor))
        ) {
            this.updateFloorRange(
                sectionIndex,
                sectionUpdate.minFloor,
                sectionUpdate.maxFloor,
                sectionUpdate.unitsOnFloor,
                true
            )
        }

        this.notifyUpdater()
    }

    public restoreSection (sectionId: string): void {
        if (!this.sectionBackups[sectionId]) return

        const sectionIndex = this.sections.findIndex(s => s.id === sectionId)
        if (sectionIndex === -1) return

        this.sections[sectionIndex] = cloneDeep(this.sectionBackups[sectionId])

        delete this.sectionBackups[sectionId]

        this.notifyUpdater()
    }

    public restoreSections (): void {
        Object.keys(this.sectionBackups).forEach(sectionId => {
            const backup = this.sectionBackups[sectionId]
            const sectionIndex = this.sections.findIndex(s => s.id === sectionId)

            if (sectionIndex >= 0) {
                this.sections[sectionIndex] = cloneDeep(backup)
            }
        })

        this.selectedSection = null
        this.sectionBackups = {}
        this.notifyUpdater()
    }

    public updateSection (sectionUpdate: Partial<BuildingSectionArg>, renameNextUnits = true, renameNextSections = true): void {
        const sectionIndex = this.sections.findIndex(section => section.id === sectionUpdate.id)
        if (sectionIndex === -1) return

        if (sectionUpdate.maxFloor !== undefined && sectionUpdate.minFloor !== undefined &&
            sectionUpdate.maxFloor < sectionUpdate.minFloor) {
            return
        }

        const section = this.sections[sectionIndex]
        // Update section name if provided
        if (sectionUpdate.name) {
            section.name = sectionUpdate.name
            if (renameNextSections) {
                this.updateSectionNumbers(sectionIndex, renameNextSections)
            }
        }

        // Handle units per floor changes
        if (sectionUpdate.unitsOnFloor !== undefined) {
            this.updateUnitsPerFloor(sectionIndex, sectionUpdate.unitsOnFloor, false)
        }

        // Handle floor range changes (min/max floors)
        if (sectionUpdate.minFloor !== undefined || sectionUpdate.maxFloor !== undefined) {
            this.updateFloorRange(
                sectionIndex,
                sectionUpdate.minFloor,
                sectionUpdate.maxFloor,
                sectionUpdate.unitsOnFloor,
                false,
            )
        }

        if (renameNextUnits) {
            const floor = section.floors.sort((a, b) => b.index - a.index)
            const lastFloor = floor[floor.length - 1]
            const lastUnit = lastFloor.units[lastFloor.units.length - 1]

            if (lastUnit) this.updateUnitNumbers(lastUnit)
        }

        this.restoreSections()
        this.editMode = null
        this.notifyUpdater()
    }

    private updateUnitsPerFloor (sectionIndex: number, newUnitsPerFloor: number, preview?: boolean): void {
        const section = this.sections[sectionIndex]
        let lastUntouchedUnit: BuildingUnit | null = null

        for (const floor of section.floors) {
            const unitDifference = newUnitsPerFloor - floor.units.length
            if (unitDifference > 0) {
                if (floor.units.length > 0) {
                    const sortedUnits = [...floor.units].sort((a, b) => Number(a.label) - Number(b.label))
                    lastUntouchedUnit = sortedUnits[sortedUnits.length - 1]
                }
                this.addUnitsToFloor(floor, unitDifference, preview)
            } else if (unitDifference < 0) {
                if (floor.units.length > 0) {
                    const sortedUnits = [...floor.units].sort((a, b) => Number(a.label) - Number(b.label))
                    const unitsToKeep = sortedUnits.slice(0, sortedUnits.length + unitDifference)
                    if (unitsToKeep.length > 0) {
                        lastUntouchedUnit = unitsToKeep[unitsToKeep.length - 1]
                    }
                }
                this.removeUnitsFromFloor(floor, Math.abs(unitDifference))
            }
        }

        if (lastUntouchedUnit) {
            this.updateUnitNumbers(lastUntouchedUnit, this.sections[sectionIndex].index)
        }
    }

    private addUnitsToFloor (floor: BuildingFloor, count: number, preview?: boolean): void {
        let maxUnitLabel = 0
        if (floor.units.length > 0) {
            const numericLabels = floor.units.map(unit => Number(unit.label)).filter(label => !isNaN(label))
            maxUnitLabel = numericLabels.length > 0 ? Math.max(...numericLabels) : 0
        }

        const newUnits: BuildingUnit[] = []
        for (let i = 1; i <= count; i++) {
            newUnits.push({
                id: String(++this.autoincrement),
                label: String(maxUnitLabel + i),
                type: BuildingUnitType.Unit,
                unitType: this.defaultUnitType,
                preview: preview,
            })
        }
        floor.units.push(...newUnits)
    }

    getSectionMissingFloorsCount (sectionIndex: number): number {
        const currentFloorIndexes = this.sections[sectionIndex].floors.map(floor => floor.index).sort((a, b) => a - b)

        let missingFloors = 0
        if (currentFloorIndexes.length > 1) {
            for (let i = 1; i < currentFloorIndexes.length; i++) {
                const gap = currentFloorIndexes[i] - currentFloorIndexes[i - 1] - 1
                if (gap > 0) {
                    missingFloors += gap
                }
            }
        }

        return missingFloors
    }

    private updateFloorRange (
        sectionIndex: number,
        newMinFloor: number | undefined,
        newMaxFloor: number | undefined,
        unitsPerFloor: number | undefined,
        preview?: boolean
    ): void {
        const section = this.sections[sectionIndex]
        // Handle min floor adjustment
        const currentMinFloor = this.getSectionMinFloor(sectionIndex)
        const floorShift = newMinFloor - currentMinFloor

        if (floorShift !== 0) {
            section.floors.forEach(floor => floor.index += floorShift)
        }

        const missingFloors = this.getSectionMissingFloorsCount(sectionIndex)

        // Calculate required floor count and adjustment needed
        const requiredFloorCount = Math.abs(newMaxFloor - newMinFloor) + 1
        const currentFloorCount = section.floors.length
        const effectiveCurrentFloorCount = currentFloorCount + missingFloors

        const floorsToAddOrRemove = requiredFloorCount - effectiveCurrentFloorCount

        const currentSectionMaxFloor = this.getSectionMaxFloor(sectionIndex)

        if (floorsToAddOrRemove > 0) {
            this.addFloorsToSection(sectionIndex, currentSectionMaxFloor, newMaxFloor, unitsPerFloor, preview)
        } else if (floorsToAddOrRemove < 0) {
            this.removeFloorsFromSection(sectionIndex, Math.abs(floorsToAddOrRemove))
        }
    }

    private addFloorsToSection (
        sectionIndex: number,
        currentMaxFloor: number,
        newMaxFloor: number,
        unitsPerFloor: number,
        preview?: boolean
    ): void {
        const section = this.sections[sectionIndex]
        const floors = [...this.sections[sectionIndex].floors].sort((a, b) => a.index - b.index)
        let lastUnitNumber = 0

        for (let i = 0; i < floors.length; i++) {
            const units = floors[i].units

            for (let j = units.length - 1; j >= 0; j--) {
                const unitNumber = Number(units[j].label)

                if (!isNaN(unitNumber)) {
                    lastUnitNumber = unitNumber
                    break
                }
            }
        }

        for (let floorIndex = currentMaxFloor + 1; floorIndex <= newMaxFloor; floorIndex++) {
            const newFloor = {
                id: String(++this.autoincrement),
                index: floorIndex,
                units: [],
                name: String(floorIndex),
                type: BuildingFloorType.Floor,
            }

            for (let i = 1; i <= unitsPerFloor; i++) {
                newFloor.units.push({
                    id: String(++this.autoincrement),
                    label: String(lastUnitNumber + i),
                    type: BuildingUnitType.Unit,
                    unitType: this.defaultUnitType,
                    preview: preview,
                })
            }

            lastUnitNumber += unitsPerFloor
            section.floors.unshift(newFloor)
        }
    }

    private removeFloorsFromSection (sectionIndex: number, count: number): void {
        for (let i = 0; i < count; i++) {
            this.removeFloor(sectionIndex, 0)
        }
    }

    private removeUnitsFromFloor (floor: BuildingFloor, count: number): void {
        const unitsToRemove = floor.units.slice(-count)
        const unitIdsToRemove = unitsToRemove.map(unit => unit.id)

        floor.units = floor.units.filter(unit => !unitIdsToRemove.includes(unit.id))
    }

    public removeSection (id: string, renameNextUnits = true): void {
        const sectionIndex = this.sections.findIndex(mapSection => mapSection.id === id)
        const removedSection = { ...this.sections[sectionIndex] }
        this.sections.splice(sectionIndex, 1)
        if (renameNextUnits) this.updateSectionNumbers(sectionIndex, renameNextUnits, removedSection)

        this.selectedSection = null
        this.mode = null
        this.editMode = null
        this.notifyUpdater()
    }

    public addPreviewUnit (unit: Partial<BuildingUnitArg>, renameNextUnits = true): void {
        this.removePreviewUnit(renameNextUnits)
        const { id, section, floor, label, unitType } = unit
        const sectionIndex = this.sections.findIndex(mapSection => mapSection.id === section)
        if (sectionIndex === -1) {
            return
        }
        const floorIndex = this.sections[sectionIndex].floors.findIndex(sectionFloor => sectionFloor.id === floor)
        if (floorIndex === -1) {
            return
        }
        const newUnit = {
            id,
            label,
            type: null,
            unitType,
            preview: true,
        }
        newUnit.type = BuildingMapEntityType.Unit
        if (!id) {
            newUnit.id = String(++this.autoincrement)
        }
        this.sections[sectionIndex].floors[floorIndex].units.push(newUnit)
        this._previewUnitId = newUnit.id
    }

    public addUnit (unit: Partial<BuildingUnitArg>, renameNextUnits = true): void {
        const { id, section, floor, label, unitType } = unit
        const sectionIndex = this.sections.findIndex(mapSection => mapSection.id === section)
        if (sectionIndex === -1) {
            return
        }
        const floorIndex = this.sections[sectionIndex].floors.findIndex(sectionFloor => sectionFloor.id === floor)
        if (floorIndex === -1) {
            return
        }
        const newUnit = {
            id,
            name: label,
            label,
            type: null,
            unitType,
        }
        newUnit.type = BuildingMapEntityType.Unit
        if (!id) {
            newUnit.id = String(++this.autoincrement)
        }
        this.sections[sectionIndex].floors[floorIndex].units.push(newUnit)

        if (renameNextUnits) this.updateUnitNumbers(newUnit)

        this.removePreviewSection()
        this.selectedSection = null
        this.selectedUnits = []
        this.mode = null
        this.notifyUpdater()
    }

    public removeUnit (id: string, renameNextUnits = true, sectionIndex?: number): void {
        const unitIndex = this.getUnitIndex(id)
        const nextUnit = this.getNextUnit(id)
        if (unitIndex.unit !== -1) {
            this.selectedUnits = this.selectedUnits.filter(unit => unit.id !== id)
            const floorUnits = this.sections[unitIndex.section].floors[unitIndex.floor].units
            const [removedUnit] = floorUnits.splice(unitIndex.unit, 1)
            if (floorUnits.length === 0) {
                this.removeFloor(unitIndex.section, unitIndex.floor)
            }

            if (nextUnit && NUMERIC_REGEXP.test(removedUnit.label) && (renameNextUnits || sectionIndex !== undefined)) {
                nextUnit.label = !sectionIndex ? removedUnit.label : nextUnit.label
                const updatedSectionIndex = renameNextUnits ? null : this.sections[sectionIndex].index
                const unitNumberToStartRenaming = renameNextUnits ? null : updatedSectionIndex

                this.updateUnitNumbers(nextUnit, unitNumberToStartRenaming)
            }
        }

        // if no units at this section -> remove it
        if (isObjectEmpty(this.sections[unitIndex.section].floors)) {
            this.removeSection(this.sections[unitIndex.section].id, renameNextUnits)
        }

        this.notifyUpdater()
    }

    public updateUnit (unit: BuildingUnitArg, renameNextUnits = true): void {
        const unitIndex = this.getUnitIndex(unit.id)
        if (unitIndex.unit === -1) {
            return
        }

        const oldSection = this.sections[unitIndex.section].id
        const oldFloor = this.sections[unitIndex.section].floors[unitIndex.floor].id

        if (oldFloor !== unit.floor || oldSection !== unit.section) {
            this.removeUnit(unit.id, renameNextUnits)
            this.addUnit(unit, renameNextUnits)
        } else {
            this.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].unitType = unit.unitType
            this.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].name = unit.label
            this.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].label = unit.label
            if (renameNextUnits) this.updateUnitNumbers(unit)
        }
        this.editMode = null
        this.notifyUpdater()
    }

    private updateUnitNumbers (unitFrom: BuildingUnit, sectionIndex?: number): void {
        const { id, label } = unitFrom
        if (isNaN(Number(label))) {
            return
        }
        let started = false
        let next = Number(label) + 1
        this.sections.forEach(section => {
            if (sectionIndex !== undefined && section.index !== sectionIndex) return

            section.floors.slice().reverse().forEach(floor => {
                floor.units.forEach(unit => {
                    if (started && !isNaN(Number(unit.label))) {
                        unit.label = String(next++)
                    }
                    if (unit.id === id) {
                        started = true
                    }
                })
            })
        })
    }

    private generateSection (section: Partial<BuildingSectionArg>, unitType: BuildingUnitSubType): BuildingSection {
        let unitNumber = this.nextUnitNumber
        const { name, minFloor, maxFloor, unitsOnFloor } = section
        const newSection: BuildingSection = {
            id: String(++this.autoincrement),
            floors: [],
            name,
            index: this.sections.length + 1,
            type: BuildingSectionType.Section,
        }

        for (let floor = minFloor; floor <= maxFloor; floor++) {
            if (floor === 0) {
                continue
            }
            const units = []
            for (let unitOnFloor = 0; unitOnFloor < unitsOnFloor; unitOnFloor++) {
                let label = ''
                if (floor > 0) {
                    label = String(unitNumber)
                    unitNumber++
                }
                units.push({
                    id: String(++this.autoincrement),
                    label,
                    type: 'unit',
                    unitType: unitType,
                })
            }
            newSection.floors.unshift({
                id: String(++this.autoincrement),
                index: floor,
                name: String(floor),
                type: BuildingFloorType.Floor,
                units,
            })
        }
        return newSection
    }

    private generateFloor (floor: BuildingFloorArg, preview = false): BuildingFloor {
        return {
            id: String(++this.autoincrement),
            index: floor.index,
            name: String(floor.index),
            type: BuildingFloorType.Floor,
            units: Array.from({ length: floor.unitCount }, (_, unitIndex) => {
                const label = floor.startUnitIndex !== undefined ? String(unitIndex + floor.startUnitIndex + 1) : null

                return {
                    id: String(++this.autoincrement),
                    label,
                    unitType: floor.unitType ?? this.defaultUnitType,
                    preview,
                    type: BuildingUnitType.Unit,
                }
            }),
        }
    }

    private insertFloor (floor: BuildingFloor, sectionIndex: number): number {
        const modifiedSection = this.sections[sectionIndex]
        modifiedSection.floors.forEach(({ index }, dataIndex) => {
            this.sectionFloorMap[index] = dataIndex
        })

        let insertIndex
        if (floor.index > 0) {
            insertIndex = this.sectionFloorMap[floor.index] === undefined ?
                0 : this.sectionFloorMap[floor.index] + 1
        } else if (floor.index < 0) {
            insertIndex = this.sectionFloorMap[floor.index] === undefined ?
                modifiedSection.floors.length : this.sectionFloorMap[floor.index] + 1
        } else {
            const positiveFloorsLength = modifiedSection.floors
                .filter(floor => floor.index >= 0).length
            insertIndex = positiveFloorsLength > 0 ? positiveFloorsLength : 0
        }
        const hasFloorWithSameIndex = Boolean(modifiedSection.floors.find(f => f.index === floor.index))

        // If we need to add positive floor -> rename all positive floor indexes
        if (hasFloorWithSameIndex) {
            if (floor.index >= 0) {
                modifiedSection.floors.forEach((f, arrayIndex) => {
                    if (f.index >= floor.index) {
                        const newValue = f.index + 1
                        modifiedSection.floors[arrayIndex].index = newValue
                        modifiedSection.floors[arrayIndex].name = String(newValue)
                    }
                })
            } else {
                modifiedSection.floors.forEach((f, arrayIndex) => {
                    if (f.index <= floor.index) {
                        const newValue = f.index - 1
                        modifiedSection.floors[arrayIndex].index = newValue
                        modifiedSection.floors[arrayIndex].name = String(newValue)
                    }
                })
            }
        }

        modifiedSection.floors.splice(insertIndex, 0, floor)

        this._previewSectionFloor = insertIndex
        return insertIndex
    }

    private getNextUnit (id: string): BuildingUnit {
        const units = this.sections
            .map(section => section.floors.slice(0).reverse().map(floor => floor.units)).flat(2)
        const unitIndex = units.findIndex(unit => unit.id === id)
        const nextIndex = unitIndex + 1
        return units[nextIndex] || null
    }

    private removeFloor (sectionIdx: number, floorIndex: number): void {
        if (!this.sections[sectionIdx]?.floors[floorIndex]) {
            return
        }

        const floorToRemove = this.sections[sectionIdx].floors[floorIndex]
        this.sections[sectionIdx].floors.splice(floorIndex, 1)
        const floorIndexCache = invert(this.sectionFloorMap)

        this.sections[sectionIdx].floors.map((floor, dataIndex) => {
            if (floorToRemove.index > 0 && floorToRemove.index < floor.index) {
                floor.index--
                floor.name = floor.index.toString()
            }
            if (!isObjectEmpty(floorIndexCache) && floorToRemove.index < 0 && floor.index < 0) {
                floor.index = Number(floorIndexCache[dataIndex])
            }
            return floor
        })
    }

    private notifyUpdater () {
        if (this.updateMap) {
            this.updateMap(this.map)
        }
    }

    private updateSectionNumbers (updatedIndex: number, renameNextUnits = true, removedSection = {}): void {
        if (updatedIndex === this.sections.length) {
            return
        }
        let sectionNameNumber = parseInt(get(this.sections, `${updatedIndex}.name`))
        if (!isEmpty(removedSection)) sectionNameNumber = get(removedSection, 'name', 1)
        let sectionIndex = !isEmpty(removedSection) ? get(removedSection, 'index', 0) : updatedIndex
        this.sections.forEach((section, index) => {
            if (index >= updatedIndex) {
                section.name = String(sectionNameNumber)
                section.index = sectionIndex
                sectionNameNumber++
                sectionIndex++
            }
        })

    }
}


export {
    MapView,
    MapEdit,
}
