import { buildingEmptyMapJson } from '@condo/domains/property/constants/property.example'

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
    return (map ? map : buildingEmptyMapJson) as BuildingMap
}

const cloneMap = (map: Maybe<BuildingMap>): BuildingMap => {
    return JSON.parse(JSON.stringify(getMap(map)))
}

const nextUnitNumber = (map: BuildingMap): number => {
    const result = Math.max(0, ...map.sections
        .map(section => section.floors
            .map(floor => floor.units
                .map(unit => !isNaN(+unit.label) ? Number(unit.label) : 0)))
        .flat(2)) + 1
    return result 
}

const maxFloor = (map: BuildingMap): number => {
    return Math.max(...map.sections
        .map(section => section.floors
            .map(floor => floor.index))
        .flat()
    )
}

const minFloor = (map: BuildingMap): number => {
    return Math.min(...map.sections
        .map(section => section.floors
            .map(floor => floor.index))
        .flat()
    )
}

const possibleFloors = (map: BuildingMap): number[] => {
    const improvedMap = getMap(map)
    const min  = minFloor(improvedMap)
    const max = maxFloor(improvedMap)
    const possibleFloors = []
    for (let floorIndex = min; floorIndex <= max; floorIndex++) {
        if (floorIndex !== 0) {
            possibleFloors.unshift(floorIndex)
        }
    }
    return possibleFloors
}


const unitIndex = (map: BuildingMap, unitId: string): IndexLocation => {
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

const unitInfo = (map: Maybe<BuildingMap>, id: string): BuildingUnit => {
    const improvedMap = getMap(map)
    const result = { id: null, type: 'unit', label: '', floor: '', section: '' }
    if (!id) {
        return result
    }
    const idx = unitIndex(improvedMap, id)
    if (idx.unit === -1) {
        return result
    }
    result.section = improvedMap.sections[idx.section].id
    result.floor = improvedMap.sections[idx.section].floors[idx.floor].id
    return result
}

const sectionFloorOptions = (map: Maybe<BuildingMap>, id: string): BuildingSelectOption[] => {
    const improvedMap = getMap(map)
    const foundSection = improvedMap.sections.find(section => section.id === id)
    if (!foundSection) {
        return []
    }
    const options = foundSection.floors.map(floor => ({ id: floor.id, label: floor.name }))
    return options
}

const sectionOptions = (map: Maybe<BuildingMap>): BuildingSelectOption[] => {
    const improvedMap = getMap(map)
    const options = improvedMap.sections.map(section => ({ id: section.id, label: section.name }))
    return options
}

const mapAddSection = (map: Maybe<BuildingMap>, section: BuildingSection): BuildingMap => {
    const improvedMap = cloneMap(map)
    section.floors = []
    let unitNumber = nextUnitNumber(improvedMap)
    let id = improvedMap.autoincrement || 0
    section.id = String(++id)
    for (let floor = section.minFloor; floor <= section.maxFloor; floor++) {
        if (floor === 0) {
            continue
        }
        const unitsOnFloor = []
        for (let unitOnFloor = 0; unitOnFloor < section.unitsOnFloor; unitOnFloor++) {
            let label = ' '
            if (floor > 0) {
                label = String(unitNumber)
                unitNumber++
            }
            unitsOnFloor.push({
                id: String(++id),
                label: label,
                type: 'unit',
            })
        }
        section.floors.unshift({
            id: String(++id),
            index: floor,
            name: String(floor),
            type: 'floor',
            units: unitsOnFloor,
        })
    }
    improvedMap.sections.push(section)
    improvedMap.autoincrement = id
    return improvedMap
}

const mapUpdateSection = (map: Maybe<BuildingMap>, section: BuildingSection): BuildingMap => {
    const improvedMap = cloneMap(map)
    const idx = improvedMap.sections.findIndex(sec => section.id === sec.id)
    if (idx !== -1) {
        improvedMap.sections[idx].name = section.name
    }
    return improvedMap
}

const mapRemoveSection = (map: Maybe<BuildingMap>, id: string): BuildingMap => {
    const improvedMap = cloneMap(map)
    const idx = improvedMap.sections.findIndex(sec => sec.id === id)
    improvedMap.sections.splice(idx, 1)
    return improvedMap
}

const walk = (map: BuildingMap, fromId: string, callback: (unit: BuildingUnit) => void): void => {
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
        walk(map, unit.id, (unitToUpdate) => {
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
    const idx = unitIndex(improvedMap, unit.id)
    if (idx.unit === -1) {
        return improvedMap
    }
    const oldFloor = improvedMap.sections[idx.section].floors[idx.floor].id
    const oldSection = improvedMap.sections[idx.section].id
    if (oldFloor !== unit.floor || oldSection !== unit.section) {
        improvedMap = mapRemoveUnit(improvedMap, unit.id)
        improvedMap = mapAddUnit(improvedMap, unit)
    } else {
        improvedMap.sections[idx.section].floors[idx.floor].units[idx.unit].label = unit.label
        if (unit.label && !isNaN(+unit.label)) {
            updateUnitNumbers(improvedMap, unit)
        }
    }
    return improvedMap
}

const mapRemoveUnit = (map: Maybe<BuildingMap>, id: string): BuildingMap => {
    const improvedMap = cloneMap(map)
    const idx = unitIndex(improvedMap, id)
    if (idx.unit !== -1) {
        improvedMap.sections[idx.section].floors[idx.floor].units.splice(idx.unit, 1)
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

    unitInfo,
    possibleFloors,

    sectionFloorOptions,
    sectionOptions,
}