/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

const MorphCase = require("./MorphCase");
const MorphGender = require("./MorphGender");
const MorphMiscInfo = require("./MorphMiscInfo");
const MorphNumber = require("./MorphNumber");
const MorphLang = require("./MorphLang");
const UnicodeInfo = require("./internal/UnicodeInfo");
const MorphClass = require("./MorphClass");
const MorphWordForm = require("./MorphWordForm");
const InnerMorphology = require("./internal/InnerMorphology");

/**
 * Сервис морфологического анализа текстов (POS-tagger).
 * 
 * Сервис морфологии
 */
class MorphologyService {
    
    /**
     * Инициализация внутренних словарей. 
     * Можно не вызывать, но тогда будет автоматически вызвано при первом обращении к морфологии, 
     * и соответственно первый разбор отработает на несколько секунд дольше. 
     * Если используете Sdk.Initialize() или ProcessorService.Initialize(), то тогда эту функцию вызывать не нужно, 
     * так как там внутри это делается.
     * @param langs по умолчанию, русский и английский
     */
    static initialize(langs = null) {
        if (MorphologyService.m_Initialized) 
            return;
        UnicodeInfo.initialize();
        if (langs === null || langs.isUndefined) 
            langs = MorphLang.ooBitor(MorphLang.RU, MorphLang.EN);
        MorphologyService.m_Morph.loadLanguages(langs, MorphologyService.LAZY_LOAD);
        MorphologyService.m_Initialized = true;
    }
    
    static getLoadedLanguages() {
        return MorphologyService.m_Morph.loadedLanguages;
    }
    
    /**
     * Загрузить язык(и), если они ещё не загружены
     * @param langs загружаемые языки
     */
    static loadLanguages(langs) {
        MorphologyService.m_Morph.loadLanguages(langs, MorphologyService.LAZY_LOAD);
    }
    
    /**
     * Выгрузить язык(и), если они больше не нужны
     * @param langs выгружаемые языки
     */
    static unloadLanguages(langs) {
        MorphologyService.m_Morph.unloadLanguages(langs);
    }
    
    /**
     * Произвести чистую токенизацию без формирования морф-вариантов
     * @param text исходный текст
     * @return последовательность результирующих лексем
     */
    static tokenize(text) {
        if (Utils.isNullOrEmpty(text)) 
            return null;
        let res = MorphologyService.m_Morph.run(text, true, MorphLang.UNKNOWN, false, null);
        if (res !== null) {
            for (const r of res) {
                if (r.wordForms === null) 
                    r.wordForms = MorphologyService.m_EmptyWordForms;
                for (const wf of r.wordForms) {
                    if (wf.misc === null) 
                        wf.misc = MorphologyService.m_EmptyMisc;
                }
            }
        }
        return res;
    }
    
    /**
     * Произвести морфологический анализ текста. Если используете морфологию в составе лингвистического процессора из 
     * ProcessorService, то эту функцию явно вызывать не придётся.
     * @param text исходный текст
     * @param lang базовый язык (если null, то будет определён автоматически)
     * @param progress это для бегунка
     * @return последовательность результирующих лексем MorphToken
     * 
     */
    static process(text, lang = null, progress = null) {
        if (Utils.isNullOrEmpty(text)) 
            return null;
        if (!MorphologyService.m_Initialized) 
            throw new Error("Pullenti Morphology Service not initialized");
        let res = MorphologyService.m_Morph.run(text, false, lang, false, progress);
        if (res !== null) {
            for (const r of res) {
                if (r.wordForms === null) 
                    r.wordForms = MorphologyService.m_EmptyWordForms;
                for (const wf of r.wordForms) {
                    if (wf.misc === null) 
                        wf.misc = MorphologyService.m_EmptyMisc;
                }
            }
        }
        return res;
    }
    
    /**
     * Получить все варианты словоформ для нормальной формы слова
     * @param word нормальная форма слова (лемма), в верхнем регистре
     * @param lang язык (по умолчанию, русский)
     * @return список словоформ MorphWordForm
     */
    static getAllWordforms(word, lang = null) {
        if (word === null) 
            return null;
        if (!MorphologyService.m_Initialized) 
            throw new Error("Pullenti Morphology Service not initialized");
        for (const ch of word) {
            if (Utils.isLowerCase(ch)) {
                word = word.toUpperCase();
                break;
            }
        }
        let res = MorphologyService.m_Morph.getAllWordforms(word, lang);
        if (res !== null) {
            for (const r of res) {
                if (r.misc === null) 
                    r.misc = MorphologyService.m_EmptyMisc;
            }
        }
        return res;
    }
    
    /**
     * Получить вариант написания словоформы
     * @param word слово
     * @param morphInfo морфологическая информация
     * @return вариант написания
     */
    static getWordform(word, morphInfo) {
        if (morphInfo === null || Utils.isNullOrEmpty(word)) 
            return word;
        if (!MorphologyService.m_Initialized) 
            throw new Error("Pullenti Morphology Service not initialized");
        let cla = morphInfo._class;
        if (cla.isUndefined) {
            try {
                let mi0 = MorphologyService.getWordBaseInfo(word, null, false, false);
                if (mi0 !== null) 
                    cla = mi0._class;
            } catch (ex277) {
            }
        }
        let word1 = word;
        for (const ch of word) {
            if (Utils.isLowerCase(ch)) {
                word1 = word.toUpperCase();
                break;
            }
        }
        let wf = Utils.as(morphInfo, MorphWordForm);
        let res = MorphologyService.m_Morph.getWordform(word1, cla, morphInfo.gender, morphInfo._case, morphInfo.number, morphInfo.language, wf);
        if (Utils.isNullOrEmpty(res)) 
            return word;
        return res;
    }
    
    /**
     * Получить для словоформы род\число\падеж
     * @param word словоформа
     * @param lang возможный язык
     * @param isCaseNominative исходное слово в именительном падеже (иначе считается падеж любым)
     * @param inDictOnly при true не строить гипотезы для несловарных слов
     * @return базовая морфологическая информация
     */
    static getWordBaseInfo(word, lang = null, isCaseNominative = false, inDictOnly = false) {
        if (!MorphologyService.m_Initialized) 
            throw new Error("Pullenti Morphology Service not initialized");
        let mt = MorphologyService.m_Morph.run(word, false, lang, false, null);
        let bi = new MorphWordForm();
        let cla = new MorphClass();
        if (mt !== null && mt.length > 0) {
            for (let k = 0; k < 2; k++) {
                let ok = false;
                for (const wf of mt[0].wordForms) {
                    if (k === 0) {
                        if (!wf.isInDictionary) 
                            continue;
                    }
                    else if (wf.isInDictionary) 
                        continue;
                    if (isCaseNominative) {
                        if (!wf._case.isNominative && !wf._case.isUndefined) 
                            continue;
                    }
                    cla.value |= wf._class.value;
                    bi.gender = MorphGender.of((bi.gender.value()) | (wf.gender.value()));
                    bi._case = MorphCase.ooBitor(bi._case, wf._case);
                    bi.number = MorphNumber.of((bi.number.value()) | (wf.number.value()));
                    if (wf.misc !== null && bi.misc === null) 
                        bi.misc = wf.misc;
                    ok = true;
                }
                if (ok || inDictOnly) 
                    break;
            }
        }
        bi._class = cla;
        return bi;
    }
    
    /**
     * Попробовать откорректировать одну букву словоформы, чтобы получилось словарное слово. 
     * Делается изменение одной буквы, удаление одной буквы и вставка одной буквы. 
     * Если получается несколько вариантов, то возвращается null. Для получение всех вариантов используйте CorrectWordEx.
     * @param word искаженное слово
     * @param lang возможный язык
     * @return откорректированное слово или null при невозможности
     */
    static correctWord(word, lang = null) {
        let vars = MorphologyService.m_Morph.correctWordByMorph(word, lang, true);
        if (vars === null || vars.length !== 1) 
            return null;
        return vars[0];
    }
    
    /**
     * Попробовать откорректировать одну букву словоформы, чтобы получилось словарное слово. 
     * Делается изменение одной буквы, удаление одной буквы и вставка одной буквы.
     * @param word искаженное слово
     * @param lang возможный язык
     * @return "правильные" варианты или null
     */
    static correctWordEx(word, lang = null) {
        return MorphologyService.m_Morph.correctWordByMorph(word, lang, false);
    }
    
    /**
     * Преобразовать наречие в прилагательное (это пока только для русского языка)
     * @param adverb наречие
     * @param bi род число падеж
     * @return прилагательное
     */
    static convertAdverbToAdjective(adverb, bi) {
        if (adverb === null || (adverb.length < 4)) 
            return null;
        let last = adverb[adverb.length - 1];
        if (last !== 'О' && last !== 'Е') 
            return adverb;
        let var1 = adverb.substring(0, 0 + adverb.length - 1) + "ИЙ";
        let var2 = adverb.substring(0, 0 + adverb.length - 1) + "ЫЙ";
        try {
            let bi1 = MorphologyService.getWordBaseInfo(var1, null, false, false);
            let bi2 = MorphologyService.getWordBaseInfo(var2, null, false, false);
            let _var = var1;
            if (!bi1._class.isAdjective && bi2._class.isAdjective) 
                _var = var2;
            if (bi === null) 
                return _var;
            return Utils.notNull(MorphologyService.m_Morph.getWordform(_var, MorphClass.ADJECTIVE, bi.gender, bi._case, bi.number, MorphLang.UNKNOWN, null), _var);
        } catch (ex278) {
        }
        return var1;
    }
    
    static static_constructor() {
        MorphologyService.m_Initialized = false;
        MorphologyService.m_EmptyWordForms = new Array();
        MorphologyService.m_EmptyMisc = new MorphMiscInfo();
        MorphologyService.LAZY_LOAD = true;
        MorphologyService.m_Morph = new InnerMorphology();
    }
}


MorphologyService.static_constructor();

module.exports = MorphologyService