/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const path = require('path');
const Utils = require("./../unisharp/Utils");
const Stopwatch = require("./../unisharp/Stopwatch");

const AddressHelper = require("./AddressHelper");
const GarHelper = require("./internal/GarHelper");
const MiscLocationHelper = require("./../ner/geo/internal/MiscLocationHelper");
const ProcessorService = require("./../ner/ProcessorService");
const NamedEntityAnalyzer = require("./../ner/named/NamedEntityAnalyzer");
const PersonAnalyzer = require("./../ner/person/PersonAnalyzer");
const RegionHelper = require("./internal/RegionHelper");
const GarStatistic = require("./GarStatistic");
const ImageWrapper = require("./ImageWrapper");
const GeoAnalyzer = require("./../ner/geo/GeoAnalyzer");
const PullentiAddressInternalResourceHelper = require("./internal/PullentiAddressInternalResourceHelper");
const INameChecker = require("./../ner/geo/internal/INameChecker");
const UriAnalyzer = require("./../ner/uri/UriAnalyzer");
const PhoneAnalyzer = require("./../ner/phone/PhoneAnalyzer");
const MoneyAnalyzer = require("./../ner/money/MoneyAnalyzer");
const DateAnalyzer = require("./../ner/date/DateAnalyzer");
const OrganizationAnalyzer = require("./../ner/org/OrganizationAnalyzer");
const AddressAnalyzer = require("./../ner/address/AddressAnalyzer");
const NameChecker = require("./internal/NameChecker");

/**
 * Сервис работы с адресами
 * 
 */
class AddressService {
    
    /**
     * Инициализация движка - необходимо вызывать один раз в начале работы.
     */
    static initialize() {
        const CorrectionHelper = require("./internal/CorrectionHelper");
        const AnalyzeHelper = require("./internal/AnalyzeHelper");
        if (AddressService.m_Inited) 
            return;
        AddressService.m_Inited = true;
        ProcessorService.initialize(null);
        MoneyAnalyzer.initialize();
        UriAnalyzer.initialize();
        PhoneAnalyzer.initialize();
        DateAnalyzer.initialize();
        GeoAnalyzer.initialize();
        MiscLocationHelper.NAME_CHECKER = new NameChecker();
        AddressAnalyzer.initialize();
        OrganizationAnalyzer.initialize();
        PersonAnalyzer.initialize();
        NamedEntityAnalyzer.initialize();
        AnalyzeHelper.init();
        GarHelper.init(null);
        CorrectionHelper.initialize0();
        AddressHelper.IMAGES.push(new ImageWrapper("country", PullentiAddressInternalResourceHelper.getBytes("country.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("region", PullentiAddressInternalResourceHelper.getBytes("region.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("admin", PullentiAddressInternalResourceHelper.getBytes("admin.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("municipal", PullentiAddressInternalResourceHelper.getBytes("municipal.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("settlement", PullentiAddressInternalResourceHelper.getBytes("settlement.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("city", PullentiAddressInternalResourceHelper.getBytes("city.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("locality", PullentiAddressInternalResourceHelper.getBytes("locality.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("district", PullentiAddressInternalResourceHelper.getBytes("district.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("area", PullentiAddressInternalResourceHelper.getBytes("area.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("street", PullentiAddressInternalResourceHelper.getBytes("street.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("plot", PullentiAddressInternalResourceHelper.getBytes("plot.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("building", PullentiAddressInternalResourceHelper.getBytes("building.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("room", PullentiAddressInternalResourceHelper.getBytes("room.png")));
        AddressHelper.IMAGES.push(new ImageWrapper("carplace", PullentiAddressInternalResourceHelper.getBytes("carplace.png")));
    }
    
    /**
     * Указание директории с индексом ГАР (если не задать, то выделяемые объекты привязываться не будут)
     * @param garPath папка с индексом ГАР
     */
    static setGarIndexPath(garPath) {
        const ServerHelper = require("./internal/ServerHelper");
        const CorrectionHelper = require("./internal/CorrectionHelper");
        GarHelper.init(garPath);
        if (garPath !== null) {
            let regFile = path.join(garPath, "regions.xml");
            RegionHelper.loadFromFile(regFile);
        }
        CorrectionHelper.initialize();
        ServerHelper.SERVER_URI = null;
    }
    
    /**
     * Получить папку с используемым ГАР-индексом (если null, то индекс не подгружен)
     * @return 
     */
    static getGarIndexPath() {
        if (GarHelper.GAR_INDEX === null) 
            return null;
        return GarHelper.GAR_INDEX.baseDir;
    }
    
    /**
     * Получить информацию по индексу и его объектам
     * @return 
     */
    static getGarStatistic() {
        const ServerHelper = require("./internal/ServerHelper");
        try {
            if (ServerHelper.SERVER_URI !== null) 
                return ServerHelper.getGarStatistic();
            if (GarHelper.GAR_INDEX === null) 
                return null;
            let res = new GarStatistic();
            res.indexPath = GarHelper.GAR_INDEX.baseDir;
            res.areaCount = GarHelper.GAR_INDEX.areasCount;
            res.houseCount = GarHelper.GAR_INDEX.housesCount;
            res.roomCount = GarHelper.GAR_INDEX.roomsCount;
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    /**
     * Для работы установить связь с сервером и все запросы делать через него 
     * (используется для ускорения работы для JS и Python)
     * @param uri например, http://localhost:2222, если null, то связь разрывается
     * @return 
     */
    static setServerConnection(uri) {
        const ServerHelper = require("./internal/ServerHelper");
        if (uri === null) {
            ServerHelper.SERVER_URI = null;
            return true;
        }
        let ver = ServerHelper.getServerVersion(uri);
        if (ver === null) {
            ServerHelper.SERVER_URI = null;
            return false;
        }
        else {
            AddressService.setGarIndexPath(null);
            ServerHelper.SERVER_URI = uri;
            return true;
        }
    }
    
    /**
     * Если связь с сервером установлена, то вернёт адрес
     * @return 
     */
    static getServerUri() {
        const ServerHelper = require("./internal/ServerHelper");
        return ServerHelper.SERVER_URI;
    }
    
    /**
     * Получить версию SDK на сервере
     * @param uri 
     * @return версия или null при недоступности сервера
     */
    static getServerVersion(uri) {
        const ServerHelper = require("./internal/ServerHelper");
        return ServerHelper.getServerVersion(uri);
    }
    
    /**
     * Обработать произвольный текст, в котором есть адреса
     * @param txt текст
     * @param pars дополнительные параметры (null - дефолтовые)
     * @return результат - для каждого найденного адреса свой экземпляр
     * 
     */
    static processText(txt, pars = null) {
        const AnalyzeHelper = require("./internal/AnalyzeHelper");
        const ServerHelper = require("./internal/ServerHelper");
        try {
            if (ServerHelper.SERVER_URI !== null) 
                return ServerHelper.processText(txt, pars);
            let ah = new AnalyzeHelper();
            let res = ah.analyze(txt, null, false, pars);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    /**
     * Обработать текст с одним адресом (адресное поле)
     * @param txt исходный текст
     * @param pars дополнительные параметры (null - дефолтовые)
     * @return результат обработки
     * 
     */
    static processSingleAddressText(txt, pars = null) {
        const TextAddress = require("./TextAddress");
        const ServerHelper = require("./internal/ServerHelper");
        const AnalyzeHelper = require("./internal/AnalyzeHelper");
        try {
            if (ServerHelper.SERVER_URI !== null) 
                return ServerHelper.processSingleAddressText(txt, pars);
            let sw = new Stopwatch();
            sw.start();
            let ah = new AnalyzeHelper();
            let objs = ah.analyze(txt, null, true, pars);
            let res = null;
            if (objs === null || objs.length === 0) 
                res = TextAddress._new197("Адрес не выделен", txt);
            else 
                res = objs[0];
            res.readCount = ah.indexReadCount;
            sw.stop();
            res.milliseconds = sw.elapsedMilliseconds;
            return res;
        } catch (ex) {
            return TextAddress._new197(ex.toString(), txt);
        }
    }
    
    /**
     * Обработать порцию адресов. Использовать в случае сервера, посылая ему порцию на обработку 
     * (не более 100-300 за раз), чтобы сократить время на издержки взаимодействия. 
     * Для обычной работы (не через сервер) это эквивалентно вызову в цикле ProcessSingleAddressText 
     * и особого смысла не имеет.
     * @param txts список адресов
     * @param pars дополнительные параметры (null - дефолтовые)
     * @return результат (количество совпадает с исходным списком), если null, то какая-то ошибка
     */
    static processSingleAddressTexts(txts, pars = null) {
        const ServerHelper = require("./internal/ServerHelper");
        try {
            if (ServerHelper.SERVER_URI !== null) 
                return ServerHelper.processSingleAddressTexts(txts, pars);
            let res = new Array();
            for (const txt of txts) {
                res.push(AddressService.processSingleAddressText(txt, null));
            }
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    /**
     * Искать объекты (для выпадающих списков)
     * @param searchPars параметры запроса
     * @return результат
     */
    static searchObjects(searchPars) {
        const AddressSearchHelper = require("./internal/AddressSearchHelper");
        const ServerHelper = require("./internal/ServerHelper");
        try {
            if (searchPars === null) 
                return null;
            if (ServerHelper.SERVER_URI !== null) 
                return ServerHelper.searchObjects(searchPars);
            else 
                return AddressSearchHelper.search(searchPars);
        } catch (ex) {
            return null;
        }
    }
    
    /**
     * Получить список дочерних объектов для ГАР-объекта
     * @param go идентификатор объект ГАР (если null, то объекты первого уровня - регионы)
     * @param ignoreHouses игнорировать дома и помещения
     * @return дочерние объекты
     */
    static getObjects(id, ignoreHouses = false) {
        const ServerHelper = require("./internal/ServerHelper");
        try {
            if (ServerHelper.SERVER_URI !== null) 
                return ServerHelper.getChildrenObjects(id, ignoreHouses);
            else 
                return GarHelper.getChildrenObjects(id, ignoreHouses);
        } catch (ex199) {
            return null;
        }
    }
    
    /**
     * Получить объект (вместе с родительской иерархией) по идентификатору
     * @param objId внутренний идентификатор
     * @return объект
     */
    static getObject(objId) {
        const ServerHelper = require("./internal/ServerHelper");
        if (Utils.isNullOrEmpty(objId)) 
            return null;
        try {
            if (ServerHelper.SERVER_URI !== null) 
                return ServerHelper.getObject(objId);
            else 
                return GarHelper.getObject(objId);
        } catch (ex200) {
            return null;
        }
    }
    
    static createTextAddressByAnalysisResult(ar) {
        const AnalyzeHelper = require("./internal/AnalyzeHelper");
        let ah = new AnalyzeHelper();
        return ah._analyze1(ar, ar.sofa.text, null, false);
    }
    
    static createTextAddressByReferent(r) {
        const AnalyzeHelper = require("./internal/AnalyzeHelper");
        let ah = new AnalyzeHelper();
        return ah.createTextAddressByReferent(r);
    }
    
    static static_constructor() {
        AddressService.VERSION = "4.20";
        AddressService.VERSION_DATE = "2023.08.30";
        AddressService.m_Inited = false;
    }
}


AddressService.static_constructor();

module.exports = AddressService