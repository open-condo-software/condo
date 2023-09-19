/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ControlModelQuestion = require("./ControlModelQuestion");
const MorphLang = require("./../../morph/MorphLang");
const DerivateDictionary = require("./../internal/DerivateDictionary");

/**
 * Сервис для получение информации о словах. Однокоренные слова объединены в так называемые дериватные группы. 
 * В настоящий момент поддержаны русский и украинский языки.
 * 
 * Сервис дериватных групп
 */
class DerivateService {
    
    /**
     * Инициализация внутренних словарей. 
     * Можно не вызывать, но тогда будет автоматически вызвано при первом обращении, 
     * и соответственно первое обращение отработает на несколько секунд дольше. 
     * Если инициализация идёт через Sdk.Initialize или ProcessorService.Initialize, то эту функцию вызывать не надо.
     * @param langs по умолчанию, русский с украинским
     */
    static initialize(langs = null) {
        if (langs === null || langs.isUndefined) 
            langs = MorphLang.RU;
        ControlModelQuestion.initialize();
        DerivateService.loadLanguages(langs);
    }
    
    static getLoadedLanguages() {
        if (DerivateService.m_DerRu.m_AllGroups.length > 0) 
            return MorphLang.ooBitor(MorphLang.RU, MorphLang.UA);
        return MorphLang.UNKNOWN;
    }
    
    static loadLanguages(langs) {
        if (langs.isRu || langs.isUa) {
            if (!DerivateService.m_DerRu.init(MorphLang.RU, true)) 
                throw new Error("Not found resource file e_ru.dat in Enplanatory");
        }
        if (langs.isUa) {
        }
    }
    
    static loadDictionaryRu(dat) {
        DerivateService.m_DerRu.load(dat);
    }
    
    static unloadLanguages(langs) {
        if (langs.isRu || langs.isUa) {
            if (langs.isRu && langs.isUa) 
                DerivateService.m_DerRu.unload();
        }
        ;
    }
    
    /**
     * Найти для слова дериватные группы DerivateGroup, в которые входит это слово 
     * (групп может быть несколько, но в большинстве случаев - одна)
     * @param word слово в верхнем регистре и нормальной форме
     * @param tryVariants пытаться ли для неизвестных слов делать варианты
     * @param lang язык (по умолчанию, русский)
     * @return список дериватных групп DerivateGroup
     */
    static findDerivates(word, tryVariants = true, lang = null) {
        return DerivateService.m_DerRu.find(word, tryVariants, lang);
    }
    
    /**
     * Найти для слова его толковую информацию (среди дериватных групп)
     * @param word слово в верхнем регистре и нормальной форме
     * @param lang возможный язык
     * @return список слов DerivateWord
     */
    static findWords(word, lang = null) {
        let grs = DerivateService.m_DerRu.find(word, false, lang);
        if (grs === null) 
            return null;
        let res = null;
        for (const g of grs) {
            for (const w of g.words) {
                if (w.spelling === word) {
                    if (res === null) 
                        res = new Array();
                    res.push(w);
                }
            }
        }
        return res;
    }
    
    /**
     * Получить слова однокоренное слово заданной части речи. 
     * Например, для существительного "ГЛАГОЛ" вариант прилагательного: "ГЛАГОЛЬНЫЙ"
     * @param word слово в верхнем регистре и нормальной форме
     * @param cla нужная часть речи
     * @param lang возможный язык
     * @return вариант или null при ненахождении
     * 
     */
    static getWordClassVar(word, cla, lang = null) {
        let grs = DerivateService.m_DerRu.find(word, false, lang);
        if (grs === null) 
            return null;
        for (const g of grs) {
            for (const w of g.words) {
                if (w._class.equals(cla)) 
                    return w.spelling;
            }
        }
        return null;
    }
    
    /**
     * Может ли быть одушевлённым
     * @param word слово в верхнем регистре и нормальной форме
     * @param lang язык (по умолчанию, русский)
     * @return да-нет
     */
    static isAnimated(word, lang = null) {
        let grs = DerivateService.m_DerRu.find(word, false, lang);
        if (grs === null) 
            return false;
        for (const g of grs) {
            for (const w of g.words) {
                if (w.spelling === word) {
                    if (w.attrs.isAnimated) 
                        return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Может ли иметь собственное имя
     * @param word слово в верхнем регистре и нормальной форме
     * @param lang язык (по умолчанию, русский)
     * @return да-нет
     */
    static isNamed(word, lang = null) {
        let grs = DerivateService.m_DerRu.find(word, false, lang);
        if (grs === null) 
            return false;
        for (const g of grs) {
            for (const w of g.words) {
                if (w.spelling === word) {
                    if (w.attrs.isNamed) 
                        return true;
                }
            }
        }
        return false;
    }
    
    static setDictionary(dic) {
        DerivateService.m_DerRu = dic;
    }
    
    static static_constructor() {
        DerivateService.m_DerRu = new DerivateDictionary();
        DerivateService.m_Lock = new Object();
    }
}


DerivateService.static_constructor();

module.exports = DerivateService