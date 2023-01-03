"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Localizer = void 0;
const fs = __importStar(require("fs-extra"));
const path = require("path");
const md5 = require("md5");
const xlsx = require("xlsx");
const LocalizeOption_1 = require("./LocalizeOption");
var TranslateState;
(function (TranslateState) {
    TranslateState[TranslateState["None"] = 0] = "None";
    TranslateState[TranslateState["Partial"] = 1] = "Partial";
    TranslateState[TranslateState["Fullfilled"] = 2] = "Fullfilled";
})(TranslateState || (TranslateState = {}));
class Localizer {
    HanPattern = /[\u4e00-\u9fa5]+/;
    CodeZhPattern = /(?<!\\)(["'`]{1})(.*?)(?<!\\)\1/;
    XmlZhPattern = /\s*<([\d|\w|_]+)>(.*)<\/\1>/;
    PrefabZhPattern = /(?<=\s)(value|m_Text|m_text): (["']{1})([\s\S]*)/;
    TagID = 'ID=';
    TagCN = 'CN=';
    OutXlsx = 'language.xlsx';
    OutDictXlsx = 'language.dict.xlsx';
    OutTxt = 'languages_mid.txt';
    OutNewTxt = 'languages_new.txt';
    OutSrcTxt = 'languages_src.txt';
    BlacklistTxt = 'blacklist.txt';
    SettingJson = 'setting.json';
    /**存储search捕获的文字 */
    sheetRows;
    /**存储search捕获的文字表 */
    capturedMap = {};
    /**存储所有文字表（包括本次捕获的和历史上捕获的） */
    strMap = {};
    /**存储各个sheet对应的文字表（只包含languages.xlsx） */
    sheetRowMap = {};
    groupMap = {};
    fromMap = {};
    newMap = {};
    crtTask;
    crtTaskErrors;
    crtFile;
    totalCnt = 0;
    modifiedFileCnt = 0;
    noLocalCnt = 0;
    logContent = '';
    mode;
    md5Cache = {};
    md52rawStr = {};
    outputJSONMap = {};
    setting;
    colInfoMap = {};
    searchZhInFiles(tasks, option) {
        this.mode = LocalizeOption_1.LocalizeMode.Search;
        this.processTasks(tasks, option);
    }
    replaceZhInFiles(tasks, option) {
        this.mode = LocalizeOption_1.LocalizeMode.Replace;
        this.processTasks(tasks, option);
    }
    processTasks(tasks, option) {
        let startAt = (new Date()).getTime();
        this.strMap = {};
        this.fromMap = {};
        this.newMap = {};
        this.totalCnt = 0;
        this.modifiedFileCnt = 0;
        this.noLocalCnt = 0;
        this.logContent = '';
        let outputRoot = option?.outputRoot || 'output/';
        if (!fs.existsSync(outputRoot)) {
            console.error(`[unity-i18n]Output root not exists: ${outputRoot}`);
            process.exit(1);
        }
        // 读入配置文件
        const settingFile = path.join(outputRoot, this.SettingJson);
        if (fs.existsSync(settingFile)) {
            this.setting = JSON.parse(fs.readFileSync(settingFile, 'utf-8'));
            console.log('[unity-i18n]setting: ', this.setting);
        }
        // 先读入xlsx
        const dictPath = path.join(outputRoot, this.OutDictXlsx);
        if (fs.existsSync(dictPath)) {
            console.log('[unity-i18n]读入字典：%s', dictPath);
            this.readXlsx(dictPath, option);
        }
        const xlsxPath = path.join(outputRoot, this.OutXlsx);
        if (fs.existsSync(xlsxPath)) {
            console.log('[unity-i18n]读入翻译表：%s', xlsxPath);
            this.sheetRowMap = this.readXlsx(xlsxPath, option);
        }
        this.sheetRows = [];
        console.log('[unity-i18n]读入翻译记录：\x1B[36m%d\x1B[0m', Object.keys(this.strMap).length);
        if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
            console.log('开始搜索中文串...\n');
        }
        else {
            console.log('开始替换中文串...\n');
        }
        if (typeof (tasks) == 'string') {
            // 单个路径
            this.runTask(tasks, option);
        }
        else {
            let tasksAlias = tasks;
            for (let oneTask of tasksAlias) {
                this.runTask(oneTask, option);
            }
        }
        // 排序，没翻译的放前面
        let sortedRows;
        if (option?.xlsxStyle == 'prepend') {
            const stateMap = {};
            for (let oneRow of this.sheetRows) {
                stateMap[oneRow.ID] = this.getTranslateState(oneRow, option);
            }
            sortedRows = this.sheetRows.sort((a, b) => {
                const statea = stateMap[a.ID];
                const stateb = stateMap[b.ID];
                if (statea != stateb)
                    return stateb - statea;
                return a.ID.charCodeAt(0) - b.ID.charCodeAt(0);
            });
        }
        else if (option?.xlsxStyle == 'sort-by-id') {
            sortedRows = this.sheetRows.sort((a, b) => {
                return a.ID.charCodeAt(0) - b.ID.charCodeAt(0);
            });
        }
        else {
            sortedRows = this.sheetRows;
        }
        let newCnt = 0;
        if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
            let txtContent = '';
            let txtNewContent = '';
            let txtSrcContent = '';
            for (let id in this.strMap) {
                let oneRow = this.strMap[id];
                let infos = this.TagID + oneRow.ID + '\n';
                infos += this.TagCN + oneRow.CN + '\n';
                for (let lang of option.langs) {
                    infos += lang + '=' + oneRow[lang] + '\n';
                }
                txtContent += infos + '\n';
                if (this.newMap[oneRow.ID]) {
                    infos += 'FROM=' + this.fromMap[oneRow.ID] + '\n';
                    txtNewContent += infos + '\n';
                }
                if (this.fromMap[oneRow.ID]) {
                    txtSrcContent += oneRow.CN + '\n';
                    txtSrcContent += this.fromMap[oneRow.ID] + '\n\n';
                }
            }
            fs.writeFileSync(path.join(outputRoot, this.OutTxt), txtContent);
            fs.writeFileSync(path.join(outputRoot, this.OutNewTxt), txtNewContent);
            fs.writeFileSync(path.join(outputRoot, this.OutSrcTxt), txtSrcContent);
            // 写一个过滤掉黑名单的
            const blackMap = {};
            const blackFile = path.join(outputRoot, this.BlacklistTxt);
            if (fs.existsSync(blackFile)) {
                const blackContent = fs.readFileSync(blackFile, 'utf-8');
                const blackLines = blackContent.split(/\r?\n/);
                for (const bl of blackLines) {
                    blackMap[bl] = true;
                }
            }
            const filteredRows = [];
            for (const row of sortedRows) {
                if (!blackMap[row.CN]) {
                    filteredRows.push(row);
                    if (this.newMap[row.ID]) {
                        newCnt++;
                    }
                }
            }
            this.writeXlsx(filteredRows, option, path.join(outputRoot, this.OutXlsx));
            // 写一个全量字典
            const dictRows = [];
            for (const key in this.strMap) {
                const row = this.strMap[key];
                for (const lang of option.langs) {
                    if (row[lang]) {
                        dictRows.push(this.strMap[key]);
                        break;
                    }
                }
            }
            this.writeXlsx(dictRows, option, path.join(outputRoot, this.OutDictXlsx));
        }
        else if (option?.softReplace) {
            // 生成各个语言包
            console.log('[unity-i18n]开始生成语言包...');
            for (const oj in this.outputJSONMap) {
                const m = this.outputJSONMap[oj];
                const cnArr = Object.keys(m);
                cnArr.sort();
                // // 需要增加脚本字符串
                // const svrScriptRows = this.sheetRowMap?.['脚本'];
                // if (svrScriptRows) {
                //     let ssCnt = 0;
                //     for (const row of svrScriptRows) {
                //         if (!m[row.CN]) {
                //             cnArr.push(row.CN);
                //             ssCnt++;
                //         }
                //     }
                //     console.log('[unity-i18n]脚本文字串数量：', ssCnt);
                // } else {
                //     console.error('[unity-i18n]生成语言包时未找到任何脚本文字串！')
                // }
                let ojRoot = this.normalizePath(oj);
                if (option.inputRoot && !path.isAbsolute(ojRoot)) {
                    ojRoot = path.join(option.inputRoot, ojRoot);
                }
                // 中文包
                const ojArr = [];
                for (let cn of cnArr) {
                    ojArr.push(this.getStringMd5(cn));
                    ojArr.push(cn);
                }
                fs.writeFileSync(ojRoot.replace('$LANG', 'CN'), JSON.stringify({ strings: ojArr }, null, option.pretty ? 2 : 0), 'utf-8');
                // 外文包
                for (let lang of option.langs) {
                    let ojArr = [];
                    for (let cn of cnArr) {
                        ojArr.push(this.getStringMd5(cn));
                        const local = this.getLocal(cn, option);
                        ojArr.push(local?.[lang] || cn);
                    }
                    fs.writeFileSync(ojRoot.replace('$LANG', lang), JSON.stringify({ strings: ojArr }, null, option.pretty ? 2 : 0), 'utf-8');
                }
            }
        }
        if (option?.needLog) {
            fs.writeFileSync('log.' + LocalizeOption_1.LocalizeMode[this.mode] + '.txt', this.logContent, 'utf-8');
        }
        let endAt = (new Date()).getTime();
        if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
            console.log('[unity-i18n]搜索结束! 耗时: \x1B[36m%d\x1B[0m秒. Total: \x1B[36m%d\x1B[0m, net: \x1B[36m%d\x1B[0m, new: \x1B[36m%d\x1B[0m.', ((endAt - startAt) / 1000).toFixed(), this.totalCnt, sortedRows.length, newCnt);
        }
        else {
            console.log('[unity-i18n]替换结束! 耗时: \x1B[36m%d\x1B[0m秒. Modified file: \x1B[36m%d\x1B[0m, no local: \x1B[36m%d\x1B[0m.', ((endAt - startAt) / 1000).toFixed(), this.modifiedFileCnt, this.noLocalCnt);
        }
    }
    readXlsx(xlsxPath, option) {
        const xlsxBook = xlsx.readFile(xlsxPath);
        const errorRows = [];
        const newlineRows = [];
        const out = {};
        for (const sheetName of xlsxBook.SheetNames) {
            const xlsxSheet = xlsxBook.Sheets[sheetName];
            this.colInfoMap[sheetName] = xlsxSheet['!cols'];
            const sheetRows = xlsx.utils.sheet_to_json(xlsxSheet);
            out[sheetName] = sheetRows;
            for (let i = 0, len = sheetRows.length; i < len; i++) {
                let oneRow = sheetRows[i];
                if (oneRow.CN == undefined) {
                    errorRows.push(i + 2);
                    continue;
                }
                if (oneRow.ID != this.getStringMd5(oneRow.CN)) {
                    console.warn(`row ${i + 2} MD5 error, auto corrected!`);
                    oneRow.ID = this.getStringMd5(oneRow.CN);
                }
                oneRow.CN = this.eunsureString(oneRow.CN);
                for (let lang of option.langs) {
                    let local = oneRow[lang];
                    if (undefined != local) {
                        oneRow[lang] = this.eunsureString(local);
                        // 检查翻译中是否有换行符
                        let idx = local.search(/[\r\n]/g);
                        if (idx >= 0) {
                            newlineRows.push(i + 2);
                        }
                    }
                }
                // 修复翻译中的换行
                this.strMap[oneRow.ID] = oneRow;
            }
        }
        this.assert(errorRows.length == 0, 'The following rows are suspect illegal: ' + errorRows.join(', '));
        this.assert(errorRows.length == 0, 'The following rows are suspect illegal: ' + errorRows.join(', '));
        this.assert(newlineRows.length == 0, 'The following rows contains newline char: ' + newlineRows.join(', '));
        return out;
    }
    writeXlsx(sortedRows, option, outputXlsx) {
        const sheetInfos = [];
        if (this.setting?.grouped) {
            const sheetMap = {};
            const otherSheet = { name: '其它', rows: [] };
            for (const row of sortedRows) {
                const group = this.groupMap[row.ID];
                if (group) {
                    let info = sheetMap[group];
                    if (!info) {
                        sheetMap[group] = info = { name: group, rows: [] };
                        sheetInfos.push(info);
                    }
                    info.rows.push(row);
                }
                else {
                    otherSheet.rows.push(row);
                }
            }
            sheetInfos.push(otherSheet);
        }
        else {
            sheetInfos.push({ rows: sortedRows });
        }
        const newBook = xlsx.utils.book_new();
        let sheetCnt = 0;
        for (let i = 0, len = sheetInfos.length; i < len; i++) {
            const info = sheetInfos[i];
            const newSheet = xlsx.utils.json_to_sheet(info.rows);
            if (!newSheet)
                continue;
            let cols = this.colInfoMap[info.name ?? `Sheet${i + 1}`];
            if (!cols) {
                cols = [{ wch: 20 }, { wch: 110 }];
                for (const lang of option.langs) {
                    cols.push({ wch: 110 });
                }
            }
            newSheet["!cols"] = cols;
            xlsx.utils.book_append_sheet(newBook, newSheet, info.name);
            sheetCnt++;
        }
        if (sheetCnt > 0) {
            xlsx.writeFile(newBook, outputXlsx);
        }
        else {
            console.log(`[unity-i18n]Nothing to write: ${outputXlsx}`);
        }
    }
    getTranslateState(oneRow, option) {
        let cnt = 0;
        for (let lang of option.langs) {
            if (oneRow[lang]) {
                cnt++;
            }
        }
        if (cnt === 0) {
            return TranslateState.None;
        }
        else if (cnt === option.langs.length) {
            return TranslateState.Fullfilled;
        }
        return TranslateState.Partial;
    }
    runTask(oneTask, option) {
        if (typeof (oneTask) == 'string') {
            oneTask = {
                "roots": [oneTask],
                "option": option
            };
        }
        this.crtTask = oneTask;
        this.crtTaskErrors = [];
        const finalOpt = this.mergeOption(oneTask.option, option);
        const ojs = oneTask.option?.outputJSONs;
        if (ojs) {
            for (const oj of ojs) {
                if (!this.outputJSONMap[oj])
                    this.outputJSONMap[oj] = {};
            }
        }
        for (let oneRoot of oneTask.roots) {
            if (option.replacer) {
                for (let rk in option.replacer) {
                    oneRoot = oneRoot.replace(rk, option.replacer[rk]);
                }
            }
            oneRoot = this.normalizePath(oneRoot);
            if (option.inputRoot && !path.isAbsolute(oneRoot)) {
                oneRoot = path.join(option.inputRoot, oneRoot);
            }
            if (!fs.existsSync(oneRoot)) {
                console.error('[unity-i18n]Task root not exists: %s\n', oneRoot);
                process.exit(1);
            }
            let rootStat = fs.statSync(oneRoot);
            if (rootStat.isFile()) {
                this.searchZhInFile(oneRoot, finalOpt);
            }
            else {
                this.searchZhInDir(oneRoot, finalOpt);
            }
        }
        // 检查任务错误
        if (this.crtTaskErrors.length > 0) {
            console.log('[unity-i18n]Task failed!');
            for (const e of this.crtTaskErrors) {
                console.error(e);
            }
            process.exit(1);
        }
    }
    mergeOption(local, global) {
        if (!local)
            local = {};
        if (global) {
            for (let globalKey in global) {
                if (!local[globalKey]) {
                    local[globalKey] = global[globalKey];
                }
            }
        }
        return local;
    }
    searchZhInDir(dirPath, option) {
        if (path.basename(dirPath).charAt(0) == '.') {
            this.addLog('SKIP', dirPath);
            return;
        }
        if (option?.excludes?.dirs) {
            for (let i = 0, len = option.excludes.dirs.length; i < len; i++) {
                let ed = option.excludes.dirs[i];
                if (typeof (ed) == 'string') {
                    ed = this.normalizePath(ed);
                }
                if (dirPath.search(ed) >= 0) {
                    this.addLog('SKIP', dirPath);
                    return;
                }
            }
        }
        let dirIncluded = true;
        if (option?.includes?.dirs) {
            let isIncluded = false;
            for (let i = 0, len = option.includes.dirs.length; i < len; i++) {
                let id = option.excludes.dirs[i];
                if (typeof (id) == 'string') {
                    id = this.normalizePath(id);
                }
                if (dirPath.search(option.includes.dirs[i]) >= 0) {
                    isIncluded = true;
                    break;
                }
            }
            if (!isIncluded) {
                dirIncluded = false;
            }
        }
        let files = fs.readdirSync(dirPath);
        let r = false;
        for (let i = 0, len = files.length; i < len; i++) {
            let filename = files[i];
            let filePath = path.join(dirPath, filename);
            let fileStat = fs.statSync(filePath);
            if (fileStat.isFile()) {
                if (dirIncluded) {
                    this.searchZhInFile(filePath, option);
                }
                else {
                    if (!r) {
                        this.addLog('SKIP', dirPath);
                        r = true;
                    }
                }
            }
            else {
                this.searchZhInDir(filePath, option);
            }
        }
    }
    searchZhInFile(filePath, option) {
        let fileExt = path.extname(filePath).toLowerCase();
        if (option?.excludes?.exts && option.excludes.exts.indexOf(fileExt) >= 0) {
            this.addLog('SKIP', filePath);
            return;
        }
        if (option?.includes?.exts && option.includes.exts.indexOf(fileExt) < 0) {
            this.addLog('SKIP', filePath);
            return;
        }
        if (option?.excludes?.files) {
            for (let i = 0, len = option.excludes.files.length; i < len; i++) {
                if (filePath.search(this.ensureRegExp(option.excludes.files[i])) >= 0) {
                    this.addLog('SKIP', filePath);
                    return;
                }
            }
        }
        if (option?.includes?.files) {
            let isIncluded = false;
            for (let i = 0, len = option.includes.files.length; i < len; i++) {
                if (filePath.search(this.ensureRegExp(option.includes.files[i])) >= 0) {
                    isIncluded = true;
                    break;
                }
            }
            if (!isIncluded) {
                this.addLog('SKIP', filePath);
                return;
            }
        }
        this.crtFile = filePath;
        if (!option.silent) {
            console.log('\x1B[1A\x1B[Kprocessing: %s', filePath);
        }
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        let newContent;
        if ('.prefab' == fileExt) {
            newContent = this.processZnInPrefab(fileContent, option);
        }
        else if ('.xml' == fileExt) {
            newContent = this.processZnInXml(fileContent, option);
        }
        else if ('.json' == fileExt) {
            newContent = this.processZnInJSON(fileContent, option);
        }
        else {
            newContent = this.processZnInCodeFile(fileContent, option);
        }
        if (this.mode == LocalizeOption_1.LocalizeMode.Replace && !this.crtTask.readonly) {
            if (option.softReplace && option.replaceOutput) {
                const filename = path.basename(filePath, fileExt);
                for (let lang of option.langs) {
                    const newFilePath = path.join(option.inputRoot, option.replaceOutput).replace(/\$LANG/g, lang).replace(/\$FILENAME/g, filename);
                    const newFileDir = path.dirname(newFilePath);
                    fs.ensureDirSync(newFileDir);
                    let outContent;
                    if (newContent) {
                        outContent = newContent.replace(/\$i18n-(\w+)\$/g, (substring, ...args) => {
                            const local = this.strMap[args[0]];
                            if (local) {
                                return local[lang] || local.CN;
                            }
                            let raw = this.md52rawStr[args[0]];
                            this.assert(raw != undefined, `No local and raw found when process ${filename}`);
                            return raw;
                        });
                    }
                    else {
                        outContent = fileContent;
                    }
                    this.addLog('REPLACE', newFilePath);
                    fs.writeFileSync(newFilePath, outContent, 'utf-8');
                }
            }
            else {
                if (newContent) {
                    this.addLog('REPLACE', filePath);
                    fs.writeFileSync(filePath, newContent, 'utf-8');
                }
            }
        }
    }
    processZnInXml(fileContent, option) {
        let modified = false;
        let newContent = '';
        let lines = fileContent.split(/[\r\n]+/);
        for (let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            let zh = '';
            let ret = oneLine.match(this.XmlZhPattern);
            if (ret) {
                let rawContent = ret[2];
                if (!rawContent.startsWith('0') && this.containsZh(rawContent)) {
                    zh = rawContent;
                    this.markTaskUsed(zh);
                }
            }
            if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                if (zh) {
                    this.insertString(zh, option);
                }
            }
            else {
                let local;
                if (zh) {
                    local = this.getLocal(zh, option);
                }
                if (local?.[option.langs[0]]) {
                    modified = true;
                    newContent += oneLine.substring(0, ret.index) + '<' + ret[0] + '>' + local[option.langs[0]] + '<' + ret[0] + '/>' + '\n';
                }
                else {
                    newContent += oneLine + '\n';
                }
            }
        }
        return modified ? newContent : null;
    }
    processZnInCodeFile(fileContent, option) {
        let modified = false;
        let newContent = '';
        // 保留跨行注释
        let commentCaches = [];
        fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, (substring, ...args) => {
            commentCaches.push(substring);
            return '[[[i18n-comment]]]';
        });
        let lines = fileContent.split(/\r?\n/); // 保留空行
        for (let i = 0, len = lines.length; i < len; i++) {
            if (i > 0)
                newContent += '\n';
            let oneLine = lines[i];
            // 过滤掉注释行
            let skip = oneLine.match(/^\s*\/\//) != null || oneLine.match(/^\s*\/\*/) != null;
            // 过滤掉log语句
            if (!skip && option?.skipPatterns) {
                for (let j = 0, jlen = option.skipPatterns.length; j < jlen; j++) {
                    let ptn = this.ensureRegExp(option.skipPatterns[j]);
                    if (oneLine.match(ptn)) {
                        skip = true;
                        break;
                    }
                }
            }
            if (!skip) {
                let ret = oneLine.match(this.CodeZhPattern);
                while (ret) {
                    let zh = '';
                    let quote = ret[1];
                    let rawContent = ret[2];
                    if (this.containsZh(rawContent)) {
                        zh = rawContent;
                        // 对于ts和js，不允许使用内嵌字符串
                        if (option.softReplace && this.crtFile.endsWith('.ts') || this.crtFile.endsWith('.js')) {
                            if (quote === '`') {
                                this.crtTaskErrors.push(`不允许使用内嵌字符串，请使用uts.format! ${this.crtFile} : line ${i + 1}`);
                            }
                        }
                        this.markTaskUsed(zh);
                    }
                    if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                        if (zh) {
                            this.insertString(zh, option);
                        }
                    }
                    else {
                        if (zh) {
                            if (option.softReplace && option.softReplacer) {
                                modified = true;
                                let localStr = option.softReplacer.replace('$RAWSTRING', quote + zh + quote).replace('$STRINGID', this.getStringMd5(zh));
                                newContent += oneLine.substring(0, ret.index) + localStr;
                            }
                            else {
                                let local = this.getLocal(zh, option);
                                if (local?.[option.langs[0]]) {
                                    modified = true;
                                    let localStr = this.processQuote(local[option.langs[0]], quote);
                                    newContent += oneLine.substring(0, ret.index) + quote + localStr + quote;
                                }
                                else {
                                    newContent += oneLine.substring(0, ret.index + ret[0].length);
                                }
                            }
                        }
                        else {
                            newContent += oneLine.substring(0, ret.index + ret[0].length);
                        }
                    }
                    oneLine = oneLine.substring(ret.index + ret[0].length);
                    ret = oneLine.match(this.CodeZhPattern);
                }
                newContent += oneLine;
            }
            else {
                newContent += oneLine;
            }
        }
        if (modified && commentCaches.length > 0) {
            let commentCnt = 0;
            newContent = newContent.replace(/\[\[\[i18n-comment\]\]\]/g, (substring, ...args) => {
                return commentCaches[commentCnt++];
            });
        }
        return modified ? newContent : null;
    }
    processZnInJSON(fileContent, option) {
        let modified = false;
        let newContent = '';
        let ret = fileContent.match(this.CodeZhPattern);
        while (ret) {
            let zh = '';
            let rawContent = ret[2];
            if (this.containsZh(rawContent)) {
                zh = rawContent;
                this.markTaskUsed(zh);
            }
            if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                if (zh) {
                    this.insertString(zh, option);
                }
            }
            else {
                let localStr;
                if (zh) {
                    if (option.softReplace && option.replaceOutput) {
                        modified = true;
                        localStr = `$i18n-${this.getStringMd5(zh)}$`;
                    }
                    else {
                        let local = this.getLocal(zh, option);
                        if (local?.[option.langs[0]]) {
                            localStr = local[option.langs[0]].replace(/(?<!\\)"/g, '\\"');
                        }
                    }
                }
                if (localStr) {
                    modified = true;
                    newContent += fileContent.substring(0, ret.index) + ret[1] + localStr + ret[1];
                }
                else {
                    newContent += fileContent.substring(0, ret.index + ret[0].length);
                }
            }
            fileContent = fileContent.substring(ret.index + ret[0].length);
            ret = fileContent.match(this.CodeZhPattern);
        }
        newContent += fileContent;
        return modified ? newContent : null;
    }
    processZnInPrefab(fileContent, option) {
        let modified = false;
        let newContent = '';
        let lines = fileContent.split(/\r?\n/);
        let indent = '  ';
        // 假如是该节点是预制体实例，则是，如斗罗韩服手游WorldUIElementView.prefab
        // - target: {fileID: 114479196432416642, guid: 5d66a490e5f6da842a0990a7a99f6bf1,
        //     type: 3}
        //   propertyPath: m_Text
        //   value: "\u51A5\u738B\u9CB2+"
        //   objectReference: {fileID: 0}
        let filedName = 'm_Text';
        let quoter = '"';
        let rawLineCache;
        let crossLineCache = null;
        for (let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            let quotedContent = '';
            if (null != crossLineCache) {
                rawLineCache += '\n' + oneLine;
                crossLineCache += ' ';
                oneLine = oneLine.replace(/^\s+/, '').replace(/^\\(?=\s)/, '');
                let endRe = new RegExp('(?<!\\\\)' + quoter + '$');
                if (!endRe.test(oneLine)) {
                    // 多行继续
                    crossLineCache += oneLine;
                    continue;
                }
                // 多行结束
                quotedContent = crossLineCache + oneLine.substring(0, oneLine.length - 1);
            }
            else {
                rawLineCache = oneLine;
                let ret = oneLine.match(this.PrefabZhPattern);
                if (ret) {
                    indent = oneLine.substring(0, ret.index);
                    filedName = ret[1];
                    quoter = ret[2];
                    let rawContent = ret[3];
                    if (rawContent.charAt(rawContent.length - 1) != quoter) {
                        // 多行待续
                        crossLineCache = rawContent;
                        continue;
                    }
                    quotedContent = rawContent.substring(0, rawContent.length - 1);
                }
            }
            let zh = '';
            if (quotedContent) {
                quotedContent = this.unicode2utf8(quotedContent);
                if (this.containsZh(quotedContent)) {
                    zh = quotedContent;
                    this.markTaskUsed(zh);
                }
            }
            crossLineCache = null;
            if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                if (zh) {
                    this.insertString(zh, option);
                }
            }
            else if (!option.softReplace) {
                let local;
                if (zh) {
                    local = this.getLocal(zh, option);
                }
                if (newContent)
                    newContent += '\n';
                if (local?.[option.langs[0]]) {
                    modified = true;
                    newContent += indent + filedName + ': ' + quoter + this.utf82unicode(local[option.langs[0]]) + quoter;
                }
                else {
                    newContent += rawLineCache;
                }
            }
        }
        return modified ? newContent : null;
    }
    containsZh(str) {
        if (str.search(this.HanPattern) >= 0) {
            return true;
        }
        return false;
    }
    markTaskUsed(cn) {
        const ojs = this.crtTask.option?.outputJSONs;
        if (ojs) {
            cn = this.formatString(cn);
            for (const oj of ojs)
                this.outputJSONMap[oj][cn] = true;
        }
    }
    getReplacement(zh, option) {
        if (option.softReplace && option.softReplacer) {
            const id = this.getStringMd5(zh);
            return option.softReplacer.replace('$STRINGID', id).replace('$LOCAL', `%$${id}$%`);
        }
        const local = this.getLocal(zh, option);
        return local?.[option.langs[0]] || zh;
    }
    insertString(cn, option) {
        this.totalCnt++;
        cn = this.formatString(cn);
        // if(cn.indexOf('{0}绑定钻石') >= 0) throw new Error('!');
        let id = this.getStringMd5(cn);
        this.fromMap[id] = this.crtFile;
        if (this.crtTask.group) {
            this.groupMap[id] = this.crtTask.group;
        }
        let node = this.strMap[id];
        if (node == null) {
            node = { ID: id, CN: cn };
            for (let lang of option.langs) {
                node[lang] = '';
            }
            this.strMap[id] = node;
            this.newMap[id] = true;
        }
        if (!this.capturedMap[id]) {
            this.capturedMap[id] = node;
            this.sheetRows.push(node);
        }
    }
    getLocal(cn, option) {
        cn = this.formatString(cn);
        let id = this.getStringMd5(cn);
        let oneRow = this.strMap[id];
        if (!oneRow || !oneRow[option.langs[0]]) {
            this.noLocalCnt++;
            this.addLog('NOLOCAL', cn);
        }
        return oneRow;
    }
    formatString(s) {
        return this.safeprintf(s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\\n'));
    }
    safeprintf(s) {
        if (this.setting?.enableSafeprintf && this.crtTask.safeprintf) {
            let cnt = 0;
            s = s.replace(/\{\^?%\w+\}/g, (substring, ...args) => {
                return `{${cnt++}}`;
            });
        }
        return s;
    }
    getStringMd5(s) {
        let c = this.md5Cache[s];
        if (!c) {
            this.md5Cache[s] = c = md5(s).replace(/-/g, '').toLowerCase();
            this.md52rawStr[c] = s;
        }
        return c;
    }
    unicode2utf8(ustr) {
        return ustr.replace(/&#x([\da-f]{1,4});|\\u([\da-f]{1,4})|&#(\d+);|\\([\da-f]{1,4})/gi, function (t, e, n, o, r) { if (o)
            return String.fromCodePoint(o); var c = e || n || r; return /^\d+$/.test(c) && (c = parseInt(c, 10), !isNaN(c) && c < 256) ? unescape("%" + c) : unescape("%u" + c); });
    }
    utf82unicode(ustr) {
        return ustr.replace(/[^\u0000-\u00FF]/g, function (t) { return escape(t).replace(/^%/, "\\"); });
    }
    normalizePath(p) {
        // p是已linux风格的路径，需要转换成windows的
        if (/win/.test(process.platform)) {
            // a/b/c 换成 a\\\\b\\\\c
            p = path.normalize(p).replace(/\\+/g, '\\\\');
        }
        return p;
    }
    eunsureString(s) {
        if (typeof (s) != 'string') {
            return s.toString();
        }
        return s;
    }
    processQuote(s, quote) {
        if (quote == '"') {
            s = s.replace(/(?<!\\)"/g, '\\"');
        }
        else if (quote == "'") {
            s = s.replace(/(?<!\\)'/g, "\\'");
        }
        return s;
    }
    ensureRegExp(r) {
        if (typeof (r) == 'string')
            r = new RegExp(r);
        return r;
    }
    addLog(tag, text) {
        this.logContent += '[' + tag + ']' + text + '\n';
    }
    assert(cond, msg) {
        if (!cond) {
            throw new Error(msg);
            process.exit(1);
        }
    }
}
exports.Localizer = Localizer;
//# sourceMappingURL=Localizer.js.map