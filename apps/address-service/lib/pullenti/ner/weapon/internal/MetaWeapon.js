/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaWeapon extends ReferentClass {
    
    static initialize() {
        const WeaponReferent = require("./../WeaponReferent");
        MetaWeapon.globalMeta = new MetaWeapon();
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_TYPE, "Тип", 0, 0);
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_NAME, "Название", 0, 0);
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_NUMBER, "Номер", 0, 1);
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_BRAND, "Марка", 0, 0);
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_MODEL, "Модель", 0, 0);
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_DATE, "Дата создания", 0, 1);
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_CALIBER, "Калибр", 0, 1);
        MetaWeapon.globalMeta.addFeature(WeaponReferent.ATTR_REF, "Ссылка", 0, 0);
    }
    
    get name() {
        const WeaponReferent = require("./../WeaponReferent");
        return WeaponReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Оружие";
    }
    
    getImageId(obj = null) {
        return MetaWeapon.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaWeapon.IMAGE_ID = "weapon";
        MetaWeapon.globalMeta = null;
    }
}


MetaWeapon.static_constructor();

module.exports = MetaWeapon