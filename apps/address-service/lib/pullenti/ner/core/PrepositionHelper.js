/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MorphClass = require("./../../morph/MorphClass");
const MorphGender = require("./../../morph/MorphGender");
const MorphCase = require("./../../morph/MorphCase");
const MorphNumber = require("./../../morph/MorphNumber");
const MorphLang = require("./../../morph/MorphLang");
const LanguageHelper = require("./../../morph/LanguageHelper");
const TerminParseAttr = require("./TerminParseAttr");
const TextToken = require("./../TextToken");
const Termin = require("./Termin");
const TerminCollection = require("./TerminCollection");
const PrepositionToken = require("./PrepositionToken");

/**
 * Поддержка работы с предлогами
 * Хелпер предлогов
 */
class PrepositionHelper {
    
    /**
     * Попытаться выделить предлог с указанного токена
     * @param t начальный токен
     * @return результат или null
     */
    static tryParse(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let tok = PrepositionHelper.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok !== null) 
            return PrepositionToken._new849(t, tok.endToken, tok.termin.canonicText, tok.termin.tag);
        let mc = t.getMorphClassInDictionary();
        if (!mc.isPreposition) 
            return null;
        let res = new PrepositionToken(t, t);
        res.normal = t.getNormalCaseText(MorphClass.PREPOSITION, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
        res.nextCase = LanguageHelper.getCaseAfterPreposition(res.normal);
        if ((t.next !== null && t.next.isHiphen && !t.isWhitespaceAfter) && (t.next.next instanceof TextToken) && t.next.next.getMorphClassInDictionary().isPreposition) 
            res.endToken = t.next.next;
        return res;
    }
    
    static initialize() {
        if (PrepositionHelper.m_Ontology !== null) 
            return;
        PrepositionHelper.m_Ontology = new TerminCollection();
        for (const s of ["близко от", "в виде", "в зависимости от", "в интересах", "в качестве", "в лице", "в отличие от", "в отношении", "в пандан", "в пользу", "в преддверии", "в продолжение", "в результате", "в роли", "в силу", "в случае", "в течение", "в целях", "в честь", "во имя", "вплоть до", "впредь до", "за вычетом", "за исключением", "за счет", "исходя из", "на благо", "на виду у", "на глазах у", "начиная с", "невзирая на", "недалеко от", "независимо от", "от имени", "от лица", "по линии", "по мере", "по поводу", "по причине", "по случаю", "поблизости от", "под видом", "под эгидой", "при помощи", "с ведома", "с помощью", "с точки зрения", "с целью"]) {
            PrepositionHelper.m_Ontology.add(Termin._new850(s.toUpperCase(), MorphLang.RU, true, MorphCase.GENITIVE));
        }
        for (const s of ["вдоль по", "по направлению к", "применительно к", "смотря по", "судя по"]) {
            PrepositionHelper.m_Ontology.add(Termin._new850(s.toUpperCase(), MorphLang.RU, true, MorphCase.DATIVE));
        }
        for (const s of ["несмотря на", "с прицелом на"]) {
            PrepositionHelper.m_Ontology.add(Termin._new850(s.toUpperCase(), MorphLang.RU, true, MorphCase.ACCUSATIVE));
        }
        for (const s of ["во славу"]) {
            PrepositionHelper.m_Ontology.add(Termin._new850(s.toUpperCase(), MorphLang.RU, true, (MorphCase.ooBitor(MorphCase.GENITIVE, MorphCase.DATIVE))));
        }
        for (const s of ["не считая"]) {
            PrepositionHelper.m_Ontology.add(Termin._new850(s.toUpperCase(), MorphLang.RU, true, (MorphCase.ooBitor(MorphCase.GENITIVE, MorphCase.ACCUSATIVE))));
        }
        for (const s of ["в связи с", "в соответствии с", "вслед за", "лицом к лицу с", "наряду с", "по сравнению с", "рядом с", "следом за"]) {
            PrepositionHelper.m_Ontology.add(Termin._new850(s.toUpperCase(), MorphLang.RU, true, MorphCase.INSTRUMENTAL));
        }
    }
    
    static static_constructor() {
        PrepositionHelper.m_Ontology = null;
    }
}


PrepositionHelper.static_constructor();

module.exports = PrepositionHelper