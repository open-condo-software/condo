import {
    BuildingMap,
    BuildingMapEntityType,
    BuildingSection,
    BuildingUnit,
    BuildingFloor,
    BuildingUnitType,
    BuildingUnitSubType,
    BuildingFloorType, BuildingSectionType, BuildingMapType,
} from '@app/condo/schema'
import { buildingEmptyMapJson } from '@condo/domains/property/constants/property'
import Ajv from 'ajv'
import cloneDeep from 'lodash/cloneDeep'
import compact from 'lodash/compact'
import find from 'lodash/find'
import get from 'lodash/get'
import has from 'lodash/has'
import isObjectEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import last from 'lodash/last'
import uniq from 'lodash/uniq'
import invert from 'lodash/invert'
import MapSchemaJSON from './MapJsonSchema.json'

const ajv = new Ajv()
const validator = ajv.compile(MapSchemaJSON)

type Maybe<T> = T | null

export type BuildingSectionArg =  BuildingSection & {
    minFloor?: number
    maxFloor?: number
    unitsOnFloor?: number
    name?: string
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

type IndexParkingLocation = Omit<IndexLocation, 'section'> & {
    parking: number
}

export enum MapViewMode {
    'section',
    'parking',
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
        return this.validateSchema() && this.validateUniqueIds() && this.validateUniqueUnitLabel()
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

    public validateUniqueUnitLabel (): boolean {
        const unitLabels = this.map.sections
            ?.map((section) => section.floors
                ?.map(floor => floor.units
                    ?.map(unit => unit.label)
                )
            )
            .flat(2)
        if (unitLabels && unitLabels.length !== new Set(unitLabels).size) {
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

    public getSectionMaxFloor (sectionIdx: number): number {
        return Math.max(...this.map.sections[sectionIdx].floors.map(floor => floor.index))
    }

    get maxFloor (): number {
        return Math.max(...this.map.sections
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        )
    }

    get minFloor (): number {
        return Math.min(...this.map.sections
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
        const allIndexes = this.map.sections
            .filter(section => this.visibleSections === null || this.visibleSections === section.id)
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        const uniqueIndexes = [...new Set(allIndexes)].sort((a, b) => (b - a))
        return uniqueIndexes
    }

    get possibleChosenParkingFloors (): number[] {
        const allIndexes = this.map.parking
            .filter(parking => this.visibleParkingSections === null || this.visibleParkingSections === parking.id)
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        return [...new Set(allIndexes)].sort((a, b) => b - a)
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

    public viewMode: MapViewMode = MapViewMode.section

    // view or hide sections
    public visibleSections: string | null = null
    public visibleParkingSections: string | null = null

    public setVisibleSections (id: string | null): void {
        this.visibleSections = id
    }

    public isSectionVisible (id: string | null): boolean {
        return this.visibleSections === null || this.visibleSections === id
    }

    public setVisibleParkingSections (id: string | null): void {
        this.visibleParkingSections = id
    }

    public isParkingSectionVisible (id: string | null): boolean {
        return this.visibleParkingSections === null || this.visibleParkingSections === id
    }

    get sections (): BuildingSection[] {
        return this.map.sections
    }

    get parking (): BuildingSection[] {
        return this.map.parking
    }

    get lastSectionIndex (): number {
        return Math.max(...this.map.sections.map(section => section.index))
    }

    get lastParkingIndex (): number {
        return Math.max(...this.map.parking.map(parkingSection => parkingSection.index))
    }

    public getUnitInfo (id: string): BuildingUnitArg {
        const newUnit: BuildingUnitArg = { id: '', label: '', floor: '', section: '', type: BuildingUnitType.Unit, unitType: BuildingUnitSubType.Flat }
        if (!id) {
            return newUnit
        }
        const unitIndex = this.getUnitIndex(id)
        if (unitIndex.unit === -1) {
            return newUnit
        }
        const { label, type, unitType } = this.map.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit]
        return {
            id,
            label,
            type,
            section: this.map.sections[unitIndex.section].id,
            sectionIndex: this.map.sections[unitIndex.section].index,
            floor: this.map.sections[unitIndex.section].floors[unitIndex.floor].id,
            unitType,
        }
    }

    public getParkingUnitInfo (id: string): BuildingUnitArg {
        const newUnit: BuildingUnitArg = {
            id: '',
            label: '',
            floor: '',
            section: '',
            type: BuildingUnitType.Unit,
            unitType: BuildingUnitSubType.Parking,
        }
        if (!id) {
            return newUnit
        }
        const unitIndex = this.getParkingUnitIndex(id)
        if (unitIndex.unit === -1) {
            return newUnit
        }
        const { label, type } = this.map.parking[unitIndex.parking].floors[unitIndex.floor].units[unitIndex.unit]
        return {
            id,
            label,
            type,
            section: this.map.parking[unitIndex.parking].id,
            sectionIndex: this.map.parking[unitIndex.parking].index,
            floor: this.map.parking[unitIndex.parking].floors[unitIndex.floor].id,
        }
    }

    public getSectionOptions (): BuildingSelectOption[] {
        return this.sections.map(section => ({ id: section.id, label: section.name }))
    }

    public getParkingSectionOptions (): BuildingSelectOption[] {
        return this.parking.map(section => ({ id: section.id, label: section.name }))
    }

    public getSectionFloorOptions (id: string): BuildingSelectOption[] {
        const foundSection = this.map.sections.find(section => section.id === id)
        if (!foundSection) {
            return []
        }
        const options = foundSection.floors.map(floor => ({ id: floor.id, label: floor.name }))
        return options
    }

    public getParkingSectionFloorOptions (id: string): BuildingSelectOption[] {
        const foundSection = this.map.parking.find(section => section.id === id)
        if (!foundSection) {
            return []
        }
        return foundSection.floors.map(floor => ({ id: floor.id, label: floor.name }))
    }

    public getUnitTypeOptions (): BuildingUnitSubType[] {
        return [
            ...new Set(this.sections
                .map(section => section.floors.map(floor => floor.units.map(unit => unit.unitType))).flat(2)),
        ].sort((a, b) => a.localeCompare(b))
    }

    protected getUnitIndex (unitId: string): IndexLocation {
        const result = { section: -1, floor: -1, unit: -1 }
        this.map.sections.forEach((section, sectionIdx) => {
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

    protected getParkingUnitIndex (unitId: string): IndexParkingLocation {
        const result = { parking: -1, floor: -1, unit: -1 }
        this.map.parking.forEach((section, sectionIdx) => {
            section.floors.forEach((floor, floorIdx) => {
                const unitIdx = floor.units.findIndex(unit => unit.id === unitId)
                if (unitIdx !== -1) {
                    result.parking = sectionIdx
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
    public previewSectionId: string
    public previewParkingId: string
    public previewSectionFloor: number | null = null
    public previewUnitId: string
    public previewParkingUnitId: string
    private mode = null

    constructor (map: Maybe<BuildingMap>, private updateMap?: Maybe<(map: BuildingMap) => void>) {
        super(map)
    }

    get nextUnitNumber (): number {
        return Math.max(0, ...this.map.sections
            .map(section => section.floors
                .map(floor => floor.units
                    .map(unit => !isNaN(Number(unit.label)) ? Number(unit.label) : 0)))
            .flat(2)) + 1
    }

    get nextParkingUnitNumber (): number {
        return Math.max(0, ...this.map.parking
            .flatMap(parkingSection => parkingSection.floors
                .flatMap(floor => floor.units
                    .map(unit => !isNaN(Number(unit.label)) ? Number(unit.label) : 0))
            )
        ) + 1
    }

    get nextSectionName (): string {
        if (this.isEmptySections) return '1'
        if (!this.isEmptySections && this.sections.filter(section => !section.preview).length === 0) return '1'

        const maxSectionNumber = Math.max(...this.sections
            .filter(section => !section.preview)
            .map(section => Number(section.name)))
        return String(maxSectionNumber + 1)
    }

    get nextParkingName (): string {
        if (this.isEmptyParking) return '1'
        if (!this.isEmptyParking && this.parking.filter(section => !section.preview).length === 0) return '1'

        const maxParkingName = Math.max(...this.parking
            .filter(parkingSection => !parkingSection.preview)
            .map(parkingSection => Number(parkingSection.name)))
        return String(maxParkingName + 1)
    }

    get editMode (): string | null {
        return this.mode
    }

    set editMode (mode: string | null) {
        switch (mode) {
            case 'addSection':
                this.removePreviewUnit()
                this.viewMode = MapViewMode.section
                this.selectedUnit = null
                this.selectedSection = null
                break
            case 'editSection':
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedUnit = null
                break
            case 'addParking':
                this.viewMode = MapViewMode.parking
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedUnit = null
                this.selectedSection = null
                break
            case 'editParking':
                this.removePreviewParkingUnit()
                this.removePreviewParking()
                this.selectedParkingUnit = null
                break
            case 'addUnit':
                this.removePreviewSection()
                this.viewMode = MapViewMode.section
                this.selectedSection = null
                this.selectedUnit = null
                break
            case 'editUnit':
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedSection = null
                break
            case 'addParkingUnit':
                this.removePreviewParking()
                this.viewMode = MapViewMode.parking
                this.selectedParking = null
                this.selectedParkingUnit = null
                break
            case 'editParkingUnit':
                this.removePreviewParkingUnit()
                this.removePreviewParking()
                this.selectedParking = null
                break
            case 'addSectionFloor':
                this.viewMode = MapViewMode.section
                this.removePreviewSectionFloor()
                break
            default:
                this.selectedSection = null
                this.selectedUnit = null
                this.selectedParking = null
                this.selectedParkingUnit = null
                this.removePreviewUnit()
                this.removePreviewSection()
                this.removePreviewParking()
                this.removePreviewParkingUnit()
                this.removePreviewSectionFloor()
                this.restoreViewMode()
                this.mode = null
        }
        this.mode = mode
    }

    public setSelectedSection (section: BuildingSection): void {
        if (this.isSectionSelected(section.id)) {
            this.selectedSection = null
            this.editMode = 'addSection'
        } else {
            this.selectedSection = section
            this.editMode = 'editSection'
        }
    }

    public setSelectedParking (parkingSection: BuildingSection): void {
        if (this.isParkingSelected(parkingSection.id)) {
            this.selectedParking = null
            this.editMode = 'addParking'
        } else {
            this.selectedParking = parkingSection
            this.editMode = 'editParking'
        }
    }

    public getSelectedSection (): BuildingSection {
        return this.selectedSection
    }

    public getSelectedParking (): BuildingSection {
        return this.selectedParking
    }

    public isParkingSelected (id: string): boolean {
        return this.selectedParking && this.selectedParking.id === id
    }

    public isSectionSelected (id: string): boolean {
        return this.selectedSection && this.selectedSection.id === id
    }

    public setSelectedParkingUnit (unit: BuildingUnit): void {
        if (this.isParkingUnitSelected(unit.id)) {
            this.editMode = 'addParking'
            this.selectedParkingUnit = null
        } else {
            this.selectedParkingUnit = unit
            this.editMode = 'editParkingUnit'
        }
    }

    public getSelectedParkingUnit (): BuildingUnitArg {
        return this.selectedParkingUnit ? this.getParkingUnitInfo(this.selectedParkingUnit.id) : null
    }

    public isParkingUnitSelected (id: string): boolean {
        return this.selectedParkingUnit && this.selectedParkingUnit.id === id
    }

    public removePreviewParkingUnit (): void {
        if (this.previewParkingUnitId) {
            this.removeParkingUnit(this.previewParkingUnitId, false)
            this.previewParkingUnitId = null
        }
    }

    public setSelectedUnit (unit: BuildingUnit): void {
        if (this.isUnitSelected(unit.id)) {
            this.editMode = 'addSection'
            this.selectedUnit = null
        } else {
            this.selectedUnit = unit
            this.editMode = 'editUnit'
        }
    }

    public getSelectedUnit (): BuildingUnitArg {
        return this.selectedUnit ? this.getUnitInfo(this.selectedUnit.id) : null
    }

    public isUnitSelected (id: string): boolean {
        return this.selectedUnit && this.selectedUnit.id === id
    }

    public removePreviewSection (): void {
        if (this.previewSectionId) {
            this.removeSection(this.previewSectionId)
            this.previewSectionId = null
        }
    }

    public removePreviewUnit (): void {
        if (this.previewUnitId) {
            this.removeUnit(this.previewUnitId, false)
            this.previewUnitId = null
        }
    }

    public removePreviewSectionFloor (): void {
        if (this.sectionFloorIndex !== null && this.previewSectionFloor !== null) {
            this.removeFloor(this.sectionFloorIndex, this.previewSectionFloor)

            this.sectionFloorIndex = null
            this.previewSectionFloor = null
            this.sectionFloorMap = {}
        }
    }

    public addPreviewSection (section: Partial<BuildingSectionArg>, unitType: BuildingUnitSubType = BuildingUnitSubType.Flat): void {
        this.removePreviewSection()
        const newSection = this.generateSection(section, unitType)
        newSection.preview = true
        newSection.floors.forEach(floor => floor.units.map(unit => {
            unit.preview = true
            return unit
        }))
        this.previewSectionId = newSection.id
        this.map.sections.push(newSection)
    }

    public addSection (section: Partial<BuildingSectionArg>, unitType: BuildingUnitSubType = BuildingUnitSubType.Flat): void {
        const newSection = this.generateSection(section, unitType)
        this.map.sections.push(newSection)
        this.notifyUpdater()
        this.editMode = 'addSection'
    }

    public addPreviewSectionFloor (floor: BuildingFloorArg): void {
        this.removePreviewSectionFloor()
        this.sectionFloorIndex = this.sections[floor.section].index
        const newSectionFloor = this.generateFloor(floor, true)
        this.insertFloor(newSectionFloor, floor.section)
    }

    public addSectionFloor (floor: BuildingFloorArg): void {
        this.removePreviewSectionFloor()
        const newSectionFloor = this.generateFloor(floor)
        const floorIndex = this.insertFloor(newSectionFloor, floor.section)

        let previousFloorIndex = floorIndex
        if (floorIndex < this.sections[floor.section].floors.length - 1) {
            previousFloorIndex++
        }

        if (floor.section === 0 && floor.index === 1) {
            const hasNegativeFloors = Object.keys(this.sectionFloorMap).some(floorLabel => Number(floorLabel) < 0)
            const updateIndex = hasNegativeFloors ? floorIndex : previousFloorIndex
            this.updateUnitNumbers(this.sections[0].floors[updateIndex].units[0])
            return
        }

        const previousUnit = last(this.sections[floor.section].floors[previousFloorIndex].units)
        if (previousUnit && Number(get(invert(this.sectionFloorMap), floorIndex, -1)) > 0) {
            this.updateUnitNumbers(previousUnit)
        }
        this.notifyUpdater()
    }


    public addPreviewCopySection (sectionId: string): void {
        this.removePreviewSection()
        const newSection = cloneDeep(find(this.map.sections, section => section.id === sectionId))
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

        this.previewSectionId = newSection.id
        this.map.sections.push(newSection)
        this.notifyUpdater()
    }

    public addCopySection (sectionId: string): void {
        const newSection = cloneDeep(find(this.map.sections, section => section.id === sectionId))

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

        this.map.sections.push(newSection)
        this.notifyUpdater()
    }

    public updateSection (section: BuildingSection): void {
        const sectionIndex = this.map.sections.findIndex(mapSection => section.id === mapSection.id)
        if (sectionIndex !== -1) {
            this.map.sections[sectionIndex].name = section.name
        }
        this.editMode = null
        this.notifyUpdater()
    }

    public removeSection (id: string): void {
        const sectionIndex = this.map.sections.findIndex(mapSection => mapSection.id === id)
        this.map.sections.splice(sectionIndex, 1)
        this.updateSectionNumbers(sectionIndex)

        this.editMode = 'addSection'
        this.notifyUpdater()
    }

    public updateParking (parking: BuildingSection): void {
        const parkingIndex = this.map.parking.findIndex(parkingSection => parkingSection.id === parking.id)
        if (parkingIndex !== -1) {
            this.map.parking[parkingIndex].name = parking.name
        }
        this.editMode = null
        this.notifyUpdater()
    }

    public removeParking (id: string): void {
        const parkingIndex = this.map.parking.findIndex(mapParking => mapParking.id === id)
        this.map.parking.splice(parkingIndex, 1)
        this.updateParkingNumbers(parkingIndex)

        this.editMode = 'addParking'
        this.notifyUpdater()
    }

    public removePreviewParking (): void {
        if (this.previewParkingId) {
            this.removeParking(this.previewParkingId)
            this.previewParkingId = null
        }
    }

    public addPreviewParking (parking: Partial<BuildingSectionArg>): void {
        this.removePreviewParking()
        const newParking = this.generateSingleParking(parking)
        newParking.preview = true
        newParking.floors.forEach(floor => floor.units.map(unit => {
            unit.preview = true
            return unit
        }))
        this.previewParkingId = newParking.id
        this.map.parking.push(newParking)
    }

    public addParking (parking: Partial<BuildingSectionArg>): void {
        const newParking = this.generateSingleParking(parking)
        this.map.parking.push(newParking)
        this.notifyUpdater()
        this.editMode = 'addParking'
    }

    public addPreviewCopyParking (parkingId: string): void {
        this.removePreviewParking()
        const newParking = cloneDeep(find(this.map.parking, parking => parking.id === parkingId))
        newParking.preview = true

        newParking.id = String(++this.autoincrement)
        newParking.index = this.parking.length + 1
        newParking.name = this.nextParkingName

        let unitNumber = this.nextParkingUnitNumber
        newParking.floors.reduceRight((_, floor) => {
            floor.id = String(++this.autoincrement)

            floor.units.forEach((unit) => {
                unit.id = String(++this.autoincrement)
                unit.label = String(unitNumber)
                unit.preview = true
                unitNumber++
            })
            return floor
        }, newParking.floors[0])

        this.previewParkingId = newParking.id
        this.map.parking.push(newParking)
        this.notifyUpdater()
    }

    public addCopyParking (parkingId: string): void {
        const newParking = cloneDeep(find(this.map.parking, parking => parking.id === parkingId))

        newParking.id = String(++this.autoincrement)
        newParking.index = this.parking.length + 1
        newParking.name = this.nextParkingName

        let unitNumber = this.nextParkingUnitNumber
        newParking.floors.reduceRight((_, floor) => {
            floor.id = String(++this.autoincrement)

            floor.units.forEach((unit) => {
                unit.id = String(++this.autoincrement)
                unit.label = String(unitNumber)
                unitNumber++
            })
            return floor
        }, newParking.floors[0])

        this.map.parking.push(newParking)
        this.notifyUpdater()
    }

    public addPreviewUnit (unit: Partial<BuildingUnitArg>): void {
        this.removePreviewUnit()
        const { id, section, floor, label, unitType } = unit
        const sectionIndex = this.map.sections.findIndex(mapSection => mapSection.id === section)
        if (sectionIndex === -1) {
            return
        }
        const floorIndex = this.map.sections[sectionIndex].floors.findIndex(sectionFloor => sectionFloor.id === floor)
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
        this.map.sections[sectionIndex].floors[floorIndex].units.push(newUnit)
        this.previewUnitId = newUnit.id
    }

    public addPreviewParkingUnit (unit: Partial<BuildingUnitArg>): void {
        this.removePreviewParkingUnit()
        const { id, section, floor, label } = unit
        const sectionIndex = this.map.parking.findIndex(mapSection => mapSection.id === section)
        if (sectionIndex === -1) {
            return
        }
        const floorIndex = this.map.parking[sectionIndex].floors.findIndex(sectionFloor => sectionFloor.id === floor)
        if (floorIndex === -1) {
            return
        }
        const newUnit = {
            id,
            label,
            type: null,
            unitType: BuildingUnitSubType.Parking,
            preview: true,
        }
        newUnit.type = BuildingMapEntityType.Unit
        if (!id) {
            newUnit.id = String(++this.autoincrement)
        }
        this.map.parking[sectionIndex].floors[floorIndex].units.push(newUnit)
        this.previewParkingUnitId = newUnit.id
    }

    public addParkingUnit (unit: Partial<BuildingUnitArg>): void {
        const { id, section, floor, label } = unit
        const sectionIndex = this.map.parking.findIndex(mapSection => mapSection.id === section)
        if (sectionIndex === -1) {
            return
        }
        const floorIndex = this.map.parking[sectionIndex].floors.findIndex(sectionFloor => sectionFloor.id === floor)
        if (floorIndex === -1) {
            return
        }
        const newUnit = {
            id,
            name: label,
            label,
            type: BuildingUnitType.Unit,
            unitType: BuildingUnitSubType.Parking,
        }
        if (!id) {
            newUnit.id = String(++this.autoincrement)
        }
        this.map.parking[sectionIndex].floors[floorIndex].units.push(newUnit)
        this.updateParkingUnitNumbers(newUnit)
        this.editMode = 'addParkingUnit'
        this.notifyUpdater()
    }

    public addUnit (unit: Partial<BuildingUnitArg>): void {
        const { id, section, floor, label, unitType } = unit
        const sectionIndex = this.map.sections.findIndex(mapSection => mapSection.id === section)
        if (sectionIndex === -1) {
            return
        }
        const floorIndex = this.map.sections[sectionIndex].floors.findIndex(sectionFloor => sectionFloor.id === floor)
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
        this.map.sections[sectionIndex].floors[floorIndex].units.push(newUnit)
        this.updateUnitNumbers(newUnit)
        this.editMode = 'addUnit'
        this.notifyUpdater()
    }

    public removeUnit (id: string, shouldUpdateUnitNumbers = true): void {
        const unitIndex = this.getUnitIndex(id)
        const nextUnit = this.getNextUnit(id)
        if (unitIndex.unit !== -1) {
            const floorUnits = this.map.sections[unitIndex.section].floors[unitIndex.floor].units
            const [removedUnit] = floorUnits.splice(unitIndex.unit, 1)
            if (floorUnits.length === 0) {
                this.removeFloor(unitIndex.section, unitIndex.floor)
            }
            if (nextUnit && shouldUpdateUnitNumbers) {
                nextUnit.label = removedUnit.label
                this.updateUnitNumbers(nextUnit)
            }
        }
        this.selectedUnit = null
        this.editMode = 'addUnit'
        this.notifyUpdater()
    }

    public removeParkingUnit (id: string, shouldUpdateUnitNumbers = true): void {
        const unitIndex = this.getParkingUnitIndex(id)
        const nextUnit = this.getNextParkingUnit(id)
        if (unitIndex.unit !== -1) {
            const floorUnits = this.map.parking[unitIndex.parking].floors[unitIndex.floor].units
            const [removedUnit] = floorUnits.splice(unitIndex.unit, 1)
            if (floorUnits.length === 0) {
                this.removeParkingFloor(unitIndex.parking, unitIndex.floor)
            }
            if (nextUnit && shouldUpdateUnitNumbers) {
                nextUnit.label = removedUnit.label
                this.updateParkingUnitNumbers(nextUnit)
            }
        }
        this.selectedParkingUnit = null
        this.editMode = 'addParkingUnit'
        this.notifyUpdater()
    }

    public updateParkingUnit (unit: BuildingUnitArg): void {
        const unitIndex = this.getParkingUnitIndex(unit.id)
        if (unitIndex.unit === -1) {
            return
        }

        const oldParkingSection = this.map.parking[unitIndex.parking].id
        const oldFloor = this.map.parking[unitIndex.parking].floors[unitIndex.floor].id
        if (oldFloor !== unit.floor || oldParkingSection !== unit.section) {
            this.removeParkingUnit(unit.id)
            this.addParkingUnit(unit)
        } else {
            this.map.parking[unitIndex.parking].floors[unitIndex.floor].units[unitIndex.unit].name = unit.label
            this.map.parking[unitIndex.parking].floors[unitIndex.floor].units[unitIndex.unit].label = unit.label
            this.updateParkingUnitNumbers(unit)
        }
        this.editMode = null
        this.notifyUpdater()
    }

    public updateUnit (unit: BuildingUnitArg): void {
        const unitIndex = this.getUnitIndex(unit.id)
        if (unitIndex.unit === -1) {
            return
        }

        const oldSection = this.map.sections[unitIndex.section].id
        const oldFloor = this.map.sections[unitIndex.section].floors[unitIndex.floor].id

        if (oldFloor !== unit.floor || oldSection !== unit.section) {
            this.removeUnit(unit.id)
            this.addUnit(unit)
        } else {
            this.map.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].unitType = unit.unitType
            this.map.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].name = unit.label
            this.map.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].label = unit.label
            this.updateUnitNumbers(unit)
        }
        this.editMode = null
        this.notifyUpdater()
    }

    private updateUnitNumbers (unitFrom: BuildingUnit): void {
        const { id, label } = unitFrom
        if (isNaN(Number(label))) {
            return
        }
        let started = false
        let next = Number(label) + 1
        this.map.sections.forEach(section => {
            section.floors.slice().reverse().forEach(floor => {
                floor.units.forEach(unit => {
                    if (started) {
                        if (unit.name) {
                            if (!isNaN(Number(unit.name))) {
                                next = Number(unit.name) + 1
                            }
                        } else {
                            if (!isNaN(Number(unit.label))) {
                                unit.label = String(next++)
                            }
                        }
                    }
                    if (unit.id === id) {
                        started = true
                    }
                })
            })
        })
    }

    private updateParkingUnitNumbers (unitFrom: BuildingUnit): void {
        const { id, label } = unitFrom
        if (isNaN(Number(label))) {
            return
        }
        let started = false
        let next = Number(label) + 1
        this.map.parking.forEach(section => {
            section.floors.slice().reverse().forEach(floor => {
                floor.units.forEach(unit => {
                    if (started) {
                        if (unit.name) {
                            if (!isNaN(Number(unit.name))) {
                                next = Number(unit.name) + 1
                            }
                        } else {
                            if (!isNaN(Number(unit.label))) {
                                unit.label = String(next++)
                            }
                        }
                    }
                    if (unit.id === id) {
                        started = true
                    }
                })
            })
        })
    }

    private selectedSection: BuildingSection

    private selectedUnit: BuildingUnit

    private selectedParking: BuildingSection

    private selectedParkingUnit: BuildingUnit

    private sectionFloorIndex: number | null = null

    private sectionFloorMap: Record<number, number> = {}

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
                let label = ' '
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

    private generateSingleParking (parking: Partial<BuildingSectionArg>): BuildingSection {
        let unitNumber = this.nextParkingUnitNumber
        const { name, minFloor, maxFloor, unitsOnFloor } = parking
        const newParking: BuildingSection = {
            id: String(++this.autoincrement),
            floors: [],
            name,
            index: this.sections.length + 1,
            type: BuildingSectionType.Section,
        }

        for (let floor = minFloor; floor <= maxFloor; floor++) {
            if (floor === 0) continue
            const units: BuildingUnit[] = []

            for (let parkingOnFloor = 0; parkingOnFloor < unitsOnFloor; parkingOnFloor++) {
                units.push({
                    id: String(++this.autoincrement),
                    label: String(unitNumber),
                    type: BuildingUnitType.Unit,
                    unitType: BuildingUnitSubType.Parking,
                })
                unitNumber++
            }
            newParking.floors.unshift({
                id: String(++this.autoincrement),
                index: floor,
                name: String(floor),
                type: BuildingFloorType.Floor,
                units,
            })
        }

        return newParking
    }

    private generateFloor (floor: BuildingFloorArg, preview = false): BuildingFloor {
        return {
            id: String(++this.autoincrement),
            index: floor.index,
            name: String(floor.index),
            type: BuildingFloorType.Floor,
            units: Array.from({ length: floor.unitCount }, (_, unitIndex) => {
                let label = ''
                if (!preview && floor.section === 0 && floor.index === 1) {
                    label = String(unitIndex + 1)
                }

                return {
                    id: String(++this.autoincrement),
                    label,
                    unitType: floor.unitType,
                    preview,
                    type: BuildingUnitType.Unit,
                }
            }),
        }
    }

    private insertFloor (floor: BuildingFloor, sectionIndex: number): number {
        const modifiedSection = this.map.sections[sectionIndex]
        modifiedSection.floors.forEach(({ index }, dataIndex) => {
            this.sectionFloorMap[index] = dataIndex
        })


        let insertIndex = this.sectionFloorMap[floor.index] === undefined ? 0 : this.sectionFloorMap[floor.index] + 1
        if (floor.index < 0 && this.sectionFloorMap[floor.index] === undefined) {
            insertIndex = modifiedSection.floors.length
        }
        modifiedSection.floors.splice(insertIndex, 0, floor)

        // If we need to add positive floor -> rename all positive floor indexes
        if (floor.index >= 0) {
            const positiveFloorsCount = modifiedSection.floors.map(floor => floor.index).filter(index => index >= 0).length

            for (let dataIndex = 0; dataIndex < positiveFloorsCount; dataIndex++) {
                modifiedSection.floors[dataIndex].index = positiveFloorsCount - dataIndex
            }
        } else {
            const needToRenameNextFloor = Object.keys(this.sectionFloorMap).includes(String(floor.index))
            if (needToRenameNextFloor) {
                modifiedSection.floors[insertIndex - 1].index--
            }
        }

        this.previewSectionFloor = insertIndex
        return insertIndex
    }

    private getNextParkingUnit (id: string): BuildingUnit {
        const units = this.map.parking
            .map(section => section.floors.slice(0).reverse().map(floor => floor.units)).flat(2)
        const unitIndex = units.findIndex(unit => unit.id === id)
        const nextUnit = unitIndex + 1
        return units[nextUnit] || null
    }

    private getNextUnit (id: string): BuildingUnit {
        const units = this.map.sections
            .map(section => section.floors.slice(0).reverse().map(floor => floor.units)).flat(2)
        const unitIndex = units.findIndex(unit => unit.id === id)
        const nextIndex = unitIndex + 1
        return units[nextIndex] || null
    }

    private removeFloor (sectionIdx: number, floorIndex: number): void {
        if (!get(this.map, `sections[${sectionIdx}].floors[${floorIndex}]`, false)) {
            return
        }

        const floorToRemove = this.map.sections[sectionIdx].floors[floorIndex]
        this.map.sections[sectionIdx].floors.splice(floorIndex, 1)
        const floorIndexCache = invert(this.sectionFloorMap)

        this.map.sections[sectionIdx].floors.map((floor, dataIndex) => {
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

    private removeParkingFloor (parkingSectionId: number, floorIndex: number): void {
        if (!get(this.map, `parking[${parkingSectionId}].floors[${floorIndex}]`, false)) {
            return
        }

        const floorToRemove = this.map.parking[parkingSectionId].floors[floorIndex]
        this.map.parking[parkingSectionId].floors.splice(floorIndex, 1)
        this.map.parking[parkingSectionId].floors.map(floor => {
            if (floorToRemove.index < floor.index) {
                floor.index --
                floor.name = floor.index.toString()
            }
            return floor
        })
    }

    private notifyUpdater () {
        if (this.updateMap) {
            this.updateMap(this.map)
        }
    }

    private updateSectionNumbers (removedIndex: number): void {
        if (removedIndex === this.map.sections.length) {
            return
        }
        let sectionNameNumber = parseInt(get(this.map.sections, '0.name', '1'))
        this.map.sections.forEach((section, index) => {
            section.name = String(sectionNameNumber)
            section.index = index
            sectionNameNumber++
        })

        if (typeof this.map.sections[removedIndex] !== 'undefined') {
            if (removedIndex === 0) {
                // Rename from first unit
                const firstSectionUnit = get(
                    last(this.map.sections[removedIndex].floors.filter(floor => floor.index > 0)), 'units.0'
                )
                if (firstSectionUnit) {
                    firstSectionUnit.label = '1'
                    firstSectionUnit.index = 1
                    this.updateUnitNumbers(firstSectionUnit)
                }
            } else if (typeof this.map.sections[removedIndex - 1] !== 'undefined') {
                // Rename from last unit at section - 1 of sectionIndex
                const lastFloorUnits = get(this.map.sections[removedIndex - 1], 'floors.0.units')
                if (lastFloorUnits) {
                    this.updateUnitNumbers(last(lastFloorUnits))
                }
            }
        }
    }

    private updateParkingNumbers (removedIndex: number): void {
        if (removedIndex === this.map.parking.length) {
            return
        }

        this.map.parking.forEach((parkingSection, index) => {
            parkingSection.name = String(index + 1)
            parkingSection.index = index
        })

        if (typeof this.map.parking[removedIndex] !== 'undefined') {
            if (removedIndex === 0) {
                // Rename from first unit
                const firstSectionUnit = get(last(this.map.parking[removedIndex].floors), 'units.0')
                if (firstSectionUnit) {
                    firstSectionUnit.label = '1'
                    this.updateParkingUnit(firstSectionUnit)
                }
            } else if (typeof this.map.sections[removedIndex - 1] !== 'undefined') {
                // Rename from last unit at section - 1 of sectionIndex
                const lastFloorUnits = get(this.map.parking[removedIndex - 1], 'floors.0.units')
                if (lastFloorUnits) {
                    this.updateParkingUnitNumbers(last(lastFloorUnits))
                }
            }
        }
    }

}


export {
    MapView,
    MapEdit,
}
