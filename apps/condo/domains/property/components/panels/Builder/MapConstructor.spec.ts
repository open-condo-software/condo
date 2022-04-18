import { BuildingMap, BuildingMapEntityType, BuildingUnitType } from '@app/condo/schema'
import {
    autoFixBuildingMapJson,
    buildingMapJson,
    notValidBuildingMapJson,
} from '@condo/domains/property/constants/property'
import { cloneDeep } from 'lodash'
import { MapEdit } from './MapConstructor'

const testSection = {
    id: '',
    minFloor: -5,
    maxFloor: 10,
    unitsOnFloor: 10,
}

const sectionName = () => {
    return Math.random().toString()
}
const createBuildingMap = (sections: number, sectionTemplate = testSection): MapEdit => {
    const PropertyMap = new MapEdit(null, () => null )
    for (let i = 0; i < sections; i++){
        const name = (i + 1).toString()
        PropertyMap.addSection({ ...sectionTemplate, name, type: BuildingMapEntityType.Section })
    }
    return PropertyMap
}

const createBuildingParking = (parkingSections: number): MapEdit => {
    const propertyMap = new MapEdit(null, () => null)
    for (let i = 0; i < parkingSections; i++) {
        const name = (i + 1).toString()
        propertyMap.addParking({ ...testSection, name, type: BuildingMapEntityType.Section })
    }
    return propertyMap
}

const createBuilding = (data): MapEdit => {
    const Map = new MapEdit(JSON.parse(JSON.stringify(data)), () => null)
    return Map
}

describe('Map constructor', () => {
    describe('Repair structure', () => {
        it('should remove preview attributes if they occasionally exists', () => {
            const Building = new MapEdit(cloneDeep(autoFixBuildingMapJson) as unknown as BuildingMap, () => null )
            const map = Building.getMap()
            expect(map.sections[0]).not.toHaveProperty('preview')
            expect(map.sections[0].floors[0].units[0]).not.toHaveProperty('preview')
        })
        it('should add floor index', () => {
            const Building = new MapEdit(cloneDeep(autoFixBuildingMapJson) as unknown as BuildingMap, () => null )
            const map = Building.getMap()
            expect(map.sections[0].floors[0]).toHaveProperty('index')
        })
        it('should remove null names from units', () => {
            const Building = new MapEdit(cloneDeep(autoFixBuildingMapJson) as unknown as BuildingMap, () => null )
            const map = Building.getMap()
            expect(map.sections[0].floors[0].units[0]).not.toHaveProperty('name')
        })
        it('should add unitType attribute if it not exists',  () => {
            const Building = new MapEdit(cloneDeep(autoFixBuildingMapJson) as unknown as BuildingMap, () => null)
            const map = Building.getMap()
            expect(map.sections[0].floors[0].units[0]).toHaveProperty('unitType')
            expect(map.sections[0].floors[0].units[0].unitType).toEqual('flat')
        })
        it('should add empty parking section if it not exists', () => {
            const Building = new MapEdit(cloneDeep(autoFixBuildingMapJson) as unknown as BuildingMap, () => null)
            const map = Building.getMap()
            expect(map.parking).toBeDefined()
            expect(Array.isArray(map.parking)).toBeTruthy()
            expect(map.parking).toHaveLength(0)
        })
    })

    describe('Service functions', () => {
        describe('Select options for sections', () => {
            it('should correctly generate floor list for choosed section', () => {
                const Building = createBuildingMap(5)
                expect(Building.sections).toHaveLength(5)
                expect(Building.getSectionFloorOptions(Building.sections[0].id)).toHaveLength(15)
            })
        })
        describe('Select options for floors', () => {
            it('should correctly generate sections list', () => {
                const Building = createBuildingMap(14)
                expect(Building.getSectionOptions()).toHaveLength(14)
            })
        })
        describe('getUnitInfo by id', () => {
            it('should correctly get unit position on section and floor', () => {
                const Building = createBuildingMap(5)
                const jsonMap = Building.getMap()
                const unitFromMap = jsonMap.sections[2].floors[2].units[2]
                const unit = Building.getUnitInfo(unitFromMap.id)
                expect(unit.section).toEqual(jsonMap.sections[2].id)
                expect(unit.floor).toEqual(jsonMap.sections[2].floors[2].id)
            })
        })
        describe('getting floors range', () => {
            it('should correctly get min and max floor from all sections', () => {
                const PropertyMap = new MapEdit(null, () => null )
                PropertyMap.addSection({ id: '', minFloor: -2, maxFloor: 5, unitsOnFloor: 10, name: sectionName() })
                PropertyMap.addSection({ id: '', minFloor: -1, maxFloor: 10, unitsOnFloor: 10, name: sectionName() })
                expect(PropertyMap.possibleFloors).toEqual([ 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2 ])
            })
        })
    })

    describe('Unit operations', () => {
        describe('Add unit', () => {
            it('should be correctly placed to map', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
                Building.addUnit(newUnit)
                const newJsonMap = Building.getMap()
                const found = newJsonMap.sections[3].floors[3].units.find(u => u.label === newUnit.label)
                expect(found).not.toBeUndefined()
            })
            it('after adding unit with numeric label should update names of units placed next', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const unitPlacedAfterLabel = jsonMap.sections[5].floors[5].units[5].label
                const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
                Building.addUnit(newUnit)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.sections[5].floors[5].units[5].label).not.toEqual(unitPlacedAfterLabel)
            })
            it('after adding unit with not-numeric label shouldn\'t update names of units placed before', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const unitPlacedBefore = jsonMap.sections[1].floors[1].units[1]
                const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
                Building.addUnit(newUnit)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.sections[1].floors[1].units[1].label).toEqual(unitPlacedBefore.label)
            })
        })

        describe('Edit unit', () => {
            it('should update name of edited unit', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const updatedUnit = jsonMap.sections[5].floors[5].units[5]
                Building.updateUnit({ ...updatedUnit, ...{
                    floor: jsonMap.sections[5].floors[5].id,
                    section: jsonMap.sections[5].id,
                    label: 'Test label',
                } })
                const newJsonMap = Building.getMap()
                const unitToCompare = newJsonMap.sections[5].floors[5].units[5]
                expect(unitToCompare.name).toEqual('Test label')
                expect(unitToCompare.label).toEqual(updatedUnit.label)
            })
            it('should correctly update map if floor/section is changed', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const updatedUnit = jsonMap.sections[5].floors[5].units[5]
                Building.updateUnit({ ...updatedUnit,
                    label: 'Test label',
                    floor:  jsonMap.sections[2].floors[2].id,
                    section: jsonMap.sections[2].id,
                })
                const newJsonMap = Building.getMap()
                const info = Building.getUnitInfo(updatedUnit.id)
                expect(info.floor).toEqual(newJsonMap.sections[2].floors[2].id)
                expect(info.section).toEqual(newJsonMap.sections[2].id)
            })
            it('should not save map if section name is not unique', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const updatedUnit = jsonMap.sections[5].floors[5].units[5]
                Building.updateUnit({ ...updatedUnit, ...{
                    floor: jsonMap.sections[5].floors[5].id,
                    section: jsonMap.sections[5].id,
                    label: jsonMap.sections[0].floors[0].units[0].label,
                } })
                const newJsonMap = Building.getMap()
                const unitToCompare = newJsonMap.sections[5].floors[5].units[5]

                expect(unitToCompare.name).toEqual(jsonMap.sections[0].floors[0].units[0].label)
                expect(Building.validate()).not.toBeTruthy()
                expect(Building.validationErrors).toHaveLength(1)
                expect(Building.validationErrors[0]).toEqual('Name of unit label must be unique')
            })
        })

        describe('Delete unit', () => {
            it('should remove unit from map', () => {
                const Building = createBuildingMap(5)
                const jsonMap = Building.getMap()
                const unitToRemove = jsonMap.sections[1].floors[1].units[1]
                Building.removeUnit(unitToRemove.id)
                const found = Building.getUnitInfo(unitToRemove.id)
                expect(found.floor).toBe('')
            })
            it('should update next units labels', () => {
                const Building = createBuildingMap(5)
                const jsonMap = Building.getMap()
                const unitToRemove = jsonMap.sections[1].floors[1].units[1]
                const unitToRemoveLabel = unitToRemove.label
                Building.removeUnit(unitToRemove.id)
                const newJsonMap = Building.getMap()
                const nextUnit = newJsonMap.sections[1].floors[1].units[1]
                expect(nextUnit.id).not.toEqual(unitToRemove.id)
                expect(nextUnit.label).toEqual(unitToRemoveLabel)
            })
            it('should remove floor if no units remain', () => {
                const Building = createBuildingMap(5)
                const jsonMap = Building.getMap()
                const floorsBefore = jsonMap.sections[1].floors.length
                const unitsToRemove = [...jsonMap.sections[1].floors[0].units]
                unitsToRemove.forEach(unit => {
                    Building.removeUnit(unit.id)
                })
                const newJsonMap = Building.getMap()
                expect(newJsonMap.sections[1].floors).toHaveLength(floorsBefore - 1)
            })
            it('should not add zero floor when last unit was deleted from negative floor', () => {
                const sectionTemplate = {
                    id: '',
                    minFloor: -2,
                    maxFloor: 2,
                    unitsOnFloor: 1,
                }
                const Building = createBuildingMap(2, sectionTemplate)
                const jsonMap = Building.getMap()
                Building.removeUnit(jsonMap.sections[0].floors[2].units[0].id)
                expect(jsonMap.sections[0].floors).toHaveLength(3)
                expect(jsonMap.sections[0].floors.map(floor => floor.index)).toStrictEqual([2, 1, -2])
                expect(jsonMap.sections[1].floors.map(floor => floor.index)).toEqual(expect.not.arrayContaining([0]))
            })
        })
    })

    describe('Parking unit operations', () => {
        describe('Add parking unit', () => {
            it('should be correctly placed to map', () => {
                const Building = createBuildingParking(10)
                const jsonMap = Building.getMap()
                const newUnit = { id: '', floor: jsonMap.parking[3].floors[3].id, section: jsonMap.parking[3].id, label: '1000' }
                Building.addParkingUnit(newUnit)
                const newJsonMap = Building.getMap()
                const found = newJsonMap.parking[3].floors[3].units.find(u => u.label === newUnit.label)
                expect(found).not.toBeUndefined()
            })

            it('after adding parking unit with numeric label should update names of units placed next', () => {
                const Building = createBuildingParking(10)
                const jsonMap = Building.getMap()
                const unitPlacedAfterLabel = jsonMap.parking[5].floors[5].units[5].label
                const newUnit = { id: '', floor: jsonMap.parking[3].floors[3].id, section: jsonMap.parking[3].id, label: '1000' }
                Building.addParkingUnit(newUnit)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.parking[5].floors[5].units[5].label).not.toEqual(unitPlacedAfterLabel)
            })

            it('after adding parking unit with not-numeric label shouldn\'t update names of units placed before', () => {
                const Building = createBuildingParking(10)
                const jsonMap = Building.getMap()
                const unitPlacedBefore = jsonMap.parking[1].floors[1].units[1]
                const newUnit = { id: '', floor: jsonMap.parking[3].floors[3].id, section: jsonMap.parking[3].id, label: '1000' }
                Building.addParkingUnit(newUnit)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.parking[1].floors[1].units[1].label).toEqual(unitPlacedBefore.label)
            })
        })

        describe('Edit parking unit', () => {
            it('should update name of edited parking unit', () => {
                const Building = createBuildingParking(10)
                const jsonMap = Building.getMap()
                const updatedUnit = jsonMap.parking[5].floors[5].units[5]
                Building.updateParkingUnit({ ...updatedUnit, ...{
                    floor: jsonMap.parking[5].floors[5].id,
                    section: jsonMap.parking[5].id,
                    label: 'Test label',
                } })
                const newJsonMap = Building.getMap()
                const unitToCompare = newJsonMap.parking[5].floors[5].units[5]

                expect(unitToCompare.unitType).toEqual('parking')
                expect(unitToCompare.name).toBeDefined()
                expect(unitToCompare.name).toEqual('Test label')
                expect(unitToCompare.label).toEqual(updatedUnit.label)
            })

            it('should correctly update map if floor/section of parking was changed', () => {
                const Building = createBuildingParking(10)
                const jsonMap = Building.getMap()
                const updatedUnit = jsonMap.parking[5].floors[5].units[5]
                Building.updateParkingUnit({ ...updatedUnit,
                    floor:  jsonMap.parking[2].floors[2].id,
                    section: jsonMap.parking[2].id,
                    label: 'Test label',
                })
                const newJsonMap = Building.getMap()
                const info = Building.getParkingUnitInfo(updatedUnit.id)
                expect(info.floor).toEqual(newJsonMap.parking[2].floors[2].id)
                expect(info.section).toEqual(newJsonMap.parking[2].id)
            })
        })

        describe('Delete parking unit', () => {
            it('should remove parking unit from map', () => {
                const Building = createBuildingParking(5)
                const jsonMap = Building.getMap()
                const unitToRemove = jsonMap.parking[1].floors[1].units[1]
                Building.removeParkingUnit(unitToRemove.id)
                const found = Building.getParkingUnitInfo(unitToRemove.id)
                expect(found.floor).toBe('')
            })

            it('should update next parking units labels', () => {
                const Building = createBuildingParking(5)
                const jsonMap = Building.getMap()
                const unitToRemove = jsonMap.parking[1].floors[1].units[1]
                const unitToRemoveLabel = unitToRemove.label
                Building.removeParkingUnit(unitToRemove.id)
                const newJsonMap = Building.getMap()
                const nextUnit = newJsonMap.parking[1].floors[1].units[1]
                expect(nextUnit.id).not.toEqual(unitToRemove.id)
                expect(nextUnit.label).toEqual(unitToRemoveLabel)
            })

            it('should remove floor if no parking units remain', () => {
                const Building = createBuildingParking(5)
                const jsonMap = Building.getMap()
                const floorsBefore = jsonMap.parking[1].floors.length
                const unitsToRemove = [...jsonMap.parking[1].floors[0].units]
                unitsToRemove.forEach(unit => {
                    Building.removeParkingUnit(unit.id)
                })
                const newJsonMap = Building.getMap()
                expect(newJsonMap.parking[1].floors).toHaveLength(floorsBefore - 1)
            })
        })
    })

    describe('Section operations', () => {
        describe('Add section', () => {
            it('have valid structure on section add', () => {
                const Building = createBuildingMap(5)
                Building.addSection({ id: '', minFloor: -10, maxFloor: 10, unitsOnFloor: 10, name: sectionName() })
                expect(Building.sections).toHaveLength(6)
                Building.validate()
                expect(Building.isMapValid).toBe(true)
                expect(Building.isEmpty).toBeFalsy()
                expect(Building.isEmptySections).toBeFalsy()
                expect(Building.isEmptyParking).toBeTruthy()
            })
            it('units should have selected unitType', () => {
                const Building = createBuildingMap(5)
                Building.addSection({
                    id: '', minFloor: -10, maxFloor: 10, unitsOnFloor: 10, name: sectionName(),
                }, BuildingUnitType.Commercial)
                expect(Building.sections).toHaveLength(6)
                Building.validate()
                const newSectionUnitTypes = Building.sections[5].floors
                    .map(floor => floor.units.map(unit => unit.unitType)).flat(2)
                expect(Building.isMapValid).toBeTruthy()
                expect(newSectionUnitTypes.every(unitType => unitType === BuildingUnitType.Commercial)).toBeTruthy()
            })
        })
        describe('Edit section', () => {
            it('should update structure in json on section edit', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const updatedSection = jsonMap.sections[1]
                Building.updateSection({ ...updatedSection, name: 'Test Section Name' })
                Building.validate()
                expect(Building.isMapValid).toBe(true)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.sections[0].name).not.toEqual('Test Section Name')
                expect(newJsonMap.sections[1].name).toEqual('Test Section Name')
            })
        })
        describe('Delete section', () => {
            it('should be removed', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const removeSection = jsonMap.sections[1]
                Building.removeSection(removeSection.id)
                Building.validate()
                expect(Building.isMapValid).toBe(true)
                expect(Building.sections).toHaveLength(9)
            })
            it('should rename section names in order', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const removeSection = jsonMap.sections[1]
                Building.removeSection(removeSection.id)
                Building.validate()

                const sectionNames = Array
                    .from({ length: Building.map.sections.length }, (_, index) => String(++index))
                expect(Building.isMapValid).toBeTruthy()
                expect(Building.map.sections.map(section => section.name)).toEqual(sectionNames)
            })
        })
        describe('Copy section',  () => {
            it('should add full copy of selected section',  () => {
                const Building = createBuildingMap(1)
                Building.removeUnit(Building.sections[0].floors[0].units[0].id)
                Building.addCopySection(Building.sections[0].id)
                Building.validate()

                expect(Building.isMapValid).toBeTruthy()
                expect(Building.sections).toHaveLength(2)
                expect(Building.sections[1]).not.toHaveProperty('preview')
                expect(Building.sections[1]).toHaveProperty('name', String(Building.sections.length))
                expect(Building.sections[0].floors[0].units).toHaveLength(Building.sections[1].floors[0].units.length)
            })
        })
    })

    describe('Floor operations',  () => {
        describe('Add section floor', () => {
            it('should add floor into passed section index & update existing indexes', () => {
                const Building = createBuildingMap(5)
                const buildingFloors = Building.sections[0].floors.length
                const modifiedSection = Building.sections[0]

                Building.addSectionFloor({
                    section: 0,
                    unitCount: 2,
                    unitType: BuildingUnitType.Commercial,
                    index: 11,
                })
                const floorIndexes = modifiedSection.floors.map(({ index }) => index)
                const floorUnitTypes = modifiedSection.floors[0].units.map(unit => unit.unitType)
                Building.validate()

                expect(Building.isMapValid).toBeTruthy()
                expect(modifiedSection.floors).toHaveLength(buildingFloors + 1)
                expect(modifiedSection.floors[0].units).toHaveLength(2)
                expect(modifiedSection.floors[0].index).toEqual(11)
                expect(floorUnitTypes).toStrictEqual(Array.from({ length: 2 }, () => BuildingUnitType.Commercial))
                expect(new Set(floorIndexes).size).toEqual(floorIndexes.length)
            })

            it('should add negative floor into section & update only negative floor labels', () => {
                const Building = createBuildingMap(5)
                const buildingFloors = Building.sections[0].floors.length
                const modifiedSection = Building.sections[0]
                Building.addSectionFloor({
                    section: 0,
                    unitCount: 2,
                    unitType: BuildingUnitType.Warehouse,
                    index: -7,
                })
                const floorIndexes = modifiedSection.floors.map(({ index }) => index)

                Building.validate()
                expect(Building.isMapValid).toBeTruthy()
                expect(modifiedSection.floors).toHaveLength(buildingFloors + 1)
                expect(modifiedSection.floors[15].units).toHaveLength(2)
                expect(modifiedSection.floors[15].index).toEqual(-7)
                expect(new Set(floorIndexes).size).toEqual(floorIndexes.length)
            })
        })
    })

    describe('Parking operations', () => {
        describe('Add parking', () => {
            it('should have valid structure on parking add', () => {
                const Building = createBuildingParking(5)
                Building.addParking({ id: '', minFloor: -7, maxFloor: 3, unitsOnFloor: 3, name: sectionName() })
                expect(Building.parking).toHaveLength(6)
                Building.validate()
                expect(Building.isMapValid).toBeTruthy()
                expect(Building.isEmpty).toBeFalsy()
                expect(Building.isEmptySections).toBeTruthy()
                expect(Building.isEmptyParking).toBeFalsy()
            })
        })

        describe('Delete parking', () => {
            it('should be removed', () => {
                const Building = createBuildingParking(5)
                const jsonMap = Building.getMap()
                const removeSection = jsonMap.parking[1]
                Building.removeParking(removeSection.id)
                Building.validate()
                expect(Building.isMapValid).toBe(true)
                expect(Building.parking).toHaveLength(4)
            })

            it('should rename parking unit names in order', () => {
                const Building = createBuildingParking(5)
                const jsonMap = Building.getMap()
                const removeSection = jsonMap.parking[1]
                Building.removeParking(removeSection.id)
                Building.validate()

                const sectionNames = Array
                    .from({ length: Building.map.parking.length }, (_, index) => String(++index))
                expect(Building.isMapValid).toBeTruthy()
                expect(Building.map.parking.map(parkingSection => parkingSection.name)).toEqual(sectionNames)
            })
        })

        describe('Copy parking', () => {
            it('should add full copy of selected parking section', () => {
                const Building = createBuildingParking(1)
                Building.removeParkingUnit(Building.parking[0].floors[0].units[0].id)
                Building.addCopyParking(Building.parking[0].id)
                Building.validate()

                expect(Building.isMapValid).toBeTruthy()
                expect(Building.parking).toHaveLength(2)
                expect(Building.parking[1]).not.toHaveProperty('preview')
                expect(Building.parking[1]).toHaveProperty('name', String(Building.parking.length))
                expect(Building.parking[0].floors[0].units).toHaveLength(Building.parking[1].floors[0].units.length)
            })
        })
    })

    describe('Checking validation', () => {
        it('should be valid after unit operations', () => {
            const Building = createBuildingMap(10)
            const jsonMap = Building.getMap()
            const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
            Building.addUnit(newUnit)
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            Building.updateUnit({ ...jsonMap.sections[3].floors[3].units[3], label: 'Test label' })
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            Building.removeUnit(jsonMap.sections[3].floors[3].units[3].id)
            Building.validate()
            expect(Building.isMapValid).toBe(true)
        })
        it('should be valid after section operations', () => {
            const Building = createBuildingMap(10)
            const jsonMap = Building.getMap()
            Building.addSection({ id: '', minFloor: -10, maxFloor: 10, unitsOnFloor: 10, name: sectionName() })
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            const updatedSection = jsonMap.sections[1]
            Building.updateSection({ ...updatedSection, name: 'Test Section Name' })
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            Building.removeSection(updatedSection.id)
            Building.validate()
            expect(Building.isMapValid).toBe(true)
        })

        describe('Check that JSON schema validator is working', () => {
            it('should react to bad structure', () => {
                const Building = new MapEdit(null, () => null )
                Building.map = cloneDeep(notValidBuildingMapJson) as BuildingMap
                const isValid = Building.validateSchema()
                expect(isValid).toBe(false)
                expect(Building.validationErrors).toHaveLength(1)
            })
            it('should pass validation on good structure', () => {
                const Building = new MapEdit(null, () => null )
                Building.map = cloneDeep(buildingMapJson) as BuildingMap
                const isValid = Building.validateSchema()
                expect(isValid).toBe(true)
            })
        })
    })
})

const ONE_SECTION_TWO_FLOORS = {
    name: 'Justice 1th',
    sections: [
        {
            id: 1,
            type: 'section',
            name: '1',
            floors: [
                {
                    id: 2,
                    type: 'floor',
                    name: '2',
                    index: 2,
                    units: [
                        { id: 3, type: 'unit', name: '22' },
                        { id: 4, type: 'unit', name: '23' },
                    ],
                },
                {
                    id: 5,
                    type: 'floor',
                    name: '1',
                    index: 1,
                    units: [
                        { id: 6, type: 'unit', name: '11' },
                    ],
                },
            ],
        },
    ],
}

const TWO_SECTION_THREE_FLOORS = {
    name: 'Justice 2th',
    sections: [
        {
            id: 1,
            type: 'section',
            floors: [
                {
                    id: 2,
                    type: 'floor',
                    name: '2',
                    index: 2,
                    units: [{ id: 3, type: 'unit', name: '22' }, { id: 4, type: 'unit', name: '23' }],
                },
                {
                    id: 5,
                    type: 'floor',
                    name: '1',
                    index: 1,
                    units: [{ id: 6, type: 'unit', name: '11' }],
                },
            ],
        },
        {
            id: 7,
            type: 'section',
            index: 2,
            floors: [
                {
                    id: 8,
                    type: 'floor',
                    name: '1',
                    index: 1,
                    units: [{ id: 9, type: 'unit', name: '22x' }, { id: 10, type: 'unit', name: '23x' }],
                },
                {
                    id: 11,
                    type: 'floor',
                    name: '-1',
                    index: -1,
                    units: [{ id: 12, type: 'unit', name: '11x' }, { id: 15, type: 'unit', name: '12x' }],
                },
            ],
        },
    ],
}

describe('Check new MapConstructor to work on old JSON data', () => {
    describe('ONE_SECTION_TWO_FLOORS', () => {
        it('shoud be auto repaired (missing type, dv)', () => {
            const Building = createBuilding(ONE_SECTION_TWO_FLOORS)
            expect(Building.isMapValid).toBe(true)
        })
        it('shoud contain 1 section', () => {
            const Building = createBuilding(ONE_SECTION_TWO_FLOORS)
            expect(Building.sections).toHaveLength(1)
        })
        it('shoud contain 2 floors', () => {
            const Building = createBuilding(ONE_SECTION_TWO_FLOORS)
            const allFloors = Building.sections
                .map( section => section.floors )
                .flat()
            expect(allFloors).toHaveLength(2)
        })
        it('shoud contain 3 units', () => {
            const Building = createBuilding(ONE_SECTION_TWO_FLOORS)
            const allUnits = Building.sections
                .map( section => section.floors
                    .map( floor => floor.units))
                .flat(2)
            expect(allUnits).toHaveLength(3)
        })
    })
    describe('TWO_SECTION_THREE_FLOORS: ', () => {
        it('shoud be auto repaired (missing type, dv)', () => {
            const Building = createBuilding(TWO_SECTION_THREE_FLOORS)
            expect(Building.isMapValid).toBe(true)
        })
        it('shoud contain 2 sections', () => {
            const Building = createBuilding(TWO_SECTION_THREE_FLOORS)
            expect(Building.sections).toHaveLength(2)
        })
        it('shoud contain 4 floors', () => {
            const Building = createBuilding(TWO_SECTION_THREE_FLOORS)
            const allFloors = Building.sections
                .map( section => section.floors )
                .flat()
            expect(allFloors).toHaveLength(4)

        })
        it('shoud contain 7 units', () => {
            const Building = createBuilding(TWO_SECTION_THREE_FLOORS)
            const allUnits = Building.sections
                .map( section => section.floors
                    .map( floor => floor.units))
                .flat(2)
            expect(allUnits).toHaveLength(7)
        })
    })
})
