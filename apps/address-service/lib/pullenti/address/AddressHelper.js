/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

const RoomType = require("./RoomType");
const DetailType = require("./DetailType");
const ParamType = require("./ParamType");
const StroenType = require("./StroenType");
const GarLevel = require("./GarLevel");
const AddrLevel = require("./AddrLevel");
const HouseType = require("./HouseType");

/**
 * Разные полезные функции
 */
class AddressHelper {
    
    /**
     * Получить описание уровня ГАР
     * @param level 
     * @return 
     */
    static getGarLevelString(level) {
        if (level === GarLevel.REGION) 
            return "регион";
        if (level === GarLevel.ADMINAREA) 
            return "административный район";
        if (level === GarLevel.MUNICIPALAREA) 
            return "муниципальный район";
        if (level === GarLevel.SETTLEMENT) 
            return "сельское/городское поселение";
        if (level === GarLevel.CITY) 
            return "город";
        if (level === GarLevel.LOCALITY) 
            return "населенный пункт";
        if (level === GarLevel.DISTRICT) 
            return "район города";
        if (level === GarLevel.AREA) 
            return "элемент планировочной структуры";
        if (level === GarLevel.STREET) 
            return "элемент улично-дорожной сети";
        if (level === GarLevel.PLOT) 
            return "земельный участок";
        if (level === GarLevel.BUILDING) 
            return "здание (сооружение)";
        if (level === GarLevel.ROOM) 
            return "помещение";
        if (level === GarLevel.CARPLACE) 
            return "машино-место";
        return level.toString();
    }
    
    /**
     * Получить описание алресного уровня
     * @param level 
     * @return 
     */
    static getAddrLevelString(level) {
        if (level === AddrLevel.COUNTRY) 
            return "страна";
        if (level === AddrLevel.REGIONAREA) 
            return "регион";
        if (level === AddrLevel.REGIONCITY) 
            return "город-регион";
        if (level === AddrLevel.DISTRICT) 
            return "район";
        if (level === AddrLevel.SETTLEMENT) 
            return "поселение";
        if (level === AddrLevel.CITY) 
            return "город";
        if (level === AddrLevel.CITYDISTRICT) 
            return "городской район";
        if (level === AddrLevel.LOCALITY) 
            return "населенный пункт";
        if (level === AddrLevel.TERRITORY) 
            return "элемент планировочной структуры";
        if (level === AddrLevel.STREET) 
            return "элемент улично-дорожной сети";
        if (level === AddrLevel.PLOT) 
            return "земельный участок";
        if (level === AddrLevel.BUILDING) 
            return "здание (сооружение)";
        if (level === AddrLevel.APARTMENT) 
            return "помещение";
        if (level === AddrLevel.ROOM) 
            return "комната";
        return level.toString();
    }
    
    /**
     * Получить мнемонику картинки для уровня (по мнемонике саму картинку можно получить функцией FindImage)
     * @param level 
     * @return 
     */
    static getGarLevelImageName(level) {
        if (level === GarLevel.REGION) 
            return "region";
        if (level === GarLevel.ADMINAREA) 
            return "admin";
        if (level === GarLevel.MUNICIPALAREA) 
            return "municipal";
        if (level === GarLevel.SETTLEMENT) 
            return "settlement";
        if (level === GarLevel.CITY) 
            return "city";
        if (level === GarLevel.LOCALITY) 
            return "locality";
        if (level === GarLevel.DISTRICT) 
            return "district";
        if (level === GarLevel.AREA) 
            return "area";
        if (level === GarLevel.STREET) 
            return "street";
        if (level === GarLevel.PLOT) 
            return "plot";
        if (level === GarLevel.BUILDING) 
            return "building";
        if (level === GarLevel.ROOM) 
            return "room";
        if (level === GarLevel.CARPLACE) 
            return "carplace";
        return "undefined";
    }
    
    /**
     * Получить мнемонику картинки для уровня (по мнемонике саму картинку можно получить функцией FindImage)
     * @param level 
     * @return 
     */
    static getAddrLevelImageName(level) {
        if (level === AddrLevel.COUNTRY) 
            return "country";
        if (level === AddrLevel.REGIONAREA) 
            return "region";
        if (level === AddrLevel.REGIONCITY) 
            return "city";
        if (level === AddrLevel.DISTRICT) 
            return "municipal";
        if (level === AddrLevel.SETTLEMENT) 
            return "settlement";
        if (level === AddrLevel.CITY) 
            return "city";
        if (level === AddrLevel.CITYDISTRICT) 
            return "municipal";
        if (level === AddrLevel.LOCALITY) 
            return "locality";
        if (level === AddrLevel.TERRITORY) 
            return "area";
        if (level === AddrLevel.STREET) 
            return "street";
        if (level === AddrLevel.PLOT) 
            return "plot";
        if (level === AddrLevel.BUILDING) 
            return "building";
        if (level === AddrLevel.APARTMENT) 
            return "room";
        if (level === AddrLevel.ROOM) 
            return "room";
        return "undefined";
    }
    
    /**
     * Сравнение уровней для сортировки
     * @param lev1 первый уровень
     * @param lev2 второй уровень
     * @return -1 первый меньше, +1 первый больше, 0 равны
     */
    static compareLevels(lev1, lev2) {
        let r1 = lev1.value();
        let r2 = lev2.value();
        if (r1 < r2) 
            return -1;
        if (r1 > r2) 
            return 1;
        return 0;
    }
    
    static canBeEqualLevels(a, g) {
        if (a === AddrLevel.COUNTRY) 
            return false;
        if (a === AddrLevel.REGIONCITY || a === AddrLevel.REGIONAREA) 
            return g === GarLevel.REGION;
        if (a === AddrLevel.DISTRICT) 
            return g === GarLevel.MUNICIPALAREA || g === GarLevel.ADMINAREA;
        if (a === AddrLevel.SETTLEMENT) 
            return g === GarLevel.SETTLEMENT;
        if (a === AddrLevel.CITY) 
            return g === GarLevel.CITY;
        if (a === AddrLevel.LOCALITY) 
            return g === GarLevel.LOCALITY || g === GarLevel.AREA || g === GarLevel.ADMINAREA;
        if (a === AddrLevel.TERRITORY) 
            return g === GarLevel.AREA || g === GarLevel.DISTRICT;
        if (a === AddrLevel.STREET) 
            return g === GarLevel.STREET;
        if (a === AddrLevel.PLOT) 
            return g === GarLevel.PLOT;
        if (a === AddrLevel.BUILDING) 
            return g === GarLevel.BUILDING;
        if (a === AddrLevel.APARTMENT || a === AddrLevel.ROOM) 
            return g === GarLevel.ROOM;
        return false;
    }
    
    /**
     * Проверка уровней на предмет прямого родителя
     * @param ch прямой потомок
     * @param par родитель
     * @return может ли быть
     */
    static canBeParent(ch, par) {
        if (ch === AddrLevel.COUNTRY) 
            return false;
        if (ch === AddrLevel.REGIONCITY || ch === AddrLevel.REGIONAREA) 
            return par === AddrLevel.COUNTRY;
        if (ch === AddrLevel.DISTRICT) {
            if (par === AddrLevel.COUNTRY || par === AddrLevel.REGIONCITY || par === AddrLevel.REGIONAREA) 
                return true;
            if (par === AddrLevel.DISTRICT) 
                return true;
        }
        if (ch === AddrLevel.SETTLEMENT) 
            return par === AddrLevel.REGIONCITY || par === AddrLevel.REGIONAREA || par === AddrLevel.DISTRICT;
        if (ch === AddrLevel.CITY) 
            return (par === AddrLevel.COUNTRY || par === AddrLevel.REGIONCITY || par === AddrLevel.REGIONAREA) || par === AddrLevel.DISTRICT || par === AddrLevel.SETTLEMENT;
        if (ch === AddrLevel.CITYDISTRICT) 
            return par === AddrLevel.CITY;
        if (ch === AddrLevel.LOCALITY) {
            if ((par === AddrLevel.DISTRICT || par === AddrLevel.SETTLEMENT || par === AddrLevel.CITY) || par === AddrLevel.REGIONCITY) 
                return true;
            if (par === AddrLevel.CITYDISTRICT) 
                return true;
            if (par === AddrLevel.LOCALITY) 
                return true;
            return false;
        }
        if (ch === AddrLevel.TERRITORY) {
            if (par === AddrLevel.REGIONCITY) 
                return true;
            if ((par === AddrLevel.LOCALITY || par === AddrLevel.CITY || par === AddrLevel.DISTRICT) || par === AddrLevel.CITYDISTRICT || par === AddrLevel.SETTLEMENT) 
                return true;
            if (par === AddrLevel.TERRITORY) 
                return true;
            return false;
        }
        if (ch === AddrLevel.STREET) {
            if ((par === AddrLevel.REGIONCITY || par === AddrLevel.LOCALITY || par === AddrLevel.CITY) || par === AddrLevel.TERRITORY || par === AddrLevel.CITYDISTRICT) 
                return true;
            if (par === AddrLevel.DISTRICT) 
                return true;
            return false;
        }
        if (ch === AddrLevel.BUILDING || ch === AddrLevel.PLOT) {
            if (par === AddrLevel.LOCALITY || par === AddrLevel.TERRITORY || par === AddrLevel.STREET) 
                return true;
            if (par === AddrLevel.CITY && ch === AddrLevel.BUILDING) 
                return true;
            if (par === AddrLevel.PLOT && ch === AddrLevel.BUILDING) 
                return true;
            return false;
        }
        if (ch === AddrLevel.APARTMENT) {
            if (par === AddrLevel.BUILDING) 
                return true;
            return false;
        }
        if (ch === AddrLevel.ROOM) 
            return par === AddrLevel.APARTMENT || par === AddrLevel.BUILDING;
        return false;
    }
    
    /**
     * Получить описание для типа дома
     * @param ty тип
     * @param shortVal в короткой форме
     * @return 
     */
    static getHouseTypeString(ty, shortVal) {
        if (ty === HouseType.ESTATE) 
            return (shortVal ? "влад." : "владение");
        if (ty === HouseType.HOUSEESTATE) 
            return (shortVal ? "дмвлд." : "домовладение");
        if (ty === HouseType.HOUSE) 
            return (shortVal ? "д." : "дом");
        if (ty === HouseType.PLOT) 
            return (shortVal ? "уч." : "участок");
        if (ty === HouseType.GARAGE) 
            return (shortVal ? "гар." : "гараж");
        if (ty === HouseType.SPECIAL) 
            return (shortVal ? "" : "специальное строение");
        if (ty === HouseType.WELL) 
            return (shortVal ? "скваж." : "скважина");
        return "?";
    }
    
    /**
     * Получить описание для типа строения
     * @param ty тип
     * @param shortVal в короткой форме
     * @return 
     */
    static getStroenTypeString(ty, shortVal) {
        if (ty === StroenType.CONSTRUCTION) 
            return (shortVal ? "сооруж." : "сооружение");
        if (ty === StroenType.LITER) 
            return (shortVal ? "лит." : "литера");
        return (shortVal ? "стр." : "строение");
    }
    
    /**
     * Получить описание для типа помещения
     * @param ty тип
     * @param shortVal в короткой форме
     * @return 
     */
    static getRoomTypeString(ty, shortVal) {
        if (ty === RoomType.FLAT) 
            return (shortVal ? "кв." : "квартира");
        if (ty === RoomType.OFFICE) 
            return (shortVal ? "оф." : "офис");
        if (ty === RoomType.ROOM) 
            return (shortVal ? "комн." : "комната");
        if (ty === RoomType.SPACE || ty === RoomType.UNDEFINED) 
            return (shortVal ? "помещ." : "помещение");
        if (ty === RoomType.GARAGE) 
            return (shortVal ? "гар." : "гараж");
        if (ty === RoomType.CARPLACE) 
            return (shortVal ? "маш.м." : "машиноместо");
        if (ty === RoomType.PAVILION) 
            return (shortVal ? "пав." : "павильон");
        if (ty === RoomType.PANTY) 
            return (shortVal ? "клад." : "кладовка");
        return "?";
    }
    
    /**
     * Найти картинку по идентификатору
     * @param imageId Id картинки
     * @return обёртка
     */
    static findImage(imageId) {
        for (const img of AddressHelper.IMAGES) {
            if (Utils.compareStrings(img.id, imageId, true) === 0) 
                return img;
        }
        return null;
    }
    
    /**
     * Проверка, что спецтип является направлением
     * @param typ 
     * @return 
     */
    static isSpecTypeDirection(typ) {
        if ((typ === DetailType.NORTH || typ === DetailType.EAST || typ === DetailType.WEST) || typ === DetailType.SOUTH) 
            return true;
        if ((typ === DetailType.NORTHEAST || typ === DetailType.NORTHWEST || typ === DetailType.SOUTHEAST) || typ === DetailType.SOUTHWEST) 
            return true;
        return false;
    }
    
    /**
     * Получить описание для типа дополнительного параметра
     * @param typ тип
     * @return строковое описание
     */
    static getDetailTypeString(typ) {
        if (typ === DetailType.NEAR) 
            return "вблизи";
        if (typ === DetailType.CENTRAL) 
            return "центр";
        if (typ === DetailType.LEFT) 
            return "левее";
        if (typ === DetailType.RIGHT) 
            return "правее";
        if (typ === DetailType.NORTH) 
            return "на север";
        if (typ === DetailType.WEST) 
            return "на запад";
        if (typ === DetailType.SOUTH) 
            return "на юг";
        if (typ === DetailType.EAST) 
            return "на восток";
        if (typ === DetailType.NORTHEAST) 
            return "на северо-восток";
        if (typ === DetailType.NORTHWEST) 
            return "на северо-запад";
        if (typ === DetailType.SOUTHEAST) 
            return "на юго-восток";
        if (typ === DetailType.SOUTHWEST) 
            return "на юго-запад";
        if (typ === DetailType.KMRANGE) 
            return "диапазон";
        return typ.toString();
    }
    
    static getDetailPartParamString(typ) {
        if (typ === DetailType.CENTRAL) 
            return "центральная часть";
        if (typ === DetailType.NORTH) 
            return "северная часть";
        if (typ === DetailType.WEST) 
            return "западная часть";
        if (typ === DetailType.SOUTH) 
            return "южная часть";
        if (typ === DetailType.EAST) 
            return "восточная часть";
        if (typ === DetailType.NORTHEAST) 
            return "северо-восточная часть";
        if (typ === DetailType.NORTHWEST) 
            return "северо-западная часть";
        if (typ === DetailType.SOUTHEAST) 
            return "юго-восточная часть";
        if (typ === DetailType.SOUTHWEST) 
            return "юго-западная часть";
        if (typ === DetailType.LEFT) 
            return "левая часть";
        if (typ === DetailType.RIGHT) 
            return "правая часть";
        return typ.toString();
    }
    
    /**
     * Проверка, является ли тип доп.параметра направлением (на сервер, на юг и т.д.)
     * @param typ 
     * @return 
     */
    static isDetailParamDirection(typ) {
        if ((((((typ === DetailType.NEAR || typ === DetailType.CENTRAL || typ === DetailType.NORTH) || typ === DetailType.WEST || typ === DetailType.SOUTH) || typ === DetailType.EAST || typ === DetailType.NORTHEAST) || typ === DetailType.NORTHWEST || typ === DetailType.SOUTHEAST) || typ === DetailType.SOUTHWEST || typ === DetailType.LEFT) || typ === DetailType.RIGHT) 
            return true;
        return false;
    }
    
    /**
     * Получить описание для типа дополнительного параметра
     * @param typ тип
     * @return строковое описание
     */
    static getParamTypeString(typ) {
        if (typ === ParamType.ORDER) 
            return "очередь";
        if (typ === ParamType.PART) 
            return "часть";
        if (typ === ParamType.FLOOR) 
            return "этаж";
        if (typ === ParamType.GENPLAN) 
            return "ГП";
        if (typ === ParamType.DELIVERYAREA) 
            return "доставочный участок";
        if (typ === ParamType.ZIP) 
            return "индекс";
        if (typ === ParamType.SUBSCRIBERBOX) 
            return "а/я";
        return typ.toString();
    }
    
    static static_constructor() {
        AddressHelper.IMAGES = new Array();
    }
}


AddressHelper.static_constructor();

module.exports = AddressHelper