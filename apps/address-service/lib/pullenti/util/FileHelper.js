/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const fs = require('fs');
const Utils = require("./../unisharp/Utils");
const Stream = require("./../unisharp/Stream");
const FileStream = require("./../unisharp/FileStream");

/**
 * Различные утилитки работы с файлами
 */
class FileHelper {
    
    /**
     * Сохранение данных в файле
     * @param fileName имя файла
     * @param data сохраняемая последовательсноть байт
     */
    static saveDataToFile(fileName, data, len = -1) {
        if (data === null) 
            return;
        let f = null;
        try {
            f = new FileStream(fileName, "w+", false);
            f.write(data, 0, (len < 0 ? data.length : len));
        } finally {
            if (f !== null) 
                f.close();
        }
    }
    
    /**
     * Получить последовательность байт из файла.
     * @param fileName имя файла
     * @param attampts число попыток с небольшой задержкой
     * @return последовательнсоть байт, null, если файл пусто
     */
    static loadDataFromFile(fileName, attampts = 0) {
        let f = null;
        let buf = null;
        try {
            let ex = null;
            for (let i = 0; i <= attampts; i++) {
                try {
                    f = new FileStream(fileName, "r", false);
                    break;
                } catch (e) {
                    ex = e;
                }
                if (i === 0 && !fs.existsSync(fileName) && fs.statSync(fileName).isFile()) 
                    break;
            }
            if (f === null) 
                throw ex;
            if (f.length === (0)) 
                return null;
            buf = new Uint8Array(f.length);
            f.read(buf, 0, f.length);
        } finally {
            if (f !== null) 
                f.close();
        }
        return buf;
    }
    
    /**
     * Сохранение текста в файл. Формат UTF-8, вставляется префикс EF BB BF.
     * @param str 
     * @param fileName 
     */
    static writeStringToFile(str, fileName) {
        if (str === null) 
            str = "";
        let data = Utils.encodeString("UTF-8", str);
        let pream = Utils.getEncodingPreamble("UTF-8");
        if (data.length > pream.length) {
            let i = 0;
            for (i = 0; i < pream.length; i++) {
                if (pream[i] !== data[i]) 
                    break;
            }
            if (i >= pream.length) 
                pream = null;
        }
        if (str.length === 0) 
            pream = null;
        let fStr = null;
        try {
            fStr = new FileStream(fileName, "w+", false);
            if (pream !== null) 
                fStr.write(pream, 0, pream.length);
            fStr.write(data, 0, data.length);
        } finally {
            if (fStr !== null) 
                fStr.close();
        }
    }
}


module.exports = FileHelper