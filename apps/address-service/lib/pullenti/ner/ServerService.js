/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");
const Stream = require("./../unisharp/Stream");
const MemoryStream = require("./../unisharp/MemoryStream");
const WebClient = require("./../unisharp/WebClient");

const MorphLang = require("./../morph/MorphLang");
const SerializerHelper = require("./core/internal/SerializerHelper");
const ProcessorService = require("./ProcessorService");
const AnalysisKit = require("./core/AnalysisKit");
const AnalysisResult = require("./AnalysisResult");
const SourceOfAnalysis = require("./SourceOfAnalysis");

/**
 * Поддержка проведения анализа текста на внешнем сервере
 */
class ServerService {
    
    /**
     * Проверить работоспособность сервера Pullenti.Server. 
     * Отправляется GET-запрос на сервер, возвращает ASCII-строку с версией SDK.
     * @param _address адрес вместе с портом (если null, то это http://localhost:1111)
     * @return версия SDK на сервере или null, если недоступен
     */
    static getServerVersion(_address) {
        try {
            let web = new WebClient();
            let res = web.downloadData((_address != null ? _address : "http://localhost:1111"));
            if (res === null || res.length === 0) 
                return null;
            return Utils.decodeString("UTF-8", res, 0, -1);
        } catch (ex) {
            return null;
        }
    }
    
    /**
     * Подготовить данные для POST-отправки на сервер
     * @param proc процессор, настройки (анализаторы) которого должны быть воспроизведены на сервере (если null, то стандартный)
     * @param text обрабатывамый текст
     * @param lang язык (если не задан, то будет определён автоматически)
     * @return 
     */
    static preparePostData(proc, text, lang = null) {
        let dat = null;
        let mem1 = new MemoryStream(); 
        try {
            let tmp = new StringBuilder();
            tmp.append((lang === null ? 0 : lang.value)).append(";");
            if (proc !== null) {
                for (const a of proc.analyzers) {
                    tmp.append((a.ignoreThisAnalyzer ? "-" : "")).append(a.name).append(";");
                }
            }
            else 
                tmp.append("ALL;");
            SerializerHelper.serializeInt(mem1, 1234);
            SerializerHelper.serializeString(mem1, tmp.toString());
            SerializerHelper.serializeString(mem1, text);
            dat = mem1.toByteArray();
        }
        finally {
            mem1.close();
        }
        return dat;
    }
    
    /**
     * Оформить результат из того, что вернул сервер
     * @param dat массив байт, возвращённый сервером
     * @return результат (но может быть Exception, если была на сервере ошибка)
     */
    static createResult(dat) {
        if (dat === null || (dat.length < 1)) 
            throw new Error("Empty result");
        let res = new AnalysisResult();
        let kit = new AnalysisKit(null);
        let mem2 = new MemoryStream(dat); 
        try {
            if ((String.fromCharCode(dat[0])) === 'E' && (String.fromCharCode(dat[1])) === 'R') {
                let err = SerializerHelper.deserializeString(mem2);
                throw new Error(err);
            }
            kit.deserialize(mem2);
            res.entities.splice(res.entities.length, 0, ...kit.entities);
            res.firstToken = kit.firstToken;
            res.sofa = kit.sofa;
            let i = SerializerHelper.deserializeInt(mem2);
            res.baseLanguage = MorphLang._new269(i);
            i = SerializerHelper.deserializeInt(mem2);
            for (; i > 0; i--) {
                res.log.push(SerializerHelper.deserializeString(mem2));
            }
        }
        finally {
            mem2.close();
        }
        return res;
    }
    
    /**
     * Обработать текст на сервере (если он запущен). 
     * Функция фактически оформляет данные для отправки на сервер через PreparePostData(...), 
     * затем делает POST-запрос по http, полученный массив байт через CreateResult(...) оформляет как результат. 
     * Внимание! Внешняя онтология не поддерживается, в отличие от локальной обработки через Process.
     * @param _address адрес вместе с портом (если null, то это http://localhost:1111)
     * @param proc процессор, настройки (анализаторы) которого должны быть воспроизведены на сервере (если null, то стандартный)
     * @param text обрабатывамый текст
     * @param lang язык (если не задан, то будет определён автоматически)
     * @return аналитический контейнер с результатом
     * Обработать текст на сервере
     */
    static processOnServer(_address, proc, text, lang = null) {
        let dat = ServerService.preparePostData(proc, text, lang);
        let web = new WebClient();
        let res = web.uploadData((_address != null ? _address : "http://localhost:1111"), dat);
        return ServerService.createResult(res);
    }
    
    // Для внутреннего использования
    static internalProc(stream) {
        let tag = SerializerHelper.deserializeInt(stream);
        if (tag !== 1234) 
            return null;
        let attrs = SerializerHelper.deserializeString(stream);
        if (Utils.isNullOrEmpty(attrs)) 
            return null;
        let parts = Utils.splitString(attrs, ';', false);
        if (parts.length < 1) 
            return null;
        let lang = null;
        if (parts[0] !== "0") 
            lang = MorphLang._new269(Utils.parseInt(parts[0]));
        let proc = ProcessorService.createEmptyProcessor(); 
        try {
            for (let i = 1; i < parts.length; i++) {
                let nam = parts[i];
                if (nam.length === 0) 
                    continue;
                let ign = false;
                if (nam[0] === '-') {
                    ign = true;
                    nam = nam.substring(1);
                }
                for (const a of ProcessorService.getAnalyzers()) {
                    if (a.name === nam || ((nam === "ALL" && !a.isSpecific))) {
                        let aa = a.clone();
                        if (ign) 
                            a.ignoreThisAnalyzer = true;
                        proc.addAnalyzer(a);
                    }
                }
            }
            let txt = SerializerHelper.deserializeString(stream);
            let ar = null;
            try {
                ar = proc.process(new SourceOfAnalysis(txt), null, lang);
            } catch (ex) {
            }
            let res = null;
            if (ar !== null && (ar.tag instanceof AnalysisKit)) {
                let mem = new MemoryStream(); 
                try {
                    let kit = Utils.as(ar.tag, AnalysisKit);
                    kit.entities.splice(0, kit.entities.length);
                    kit.entities.splice(kit.entities.length, 0, ...ar.entities);
                    kit.serialize(mem, true);
                    SerializerHelper.serializeInt(mem, (ar.baseLanguage === null ? 0 : ar.baseLanguage.value));
                    SerializerHelper.serializeInt(mem, ar.log.length);
                    for (const s of ar.log) {
                        SerializerHelper.serializeString(mem, s);
                    }
                    res = mem.toByteArray();
                }
                finally {
                    mem.close();
                }
            }
            return res;
        }
        finally {
            proc.close();
        }
    }
}


module.exports = ServerService