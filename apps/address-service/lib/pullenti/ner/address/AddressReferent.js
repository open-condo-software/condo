/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const GeoReferent = require("./../geo/GeoReferent");
const StreetReferent = require("./StreetReferent");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const GeoOwnerHelper = require("./../geo/internal/GeoOwnerHelper");
const AddressDetailType = require("./AddressDetailType");
const ReferentClass = require("./../metadata/ReferentClass");
const AddressBuildingType = require("./AddressBuildingType");
const AddressHouseType = require("./AddressHouseType");
const MetaAddress = require("./internal/MetaAddress");
const Referent = require("./../Referent");

/**
 * Сущность, представляющая адрес
 * 
 */
class AddressReferent extends Referent {
    
    constructor() {
        super(AddressReferent.OBJ_TYPENAME);
        this.instanceOf = MetaAddress.globalMeta;
    }
    
    get streets() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === AddressReferent.ATTR_STREET && (s.value instanceof Referent)) 
                res.push(Utils.as(s.value, Referent));
        }
        return res;
    }
    
    get house() {
        return this.getStringValue(AddressReferent.ATTR_HOUSE);
    }
    set house(value) {
        this.addSlot(AddressReferent.ATTR_HOUSE, value, true, 0);
        return value;
    }
    
    get houseType() {
        let str = this.getStringValue(AddressReferent.ATTR_HOUSETYPE);
        if (Utils.isNullOrEmpty(str)) 
            return AddressHouseType.HOUSE;
        try {
            return AddressHouseType.of(str);
        } catch (ex611) {
            return AddressHouseType.HOUSE;
        }
    }
    set houseType(value) {
        this.addSlot(AddressReferent.ATTR_HOUSETYPE, value.toString().toUpperCase(), true, 0);
        return value;
    }
    
    get building() {
        return this.getStringValue(AddressReferent.ATTR_BUILDING);
    }
    set building(value) {
        this.addSlot(AddressReferent.ATTR_BUILDING, value, true, 0);
        return value;
    }
    
    get buildingType() {
        let str = this.getStringValue(AddressReferent.ATTR_BUILDINGTYPE);
        if (Utils.isNullOrEmpty(str)) 
            return AddressBuildingType.BUILDING;
        try {
            return AddressBuildingType.of(str);
        } catch (ex612) {
            return AddressBuildingType.BUILDING;
        }
    }
    set buildingType(value) {
        this.addSlot(AddressReferent.ATTR_BUILDINGTYPE, value.toString().toUpperCase(), true, 0);
        return value;
    }
    
    get corpus() {
        return this.getStringValue(AddressReferent.ATTR_CORPUS);
    }
    set corpus(value) {
        this.addSlot(AddressReferent.ATTR_CORPUS, value, true, 0);
        return value;
    }
    
    get corpusOrFlat() {
        return this.getStringValue(AddressReferent.ATTR_CORPUSORFLAT);
    }
    set corpusOrFlat(value) {
        this.addSlot(AddressReferent.ATTR_CORPUSORFLAT, value, true, 0);
        return value;
    }
    
    get floor() {
        return this.getStringValue(AddressReferent.ATTR_FLOOR);
    }
    set floor(value) {
        this.addSlot(AddressReferent.ATTR_FLOOR, value, true, 0);
        return value;
    }
    
    get potch() {
        return this.getStringValue(AddressReferent.ATTR_PORCH);
    }
    set potch(value) {
        this.addSlot(AddressReferent.ATTR_PORCH, value, true, 0);
        return value;
    }
    
    get flat() {
        return this.getStringValue(AddressReferent.ATTR_FLAT);
    }
    set flat(value) {
        this.addSlot(AddressReferent.ATTR_FLAT, value, true, 0);
        return value;
    }
    
    get pavilion() {
        return this.getStringValue(AddressReferent.ATTR_PAVILION);
    }
    set pavilion(value) {
        this.addSlot(AddressReferent.ATTR_PAVILION, value, true, 0);
        return value;
    }
    
    get office() {
        return this.getStringValue(AddressReferent.ATTR_OFFICE);
    }
    set office(value) {
        this.addSlot(AddressReferent.ATTR_OFFICE, value, true, 0);
        return value;
    }
    
    get room() {
        return this.getStringValue(AddressReferent.ATTR_ROOM);
    }
    set room(value) {
        this.addSlot(AddressReferent.ATTR_ROOM, value, true, 0);
        return value;
    }
    
    get plot() {
        return this.getStringValue(AddressReferent.ATTR_PLOT);
    }
    set plot(value) {
        this.addSlot(AddressReferent.ATTR_PLOT, value, true, 0);
        return value;
    }
    
    get houseOrPlot() {
        return this.getStringValue(AddressReferent.ATTR_HOUSEORPLOT);
    }
    set houseOrPlot(value) {
        this.addSlot(AddressReferent.ATTR_HOUSEORPLOT, value, true, 0);
        return value;
    }
    
    get field() {
        return this.getStringValue(AddressReferent.ATTR_FIELD);
    }
    set field(value) {
        this.addSlot(AddressReferent.ATTR_FIELD, value, true, 0);
        return value;
    }
    
    get genplan() {
        return this.getStringValue(AddressReferent.ATTR_GENPLAN);
    }
    set genplan(value) {
        this.addSlot(AddressReferent.ATTR_GENPLAN, value, true, 0);
        return value;
    }
    
    get block() {
        return this.getStringValue(AddressReferent.ATTR_BLOCK);
    }
    set block(value) {
        this.addSlot(AddressReferent.ATTR_BLOCK, value, true, 0);
        return value;
    }
    
    get box() {
        return this.getStringValue(AddressReferent.ATTR_BOX);
    }
    set box(value) {
        this.addSlot(AddressReferent.ATTR_BOX, value, true, 0);
        return value;
    }
    
    get well() {
        return this.getStringValue(AddressReferent.ATTR_WELL);
    }
    set well(value) {
        this.addSlot(AddressReferent.ATTR_WELL, value, true, 0);
        return value;
    }
    
    get carplace() {
        return this.getStringValue(AddressReferent.ATTR_CARPLACE);
    }
    set carplace(value) {
        this.addSlot(AddressReferent.ATTR_CARPLACE, value, true, 0);
        return value;
    }
    
    get part() {
        return this.getStringValue(AddressReferent.ATTR_PART);
    }
    set part(value) {
        this.addSlot(AddressReferent.ATTR_PART, value, true, 0);
        return value;
    }
    
    get pantry() {
        return this.getStringValue(AddressReferent.ATTR_PANTRY);
    }
    set pantry(value) {
        this.addSlot(AddressReferent.ATTR_PANTRY, value, true, 0);
        return value;
    }
    
    get space() {
        return this.getStringValue(AddressReferent.ATTR_SPACE);
    }
    set space(value) {
        this.addSlot(AddressReferent.ATTR_SPACE, value, true, 0);
        return value;
    }
    
    get metro() {
        return this.getStringValue(AddressReferent.ATTR_METRO);
    }
    set metro(value) {
        this.addSlot(AddressReferent.ATTR_METRO, value, true, 0);
        return value;
    }
    
    get kilometer() {
        return this.getStringValue(AddressReferent.ATTR_KILOMETER);
    }
    set kilometer(value) {
        this.addSlot(AddressReferent.ATTR_KILOMETER, value, true, 0);
        return value;
    }
    
    get zip() {
        return this.getStringValue(AddressReferent.ATTR_ZIP);
    }
    set zip(value) {
        this.addSlot(AddressReferent.ATTR_ZIP, value, true, 0);
        return value;
    }
    
    get postOfficeBox() {
        return this.getStringValue(AddressReferent.ATTR_POSTOFFICEBOX);
    }
    set postOfficeBox(value) {
        this.addSlot(AddressReferent.ATTR_POSTOFFICEBOX, value, true, 0);
        return value;
    }
    
    get deliveryArea() {
        return this.getStringValue(AddressReferent.ATTR_DELIVERYAREA);
    }
    set deliveryArea(value) {
        this.addSlot(AddressReferent.ATTR_DELIVERYAREA, value, true, 0);
        return value;
    }
    
    get cSP() {
        return this.getStringValue(AddressReferent.ATTR_CSP);
    }
    set cSP(value) {
        this.addSlot(AddressReferent.ATTR_CSP, value, true, 0);
        return value;
    }
    
    get geos() {
        let res = new Array();
        for (const a of this.slots) {
            if (a.typeName === AddressReferent.ATTR_GEO && (a.value instanceof GeoReferent)) 
                res.push(Utils.as(a.value, GeoReferent));
            else if (a.typeName === AddressReferent.ATTR_STREET && (a.value instanceof Referent)) {
                for (const s of a.value.slots) {
                    if (s.value instanceof GeoReferent) 
                        res.push(Utils.as(s.value, GeoReferent));
                }
            }
        }
        for (let i = res.length - 1; i > 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (AddressReferent._isHigher(res[i], res[j])) {
                    res.splice(i, 1);
                    break;
                }
                else if (AddressReferent._isHigher(res[j], res[i])) {
                    res.splice(j, 1);
                    i--;
                }
            }
        }
        return res;
    }
    
    static _isHigher(gHi, gLo) {
        let i = 0;
        for (; gLo !== null && (i < 10); gLo = gLo.higher,i++) {
            if (gLo.canBeEquals(gHi, ReferentsEqualType.WITHINONETEXT)) 
                return true;
        }
        return false;
    }
    
    get parentReferent() {
        let sr = Utils.as(this.getSlotValue(AddressReferent.ATTR_STREET), Referent);
        if (sr !== null) 
            return sr;
        let _geos = this.geos;
        for (const g of _geos) {
            if (g.isCity) 
                return g;
        }
        for (const g of _geos) {
            if (g.isRegion && !g.isState) 
                return g;
        }
        if (_geos.length > 0) 
            return _geos[0];
        return null;
    }
    
    addReferent(r) {
        if (r === null) 
            return;
        let geo = Utils.as(r, GeoReferent);
        if (geo !== null) {
            for (const s of this.slots) {
                if (s.typeName === AddressReferent.ATTR_GEO) {
                    let geo0 = Utils.as(s.value, GeoReferent);
                    if (geo0 === null) 
                        continue;
                    if (GeoOwnerHelper.canBeHigher(geo0, geo, null, null)) {
                        if (geo.higher === geo0 || geo.isCity) {
                            this.uploadSlot(s, geo);
                            return;
                        }
                    }
                    if (GeoOwnerHelper.canBeHigher(geo, geo0, null, null)) 
                        return;
                }
            }
            this.addSlot(AddressReferent.ATTR_GEO, r, false, 0);
        }
        else if ((r instanceof StreetReferent) || r.typeName === "ORGANIZATION") 
            this.addSlot(AddressReferent.ATTR_STREET, r, false, 0);
    }
    
    get detail() {
        let s = this.getStringValue(AddressReferent.ATTR_DETAIL);
        if (s === null) 
            return AddressDetailType.UNDEFINED;
        try {
            return AddressDetailType.of(s);
        } catch (ex613) {
        }
        return AddressDetailType.UNDEFINED;
    }
    set detail(value) {
        if (value !== AddressDetailType.UNDEFINED) 
            this.addSlot(AddressReferent.ATTR_DETAIL, value.toString().toUpperCase(), true, 0);
        return value;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        let strs = this.streets;
        if (strs.length === 0) {
            if (this.metro !== null) {
                if (res.length > 0) 
                    res.append(' ');
                res.append(Utils.notNull(this.metro, ""));
            }
        }
        else {
            if (res.length > 0) 
                res.append(' ');
            for (let i = 0; i < strs.length; i++) {
                if (i > 0) 
                    res.append(", ");
                res.append(strs[i].toStringEx(true, lang, 0));
            }
        }
        this._outHouse(res);
        let kladr = this.getSlotValue(AddressReferent.ATTR_FIAS);
        if (kladr instanceof Referent) {
            res.append(" (ФИАС: ").append((Utils.notNull(kladr.getStringValue("GUID"), "?")));
            for (const s of this.slots) {
                if (s.typeName === AddressReferent.ATTR_FIAS && (s.value instanceof Referent) && s.value !== kladr) 
                    res.append(", ").append((Utils.notNull(s.value.getStringValue("GUID"), "?")));
            }
            res.append(')');
        }
        let bti = this.getStringValue(AddressReferent.ATTR_BTI);
        if (bti !== null) 
            res.append(" (БТИ ").append(bti).append(")");
        for (const g of this.geos) {
            if (res.length > 0 && res.charAt(res.length - 1) === ' ') 
                res.length = res.length - 1;
            if (res.length > 0 && res.charAt(res.length - 1) === ']') {
            }
            else if (res.length > 0) 
                res.append(';');
            res.append(" ").append(g.toStringEx(true, lang, lev + 1));
        }
        if (this.zip !== null) 
            res.append("; ").append(this.zip);
        let str = this.getStringValue(AddressReferent.ATTR_DETAIL);
        if (str !== null) 
            str = Utils.asString(MetaAddress.globalMeta.detailFeature.convertInnerValueToOuterValue(str, lang));
        if (str !== null) {
            res.append(" [").append(str.toLowerCase());
            if ((((str = this.getStringValue(AddressReferent.ATTR_DETAILPARAM)))) !== null) 
                res.append(", ").append(str);
            if (!shortVariant) {
                let dd = Utils.as(this.getSlotValue(AddressReferent.ATTR_DETAILREF), Referent);
                if (dd !== null) 
                    res.append(", ").append(dd.toStringEx(true, lang, lev + 1));
            }
            res.append(']');
        }
        else {
            let dd = Utils.as(this.getSlotValue(AddressReferent.ATTR_DETAILREF), Referent);
            if (dd !== null) 
                res.append(" [").append(dd.toStringEx(true, lang, lev + 1)).append("]");
        }
        return res.toString().trim();
    }
    
    _outHouse(res) {
        if (this.kilometer !== null) 
            res.append(" ").append(this.kilometer).append("км.");
        if (this.field !== null) 
            res.append(" поле ").append(this.field);
        if (this.genplan !== null) 
            res.append(" ГП-").append(this.genplan);
        if (this.house !== null) {
            let ty = this.houseType;
            if (ty === AddressHouseType.ESTATE) 
                res.append(" влад.");
            else if (ty === AddressHouseType.HOUSEESTATE) 
                res.append(" домовл.");
            else if (ty === AddressHouseType.SPECIAL) 
                res.append(' ');
            else 
                res.append(" д.");
            res.append((this.house === "0" ? "Б/Н" : this.house));
        }
        else if (this.houseOrPlot !== null) 
            res.append(" ").append((this.houseOrPlot === "0" ? "Б/Н" : this.houseOrPlot));
        if (this.corpus !== null) 
            res.append(" корп.").append(((this.corpus === "0" ? "Б/Н" : this.corpus)));
        if (this.building !== null) {
            let ty = this.buildingType;
            if (ty === AddressBuildingType.CONSTRUCTION) 
                res.append(" сооруж.");
            else if (ty === AddressBuildingType.LITER) 
                res.append(" лит.");
            else 
                res.append(" стр.");
            res.append((this.building === "0" ? "Б/Н" : this.building));
        }
        if (this.part !== null) 
            res.append(" часть ").append(this.part);
        if (this.potch !== null) 
            res.append(" под.").append(this.potch);
        if (this.floor !== null) 
            res.append(" эт.").append(this.floor);
        if (this.flat !== null) 
            res.append(" кв.").append((this.flat === "0" ? "Б/Н" : this.flat));
        if (this.block !== null) 
            res.append(" блок ").append(this.block);
        if (this.corpusOrFlat !== null) 
            res.append(" корп.(кв.?)").append(this.corpusOrFlat);
        if (this.pantry !== null) 
            res.append(" кладов.").append(this.pantry);
        if (this.box !== null) 
            res.append(" гараж ").append((this.box === "0" ? "Б/Н" : this.box));
        if (this.well !== null) 
            res.append(" скважина ").append((this.well === "0" ? "Б/Н" : this.well));
        if (this.space !== null) 
            res.append(" помещ. ").append((this.space === "0" ? "Б/Н" : this.space));
        if (this.carplace !== null) 
            res.append(" маш.место ").append((this.carplace === "0" ? "Б/Н" : this.carplace));
        if (this.room !== null) 
            res.append(" ком.").append((this.room === "0" ? "Б/Н" : this.room));
        if (this.office !== null) 
            res.append(" оф.").append(this.office);
        if (this.pavilion !== null) 
            res.append(" пав.").append(this.pavilion);
        if (this.plot !== null) 
            res.append(" уч.").append(this.plot);
        if (this.postOfficeBox !== null) 
            res.append(" а\\я").append(this.postOfficeBox);
        if (this.deliveryArea !== null) 
            res.append(" дост.участок ").append(this.deliveryArea);
        if (this.cSP !== null) 
            res.append(" ГСП-").append(this.cSP);
    }
    
    /**
     * Вывод адреса в каноническом виде (сначала индекс, потом страна, город, улица и т.д.)
     * @return 
     */
    toStringClassic() {
        let _geos = new Array();
        let geo = null;
        let street = Utils.as(this.getSlotValue(AddressReferent.ATTR_STREET), StreetReferent);
        if (street !== null) 
            geo = Utils.as(street.getSlotValue(StreetReferent.ATTR_GEO), GeoReferent);
        if (geo === null) 
            geo = Utils.as(this.getSlotValue(AddressReferent.ATTR_GEO), GeoReferent);
        if (geo !== null) {
            for (let i = 0; i < 10; i++) {
                if (!_geos.includes(geo)) 
                    _geos.splice(0, 0, geo);
                geo = geo.higher;
                if (geo === null) 
                    break;
            }
        }
        if (_geos.length === 0) 
            return this.toString();
        let res = new StringBuilder();
        if (this.zip !== null) 
            res.append(this.zip).append(", ");
        for (const g of _geos) {
            let hi = g.higher;
            g.higher = null;
            res.append(g.toString()).append(", ");
            g.higher = hi;
        }
        if (street !== null) 
            res.append(street.toStringEx(true, null, 0));
        else if (res.length > 1) {
            if (res.charAt(res.length - 1) === ' ') 
                res.length = res.length - 1;
            if (res.charAt(res.length - 1) === ',') 
                res.length = res.length - 1;
        }
        let tmp2 = new StringBuilder();
        this._outHouse(tmp2);
        if (tmp2.length > 0) 
            res.append(", ").append(tmp2.toString());
        return res.toString();
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let addr = Utils.as(obj, AddressReferent);
        if (addr === null) 
            return false;
        let strs1 = this.streets;
        let strs2 = addr.streets;
        if (strs1.length > 0 || strs2.length > 0) {
            let ok = false;
            for (const s of strs1) {
                for (const ss of strs2) {
                    if (ss.canBeEquals(s, typ)) {
                        ok = true;
                        break;
                    }
                }
            }
            if (!ok) 
                return false;
        }
        if (addr.house !== null || this.house !== null) {
            if (addr.house !== this.house) 
                return false;
        }
        if (addr.houseOrPlot !== null || this.houseOrPlot !== null) {
            if (addr.houseOrPlot !== this.houseOrPlot) 
                return false;
        }
        if (addr.building !== null || this.building !== null) {
            if (addr.building !== this.building) 
                return false;
        }
        if (addr.plot !== null || this.plot !== null) {
            if (addr.plot !== this.plot) 
                return false;
        }
        if (addr.part !== null || this.part !== null) {
            if (addr.part !== this.part) 
                return false;
        }
        if (addr.field !== null || this.field !== null) {
            if (addr.field !== this.field) 
                return false;
        }
        if (addr.genplan !== null && this.genplan !== null) {
            if (addr.genplan !== this.genplan) 
                return false;
        }
        if (addr.box !== null || this.box !== null) {
            if (addr.box !== this.box) 
                return false;
        }
        if (addr.well !== null || this.well !== null) {
            if (addr.well !== this.well) 
                return false;
        }
        if (addr.carplace !== null || this.carplace !== null) {
            if (addr.carplace !== this.carplace) 
                return false;
        }
        if (addr.space !== null || this.space !== null) {
            if (addr.space !== this.space) 
                return false;
        }
        if (addr.block !== null || this.block !== null) {
            if (addr.block !== this.block) 
                return false;
        }
        if (addr.pantry !== null || this.pantry !== null) {
            if (addr.pantry !== this.pantry) 
                return false;
        }
        if (addr.corpus !== null || this.corpus !== null) {
            if (addr.corpus !== this.corpus) {
                if (addr.corpus !== null && addr.corpus === this.corpusOrFlat) {
                }
                else if (this.corpus !== null && addr.corpusOrFlat === this.corpus) {
                }
                else 
                    return false;
            }
        }
        if (addr.flat !== null || this.flat !== null) {
            if (addr.flat !== this.flat) {
                if (addr.flat !== null && addr.flat === this.corpusOrFlat) {
                }
                else if (this.flat !== null && addr.corpusOrFlat === this.flat) {
                }
                else 
                    return false;
            }
        }
        if (addr.corpusOrFlat !== null || this.corpusOrFlat !== null) {
            if (this.corpusOrFlat !== null && addr.corpusOrFlat !== null) {
                if (this.corpusOrFlat !== addr.corpusOrFlat) 
                    return false;
            }
            else if (this.corpusOrFlat === null) {
                if (this.corpus === null && this.flat === null) 
                    return false;
            }
            else if (addr.corpusOrFlat === null) {
                if (addr.corpus === null && addr.flat === null) 
                    return false;
            }
        }
        if (addr.pavilion !== null || this.pavilion !== null) {
            if (addr.pavilion !== this.pavilion) 
                return false;
        }
        if (addr.office !== null || this.office !== null) {
            if (addr.office !== this.office) 
                return false;
        }
        if (addr.room !== null || this.room !== null) {
            if (addr.room !== this.room) 
                return false;
        }
        if (addr.potch !== null || this.potch !== null) {
            if (addr.potch !== this.potch) 
                return false;
        }
        if (addr.floor !== null || this.floor !== null) {
            if (addr.floor !== this.floor) 
                return false;
        }
        if (addr.postOfficeBox !== null || this.postOfficeBox !== null) {
            if (addr.postOfficeBox !== this.postOfficeBox) 
                return false;
        }
        if (addr.deliveryArea !== null || this.deliveryArea !== null) {
            if (addr.deliveryArea !== this.deliveryArea) 
                return false;
        }
        if (addr.cSP !== null && this.cSP !== null) {
            if (addr.cSP !== this.cSP) 
                return false;
        }
        let geos1 = this.geos;
        let geos2 = addr.geos;
        if (geos1.length > 0 && geos2.length > 0) {
            let ok = false;
            for (const g1 of geos1) {
                for (const g2 of geos2) {
                    if (g1.canBeEquals(g2, typ)) {
                        ok = true;
                        break;
                    }
                }
            }
            if (!ok) 
                return false;
        }
        return true;
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        super.mergeSlots(obj, mergeStatistic);
        if (this.corpusOrFlat !== null) {
            if (this.flat === this.corpusOrFlat) 
                this.corpusOrFlat = null;
            else if (this.corpus === this.corpusOrFlat) 
                this.corpusOrFlat = null;
        }
        this.correct();
    }
    
    correct() {
        let _geos = new Array();
        for (const a of this.slots) {
            if (a.typeName === AddressReferent.ATTR_GEO && (a.value instanceof GeoReferent)) 
                _geos.push(Utils.as(a.value, GeoReferent));
            else if (a.typeName === AddressReferent.ATTR_STREET && (a.value instanceof Referent)) {
                for (const s of a.value.slots) {
                    if (s.value instanceof GeoReferent) 
                        _geos.push(Utils.as(s.value, GeoReferent));
                }
            }
        }
        for (let i = _geos.length - 1; i > 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (AddressReferent._isHigher(_geos[i], _geos[j])) {
                    let s = this.findSlot(AddressReferent.ATTR_GEO, _geos[i], true);
                    if (s !== null) 
                        Utils.removeItem(this.slots, s);
                    _geos.splice(i, 1);
                    break;
                }
                else if (AddressReferent._isHigher(_geos[j], _geos[i])) {
                    let s = this.findSlot(AddressReferent.ATTR_GEO, _geos[j], true);
                    if (s !== null) 
                        Utils.removeItem(this.slots, s);
                    _geos.splice(j, 1);
                    i--;
                }
            }
        }
        if (_geos.length === 2) {
            let reg = null;
            let cit = null;
            if (_geos[0].isCity && _geos[1].isRegion) {
                cit = _geos[0];
                reg = _geos[1];
            }
            else if (_geos[1].isCity && _geos[0].isRegion) {
                cit = _geos[1];
                reg = _geos[0];
            }
            if (cit !== null && cit.higher === null && GeoOwnerHelper.canBeHigher(reg, cit, null, null)) {
                cit.higher = reg;
                let ss = this.findSlot(AddressReferent.ATTR_GEO, reg, true);
                if (ss !== null) 
                    Utils.removeItem(this.slots, ss);
                _geos = this.geos;
            }
            else {
                let stat = null;
                let geo = null;
                if (_geos[0].isState && !_geos[1].isState) {
                    stat = _geos[0];
                    geo = _geos[1];
                }
                else if (_geos[1].isState && !_geos[0].isState) {
                    stat = _geos[1];
                    geo = _geos[0];
                }
                if (stat !== null) {
                    geo = geo.topHigher;
                    if (geo.higher === null) {
                        geo.higher = stat;
                        let s = this.findSlot(AddressReferent.ATTR_GEO, stat, true);
                        if (s !== null) 
                            Utils.removeItem(this.slots, s);
                    }
                }
            }
        }
    }
    
    static static_constructor() {
        AddressReferent.OBJ_TYPENAME = "ADDRESS";
        AddressReferent.ATTR_STREET = "STREET";
        AddressReferent.ATTR_HOUSE = "HOUSE";
        AddressReferent.ATTR_HOUSEORPLOT = "HOUSEORPLOT";
        AddressReferent.ATTR_HOUSETYPE = "HOUSETYPE";
        AddressReferent.ATTR_CORPUS = "CORPUS";
        AddressReferent.ATTR_BUILDING = "BUILDING";
        AddressReferent.ATTR_BUILDINGTYPE = "BUILDINGTYPE";
        AddressReferent.ATTR_CORPUSORFLAT = "CORPUSORFLAT";
        AddressReferent.ATTR_PORCH = "PORCH";
        AddressReferent.ATTR_FLOOR = "FLOOR";
        AddressReferent.ATTR_OFFICE = "OFFICE";
        AddressReferent.ATTR_SPACE = "SPACE";
        AddressReferent.ATTR_FLAT = "FLAT";
        AddressReferent.ATTR_PANTRY = "PANTRY";
        AddressReferent.ATTR_ROOM = "ROOM";
        AddressReferent.ATTR_CARPLACE = "CARPLACE";
        AddressReferent.ATTR_PAVILION = "PAVILION";
        AddressReferent.ATTR_KILOMETER = "KILOMETER";
        AddressReferent.ATTR_PLOT = "PLOT";
        AddressReferent.ATTR_FIELD = "FIELD";
        AddressReferent.ATTR_BLOCK = "BLOCK";
        AddressReferent.ATTR_BOX = "BOX";
        AddressReferent.ATTR_PART = "PART";
        AddressReferent.ATTR_GENPLAN = "GENPLAN";
        AddressReferent.ATTR_WELL = "WELL";
        AddressReferent.ATTR_GEO = "GEO";
        AddressReferent.ATTR_ZIP = "ZIP";
        AddressReferent.ATTR_POSTOFFICEBOX = "POSTOFFICEBOX";
        AddressReferent.ATTR_DELIVERYAREA = "TARGETPLOT";
        AddressReferent.ATTR_CSP = "CSP";
        AddressReferent.ATTR_METRO = "METRO";
        AddressReferent.ATTR_DETAIL = "DETAIL";
        AddressReferent.ATTR_DETAILPARAM = "DETAILPARAM";
        AddressReferent.ATTR_DETAILREF = "DETAILREF";
        AddressReferent.ATTR_MISC = "MISC";
        AddressReferent.ATTR_FIAS = "FIAS";
        AddressReferent.ATTR_BTI = "BTI";
    }
}


AddressReferent.static_constructor();

module.exports = AddressReferent