/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const AddressDetailType = require("./../AddressDetailType");
const ReferentClass = require("./../../metadata/ReferentClass");
const AddressHouseType = require("./../AddressHouseType");
const AddressBuildingType = require("./../AddressBuildingType");

class MetaAddress extends ReferentClass {
    
    constructor() {
        super();
        this.detailFeature = null;
        this.houseTypeFeature = null;
        this.buildingTypeFeature = null;
    }
    
    static initialize() {
        const AddressReferent = require("./../AddressReferent");
        MetaAddress.globalMeta = new MetaAddress();
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_STREET, "Улица", 0, 2);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_HOUSE, "Дом", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_HOUSEORPLOT, "Дом или участок", 0, 1);
        MetaAddress.globalMeta.houseTypeFeature = MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_HOUSETYPE, "Тип дома", 0, 1);
        MetaAddress.globalMeta.houseTypeFeature.addValue(AddressHouseType.ESTATE.toString(), "Владение", null, null);
        MetaAddress.globalMeta.houseTypeFeature.addValue(AddressHouseType.HOUSE.toString(), "Дом", null, null);
        MetaAddress.globalMeta.houseTypeFeature.addValue(AddressHouseType.HOUSEESTATE.toString(), "Домовладение", null, null);
        MetaAddress.globalMeta.houseTypeFeature.addValue(AddressHouseType.SPECIAL.toString(), "Спец.строение", null, null);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_BUILDING, "Строение", 0, 1);
        MetaAddress.globalMeta.buildingTypeFeature = MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_BUILDINGTYPE, "Тип строения", 0, 1);
        MetaAddress.globalMeta.buildingTypeFeature.addValue(AddressBuildingType.BUILDING.toString(), "Строение", null, null);
        MetaAddress.globalMeta.buildingTypeFeature.addValue(AddressBuildingType.CONSTRUCTION.toString(), "Сооружение", null, null);
        MetaAddress.globalMeta.buildingTypeFeature.addValue(AddressBuildingType.LITER.toString(), "Литера", null, null);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_CORPUS, "Корпус", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_PORCH, "Подъезд", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_FLOOR, "Этаж", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_FLAT, "Квартира", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_CORPUSORFLAT, "Корпус или квартира", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_OFFICE, "Офис", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_PAVILION, "Павильон", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_PLOT, "Участок", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_FIELD, "Поле", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_GENPLAN, "Генплан", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_BLOCK, "Блок", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_BOX, "Гараж", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_WELL, "Скважина", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_CARPLACE, "Машиноместо", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_PART, "Часть", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_PANTRY, "Кладовка", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_ROOM, "Комната", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_SPACE, "Помещение", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_KILOMETER, "Километр", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_GEO, "Город\\Регион\\Страна", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_ZIP, "Индекс", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_POSTOFFICEBOX, "Абоненский ящик", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_DELIVERYAREA, "Доставочный участок", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_CSP, "ГСП", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_METRO, "Метро", 0, 1);
        let detail = MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_DETAIL, "Дополнительный указатель", 0, 1);
        MetaAddress.globalMeta.detailFeature = detail;
        detail.addValue(AddressDetailType.CROSS.toString(), "На пересечении", null, null);
        detail.addValue(AddressDetailType.NEAR.toString(), "Вблизи", null, null);
        detail.addValue(AddressDetailType.HOSTEL.toString(), "Общежитие", null, null);
        detail.addValue(AddressDetailType.NORTH.toString(), "Севернее", null, null);
        detail.addValue(AddressDetailType.SOUTH.toString(), "Южнее", null, null);
        detail.addValue(AddressDetailType.EAST.toString(), "Восточнее", null, null);
        detail.addValue(AddressDetailType.WEST.toString(), "Западнее", null, null);
        detail.addValue(AddressDetailType.RIGHT.toString(), "Правее", null, null);
        detail.addValue(AddressDetailType.LEFT.toString(), "Левее", null, null);
        detail.addValue(AddressDetailType.NORTHEAST.toString(), "Северо-восточнее", null, null);
        detail.addValue(AddressDetailType.NORTHWEST.toString(), "Северо-западнее", null, null);
        detail.addValue(AddressDetailType.SOUTHEAST.toString(), "Юго-восточнее", null, null);
        detail.addValue(AddressDetailType.SOUTHWEST.toString(), "Юго-западнее", null, null);
        detail.addValue(AddressDetailType.CENTRAL.toString(), "Центральный", null, null);
        detail.addValue(AddressDetailType.RANGE.toString(), "Диапазон", null, null);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_MISC, "Разное", 0, 0);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_DETAILPARAM, "Параметр детализации", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_DETAILREF, "Объект детализации", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_FIAS, "Объект ФИАС", 0, 1);
        MetaAddress.globalMeta.addFeature(AddressReferent.ATTR_BTI, "Объект БТИ", 0, 1);
    }
    
    get name() {
        const AddressReferent = require("./../AddressReferent");
        return AddressReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Адрес";
    }
    
    getImageId(obj = null) {
        return MetaAddress.ADDRESS_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaAddress.ADDRESS_IMAGE_ID = "address";
        MetaAddress.globalMeta = null;
    }
}


MetaAddress.static_constructor();

module.exports = MetaAddress