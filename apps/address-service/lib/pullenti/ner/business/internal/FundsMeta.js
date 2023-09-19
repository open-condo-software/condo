/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");
const FundsKind = require("./../FundsKind");

class FundsMeta extends ReferentClass {
    
    constructor() {
        super();
        this.kindFeature = null;
    }
    
    static initialize() {
        const FundsReferent = require("./../FundsReferent");
        FundsMeta.GLOBAL_META = new FundsMeta();
        let f = FundsMeta.GLOBAL_META.addFeature(FundsReferent.ATTR_KIND, "Класс", 0, 1);
        FundsMeta.GLOBAL_META.kindFeature = f;
        f.addValue(FundsKind.STOCK.toString(), "Акция", null, null);
        f.addValue(FundsKind.CAPITAL.toString(), "Уставной капитал", null, null);
        FundsMeta.GLOBAL_META.addFeature(FundsReferent.ATTR_TYPE, "Тип", 0, 1);
        FundsMeta.GLOBAL_META.addFeature(FundsReferent.ATTR_SOURCE, "Эмитент", 0, 1);
        FundsMeta.GLOBAL_META.addFeature(FundsReferent.ATTR_PERCENT, "Процент", 0, 1);
        FundsMeta.GLOBAL_META.addFeature(FundsReferent.ATTR_COUNT, "Количество", 0, 1);
        FundsMeta.GLOBAL_META.addFeature(FundsReferent.ATTR_PRICE, "Номинал", 0, 1);
        FundsMeta.GLOBAL_META.addFeature(FundsReferent.ATTR_SUM, "Денежная сумма", 0, 1);
    }
    
    get name() {
        const FundsReferent = require("./../FundsReferent");
        return FundsReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Ценная бумага";
    }
    
    getImageId(obj = null) {
        return FundsMeta.IMAGE_ID;
    }
    
    static static_constructor() {
        FundsMeta.IMAGE_ID = "funds";
        FundsMeta.GLOBAL_META = null;
    }
}


FundsMeta.static_constructor();

module.exports = FundsMeta