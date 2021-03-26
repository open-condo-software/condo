import cloneDeep from 'lodash/cloneDeep'

enum BDataTypes {
    Section = 'section',
    Floor = 'floor',
    Unit = 'unit',
}

type BDataUnit = {
    type: BDataTypes.Unit,
    id: string | number,
    name?: string
    label?: string
}

type BDataFloor = {
    type: BDataTypes.Floor,
    id: string | number,
    index?: number,
    name?: string,
    units: BDataUnit[],
}

type BDataSection = {
    type: BDataTypes.Section,
    id: string | number,
    name?: string,
    floors: BDataFloor[],
}

export class BBuildingData {
    private data: BDataSection[]
    private uniqKey: number
    private _matrix: { floors: any[]; sections: any[] }

    constructor ({ sections }: { sections: BDataSection[] }) {
        this._checkData(sections)
        this.data = sections
        this.uniqKey = 1 // TODO(pahaz): think to remove it!
        this._matrix = this._getVisualMatrix()
    }

    private _checkData (data: BDataSection[]) {
        const sectionsIds = new Set()
        const unitsIds = new Set()

        data.forEach((section) => {
            if (section.type !== BDataTypes.Section) throw new Error('type !== section')
            if (!section.id) throw new Error('no section.id')
            if (!section.floors) throw new Error('no section.floors')
            if (sectionsIds.has(section.id)) throw new Error('duplicate section.id')

            sectionsIds.add(section.id)
            let floorIndex = Infinity
            const floorsIds = new Set()

            section.floors.forEach((floor) => {
                if (floor.type !== BDataTypes.Floor) throw new Error('type !== floor')
                if (!floor.id) throw new Error('no floor.id')
                if (!floor.units) throw new Error('no floor.units')
                if (floorsIds.has(floor.id)) throw new Error('duplicate floor.id')

                floorsIds.add(floor.id)

                if (!floor.index) throw new Error('no floor.index')
                if (floorIndex <= floor.index) throw new Error('floor.index wrong order')
                if (floorIndex === 0) throw new Error('floor.index !== 0')

                floorIndex = floor.index

                floor.units.forEach((unit) => {
                    if (unit.type !== BDataTypes.Unit) throw new Error('type !== unit')
                    if (!unit.id) throw new Error('no unit.id')
                    if (unitsIds.has(unit.id)) throw new Error('duplicate unit.id')

                    unitsIds.add(unit.id)
                })
            })
        })
    }

    private _getMaxMinFloorIndex () {
        let maxFlor = -Infinity
        let minFlor = Infinity
        this.data.forEach((section) => {
            section.floors.forEach((floor) => {
                if (floor.index > maxFlor) maxFlor = floor.index
                if (floor.index < minFlor) minFlor = floor.index
            })
        })
        return [maxFlor, minFlor]
    }

    private _getSectionsSizes () {
        return this.data.map(section => {
            let size = 0
            section.floors.forEach((floor) => {
                if (size < floor.units.length) size = floor.units.length
            })
            return size
        })
    }

    private _getFloorIndex (index) {
        let name = `${index}`
        let floorId, floorIdIndex, floorSectionIdIndex
        const sections = []
        const sectionSizes = this._getSectionsSizes()
        this.data.forEach((section, sectionIndex) => {
            const size = sectionSizes[sectionIndex]
            const units = []
            section.floors.forEach((floor, floorIndex) => {
                if (floor.index !== index) return
                if (floor.id && !floorId) {  // first! not the last
                    floorId = floor.id
                    floorIdIndex = floorIndex
                    floorSectionIdIndex = sectionIndex
                    if (floor.name) name = floor.name
                }
                floor.units.forEach((unit, unitIndex) => {
                    units.push(Object.assign({ key: this.uniqKey++, pos: [sectionIndex, floorIndex, unitIndex] }, unit))
                })
            })
            while (units.length < size) units.push({ type: 'empty', key: this.uniqKey++ })
            sections.push({ id: section.id, key: this.uniqKey++, pos: [sectionIndex], units })
        })
        return { id: floorId, key: this.uniqKey++, pos: [floorSectionIdIndex, floorIdIndex], name, sections }
    }

    private _updateUnitNames (maxFlor, minFlor, sectionSizes, floorsMap) {
        let maxName = 0
        for (let s = 0; s < sectionSizes.length; s++) {
            for (let f = 1; f <= maxFlor; f++) {
                const units = floorsMap[f].sections[s].units

                for (let i = 0; i < units.length; i++) {
                    const unit = units[i]

                    if (unit.type !== BDataTypes.Unit) continue

                    const name = unit.name
                    const nameInt = parseInt(name)

                    if (!name) {
                        unit.name = `${maxName++ + 1}`
                        unit.isNameAutoGenerated = true
                    } else if (!Number.isNaN(nameInt) && nameInt > maxName) {
                        maxName = nameInt
                    }
                }
            }
        }
    }

    private _getVisualMatrix () {
        const [maxFloor, minFloor] = this._getMaxMinFloorIndex()
        const sectionSizes = this._getSectionsSizes()

        // floors
        const floors = []
        const floorsMap = {}

        for (let x = maxFloor; x >= minFloor; x--) {
            if (x === 0) continue
            const floor = this._getFloorIndex(x)
            floors.push(floor)
            floorsMap[x] = floor
        }

        // fix names
        this._updateUnitNames(maxFloor, minFloor, sectionSizes, floorsMap)

        // sections
        const sections = []
        for (let x = 0; x < sectionSizes.length; x++) {
            sections.push({
                id: this.data[x].id,
                key: this.uniqKey++,
                name: this.data[x].name || '',
                size: sectionSizes[x],
                pos: [x],
            })
        }
        return { floors, sections }
    }

    public getVisualMatrix () {
        return this._matrix
    }
}

export function addNewBBuildingUnitToSectionData (section: BDataSection, floorIndex: number, unit: BDataUnit) {
    if (!unit) throw new Error('no unit')
    if (floorIndex === 0) throw new Error('floorIndex !== 0')
    if (!section) throw new Error('no section')
    if (typeof section !== 'object') throw new Error('wrong section type')
    if (section.type !== BDataTypes.Section) throw new Error('section.type !== "section"')
    if (!section.id) throw new Error('no section.id')
    if (!section.floors) throw new Error('no section.floors')
    if (!Array.isArray(section.floors)) throw new Error('wrong section.floors type')

    const unitId = `new-${Math.random()}`
    const newUnit = {
        id: unitId,
        type: BDataTypes.Unit,
        ...unit,
    }
    let insertAt = section.floors.length
    let pushAt = null
    for (let i = 0; i < section.floors.length; i++) {
        const floor = section.floors[i]
        if (typeof floor !== 'object') throw new Error('wrong floor type')
        if (floor.type !== BDataTypes.Floor) throw new Error('floor.type !== "floor"')
        if (!floor.id) throw new Error('no floor.id')
        if (!floor.index) throw new Error('no floor.index')
        if (!floor.units) throw new Error('no floor.units')
        if (!Array.isArray(floor.units)) throw new Error('wrong floor.units type')
        if (floor.index > floorIndex) {
            // continue
        } else if (floor.index === floorIndex) {
            pushAt = i
            insertAt = null
            break
        } else if (floor.index < floorIndex) {
            pushAt = null
            insertAt = i
            break
        } else {
            throw new Error('unexpected insert/push state #1')
        }
    }

    if (pushAt !== null) {
        section.floors[pushAt].units.push(newUnit)
    } else if (insertAt !== null) {
        section.floors.splice(insertAt, 0, {
            id: `${unitId}-floor`,
            type: BDataTypes.Floor,
            index: floorIndex,
            name: `${floorIndex}`,
            units: [newUnit],
        })
    } else {
        throw new Error('unexpected insert/push state #2')
    }
}

export function createNewBBuildingSectionData ({ sectionName, maxFloor, minFloor, unitsPerFloor }): BDataSection {
    if (typeof sectionName !== 'string') throw new Error('sectionName is not a string')
    if (!sectionName) throw new Error('no sectionName')
    if (!maxFloor) throw new Error('no maxFloor')
    if (!minFloor) throw new Error('no minFloor')
    if (!unitsPerFloor) throw new Error('no unitsPerFloor')
    if (unitsPerFloor < 0) throw new Error('unitsPerFloor < 0')
    if (minFloor > maxFloor) throw new Error('minFloor > maxFloor')
    const sectionId = `new-${Math.random()}`
    let floorIndex = maxFloor
    let unitIndex = 1
    return {
        id: sectionId,
        name: sectionName,
        type: BDataTypes.Section,
        floors: [...Array(maxFloor - minFloor + ((minFloor < 0) ? 0 : 1)).keys()].map(() => {
            if (floorIndex === 0) floorIndex = -1
            unitIndex = 1
            const floor: BDataFloor = {
                id: `${sectionId}-${floorIndex}`,
                name: `${floorIndex}`,
                type: BDataTypes.Floor,
                index: floorIndex,
                units: [...Array(unitsPerFloor).keys()].map(() => {
                    return {
                        id: `${sectionId}-${floorIndex}-${unitIndex++}`,
                        type: BDataTypes.Unit,
                    }
                }),
            }
            floorIndex--
            return floor
        }),
    }
}

type Data = {
    sections: Array<BDataSection>
}

export function updateUnitsLabels (data: Data) {
    const unitsData = cloneDeep(data)
    let counter = 1

    unitsData.sections.map(
        (section) => {
            for (let i = section.floors.length - 1; i >= 0; i--) {
                section.floors[i].units.map((unit) => {
                    if (unit.name) {
                        if (typeof Number(unit.name) === 'number') {
                            if (Number(unit.name) > counter) {
                                counter = Number(unit.name)
                            }
                        }

                        unit.label = String(unit.name)
                    } else {
                        counter++

                        unit.label = String(counter)
                    }
                })
            }
        }
    )

    return unitsData
}