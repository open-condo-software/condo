/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaBank extends ReferentClass {
    
    static initialize() {
        const BankDataReferent = require("./../BankDataReferent");
        MetaBank.globalMeta = new MetaBank();
        MetaBank.globalMeta.addFeature(BankDataReferent.ATTR_ITEM, "Элемент", 0, 0).showAsParent = true;
        MetaBank.globalMeta.addFeature(BankDataReferent.ATTR_BANK, "Банк", 0, 1);
        MetaBank.globalMeta.addFeature(BankDataReferent.ATTR_CORBANK, "Банк К/С", 0, 1);
        MetaBank.globalMeta.addFeature(BankDataReferent.ATTR_MISC, "Разное", 0, 0);
    }
    
    get name() {
        const BankDataReferent = require("./../BankDataReferent");
        return BankDataReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Банковские реквизиты";
    }
    
    getImageId(obj = null) {
        return MetaBank.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaBank.IMAGE_ID = "bankreq";
        MetaBank.globalMeta = null;
    }
}


MetaBank.static_constructor();

module.exports = MetaBank