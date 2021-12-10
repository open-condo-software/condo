import { buildingEmptyMapJson } from '@condo/domains/property/constants/property'
import get from 'lodash/get'
import has from 'lodash/has'
import cloneDeep from 'lodash/cloneDeep'
import uniq from 'lodash/uniq'
import compact from 'lodash/compact'
import isObjectEmpty from 'lodash/isEmpty'
import last from 'lodash/last'
import MapSchemaJSON from './MapJsonSchema.json'
import Ajv from 'ajv'
import { BuildingMap, BuildingMapEntityType, BuildingSection, BuildingUnit, BuildingUnitType } from '@app/condo/schema'

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
    sectionIndex?: number
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

export type MapViewMode = 'section' | 'parking'


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

    public validate (): boolean {
        return this.validateSchema() && this.validateUniqueIds() && this.validateUniqueUnitLabel()
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
        this.autoincrement = Math.max(0, ...this.map.sections
            .map(section => section.floors
                .map(floor => floor.units
                    .map(unit => !isNaN(Number(unit.id)) ? Number(unit.id) : 0)))
            .flat(2)) + 1
    }

    private repairMapStructure (): void {
        this.autoincrement = 0
        if (!has(this.map, 'dv')) {
            this.map.dv = 1
        }
        if (!has(this.map, 'type')) {
            this.map.type = BuildingMapEntityType.Building
        }
        this.map.sections.forEach((section, sectionIndex) => {
            section.type = BuildingMapEntityType.Section
            section.id = String(++this.autoincrement)
            section.index = sectionIndex
            if (has(section, 'preview')) {
                delete section.preview
            }
            if (!has(section, 'name')) {
                section.name = String(section.index)
            }
            section.floors.forEach((floor, floorIndex) => {
                floor.type = BuildingMapEntityType.Floor
                floor.id = String(++this.autoincrement)
                if (!has(floor, 'index')) {
                    floor.index = floorIndex
                }
                if (!has(floor, 'name')) {
                    floor.name = String(floorIndex)
                }
                floor.units.forEach(unit => {
                    unit.type = BuildingMapEntityType.Unit
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

        if (isObjectEmpty(this.map.sections) && !isObjectEmpty(this.map.parking)) this.viewMode = 'parking'
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
            .filter(parking => this.visibleSections === null || this.visibleSections === parking.id)
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        return [...new Set(allIndexes)].sort((a, b) => b - a)
    }

    get isEmpty (): boolean {
        return isObjectEmpty(this.map.sections) && isObjectEmpty(this.map.parking)
    }

    public viewMode: MapViewMode = 'section'

    // view or hide sections
    public visibleSections: string | null = null

    public setVisibleSections (id: string | null): void {
        this.visibleSections = id
    }

    public isSectionVisible (id: string | null): boolean {
        return this.visibleSections === null || this.visibleSections === id
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

    public getUnitInfo (id: string): BuildingUnitArg {
        const newUnit: BuildingUnitArg = { id: '', label: '', floor: '', section: '', type: BuildingMapEntityType.Unit }
        if (!id) {
            return newUnit
        }
        const unitIndex = this.getUnitIndex(id)
        if (unitIndex.unit === -1) {
            return newUnit
        }
        const { label, type } = this.map.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit]
        return {
            id,
            label,
            type,
            section: this.map.sections[unitIndex.section].id,
            sectionIndex: this.map.sections[unitIndex.section].index,
            floor: this.map.sections[unitIndex.section].floors[unitIndex.floor].id,
        }
    }

    public  getSectionOptions (): BuildingSelectOption[] {
        const options = this.sections.map(section => ({ id: section.id, label: section.name }))
        return options
    }

    public getSectionFloorOptions (id: string): BuildingSelectOption[] {
        const foundSection = this.map.sections.find(section => section.id === id)
        if (!foundSection) {
            return []
        }
        const options = foundSection.floors.map(floor => ({ id: floor.id, label: floor.name }))
        return options
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
}


class MapEdit extends MapView {
    public previewSectionId: string
    public previewUnitId: string
    private mode = null

    constructor (map: Maybe<BuildingMap>, private updateMap?: Maybe<(map: BuildingMap) => void>) {
        super(map)
    }

    get nextUnitNumber (): number {
        const result = Math.max(0, ...this.map.sections
            .map(section => section.floors
                .map(floor => floor.units
                    .map(unit => !isNaN(Number(unit.label)) ? Number(unit.label) : 0)))
            .flat(2)) + 1
        return result
    }

    get nextSectionName (): string {
        if (this.isEmpty) return '1'
        if (!this.isEmpty && this.sections.filter(section => !section.preview).length === 0) return '1'

        const maxSectionNumber = Math.max(...this.sections
            .filter(section => !section.preview)
            .map(section => Number(section.name)))
        return String(maxSectionNumber + 1)
    }

    get editMode (): string | null {
        return this.mode
    }

    set editMode (mode: string | null) {
        switch (mode) {
            case 'addSection':
                this.removePreviewUnit()
                this.selectedUnit = null
                this.selectedSection = null
                break
            case 'editSection':
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedUnit = null
                break
            case 'addParking':
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedUnit = null
                this.selectedSection = null
                break
            case 'addUnit':
                this.removePreviewSection()
                this.selectedSection = null
                this.selectedUnit = null
                break
            case 'editUnit':
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedSection = null
                break
            default:
                this.selectedSection = null
                this.selectedUnit = null
                this.removePreviewUnit()
                this.removePreviewSection()
                this.removePreviewParking()
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

    public getSelectedSection (): BuildingSection {
        return this.selectedSection
    }

    public isSectionSelected (id: string): boolean {
        return this.selectedSection && this.selectedSection.id === id
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

    public addPreviewSection (section: Partial<BuildingSectionArg>): void {
        this.removePreviewSection()
        const newSection = this.generateSection(section)
        newSection.preview = true
        newSection.floors.forEach(floor => floor.units.map(unit => {
            unit.preview = true
            return unit
        }))
        this.previewSectionId = newSection.id
        this.map.sections.push(newSection)
    }

    public addSection (section: Partial<BuildingSectionArg>): void {
        const newSection = this.generateSection(section)
        this.map.sections.push(newSection)
        this.notifyUpdater()
        this.editMode = 'addSection'
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

    public removeParking (id: string): void {
        const parkingIndex = this.map.parking.findIndex(mapParking => mapParking.id === id)
        this.map.parking.splice(parkingIndex, 1)
        this.editMode = 'addParking'
        this.notifyUpdater()
    }

    public removePreviewParking (): void {
        if (this.previewSectionId) {
            this.removeParking(this.previewSectionId)
            this.previewSectionId = null
        }
    }

    public addPreviewParking (parking: Partial<BuildingSectionArg>): void {
        this.removePreviewParking()
        const newParking = this.generateSingleParking(parking)
        newParking.preview = true
        newParking.floors.forEach(floor => floor.units.map(unit => ({ ...unit, preview: true })))
        this.previewSectionId = newParking.id
        this.map.parking.push(newParking)
    }

    public addParking (parking: Partial<BuildingSectionArg>): void {
        const newParking = this.generateSingleParking(parking)
        this.map.parking.push(newParking)
        this.notifyUpdater()
        this.editMode = 'addParking'
    }

    public addPreviewUnit (unit: Partial<BuildingUnitArg>): void {
        this.removePreviewUnit()
        const { id, section, floor, label } = unit
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
            preview: true,
        }
        newUnit.type = BuildingMapEntityType.Unit
        if (!id) {
            newUnit.id = String(++this.autoincrement)
        }
        this.map.sections[sectionIndex].floors[floorIndex].units.push(newUnit)
        this.previewUnitId = newUnit.id
    }

    public addUnit (unit: Partial<BuildingUnitArg>): void {
        const { id, section, floor, label } = unit
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

    private selectedSection: BuildingSection

    private selectedUnit: BuildingUnit

    private generateSection (section: Partial<BuildingSectionArg>): BuildingSection {
        let unitNumber = this.nextUnitNumber
        const { name, minFloor, maxFloor, unitsOnFloor } = section
        const newSection: BuildingSection = {
            id: String(++this.autoincrement),
            floors: [],
            name,
            index: this.sections.length + 1,
            type: BuildingMapEntityType.Section,
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
                })
            }
            newSection.floors.unshift({
                id: String(++this.autoincrement),
                index: floor,
                name: String(floor),
                type: BuildingMapEntityType.Floor,
                units,
            })
        }
        return newSection
    }

    private generateSingleParking (parking: Partial<BuildingSectionArg>): BuildingSection {
        const { name, minFloor, maxFloor, unitsOnFloor } = parking
        const newParking: BuildingSection = {
            id: String(++this.autoincrement),
            floors: [],
            name,
            index: this.sections.length + 1,
            type: BuildingMapEntityType.Section,
        }

        for (let floor = minFloor; floor <= maxFloor; floor++) {
            if (floor === 0) continue
            const units: BuildingUnit[] = []

            for (let parkingOnFloor = 0; parkingOnFloor < unitsOnFloor; parkingOnFloor++) {
                units.push({
                    id: String(++this.autoincrement),
                    label: String(parkingOnFloor + 1),
                    type: BuildingMapEntityType.Unit,
                    unitType: BuildingUnitType.Parking,
                })
            }
            newParking.floors.unshift({
                id: String(++this.autoincrement),
                index: floor,
                name: String(floor),
                type: BuildingMapEntityType.Floor,
                units,
            })
        }

        return newParking
    }

    private getNextUnit (id: string): BuildingUnit {
        const units = this.map.sections.map(section => section.floors.slice(0).reverse().map(floor => floor.units)).flat(2)
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

        this.map.sections[sectionIdx].floors.map(floor => {
            if (floorToRemove.index > 0 && floorToRemove.index < floor.index) {
                floor.index--
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

}


export {
    MapView,
    MapEdit,
}
