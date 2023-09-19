/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaChat extends ReferentClass {
    
    static initialize() {
        const ChatReferent = require("./../ChatReferent");
        MetaChat.globalMeta = new MetaChat();
        MetaChat.globalMeta.addFeature(ChatReferent.ATTR_TYPE, "Тип", 1, 1);
        MetaChat.globalMeta.addFeature(ChatReferent.ATTR_VALUE, "Значение", 0, 1);
        MetaChat.globalMeta.addFeature(ChatReferent.ATTR_NOT, "Отрицание", 0, 1);
        MetaChat.globalMeta.addFeature(ChatReferent.ATTR_VERBTYPE, "Тип глагола", 0, 0);
    }
    
    get name() {
        const ChatReferent = require("./../ChatReferent");
        return ChatReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Элемент диалога";
    }
    
    getImageId(obj = null) {
        return MetaChat.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaChat.IMAGE_ID = "chat";
        MetaChat.globalMeta = null;
    }
}


MetaChat.static_constructor();

module.exports = MetaChat