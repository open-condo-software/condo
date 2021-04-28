import { buildingEmptyMapJson } from '@condo/domains/property/constants/property.example'
import { cloneDeep } from 'lodash'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'

type Maybe<T> = T | null

export type BuildingUnit = {
    id: Maybe<string>
    type?: string
    label?: string
    floor?: string
    section?: string
    isPreview?: boolean
}

export type BuildingFloor = {
    id: string
    index: number
    name: string
    type: 'floor'
    units: BuildingUnit[]
}

export type BuildingSection = {
    id: string
    index?: number
    name?: string
    type?: 'section'
    floors?: BuildingFloor[]
    minFloor?: number
    maxFloor?: number
    unitsOnFloor?: number
}

export type BuildingMap = {
    dv: number
    sections: BuildingSection[]
    autoincrement: number
    type: 'building' | 'vilage'
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

export default class MapConstructor {

    constructor (map: Maybe<BuildingMap>, updateMap: Maybe<(map: BuildingMap) => void>) {
        this.map = map ? cloneDeep(map) : buildingEmptyMapJson as BuildingMap
        this.updateStructure()
        this.setVisibleSections(this.getSections().map(section => section.id))
        this.updateMap = updateMap
    }    

    private updateFormField () {
        this.updateMap(this.map)
    }

    public setEditMode (mode: string): void {
        switch (mode) {
            case 'addSection':
                this.selectedUnit = null
                this.selectedSection = null
                break              
            case 'editSection':
                this.selectedUnit = null
                break        
            case 'addUnit':
                this.selectedSection = null
                this.selectedUnit = null
                break        
            case 'editUnit':
                this.selectedSection = null
                break        
            default:
                this.mode = 'addSection'
        }
        this.mode = mode
    }

    public getEditMode (): string {
        return this.mode
    }
    

    // view sections
    public visibleSections: CheckboxValueType[]
    public setVisibleSections (ids: CheckboxValueType[]): void {
        this.visibleSections = ids
    }
    public isSectionVisible (id: string): boolean {
        return this.visibleSections.includes(id)
    }

    // Edit section
    private selectedSection: BuildingSection
    public setSelectedSection (section: BuildingSection): void{
        if (this.isSectionSelected(section.id)) {
            this.selectedSection = null
            this.setEditMode('addSection')
        } else {
            this.selectedSection = section
            this.setEditMode('editSection')
        }        
    }
    public getSelectedSection (): BuildingSection {
        return this.selectedSection
    }
    public isSectionSelected (id: string): boolean {
        return this.selectedSection && this.selectedSection.id === id
    }

    // Edit unit
    private selectedUnit: BuildingUnit    
    public setSelectedUnit (unit: BuildingUnit): void {
        if (this.isUnitSelected(unit.id)) {
            this.setEditMode('addUnit')
            this.selectedUnit = null
        } else {
            this.setEditMode('editUnit')
            this.selectedUnit = unit
        }        
    }
    public getSelectedUnit (): BuildingUnit {
        return this.selectedUnit ? this.getUnitInfo(this.selectedUnit.id) : null
    } 
    public isUnitSelected (id: string): boolean {
        return this.selectedUnit && this.selectedUnit.id === id
    }

    private getNextUnitNumber (): number {
        const result = Math.max(0, ...this.map.sections
            .map(section => section.floors
                .map(floor => floor.units
                    .map(unit => !isNaN(+unit.label) ? Number(unit.label) : 0)))
            .flat(2)) + 1
        return result
    }

    private getMaxFloor (): number {
        return Math.max(...this.map.sections
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        )
    }
    
    private getMinFloor (): number {
        return Math.min(...this.map.sections
            .map(section => section.floors
                .map(floor => floor.index))
            .flat()
        )
    }    

    public getPossibleFloors (): number[] {
        const minFloor = this.getMinFloor()
        const maxFloor = this.getMaxFloor()
        const floors = []
        for (let floorIndex = minFloor; floorIndex <= maxFloor; floorIndex++) {
            if (floorIndex !== 0) {
                floors.unshift(floorIndex)
            }
        }
        return floors
    }

    public isEmpty (): boolean {
        return this.map.sections.length === 0
    }

    public getSections (): BuildingSection[] {
        return this.map.sections
    }
    
    private updateStructure (): void {
        this.map.autoincrement = 0
        this.map.sections.forEach(section => {
            section.type = 'section'
            section.id = String(++this.map.autoincrement)
            section.floors.forEach(floor => {
                floor.type = 'floor'
                floor.id = String(++this.map.autoincrement)
                floor.units.forEach(unit => {
                    unit.type = 'unit'
                    unit.id = String(++this.map.autoincrement)
                })
            })
        })
    }

    private getUnitIndex (unitId: string): IndexLocation {
        const result = { section: -1, floor: -1, unit: -1 }
        try {
            this.map.sections.forEach((section, sectionIdx) => {
                section.floors.forEach((floor, floorIdx) => {
                    const unitIdx = floor.units.findIndex(unit => unit.id === unitId)
                    if (unitIdx !== -1) {
                        result.section = sectionIdx
                        result.floor = floorIdx
                        result.unit = unitIdx
                        throw new Error('Found')
                    }
                })
            })
        } catch (_) {
            //
        }
        return result
    }

    public getUnitInfo (id: string): BuildingUnit {
        const newUnit = { id: null, type: 'unit', label: '', floor: '', section: '' }
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

    private updateUnitNumbers (unitFrom: BuildingUnit): void {
        const { id, label } = unitFrom
        if (isNaN(+label)) {
            return
        }
        let started = false
        let next = Number(label) + 1
        this.map.sections.forEach(section => {
            section.floors.slice().reverse().forEach(floor => {
                floor.units.forEach(unit => {
                    if (started) {
                        if (!isNaN(+unit.label)) {
                            unit.label = String(next++)
                        }
                    }
                    if (unit.id === id) {
                        started = true
                    }
                })
            })
        })
    }
        
    public getSectionOptions (): BuildingSelectOption[] {
        const options = this.getSections().map(section => ({ id: section.id, label: section.name }))
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

    public mapAddSection (section: BuildingSection): void {
        let unitNumber = this.getNextUnitNumber()
        const { name, minFloor, maxFloor, unitsOnFloor } = section
        const newSection = {
            id: String(++this.map.autoincrement),
            floors: [],
            name,
            minFloor,
            maxFloor,
            unitsOnFloor,
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
                    id: String(++this.map.autoincrement),
                    label,
                    type: 'unit',
                })
            }
            newSection.floors.unshift({
                id: String(++this.map.autoincrement),
                index: floor,
                name: String(floor),
                type: 'floor',
                units,
            })
        }
        this.map.sections.push(newSection)
        this.visibleSections.push(newSection.id)
        this.updateFormField()
    }
    
    public mapUpdateSection (section: BuildingSection): void {
        const sectionIndex = this.map.sections.findIndex(mapSection => section.id === mapSection.id)
        if (sectionIndex !== -1) {
            this.map.sections[sectionIndex].name = section.name
        }
        this.setEditMode('addSection')        
        this.updateFormField()
    }
    
    public mapRemoveSection (id: string): void {
        const sectionIndex = this.map.sections.findIndex(mapSection => mapSection.id === id)
        this.map.sections.splice(sectionIndex, 1)
        this.setEditMode('addSection')
        this.updateFormField()
    }

    public mapAddUnit (unit: BuildingUnit): void {
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
            type: 'unit',
        }
        if (!id) {
            newUnit.id = String(++this.map.autoincrement)
        }
        this.map.sections[sectionIndex].floors[floorIndex].units.push(newUnit)
        this.updateUnitNumbers(newUnit)
        this.setEditMode('addUnit')
        this.updateFormField()
    }

    public mapRemoveUnit (id: string): void {
        const unitIndex = this.getUnitIndex(id)
        if (unitIndex.unit !== -1) {
            this.map.sections[unitIndex.section].floors[unitIndex.floor].units.splice(unitIndex.unit, 1)
        }
        this.selectedUnit = null
        this.setEditMode('addUnit')
        this.updateFormField()
    }


    public mapUpdateUnit (unit: BuildingUnit): void {
        const unitIndex = this.getUnitIndex(unit.id)
        if (unitIndex.unit === -1) {
            return
        }
        const oldSection = this.map.sections[unitIndex.section].id
        const oldFloor = this.map.sections[unitIndex.section].floors[unitIndex.floor].id
        
        if (oldFloor !== unit.floor || oldSection !== unit.section) {
            this.mapRemoveUnit(unit.id)
            this.mapAddUnit(unit)
        } else {
            this.map.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].label = unit.label
            this.updateUnitNumbers(unit)
        }
        this.setEditMode('editUnit')
        this.updateFormField()
    }

    private map: BuildingMap
    private mode = 'addSection'    
    private updateMap: (map: BuildingMap) => void
}
