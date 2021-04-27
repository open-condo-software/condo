import { buildingEmptyMapJson } from '@condo/domains/property/constants/property.example'
import { cloneDeep } from 'lodash'

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


const getMap = (map: Maybe<BuildingMap>): BuildingMap => {
    return (map ? map : buildingEmptyMapJson as BuildingMap) 
}

const cloneMap = (map: Maybe<BuildingMap>): BuildingMap => {
    return cloneDeep(map)
}

const getNextUnitNumber = (map: BuildingMap): number => {
    const result = Math.max(0, ...map.sections
        .map(section => section.floors
            .map(floor => floor.units
                .map(unit => !isNaN(+unit.label) ? Number(unit.label) : 0)))
        .flat(2)) + 1
    return result 
}

const getMaxFloor = (map: BuildingMap): number => {
    return Math.max(...map.sections
        .map(section => section.floors
            .map(floor => floor.index))
        .flat()
    )
}

const getMinFloor = (map: BuildingMap): number => {
    return Math.min(...map.sections
        .map(section => section.floors
            .map(floor => floor.index))
        .flat()
    )
}

const getPossibleFloors = (map: BuildingMap): number[] => {
    const improvedMap = getMap(map)
    const min  = getMinFloor(improvedMap)
    const max = getMaxFloor(improvedMap)
    const floors = []
    for (let floorIndex = min; floorIndex <= max; floorIndex++) {
        if (floorIndex !== 0) {
            floors.unshift(floorIndex)
        }
    }
    return floors
}


const getUnitIndex = (map: BuildingMap, unitId: string): IndexLocation => {
    const result = { section: -1, floor: -1, unit: -1 }
    try {
        map.sections.forEach( (section, sectionIdx) => {
            section.floors.forEach( (floor, floorIdx)  => {
                const unitIdx =  floor.units.findIndex( unit => unit.id === unitId)
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

const getUnitInfo = (map: Maybe<BuildingMap>, id: string): BuildingUnit => {
    const improvedMap = getMap(map)
    const result = { id: null, type: 'unit', label: '', floor: '', section: '' }
    if (!id) {
        return result
    }
    const unitIndex = getUnitIndex(improvedMap, id)
    if (unitIndex.unit === -1) {
        return result
    }
    result.section = improvedMap.sections[unitIndex.section].id
    result.floor = improvedMap.sections[unitIndex.section].floors[unitIndex.floor].id
    return result
}

const getSectionFloorOptions = (map: Maybe<BuildingMap>, id: string): BuildingSelectOption[] => {
    const improvedMap = getMap(map)
    const foundSection = improvedMap.sections.find(section => section.id === id)
    if (!foundSection) {
        return []
    }
    const options = foundSection.floors.map(floor => ({ id: floor.id, label: floor.name }))
    return options
}

const getSectionOptions = (map: Maybe<BuildingMap>): BuildingSelectOption[] => {
    const improvedMap = getMap(map)
    const options = improvedMap.sections.map(section => ({ id: section.id, label: section.name }))
    return options
}

const mapAddSection = (map: Maybe<BuildingMap>, section: BuildingSection): BuildingMap => {
    const improvedMap = cloneMap(map)
    let unitNumber = getNextUnitNumber(improvedMap)
    improvedMap.autoincrement = improvedMap.autoincrement || 0 
    improvedMap.autoincrement++
    const { name, minFloor, maxFloor, unitsOnFloor } = section
    const newSection = {
        id: String(improvedMap.autoincrement),
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
                id: String(++improvedMap.autoincrement),
                label,
                type: 'unit',
            })
        }
        newSection.floors.unshift({
            id: String(++improvedMap.autoincrement),
            index: floor,
            name: String(floor),
            type: 'floor',
            units,
        })
    }
    improvedMap.sections.push(newSection)
    return improvedMap
}

const mapUpdateSection = (map: Maybe<BuildingMap>, section: BuildingSection): BuildingMap => {
    const improvedMap = cloneMap(map)
    const sectionIndex = improvedMap.sections.findIndex(sec => section.id === sec.id)
    if (sectionIndex !== -1) {
        improvedMap.sections[sectionIndex].name = section.name
    }
    return improvedMap
}

const mapRemoveSection = (map: Maybe<BuildingMap>, id: string): BuildingMap => {
    const improvedMap = cloneMap(map)
    const sectionIndex = improvedMap.sections.findIndex(sec => sec.id === id)
    improvedMap.sections.splice(sectionIndex, 1)
    return improvedMap
}

const iterate = (map: BuildingMap, fromId: string, callback: (unit: BuildingUnit) => void): void => {
    let started = false
    map.sections.forEach(section => {
        section.floors.slice().reverse().forEach(floor => {
            floor.units.forEach(unit => {
                if (started) {
                    callback(unit)
                }
                if (unit.id === fromId) {
                    started = true     
                }
            })
        })
    })
}

const updateUnitNumbers = (map: BuildingMap, unit: BuildingUnit): void => {
    if (!isNaN(+unit.label)) {
        let next = Number(unit.label) + 1
        iterate(map, unit.id, (unitToUpdate) => {
            if (!isNaN(+unitToUpdate.label)) {
                unitToUpdate.label = String(next++)
            }
        })
    }
}

const mapAddUnit = (map: Maybe<BuildingMap>, unit: BuildingUnit): BuildingMap => {
    const improvedMap = cloneMap(map)
    const sectionIndex = improvedMap.sections.findIndex(section => section.id === unit.section)
    if (sectionIndex === -1) {
        return improvedMap
    }
    const floorIndex = improvedMap.sections[sectionIndex].floors.findIndex(floor => floor.id === unit.floor)
    if (floorIndex === -1) {
        return improvedMap
    }
    if (!unit.id) {
        improvedMap.autoincrement++
        unit.id = String(improvedMap.autoincrement)
    }
    improvedMap.sections[sectionIndex].floors[floorIndex].units.push(unit)
    updateUnitNumbers(improvedMap, unit)
    return improvedMap
}

const mapUpdateUnit = (map: Maybe<BuildingMap>, unit: BuildingUnit): BuildingMap => {
    let improvedMap = cloneMap(map)
    const unitIndex = getUnitIndex(improvedMap, unit.id)
    if (unitIndex.unit === -1) {
        return improvedMap
    }
    const oldFloor = improvedMap.sections[unitIndex.section].floors[unitIndex.floor].id
    const oldSection = improvedMap.sections[unitIndex.section].id
    if (oldFloor !== unit.floor || oldSection !== unit.section) {
        improvedMap = mapRemoveUnit(improvedMap, unit.id)
        improvedMap = mapAddUnit(improvedMap, unit)
    } else {
        improvedMap.sections[unitIndex.section].floors[unitIndex.floor].units[unitIndex.unit].label = unit.label
        if (unit.label && !isNaN(+unit.label)) {
            updateUnitNumbers(improvedMap, unit)
        }
    }
    return improvedMap
}

const mapRemoveUnit = (map: Maybe<BuildingMap>, id: string): BuildingMap => {
    const improvedMap = cloneMap(map)
    const unitIndex = getUnitIndex(improvedMap, id)
    if (unitIndex.unit !== -1) {
        improvedMap.sections[unitIndex.section].floors[unitIndex.floor].units.splice(unitIndex.unit, 1)
    }
    return improvedMap
}

export {

    mapAddSection,
    mapUpdateSection,
    mapRemoveSection,

    mapAddUnit,
    mapUpdateUnit,
    mapRemoveUnit,

    getUnitInfo,
    getPossibleFloors,

    getSectionFloorOptions,
    getSectionOptions,
}