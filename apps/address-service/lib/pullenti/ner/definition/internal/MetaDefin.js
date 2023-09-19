/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");
const DefinitionKind = require("./../DefinitionKind");

class MetaDefin extends ReferentClass {
    
    static initialize() {
        const DefinitionReferent = require("./../DefinitionReferent");
        MetaDefin.globalMeta = new MetaDefin();
        MetaDefin.globalMeta.addFeature(DefinitionReferent.ATTR_TERMIN, "Термин", 1, 0);
        MetaDefin.globalMeta.addFeature(DefinitionReferent.ATTR_TERMIN_ADD, "Дополнение термина", 0, 0);
        MetaDefin.globalMeta.addFeature(DefinitionReferent.ATTR_VALUE, "Значение", 1, 0);
        MetaDefin.globalMeta.addFeature(DefinitionReferent.ATTR_MISC, "Мелочь", 0, 0);
        MetaDefin.globalMeta.addFeature(DefinitionReferent.ATTR_DECREE, "Ссылка на НПА", 0, 0);
        let fi = MetaDefin.globalMeta.addFeature(DefinitionReferent.ATTR_KIND, "Тип", 1, 1);
        fi.addValue(DefinitionKind.ASSERTATION.toString(), "Утверждение", null, null);
        fi.addValue(DefinitionKind.DEFINITION.toString(), "Определение", null, null);
        fi.addValue(DefinitionKind.NEGATION.toString(), "Отрицание", null, null);
    }
    
    get name() {
        const DefinitionReferent = require("./../DefinitionReferent");
        return DefinitionReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Тезис";
    }
    
    getImageId(obj = null) {
        const DefinitionReferent = require("./../DefinitionReferent");
        if (obj instanceof DefinitionReferent) {
            let ki = obj.kind;
            if (ki === DefinitionKind.DEFINITION) 
                return MetaDefin.IMAGE_DEF_ID;
        }
        return MetaDefin.IMAGE_ASS_ID;
    }
    
    static static_constructor() {
        MetaDefin.IMAGE_DEF_ID = "defin";
        MetaDefin.IMAGE_ASS_ID = "assert";
        MetaDefin.globalMeta = null;
    }
}


MetaDefin.static_constructor();

module.exports = MetaDefin