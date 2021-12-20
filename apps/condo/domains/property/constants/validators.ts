import { AddressMetaField } from '@app/condo/schema'

// "д" - "дом" or "к" - "корпус"
export const validHouseTypes: AddressMetaField['data']['house_type_full'][] = ['дом', 'корпус', 'строение', 'домовладение', 'сооружение', 'владение']
