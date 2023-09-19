/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const path = require('path');
const fs = require('fs');
const Utils = require("./../unisharp/Utils");
const Hashtable = require("./../unisharp/Hashtable");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");
const Stream = require("./../unisharp/Stream");
const FileStream = require("./../unisharp/FileStream");
const MemoryStream = require("./../unisharp/MemoryStream");

const AddrLevel = require("./AddrLevel");
const HouseAttributes = require("./HouseAttributes");
const RoomAttributes = require("./RoomAttributes");
const AreaAttributes = require("./AreaAttributes");
const RepAddrTreeNodeObj = require("./internal/RepAddrTreeNodeObj");
const AddressHelper = require("./AddressHelper");
const RepaddrSearchObj = require("./internal/RepaddrSearchObj");
const RepaddrObject = require("./RepaddrObject");
const RepChildrenTable = require("./internal/RepChildrenTable");
const RepTypTable = require("./internal/RepTypTable");
const RepObjTree = require("./internal/RepObjTree");
const KeyBaseTable = require("./../util/repository/KeyBaseTable");
const RepAddrTree = require("./internal/RepAddrTree");
const RepObjTable = require("./internal/RepObjTable");

/**
 * Репозиторий адресов (Адрессарий)
 * 
 */
class AddressRepository {
    
    constructor() {
        this.m_BaseDir = null;
        this.m_Typs = null;
        this.m_Objs = null;
        this.m_Chis = null;
        this.m_ATree = null;
        this.m_CObjs = null;
        this.m_OTrees = new Hashtable();
        this.m_OTreeIds = new Array();
        this.m_Modified = false;
        this.m_Root = null;
    }
    
    /**
     * Открыть репозиторий
     * @param pathName папка, если папки не существует или пуста, то репозиторий будет в ней создан
     */
    open(pathName) {
        this.m_BaseDir = path.resolve(pathName);
        if (!fs.existsSync(this.m_BaseDir) && fs.statSync(this.m_BaseDir).isDirectory()) 
            fs.mkdirSync(this.m_BaseDir);
        this.m_Typs = new RepTypTable(pathName);
        this.m_Typs.open(false, 0);
        this.m_Objs = new RepObjTable(this.m_Typs, pathName);
        this.m_Objs.open(false, 0);
        this.m_Chis = new RepChildrenTable(pathName);
        this.m_Chis.open(false, 0);
        this.m_Root = this.m_Objs.get(1);
        if (this.m_Root === null) {
            this.m_Root = new RepaddrObject();
            this.m_Root.spelling = "Root";
            this.m_Objs.add(1, this.m_Root);
            this.m_Objs.flush();
        }
        else 
            this.m_Root.children = this.m_Chis.get(1);
        this.m_ATree = new RepAddrTree();
        let nam = path.join(this.m_BaseDir, "atree.dat");
        if (fs.existsSync(nam) && fs.statSync(nam).isFile()) 
            this.m_ATree.open(Utils.readAllBytes(nam));
        this.m_CObjs = new KeyBaseTable(null, "cobjs", this.baseDir);
        this.m_CObjs.open(false, 0);
        this.m_Modified = false;
    }
    
    get baseDir() {
        return this.m_BaseDir;
    }
    
    /**
     * Сохранить изменения (вызывать периодически при добавлении больших объёмов, 
     * а также в конце загрузки)
     */
    commit() {
        if (!this.m_Modified) 
            return;
        if (this.m_ATree === null) 
            return;
        let nam = path.join(this.m_BaseDir, "atree.dat");
        let f = new FileStream(nam, "w+", false); 
        try {
            this.m_ATree.save(f);
        }
        finally {
            f.close();
        }
        this.m_ATree.clear();
        let dat = Utils.readAllBytes(nam);
        this.m_ATree.open(dat);
        for (const ot of this.m_OTrees.entries) {
            if (ot.value.modified) {
                let dat1 = null;
                let mem = new MemoryStream(); 
                try {
                    ot.value.save(mem);
                    dat1 = mem.toByteArray();
                }
                finally {
                    mem.close();
                }
                this.m_CObjs.writeKeyData(ot.key, dat1);
            }
        }
        this.m_OTrees.clear();
        this.m_OTreeIds.splice(0, this.m_OTreeIds.length);
        this.m_Modified = false;
    }
    
    /**
     * Вызывать в конце длительной загрузки - это займёт некоторое время, 
     * зато уменьшит размер индекса для оптимизации доступа и поиска.
     */
    optimize() {
        if (this.m_Modified) 
            this.commit();
        if (this.m_Objs !== null) 
            this.m_Objs.optimize(10);
        if (this.m_Chis !== null) 
            this.m_Chis.optimize(10);
        if (this.m_CObjs !== null) 
            this.m_CObjs.optimize(10);
    }
    
    /**
     * Завершить работу с репозиторием (крайне желательно вызывать в конце)
     */
    close() {
        if (this.m_Modified) 
            this.commit();
        if (this.m_ATree !== null) {
            this.m_ATree.clear();
            this.m_ATree = null;
        }
        for (const ot of this.m_OTrees.entries) {
            ot.value.clear();
        }
        this.m_OTrees.clear();
        this.m_OTreeIds.splice(0, this.m_OTreeIds.length);
        if (this.m_Chis !== null) {
            this.m_Chis.close();
            this.m_Chis = null;
        }
        if (this.m_CObjs !== null) {
            this.m_CObjs.close();
            this.m_CObjs = null;
        }
        if (this.m_Objs !== null) {
            this.m_Objs.close();
            this.m_Objs = null;
        }
        if (this.m_Typs !== null) {
            this.m_Typs.close();
            this.m_Typs = null;
        }
    }
    
    _getTree(id) {
        let res = null;
        let wrapres195 = new RefOutArgWrapper();
        let inoutres196 = this.m_OTrees.tryGetValue(id, wrapres195);
        res = wrapres195.value;
        if (inoutres196) {
            if (this.m_OTreeIds[0] !== id) {
                Utils.removeItem(this.m_OTreeIds, id);
                this.m_OTreeIds.splice(0, 0, id);
            }
            return res;
        }
        if (this.m_OTrees.length >= 100) {
            let id1 = this.m_OTreeIds[this.m_OTreeIds.length - 1];
            if (this.m_OTrees.get(id1).modified) {
                let dat1 = null;
                let mem = new MemoryStream(); 
                try {
                    this.m_OTrees.get(id1).save(mem);
                    dat1 = mem.toByteArray();
                }
                finally {
                    mem.close();
                }
                this.m_CObjs.writeKeyData(id1, dat1);
            }
            this.m_OTrees.remove(id1);
            this.m_OTreeIds.splice(this.m_OTreeIds.length - 1, 1);
        }
        res = new RepObjTree();
        let dat = this.m_CObjs.readKeyData(id, 0);
        if (dat !== null) 
            res.open(dat);
        this.m_OTrees.put(id, res);
        this.m_OTreeIds.splice(0, 0, id);
        return res;
    }
    
    /**
     * Максимальный идентификатор (равен общему количеству элементов)
     * @return 
     */
    getMaxId() {
        if (this.m_Objs === null) 
            return 0;
        return this.m_Objs.getMaxKey();
    }
    
    /**
     * Получить объект по его идентификатору
     * @param id идентификатор
     * @return объект или null
     */
    getObject(id) {
        if (this.m_Objs === null) 
            return null;
        let res = this.m_Objs.get(id);
        if (res === null) 
            return null;
        res.children = this.m_Chis.get(id);
        return res;
    }
    
    /**
     * Получить экземпляры дочерних объектов объекта
     * @param ro родительский объект (если null, то вернёт объекты первого уровня)
     * @return список дочерних объектов RepaddrObject
     */
    getObjects(ro) {
        if (ro === null) 
            return null;
        let res = new Array();
        if (ro === null) {
            if (this.m_Root === null) 
                return null;
            if (this.m_Root.children !== null) {
                for (const id of this.m_Root.children) {
                    let o = this.getObject(id);
                    if (o !== null) 
                        res.push(o);
                }
            }
        }
        else if (ro.children !== null) {
            for (const id of ro.children) {
                let o = this.getObject(id);
                if (o !== null) 
                    res.push(o);
            }
        }
        AddressRepository._sort(res);
        return res;
    }
    
    static _sort(res) {
        res.sort((a, b) => a.compareTo(b));
    }
    
    /**
     * Добавить адрес (всю иерархию) в репозиторий. У элементов будут 
     * устанавливаться поля RepObject с информацией о сохранении.
     * @param addr адресный элемент нижнего уровня
     * @return Количество новых добавленных объектов
     */
    add(addr) {
        if (this.m_ATree === null) 
            return 0;
        return this._search(addr, true);
    }
    
    /**
     * Без добавления попытаться привязать существующие элементы 
     * (для кого удалось - устанавливается поле RepObject)
     * @param addr адресный элемент нижнего уровня
     */
    search(addr) {
        if (this.m_ATree === null) 
            return;
        this._search(addr, false);
    }
    
    _search(addr, _add) {
        let path = new Array();
        let plot = null;
        let house = null;
        let room = null;
        let ret = 0;
        for (const a of addr.items) {
            if (a.attrs instanceof RoomAttributes) 
                room = a;
            else if (a.attrs instanceof HouseAttributes) {
                if (a.level === AddrLevel.PLOT) 
                    plot = a;
                else 
                    house = a;
            }
            else if (a.attrs instanceof AreaAttributes) 
                path.push(a);
        }
        if (path.length === 0) 
            return ret;
        if ((path[0].level === AddrLevel.COUNTRY || path[0].level === AddrLevel.REGIONCITY || path[0].level === AddrLevel.REGIONAREA) || path[0].level === AddrLevel.CITY) {
        }
        else 
            return -1;
        let opath = new Array();
        let modif = false;
        for (let i = 0; i < path.length; i++) {
            let cur = path[i];
            let so = new RepaddrSearchObj(cur, this.m_Typs);
            let coef = 100;
            let best = null;
            for (const str of so.searchStrs) {
                let objs = this.m_ATree.find(str);
                if (objs === null || objs.length === 0) 
                    continue;
                for (const o of objs) {
                    let co = so.calcCoef(o, (opath.length > 0 ? opath[0] : null), (opath.length > 1 ? opath[1] : null));
                    if (co < coef) {
                        coef = co;
                        best = o;
                    }
                }
                if (coef === 0) 
                    break;
            }
            if (best === null) {
                if (!_add) 
                    return ret;
                let newObj = new RepaddrObject();
                newObj.spelling = cur.toString();
                newObj.level = cur.level;
                newObj.types.splice(newObj.types.length, 0, ...cur.attrs.types);
                if (opath.length > 0) {
                    if (!AddressHelper.canBeParent(newObj.level, opath[0].level)) 
                        continue;
                    newObj.parents = new Array();
                    newObj.parents.push(opath[0].id);
                }
                newObj.id = this.m_Objs.getMaxKey() + 1;
                if (cur.gars.length > 0) {
                    newObj.garGuids = new Array();
                    for (const g of cur.gars) {
                        newObj.garGuids.push(g.guid);
                    }
                }
                this.m_Objs.add(newObj.id, newObj);
                cur.repObject = newObj;
                best = new RepAddrTreeNodeObj();
                best.id = newObj.id;
                best.lev = so.lev;
                best.typIds.splice(best.typIds.length, 0, ...so.typeIds);
                best.parents = newObj.parents;
                for (const str of so.searchStrs) {
                    this.m_ATree.add(str, best);
                }
                modif = true;
                ret++;
            }
            else {
                cur.repObject = this.getObject(best.id);
                if (cur.repObject === null) 
                    continue;
                if (_add) {
                    if (best.correct(cur.repObject, this.m_Typs, (opath.length > 0 ? opath[0] : null))) {
                        this.m_Objs.add(best.id, cur.repObject);
                        modif = true;
                    }
                    for (const str of so.searchStrs) {
                        if (this.m_ATree.add(str, best)) 
                            modif = true;
                    }
                }
            }
            if (cur.repObject !== null) 
                opath.splice(0, 0, cur.repObject);
        }
        if (opath.length === 0) 
            return ret;
        for (let kk = 0; kk < 3; kk++) {
            let pid = opath[0].id;
            let tobj = null;
            if (kk === 0 && plot !== null) 
                tobj = plot;
            else if (kk === 1 && house !== null) 
                tobj = house;
            else if (kk === 2 && room !== null) 
                tobj = room;
            if (tobj === null) 
                continue;
            let strs = RepaddrSearchObj.getSearchStrings(tobj);
            let tree = this._getTree(pid);
            if (tree === null) 
                break;
            let id = 0;
            for (const s of strs) {
                id = tree.find(s);
                if (id > 0) 
                    break;
            }
            if (id === 0) {
                if (!_add) 
                    return ret;
                let newObj = new RepaddrObject();
                newObj.spelling = tobj.toString();
                newObj.level = (kk === 0 ? AddrLevel.PLOT : (kk === 1 ? AddrLevel.BUILDING : AddrLevel.APARTMENT));
                if (!AddressHelper.canBeParent(newObj.level, opath[0].level)) 
                    continue;
                newObj.parents = new Array();
                newObj.parents.push(pid);
                id = this.m_Objs.getMaxKey() + 1;
                newObj.id = id;
                if (tobj.gars.length > 0) {
                    newObj.garGuids = new Array();
                    for (const g of tobj.gars) {
                        newObj.garGuids.push(g.guid);
                    }
                }
                this.m_Objs.add(newObj.id, newObj);
                tobj.repObject = newObj;
                ret++;
                modif = true;
            }
            else {
                tobj.repObject = this.getObject(id);
                if (tobj.repObject === null) 
                    break;
            }
            if (_add) {
                for (const s of strs) {
                    if (tree.add(s, id)) 
                        modif = true;
                }
            }
            opath.splice(0, 0, tobj.repObject);
        }
        if (modif) {
            this.m_Modified = true;
            this.m_Objs.flush();
            let corrChi = false;
            if (this.m_Root.children === null) 
                this.m_Root.children = new Array();
            if (!this.m_Root.children.includes(opath[opath.length - 1].id)) {
                this.m_Root.children.push(opath[opath.length - 1].id);
                this.m_Chis.add(1, this.m_Root.children);
                corrChi = true;
            }
            for (let i = 0; i < (opath.length - 1); i++) {
                if (opath[i + 1].children === null) 
                    opath[i + 1].children = new Array();
                if (!AddressHelper.canBeParent(opath[i].level, opath[i + 1].level)) 
                    continue;
                if (!opath[i + 1].children.includes(opath[i].id)) {
                    opath[i + 1].children.push(opath[i].id);
                    this.m_Chis.add(opath[i + 1].id, opath[i + 1].children);
                    corrChi = true;
                }
            }
            if (corrChi) 
                this.m_Chis.flush();
        }
        return ret;
    }
}


module.exports = AddressRepository