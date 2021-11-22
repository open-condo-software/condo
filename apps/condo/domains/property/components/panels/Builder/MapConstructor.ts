import { buildingEmptyMapJson } from '@condo/domains/property/constants/property'
import { cloneDeep, compact, has, uniq, get } from 'lodash'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'
import MapSchemaJSON from './MapJsonSchema.json'
import Ajv from 'ajv'
import {
    BuildingMap,
    BuildingMapEntityType,
    BuildingUnit,
    BuildingSection,
} from '@app/condo/schema'

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


    public getMap (): BuildingMap {
        return this.map
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

    public validate (): boolean {
        return this.validateSchema() && this.validateUniqueIds()
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

}


class MapView extends Map {
    constructor (map: Maybe<BuildingMap>) {
        super(map)
        if (!this.isMapValid) {
            console.log('Invalid JSON for property:map', this.validationErrors)
        }
        this.setVisibleSections(this.sections.map(section => section.id))
    }

    // view or hide sections
    public visibleSections: CheckboxValueType[]

    public setVisibleSections (ids: CheckboxValueType[]): void {
        this.visibleSections = ids
    }

    public isSectionVisible (id: string): boolean {
        return this.visibleSections.includes(id)
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
            .filter(section => this.visibleSections.includes(section.id))
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        const uniqueIndexes = [...new Set(allIndexes)].sort((a, b) => (b - a))
        return uniqueIndexes
    }

    get isEmpty (): boolean {
        return this.map.sections.length === 0
    }

    get sections (): BuildingSection[] {
        return this.map.sections
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

}


class MapEdit extends MapView {

    public previewSectionId: string
    public previewUnitId: string

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

    private mode = null

    get editMode (): string {
        return this.mode
    }

    set editMode (mode: string) {
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
                this.removePreviewUnit()
                this.removePreviewSection()
                this.selectedSection = null
                this.selectedUnit = null
        }
        this.mode = mode
    }

    private selectedSection: BuildingSection

    public setSelectedSection (section: BuildingSection): void{
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

    private selectedUnit: BuildingUnit

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
            this.removeUnit(this.previewUnitId)
            this.previewUnitId = null
        }
    }

    private generateSection (section: Partial<BuildingSectionArg>): BuildingSection {
        let unitNumber = this.nextUnitNumber
        const { name, minFloor, maxFloor, unitsOnFloor } = section
        const newSection = {
            id: String(++this.autoincrement),
            floors: [],
            name,
            index: this.sections.length + 1,
            type: null,
        }
        newSection.type = BuildingMapEntityType.Section
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
        this.visibleSections.push(newSection.id)
    }

    public addSection (section: Partial<BuildingSectionArg>): void {
        const newSection = this.generateSection(section)
        this.map.sections.push(newSection)
        this.visibleSections.push(newSection.id)
        this.notifyUpdater()
    }

    public updateSection (section: BuildingSection): void {
        const sectionIndex = this.map.sections.findIndex(mapSection => section.id === mapSection.id)
        if (sectionIndex !== -1) {
            this.map.sections[sectionIndex].name = section.name
        }
        this.editMode = 'addSection'
        this.notifyUpdater()
    }

    public removeSection (id: string): void {
        const sectionIndex = this.map.sections.findIndex(mapSection => mapSection.id === id)
        this.map.sections.splice(sectionIndex, 1)
        this.editMode = 'addSection'
        this.notifyUpdater()
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

    private getNextUnit (id: string): BuildingUnit {
        const units = this.map.sections.map(section => section.floors.slice(0).reverse().map(floor => floor.units)).flat(2)
        const unitIndex = units.findIndex(unit => unit.id === id)
        const nextIndex = unitIndex + 1
        return units[nextIndex] || null
    }


    private removeFloor (sectionIdx: number, floorIndex: number): void {
        if (!get(this.map, `sections[${sectionIdx}].floors[${floorIndex}]`, false)){
            return
        }
        const floorToRemove = this.map.sections[sectionIdx].floors[floorIndex]
        this.map.sections[sectionIdx].floors.splice(floorIndex, 1)
        this.map.sections[sectionIdx].floors.map(floor => {
            if (floorToRemove.index < floor.index){
                floor.index--
                floor.name = floor.index.toString()
            }
            return floor
        })
    }

    public removeUnit (id: string): void {
        const unitIndex = this.getUnitIndex(id)
        const nextUnit = this.getNextUnit(id)
        if (unitIndex.unit !== -1) {
            const floorUnits = this.map.sections[unitIndex.section].floors[unitIndex.floor].units
            const [removedUnit] = floorUnits.splice(unitIndex.unit, 1)
            if (floorUnits.length === 0) {
                this.removeFloor(unitIndex.section, unitIndex.floor)
            }
            if (nextUnit) {
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
        this.editMode = 'addSection'
        this.notifyUpdater()
    }

    private notifyUpdater () {
        if (this.updateMap) {
            this.updateMap(this.map)
        }
    }

}


export {
    MapView,
    MapEdit,
}
