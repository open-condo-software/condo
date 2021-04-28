// import Ajv, {JTDDataType} from "ajv/dist/jtd"
// https://ajv.js.org/guide/typescript.html

type Maybe<T> = T | null

type BuildingUnit = {
    id: Maybe<string>
    type: string
    label?: string
    floor?: string
    section?: string
}

type BuildingFloor = {
    id: string
    index: number
    name: string
    type: string
    units: BuildingUnit[]
}

type BuildingSection = {
    id: string
    name: string
    type: string
    floors: BuildingFloor[]
    minFloor?: number
    maxFloor?: number
    unitsOnFloor?: number
}

type BuildingMap = {
    dv: number
    sections: BuildingSection[]
    autoincrement?: number
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


class MapValid {

}

class MapView extends MapValid {
    
}


class MapEdit extends MapView {

}

/*
export {
    BuildingMap,
    BuildingSection,
    BuildingFloor,
    BuildingUnit,
    MapValid,
    MapView,
    MapEdit,
}
*/