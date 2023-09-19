/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const TerminParseAttr = require("./TerminParseAttr");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const ConjunctionToken = require("./ConjunctionToken");
const TextToken = require("./../TextToken");
const Termin = require("./Termin");
const TerminCollection = require("./TerminCollection");
const NounPhraseHelper = require("./NounPhraseHelper");
const ConjunctionType = require("./ConjunctionType");

/**
 * Поддержка работы с союзами (запятая тоже считается союзом). Союзы могут быть из нескольких слов, 
 * например, "а также и".
 * Хелпер союзов
 */
class ConjunctionHelper {
    
    /**
     * Попытаться выделить союз с указанного токена.
     * @param t начальный токен
     * @return результат или null
     */
    static tryParse(t) {
        if (!(t instanceof TextToken)) 
            return null;
        if (t.isComma) {
            let ne = ConjunctionHelper.tryParse(t.next);
            if (ne !== null) {
                ne.beginToken = t;
                ne.isSimple = false;
                return ne;
            }
            return ConjunctionToken._new781(t, t, ConjunctionType.COMMA, true, ",");
        }
        let tok = ConjunctionHelper.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok !== null) {
            if (t.isValue("ТО", null)) {
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSEADVERBS, 0, null);
                if (npt !== null && npt.endChar > tok.endToken.endChar) 
                    return null;
            }
            if (tok.termin.tag2 !== null) {
                if (!(tok.endToken instanceof TextToken)) 
                    return null;
                if (tok.endToken.getMorphClassInDictionary().isVerb) {
                    if (!tok.endToken.term.endsWith("АЯ")) 
                        return null;
                }
            }
            return ConjunctionToken._new782(t, tok.endToken, tok.termin.canonicText, ConjunctionType.of(tok.termin.tag));
        }
        if (!t.getMorphClassInDictionary().isConjunction) 
            return null;
        if (t.isAnd || t.isOr) {
            let res = ConjunctionToken._new783(t, t, t.term, true, (t.isOr ? ConjunctionType.OR : ConjunctionType.AND));
            if (((t.next !== null && t.next.isChar('(') && (t.next.next instanceof TextToken)) && t.next.next.isOr && t.next.next.next !== null) && t.next.next.next.isChar(')')) 
                res.endToken = t.next.next.next;
            else if ((t.next !== null && t.next.isCharOf("\\/") && (t.next.next instanceof TextToken)) && t.next.next.isOr) 
                res.endToken = t.next.next;
            return res;
        }
        let term = t.term;
        if (term === "НИ") 
            return ConjunctionToken._new782(t, t, term, ConjunctionType.NOT);
        if ((term === "А" || term === "НО" || term === "ЗАТО") || term === "ОДНАКО") 
            return ConjunctionToken._new782(t, t, term, ConjunctionType.BUT);
        return null;
    }
    
    static initialize() {
        if (ConjunctionHelper.m_Ontology !== null) 
            return;
        ConjunctionHelper.m_Ontology = new TerminCollection();
        let te = null;
        te = Termin._new170("ТАКЖЕ", ConjunctionType.AND);
        te.addVariant("А ТАКЖЕ", false);
        te.addVariant("КАК И", false);
        te.addVariant("ТАК И", false);
        te.addVariant("А РАВНО", false);
        te.addVariant("А РАВНО И", false);
        ConjunctionHelper.m_Ontology.add(te);
        te = Termin._new170("ЕСЛИ", ConjunctionType.IF);
        ConjunctionHelper.m_Ontology.add(te);
        te = Termin._new170("ТО", ConjunctionType.THEN);
        ConjunctionHelper.m_Ontology.add(te);
        te = Termin._new170("ИНАЧЕ", ConjunctionType.ELSE);
        ConjunctionHelper.m_Ontology.add(te);
        te = Termin._new349("ИНАЧЕ КАК", ConjunctionType.EXCEPT, true);
        te.addVariant("ИНАЧЕ, КАК", false);
        te.addVariant("ЗА ИСКЛЮЧЕНИЕМ", false);
        te.addVariant("ИСКЛЮЧАЯ", false);
        te.addAbridge("КРОМЕ");
        te.addAbridge("КРОМЕ КАК");
        te.addAbridge("КРОМЕ, КАК");
        ConjunctionHelper.m_Ontology.add(te);
        te = Termin._new349("ВКЛЮЧАЯ", ConjunctionType.INCLUDE, true);
        te.addVariant("В ТОМ ЧИСЛЕ", false);
        ConjunctionHelper.m_Ontology.add(te);
    }
    
    static static_constructor() {
        ConjunctionHelper.m_Ontology = null;
    }
}


ConjunctionHelper.static_constructor();

module.exports = ConjunctionHelper