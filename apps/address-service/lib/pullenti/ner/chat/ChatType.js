/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Типы диалоговых элементов
 */
class ChatType {

    constructor(val, str) {
        this.m_val = val;
        this.m_str = str;
    }
    toString() {
        return this.m_str;
    }
    value() {
        return this.m_val;
    }
    static of(val) {
        if(val instanceof ChatType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(ChatType.mapStringToEnum.containsKey(val))
                return ChatType.mapStringToEnum.get(val);
            return null;
        }
        if(ChatType.mapIntToEnum.containsKey(val))
            return ChatType.mapIntToEnum.get(val);
        let it = new ChatType(val, val.toString());
        ChatType.mapIntToEnum.put(val, it);
        ChatType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return ChatType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return ChatType.m_Values;
    }
    static static_constructor() {
        ChatType.mapIntToEnum = new Hashtable();
        ChatType.mapStringToEnum = new Hashtable();
        ChatType.UNDEFINED = new ChatType(0, "UNDEFINED");
        ChatType.mapIntToEnum.put(ChatType.UNDEFINED.value(), ChatType.UNDEFINED); 
        ChatType.mapStringToEnum.put(ChatType.UNDEFINED.m_str.toUpperCase(), ChatType.UNDEFINED); 
        ChatType.THANKS = new ChatType(1, "THANKS");
        ChatType.mapIntToEnum.put(ChatType.THANKS.value(), ChatType.THANKS); 
        ChatType.mapStringToEnum.put(ChatType.THANKS.m_str.toUpperCase(), ChatType.THANKS); 
        ChatType.MISC = new ChatType(2, "MISC");
        ChatType.mapIntToEnum.put(ChatType.MISC.value(), ChatType.MISC); 
        ChatType.mapStringToEnum.put(ChatType.MISC.m_str.toUpperCase(), ChatType.MISC); 
        ChatType.HELLO = new ChatType(3, "HELLO");
        ChatType.mapIntToEnum.put(ChatType.HELLO.value(), ChatType.HELLO); 
        ChatType.mapStringToEnum.put(ChatType.HELLO.m_str.toUpperCase(), ChatType.HELLO); 
        ChatType.BYE = new ChatType(4, "BYE");
        ChatType.mapIntToEnum.put(ChatType.BYE.value(), ChatType.BYE); 
        ChatType.mapStringToEnum.put(ChatType.BYE.m_str.toUpperCase(), ChatType.BYE); 
        ChatType.ACCEPT = new ChatType(5, "ACCEPT");
        ChatType.mapIntToEnum.put(ChatType.ACCEPT.value(), ChatType.ACCEPT); 
        ChatType.mapStringToEnum.put(ChatType.ACCEPT.m_str.toUpperCase(), ChatType.ACCEPT); 
        ChatType.CANCEL = new ChatType(6, "CANCEL");
        ChatType.mapIntToEnum.put(ChatType.CANCEL.value(), ChatType.CANCEL); 
        ChatType.mapStringToEnum.put(ChatType.CANCEL.m_str.toUpperCase(), ChatType.CANCEL); 
        ChatType.BUSY = new ChatType(7, "BUSY");
        ChatType.mapIntToEnum.put(ChatType.BUSY.value(), ChatType.BUSY); 
        ChatType.mapStringToEnum.put(ChatType.BUSY.m_str.toUpperCase(), ChatType.BUSY); 
        ChatType.VERB = new ChatType(8, "VERB");
        ChatType.mapIntToEnum.put(ChatType.VERB.value(), ChatType.VERB); 
        ChatType.mapStringToEnum.put(ChatType.VERB.m_str.toUpperCase(), ChatType.VERB); 
        ChatType.LATER = new ChatType(9, "LATER");
        ChatType.mapIntToEnum.put(ChatType.LATER.value(), ChatType.LATER); 
        ChatType.mapStringToEnum.put(ChatType.LATER.m_str.toUpperCase(), ChatType.LATER); 
        ChatType.DATE = new ChatType(10, "DATE");
        ChatType.mapIntToEnum.put(ChatType.DATE.value(), ChatType.DATE); 
        ChatType.mapStringToEnum.put(ChatType.DATE.m_str.toUpperCase(), ChatType.DATE); 
        ChatType.DATERANGE = new ChatType(11, "DATERANGE");
        ChatType.mapIntToEnum.put(ChatType.DATERANGE.value(), ChatType.DATERANGE); 
        ChatType.mapStringToEnum.put(ChatType.DATERANGE.m_str.toUpperCase(), ChatType.DATERANGE); 
        ChatType.REPEAT = new ChatType(12, "REPEAT");
        ChatType.mapIntToEnum.put(ChatType.REPEAT.value(), ChatType.REPEAT); 
        ChatType.mapStringToEnum.put(ChatType.REPEAT.m_str.toUpperCase(), ChatType.REPEAT); 
        ChatType.m_Values = Array.from(ChatType.mapIntToEnum.values);
        ChatType.m_Keys = Array.from(ChatType.mapIntToEnum.keys);
    }
}


ChatType.static_constructor();

module.exports = ChatType