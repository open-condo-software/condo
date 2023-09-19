/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const VerbType = require("./VerbType");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaChat = require("./internal/MetaChat");
const ChatType = require("./ChatType");

class ChatReferent extends Referent {
    
    constructor() {
        super(ChatReferent.OBJ_TYPENAME);
        this.instanceOf = MetaChat.globalMeta;
    }
    
    toStringEx(shortVariant, lang, lev = 0) {
        let res = new StringBuilder();
        res.append(this.typ.toString());
        if (this.not) 
            res.append(" not");
        let val = this.value;
        if (val !== null) 
            res.append(" ").append(val);
        let vty = this.verbTypes;
        if (vty.length > 0) {
            res.append("[");
            for (let i = 0; i < vty.length; i++) {
                if (i > 0) 
                    res.append(", ");
                res.append(vty[i].toString());
            }
            res.append("]");
        }
        return res.toString();
    }
    
    get typ() {
        let str = this.getStringValue(ChatReferent.ATTR_TYPE);
        if (Utils.isNullOrEmpty(str)) 
            return ChatType.UNDEFINED;
        try {
            return ChatType.of(str);
        } catch (ex685) {
        }
        return ChatType.UNDEFINED;
    }
    set typ(_value) {
        this.addSlot(ChatReferent.ATTR_TYPE, _value.toString().toUpperCase(), true, 0);
        return _value;
    }
    
    get not() {
        return this.getStringValue(ChatReferent.ATTR_NOT) === "true";
    }
    set not(_value) {
        if (!_value) 
            this.addSlot(ChatReferent.ATTR_NOT, null, true, 0);
        else 
            this.addSlot(ChatReferent.ATTR_NOT, "true", true, 0);
        return _value;
    }
    
    get value() {
        return this.getStringValue(ChatReferent.ATTR_VALUE);
    }
    set value(_value) {
        this.addSlot(ChatReferent.ATTR_VALUE, _value, true, 0);
        return _value;
    }
    
    get verbTypes() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === ChatReferent.ATTR_VERBTYPE) {
                try {
                    res.push(VerbType.of(Utils.asString(s.value)));
                } catch (ex686) {
                }
            }
        }
        return res;
    }
    
    addVerbType(vt) {
        this.addSlot(ChatReferent.ATTR_VERBTYPE, vt.toString().toUpperCase(), false, 0);
    }
    
    canBeEquals(obj, _typ = ReferentsEqualType.WITHINONETEXT) {
        let tr = Utils.as(obj, ChatReferent);
        if (tr === null) 
            return false;
        if (tr.typ !== this.typ) 
            return false;
        if (tr.value !== this.value) 
            return false;
        if (tr.not !== this.not) 
            return false;
        return true;
    }
    
    static _new684(_arg1) {
        let res = new ChatReferent();
        res.typ = _arg1;
        return res;
    }
    
    static static_constructor() {
        ChatReferent.OBJ_TYPENAME = "CHAT";
        ChatReferent.ATTR_TYPE = "TYPE";
        ChatReferent.ATTR_VALUE = "VALUE";
        ChatReferent.ATTR_NOT = "NOT";
        ChatReferent.ATTR_VERBTYPE = "VERBTYPE";
    }
}


ChatReferent.static_constructor();

module.exports = ChatReferent