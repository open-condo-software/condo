const KeyValuePair=require("./KeyValuePair");

class Hashtable {

    constructor(ini = null) {
        this._map = new Map();
        this._indexes = new Map();
        this._keys = [];
        this._values = [];
        if(ini != null)
            for(const kp of ini.entries)
                this.put(kp.key, kp.value);
    }

    put (key, value) {
        var newKey = !this.containsKey(key);
        this._map.set(key, value);
        if (newKey) {
            this._indexes.set(key, this.length);
            this._keys.push(key);
            this._values.push(value);
        }
        else {
            var index = this._indexes.get(key);
            this._values[index] = value;
        }
    }

    remove(key) {
        if (!this.containsKey(key))
            return;
        this._map.delete(key);
        var index = this._indexes.get(key);
        this._indexes.delete(key);
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
        for(let i = index; i < this._keys.length; i++) {
            this._indexes.set(this._keys[i], i);
        }
    }

    indexOfKey(key) {
        return this._indexes.get(key);
    }

    indexOfValue(value) {
        return this._values.indexOf(value) != -1;
    }

    get(key) {
        let res = this._map.get(key);
        if(typeof res === "undefined") return null;
        return res;
    }
	tryGetValue(key, res) {
        if(!this.containsKey(key)) return false;
        res.value = this._map.get(key);
        return true;
    }

    entryAt (index) {
        return new KeyValuePair(this.keys[index], this.values[index]);
        //var item = {};
        //Object.defineProperty(item, "key", {
            //value: this.keys[index],
            //writable: false
        //});
        //Object.defineProperty(item, "value", {
            //value: this.values[index],
            //writable: false
        //});
        //return item;
    }

    clear() {
        this._map = new Map();
        this._indexes = new Map();
        this._keys = [];
        this._values = [];
    }

    containsKey(key) {
        return this._map.has(key);
    }
    containsValue(value) {
        return this._values.indexOf(value) != -1;
    }
    // this.forEach = function(iterator) {
    //     for (var i = 0; i < this.length; i++)
    //         iterator(this.keys[i], this.values[i], i);
    // };

    get length() {
            return this._keys.length;
    }

    get keys() {
            return this._keys;
    }
    get values() {
        return this._values;
    }

    get entries() {
        var entries = new Array(this.length);
        for (var i = 0; i < entries.length; i++)
            entries[i] = this.entryAt(i);
        return entries;
    }
}
module.exports = Hashtable;
