/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const fs = require('fs');
const path = require('path');
const Utils = require("./../unisharp/Utils");
const Stream = require("./../unisharp/Stream");
const FileStream = require("./../unisharp/FileStream");
const FileInfo = require("./../unisharp/FileInfo");

/**
 * Запись в лог-файл и на экран
 */
class ConsoleHelper {
    
    static getHideConsoleOutput() {
        return ConsoleHelper.m_HideConsoleOutput;
    }
    static setHideConsoleOutput(value) {
        ConsoleHelper.m_HideConsoleOutput = value;
        return value;
    }
    
    static clear(saveLog) {
        if (ConsoleHelper.HIDE_LOG_OUTPUT) 
            return null;
        try {
            if (ConsoleHelper.m_Stream !== null) {
                ConsoleHelper.m_Stream.close();
                ConsoleHelper.m_Stream = null;
            }
        } catch (ex3026) {
        }
        let ret = null;
        try {
            if (fs.existsSync(ConsoleHelper.getLogFileName()) && fs.statSync(ConsoleHelper.getLogFileName()).isFile()) {
                try {
                    fs.unlinkSync(ConsoleHelper.getLogFileName());
                } catch (ex3027) {
                }
                ConsoleHelper.logFileLength = 0;
            }
        } catch (ex3028) {
        }
        return ret;
    }
    
    static getDtFileName(dt) {
        return (ConsoleHelper.m_Prefix + Utils.correctToString((dt.getFullYear()).toString(10), 4, true) + Utils.correctToString((Utils.getMonth(dt)).toString(10), 2, true) + Utils.correctToString((dt.getDate()).toString(10), 2, true) + Utils.correctToString((dt.getHours()).toString(10), 2, true) + Utils.correctToString((dt.getMinutes()).toString(10), 2, true) + ".txt");
    }
    
    static getPrefix() {
        return ConsoleHelper.m_Prefix;
    }
    static setPrefix(value) {
        ConsoleHelper.m_Prefix = value;
        ConsoleHelper.m_LogFileName = null;
        return value;
    }
    
    static getLogFileName() {
        try {
            if (ConsoleHelper.m_LogFileName === null) 
                ConsoleHelper.m_LogFileName = path.join(ConsoleHelper.getLogDirectory(), ConsoleHelper.m_Prefix + ".txt");
        } catch (ex3029) {
        }
        return ConsoleHelper.m_LogFileName;
    }
    static setLogFileName(value) {
        ConsoleHelper.m_LogFileName = value;
        return value;
    }
    
    static getLogDirectory() {
        if (ConsoleHelper.M_LOG_DIRECTORY !== null) 
            return ConsoleHelper.M_LOG_DIRECTORY;
        return __dirname;
    }
    static setLogDirectory(value) {
        ConsoleHelper.M_LOG_DIRECTORY = value;
        ConsoleHelper.m_LogFileName = null;
        return value;
    }
    
    static write(str) {
        /* this is synchronized block by ConsoleHelper.m_Lock, but this feature isn't supported in JS */ {
            ConsoleHelper._write(str);
        }
    }
    
    static _write(str) {
        if (ConsoleHelper.MESSAGE_OCCURED.length > 0) 
            for(const eventitem of ConsoleHelper.MESSAGE_OCCURED) eventitem.call(str, null);
        try {
            if (!ConsoleHelper.getHideConsoleOutput()) 
                process.stdout.write(str);
        } catch (ex3030) {
        }
        if (ConsoleHelper.HIDE_LOG_OUTPUT) 
            return;
        try {
            if (ConsoleHelper.logFileLength < (0)) {
                let fi = new FileInfo(ConsoleHelper.getLogFileName());
                if (!fi.exists()) 
                    ConsoleHelper.logFileLength = 0;
                else 
                    ConsoleHelper.logFileLength = fi.length;
            }
            if (ConsoleHelper.logFileLength > ConsoleHelper.maxLogFileLength) {
                if (!ConsoleHelper.getHideConsoleOutput()) 
                    process.stdout.write("\r\nLog file too long, it's copied and cleared");
                let fname = ConsoleHelper.clear(true);
                if (fname !== null) 
                    ConsoleHelper._write(("This log-file is continued, previous part in file " + fname + "\r\n"));
            }
        } catch (ex3031) {
        }
        try {
            if (ConsoleHelper.m_Stream === null) 
                ConsoleHelper.m_Stream = new FileStream(ConsoleHelper.getLogFileName(), "r+", false);
            if (str.indexOf('\n') >= 0 || ConsoleHelper.m_Stream.length === (0)) {
                let dt = Utils.now();
                let date = "";
                if (ConsoleHelper.OUT_DATE) 
                    date = (Utils.correctToString((dt.getFullYear()).toString(10), 4, true) + "." + Utils.correctToString((Utils.getMonth(dt)).toString(10), 2, true) + "." + Utils.correctToString((dt.getDate()).toString(10), 2, true) + " ");
                let time = ("\n" + date + Utils.correctToString((dt.getHours()).toString(10), 2, true) + ":" + Utils.correctToString((dt.getMinutes()).toString(10), 2, true) + ":" + Utils.correctToString((dt.getSeconds()).toString(10), 2, true) + " ");
                if (ConsoleHelper.m_Stream.length === (0)) 
                    str = (time.trim() + " " + str);
                str = Utils.replaceString(str, "\n", time);
            }
            let dat = Utils.encodeString("UTF-8", str);
            ConsoleHelper.m_Stream.position = ConsoleHelper.m_Stream.length;
            ConsoleHelper.m_Stream.write(dat, 0, dat.length);
            ConsoleHelper.m_Stream.flush();
            ConsoleHelper.logFileLength = ConsoleHelper.m_Stream.length;
            if (ConsoleHelper.CLOSE_STREAM_AFTER_EACH_WRITE) {
                ConsoleHelper.m_Stream.close();
                ConsoleHelper.m_Stream = null;
            }
            let first = true;
            for (const li of Utils.splitString(str, '\n', false)) {
                let line = li.trim();
                if (Utils.isNullOrEmpty(line)) {
                    first = false;
                    continue;
                }
                if (first && ConsoleHelper.m_Lines.length > 0) 
                    ConsoleHelper.m_Lines[ConsoleHelper.m_Lines.length - 1] += line;
                else 
                    ConsoleHelper.m_Lines.push(line);
                if (ConsoleHelper.m_Lines.length > ConsoleHelper.m_MaxLines) 
                    ConsoleHelper.m_Lines.splice(0, 1);
                first = false;
            }
        } catch (ex) {
        }
    }
    
    static writeLine(str) {
        ConsoleHelper.write(str + "\r\n");
    }
    
    static writeMemory(collect = false) {
        if (collect) 
            ;
    }
    
    /**
     * Получить последние строки из лога
     * @return 
     */
    static getLastLines() {
        /* this is synchronized block by ConsoleHelper.m_Lock, but this feature isn't supported in JS */ {
            return Array.from(ConsoleHelper.m_Lines);
        }
    }
    
    static static_constructor() {
        ConsoleHelper.m_HideConsoleOutput = false;
        ConsoleHelper.HIDE_LOG_OUTPUT = false;
        ConsoleHelper.OUT_DATE = true;
        ConsoleHelper.CLOSE_STREAM_AFTER_EACH_WRITE = false;
        ConsoleHelper.REMOVE_LOGS_OLDER_THIS_DAYS = 7;
        ConsoleHelper.m_Prefix = "log";
        ConsoleHelper.m_LogFileName = null;
        ConsoleHelper.M_LOG_DIRECTORY = null;
        ConsoleHelper.logFileLength = -1;
        ConsoleHelper.maxLogFileLength = 100000000;
        ConsoleHelper.MESSAGE_OCCURED = new Array();
        ConsoleHelper.m_Lock = new Object();
        ConsoleHelper.m_Stream = null;
        ConsoleHelper.m_Lines = new Array();
        ConsoleHelper.m_MaxLines = 300;
    }
}


ConsoleHelper.static_constructor();

module.exports = ConsoleHelper