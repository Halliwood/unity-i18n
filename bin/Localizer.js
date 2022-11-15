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
var fs = __importStar(require("fs-extra"));
var path = require("path");
var md5 = require("md5");
var xlsx = require("xlsx");
var LocalizeOption_1 = require("./LocalizeOption");
var Localizer = /** @class */ (function () {
    function Localizer() {
        this.HanPattern = /[\u4e00-\u9fa5]+/;
        this.CodeZhPattern = /(?<!\\)(["'`]{1})(.*?)(?<!\\)\1/;
        this.XmlZhPattern = /\s*<([\d|\w|_]+)>(.*)<\/\1>/;
        this.PrefabZhPattern = /(?<=\s)(value|m_Text): (["']{1})([\s\S]*)/;
        this.TagID = 'ID=';
        this.TagCN = 'CN=';
        this.OutXlsx = 'language.xlsx';
        this.OutFullXlsx = 'language.full.xlsx';
        this.OutTxt = 'languages_mid.txt';
        this.OutNewTxt = 'languages_new.txt';
        this.OutSrcTxt = 'languages_src.txt';
        this.BlacklistTxt = 'blacklist.txt';
        this.strMap = {};
        this.fromMap = {};
        this.newMap = {};
        this.totalCnt = 0;
        this.newCnt = 0;
        this.modifiedFileCnt = 0;
        this.noLocalCnt = 0;
        this.logContent = '';
        this.md5Cache = {};
        this.md52rawStr = {};
        this.outputJSONMap = {};
    }
    Localizer.prototype.searchZhInFiles = function (tasks, option) {
        this.mode = LocalizeOption_1.LocalizeMode.Search;
        this.processTasks(tasks, option);
    };
    Localizer.prototype.replaceZhInFiles = function (tasks, option) {
        this.mode = LocalizeOption_1.LocalizeMode.Replace;
        this.processTasks(tasks, option);
    };
    Localizer.prototype.processTasks = function (tasks, option) {
        var startAt = (new Date()).getTime();
        this.strMap = {};
        this.fromMap = {};
        this.newMap = {};
        this.totalCnt = 0;
        this.newCnt = 0;
        this.modifiedFileCnt = 0;
        this.noLocalCnt = 0;
        this.logContent = '';
        var outputRoot = (option === null || option === void 0 ? void 0 : option.outputRoot) || 'output/';
        if (!fs.existsSync(outputRoot)) {
            console.error("Output root not exists: ".concat(outputRoot));
            process.exit(1);
        }
        // 先读入xlsx
        var xlsxPath = path.join(outputRoot, this.OutXlsx);
        var xlsxSheet;
        var sheetName;
        if (fs.existsSync(xlsxPath)) {
            var xlsxBook = xlsx.readFile(xlsxPath);
            sheetName = xlsxBook.SheetNames[0];
            xlsxSheet = xlsxBook.Sheets[sheetName];
            this.sheetRows = xlsx.utils.sheet_to_json(xlsxSheet);
            var errorRows = [];
            var newlineRows = [];
            for (var i = 0, len = this.sheetRows.length; i < len; i++) {
                var oneRow = this.sheetRows[i];
                if (oneRow.CN == undefined) {
                    errorRows.push(i + 2);
                    continue;
                }
                if (oneRow.ID != this.getStringMd5(oneRow.CN)) {
                    console.warn("row ".concat(i + 2, " MD5 error, auto corrected!"));
                    oneRow.ID = this.getStringMd5(oneRow.CN);
                }
                oneRow.CN = this.eunsureString(oneRow.CN);
                for (var _i = 0, _a = option.langs; _i < _a.length; _i++) {
                    var lang = _a[_i];
                    var local = oneRow[lang];
                    if (undefined != local) {
                        oneRow[lang] = this.eunsureString(local);
                        // 检查翻译中是否有换行符
                        var idx = local.search(/[\r\n]/g);
                        if (idx >= 0) {
                            newlineRows.push(i + 2);
                        }
                    }
                }
                // 修复翻译中的换行
                this.strMap[oneRow.ID] = oneRow;
            }
            this.assert(errorRows.length == 0, 'The following rows are suspect illegal: ' + errorRows.join(', '));
            this.assert(errorRows.length == 0, 'The following rows are suspect illegal: ' + errorRows.join(', '));
            this.assert(newlineRows.length == 0, 'The following rows contains newline char: ' + newlineRows.join(', '));
            console.log('[unity-i18n]读入翻译记录：\x1B[36m%d\x1B[0m', this.sheetRows.length);
        }
        else {
            console.log('[unity-i18n]找不到旧的翻译记录：%s', xlsxPath);
            this.sheetRows = [];
        }
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
            var tasksAlias = tasks;
            for (var _b = 0, tasksAlias_1 = tasksAlias; _b < tasksAlias_1.length; _b++) {
                var oneTask = tasksAlias_1[_b];
                this.runTask(oneTask, option);
            }
        }
        if (this.sheetRows.length == 0) {
            console.log('[unity-i18n]No zh strings found.');
            return;
        }
        // 排序，没翻译的放前面
        var sortedRows;
        if ((option === null || option === void 0 ? void 0 : option.xlsxStyle) == 'prepend') {
            sortedRows = [];
            for (var _c = 0, _d = this.sheetRows; _c < _d.length; _c++) {
                var oneRow = _d[_c];
                if (!this.isRowTranslated(oneRow, option)) {
                    sortedRows.push(oneRow);
                }
            }
            for (var _e = 0, _f = this.sheetRows; _e < _f.length; _e++) {
                var oneRow = _f[_e];
                if (this.isRowTranslated(oneRow, option)) {
                    sortedRows.push(oneRow);
                }
            }
        }
        else if ((option === null || option === void 0 ? void 0 : option.xlsxStyle) == 'sort-by-id') {
            sortedRows = this.sheetRows.sort(function (a, b) {
                return a.ID.charCodeAt(0) - b.ID.charCodeAt(0);
            });
        }
        else {
            sortedRows = this.sheetRows;
        }
        if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
            var txtContent = '';
            var txtNewContent = '';
            var txtSrcContent = '';
            for (var id in this.strMap) {
                var oneRow = this.strMap[id];
                var infos = this.TagID + oneRow.ID + '\n';
                infos += this.TagCN + oneRow.CN + '\n';
                for (var _g = 0, _h = option.langs; _g < _h.length; _g++) {
                    var lang = _h[_g];
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
            var cols = xlsxSheet["!cols"];
            if (!cols) {
                cols = [{ wch: 20 }, { wch: 110 }];
                for (var _j = 0, _k = option.langs; _j < _k.length; _j++) {
                    var lang = _k[_j];
                    cols.push({ wch: 110 });
                }
            }
            this.writeXlsx(sortedRows, cols, path.join(outputRoot, this.OutFullXlsx));
            // 再写一个过滤掉黑名单的
            var blackMap = {};
            var blackFile = path.join(outputRoot, this.BlacklistTxt);
            if (fs.existsSync(blackFile)) {
                var blackContent = fs.readFileSync(blackFile, 'utf-8');
                var blackLines = blackContent.split(/\r?\n/);
                for (var _l = 0, blackLines_1 = blackLines; _l < blackLines_1.length; _l++) {
                    var bl = blackLines_1[_l];
                    blackMap[bl] = true;
                }
            }
            var filteredRows = [];
            for (var _m = 0, sortedRows_1 = sortedRows; _m < sortedRows_1.length; _m++) {
                var row = sortedRows_1[_m];
                if (!blackMap[row.CN]) {
                    filteredRows.push(row);
                }
            }
            this.writeXlsx(filteredRows, cols, path.join(outputRoot, this.OutXlsx));
        }
        else if (option === null || option === void 0 ? void 0 : option.softReplace) {
            // 生成各个语言包
            for (var oj in this.outputJSONMap) {
                var m = this.outputJSONMap[oj];
                var cnArr = Object.keys(m);
                cnArr.sort();
                var ojRoot = this.normalizePath(oj);
                if (option.inputRoot && !path.isAbsolute(ojRoot)) {
                    ojRoot = path.join(option.inputRoot, ojRoot);
                }
                // 中文包
                var ojArr = [];
                for (var _o = 0, cnArr_1 = cnArr; _o < cnArr_1.length; _o++) {
                    var cn = cnArr_1[_o];
                    ojArr.push(this.getStringMd5(cn));
                    ojArr.push(cn);
                }
                fs.writeFileSync(ojRoot.replace('$LANG', 'CN'), JSON.stringify({ strings: ojArr }), 'utf-8');
                // 外文包
                for (var _p = 0, _q = option.langs; _p < _q.length; _p++) {
                    var lang = _q[_p];
                    var ojArr_1 = [];
                    for (var _r = 0, cnArr_2 = cnArr; _r < cnArr_2.length; _r++) {
                        var cn = cnArr_2[_r];
                        ojArr_1.push(this.getStringMd5(cn));
                        var local = this.getLocal(cn, option);
                        ojArr_1.push((local === null || local === void 0 ? void 0 : local[lang]) || cn);
                    }
                    fs.writeFileSync(ojRoot.replace('$LANG', lang), JSON.stringify({ strings: ojArr_1 }), 'utf-8');
                }
            }
        }
        if (option === null || option === void 0 ? void 0 : option.needLog) {
            fs.writeFileSync('log.' + LocalizeOption_1.LocalizeMode[this.mode] + '.txt', this.logContent, 'utf-8');
        }
        var endAt = (new Date()).getTime();
        if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
            console.log('[unity-i18n]搜索结束! 耗时: \x1B[36m%d\x1B[0m秒. Total: \x1B[36m%d\x1B[0m, net: \x1B[36m%d\x1B[0m, new: \x1B[36m%d\x1B[0m.', ((endAt - startAt) / 1000).toFixed(), this.totalCnt, sortedRows.length, this.newCnt);
        }
        else {
            console.log('[unity-i18n]替换结束! 耗时: \x1B[36m%d\x1B[0m秒. Modified file: \x1B[36m%d\x1B[0m, no local: \x1B[36m%d\x1B[0m.', ((endAt - startAt) / 1000).toFixed(), this.modifiedFileCnt, this.noLocalCnt);
        }
    };
    Localizer.prototype.writeXlsx = function (sortedRows, cols, outputXlsx) {
        var newBook = xlsx.utils.book_new();
        var newSheet = xlsx.utils.json_to_sheet(sortedRows);
        newSheet["!cols"] = cols;
        xlsx.utils.book_append_sheet(newBook, newSheet);
        xlsx.writeFile(newBook, outputXlsx);
    };
    Localizer.prototype.isRowTranslated = function (oneRow, option) {
        for (var _i = 0, _a = option.langs; _i < _a.length; _i++) {
            var lang = _a[_i];
            if (oneRow[lang] == undefined) {
                return false;
            }
        }
        return true;
    };
    Localizer.prototype.runTask = function (oneTask, option) {
        var _a;
        if (typeof (oneTask) == 'string') {
            oneTask = {
                "roots": [oneTask],
                "option": option
            };
        }
        this.crtTask = oneTask;
        var finalOpt = this.mergeOption(oneTask.option, option);
        var oj = (_a = oneTask.option) === null || _a === void 0 ? void 0 : _a.outputJSON;
        if (oj) {
            if (!this.outputJSONMap[oj])
                this.outputJSONMap[oj] = {};
        }
        for (var _i = 0, _b = oneTask.roots; _i < _b.length; _i++) {
            var oneRoot = _b[_i];
            if (option.replacer) {
                for (var rk in option.replacer) {
                    oneRoot = oneRoot.replace(rk, option.replacer[rk]);
                }
            }
            oneRoot = this.normalizePath(oneRoot);
            if (option.inputRoot && !path.isAbsolute(oneRoot)) {
                oneRoot = path.join(option.inputRoot, oneRoot);
            }
            if (!fs.existsSync(oneRoot)) {
                console.warn('[WARNING]Task root not exists: %s\n', oneRoot);
                continue;
            }
            var rootStat = fs.statSync(oneRoot);
            if (rootStat.isFile()) {
                this.searchZhInFile(oneRoot, finalOpt);
            }
            else {
                this.searchZhInDir(oneRoot, finalOpt);
            }
        }
    };
    Localizer.prototype.mergeOption = function (local, global) {
        if (!local)
            local = {};
        if (global) {
            for (var globalKey in global) {
                if (!local[globalKey]) {
                    local[globalKey] = global[globalKey];
                }
            }
        }
        return local;
    };
    Localizer.prototype.searchZhInDir = function (dirPath, option) {
        var _a, _b;
        if (path.basename(dirPath).charAt(0) == '.') {
            this.addLog('SKIP', dirPath);
            return;
        }
        if ((_a = option === null || option === void 0 ? void 0 : option.excludes) === null || _a === void 0 ? void 0 : _a.dirs) {
            for (var i = 0, len = option.excludes.dirs.length; i < len; i++) {
                var ed = option.excludes.dirs[i];
                if (typeof (ed) == 'string') {
                    ed = this.normalizePath(ed);
                }
                if (dirPath.search(ed) >= 0) {
                    this.addLog('SKIP', dirPath);
                    return;
                }
            }
        }
        var dirIncluded = true;
        if ((_b = option === null || option === void 0 ? void 0 : option.includes) === null || _b === void 0 ? void 0 : _b.dirs) {
            var isIncluded = false;
            for (var i = 0, len = option.includes.dirs.length; i < len; i++) {
                var id = option.excludes.dirs[i];
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
        var files = fs.readdirSync(dirPath);
        var r = false;
        for (var i = 0, len = files.length; i < len; i++) {
            var filename = files[i];
            var filePath = path.join(dirPath, filename);
            var fileStat = fs.statSync(filePath);
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
    };
    Localizer.prototype.searchZhInFile = function (filePath, option) {
        var _this = this;
        var _a, _b, _c, _d;
        var fileExt = path.extname(filePath).toLowerCase();
        if (((_a = option === null || option === void 0 ? void 0 : option.excludes) === null || _a === void 0 ? void 0 : _a.exts) && option.excludes.exts.indexOf(fileExt) >= 0) {
            this.addLog('SKIP', filePath);
            return;
        }
        if (((_b = option === null || option === void 0 ? void 0 : option.includes) === null || _b === void 0 ? void 0 : _b.exts) && option.includes.exts.indexOf(fileExt) < 0) {
            this.addLog('SKIP', filePath);
            return;
        }
        if ((_c = option === null || option === void 0 ? void 0 : option.excludes) === null || _c === void 0 ? void 0 : _c.files) {
            for (var i = 0, len = option.excludes.files.length; i < len; i++) {
                if (filePath.search(this.ensureRegExp(option.excludes.files[i])) >= 0) {
                    this.addLog('SKIP', filePath);
                    return;
                }
            }
        }
        if ((_d = option === null || option === void 0 ? void 0 : option.includes) === null || _d === void 0 ? void 0 : _d.files) {
            var isIncluded = false;
            for (var i = 0, len = option.includes.files.length; i < len; i++) {
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
        var fileContent = fs.readFileSync(filePath, 'utf-8');
        var newContent;
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
        if (this.mode == LocalizeOption_1.LocalizeMode.Replace) {
            if (option.softReplace && option.replaceOutput) {
                var filename_1 = path.basename(filePath, fileExt);
                var _loop_1 = function (lang) {
                    var newFilePath = path.join(option.inputRoot, option.replaceOutput).replace(/\$LANG/g, lang).replace(/\$FILENAME/g, filename_1);
                    var newFileDir = path.dirname(newFilePath);
                    fs.ensureDirSync(newFileDir);
                    var outContent = void 0;
                    if (newContent) {
                        outContent = newContent.replace(/\$i18n-(\w+)\$/g, function (substring) {
                            var args = [];
                            for (var _i = 1; _i < arguments.length; _i++) {
                                args[_i - 1] = arguments[_i];
                            }
                            var local = _this.strMap[args[0]];
                            if (local) {
                                return local[lang] || local.CN;
                            }
                            var raw = _this.md52rawStr[args[0]];
                            _this.assert(raw != undefined, "No local and raw found when process ".concat(filename_1));
                            return raw;
                        });
                    }
                    else {
                        outContent = fileContent;
                    }
                    this_1.addLog('REPLACE', newFilePath);
                    fs.writeFileSync(newFilePath, outContent, 'utf-8');
                };
                var this_1 = this;
                for (var _i = 0, _e = option.langs; _i < _e.length; _i++) {
                    var lang = _e[_i];
                    _loop_1(lang);
                }
            }
            else {
                if (newContent) {
                    this.addLog('REPLACE', filePath);
                    fs.writeFileSync(filePath, newContent, 'utf-8');
                }
            }
        }
    };
    Localizer.prototype.processZnInXml = function (fileContent, option) {
        var modified = false;
        var newContent = '';
        var lines = fileContent.split(/[\r\n]+/);
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            var zh = '';
            var ret = oneLine.match(this.XmlZhPattern);
            if (ret) {
                var rawContent = ret[2];
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
                var local = void 0;
                if (zh) {
                    local = this.getLocal(zh, option);
                }
                if (local === null || local === void 0 ? void 0 : local[option.langs[0]]) {
                    modified = true;
                    newContent += oneLine.substring(0, ret.index) + '<' + ret[0] + '>' + local[option.langs[0]] + '<' + ret[0] + '/>' + '\n';
                }
                else {
                    newContent += oneLine + '\n';
                }
            }
        }
        return modified ? newContent : null;
    };
    Localizer.prototype.processZnInCodeFile = function (fileContent, option) {
        var modified = false;
        var newContent = '';
        // 保留跨行注释
        var commentCaches = [];
        fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, function (substring) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            commentCaches.push(substring);
            return '[[[i18n-comment]]]';
        });
        var lines = fileContent.split(/\r?\n/); // 保留空行
        for (var i = 0, len = lines.length; i < len; i++) {
            if (i > 0)
                newContent += '\n';
            var oneLine = lines[i];
            // 过滤掉注释行
            var skip = oneLine.match(/^\s*\/\//) != null || oneLine.match(/^\s*\/\*/) != null;
            // 过滤掉log语句
            if (!skip && (option === null || option === void 0 ? void 0 : option.skipPatterns)) {
                for (var j = 0, jlen = option.skipPatterns.length; j < jlen; j++) {
                    var ptn = this.ensureRegExp(option.skipPatterns[j]);
                    if (oneLine.match(ptn)) {
                        skip = true;
                        break;
                    }
                }
            }
            if (!skip) {
                var ret = oneLine.match(this.CodeZhPattern);
                while (ret) {
                    var zh = '';
                    var quote = ret[1];
                    var rawContent = ret[2];
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
                        if (zh) {
                            if (option.softReplace && option.softReplacer) {
                                modified = true;
                                var localStr = option.softReplacer.replace('$RAWSTRING', quote + zh + quote).replace('$STRINGID', this.getStringMd5(zh));
                                newContent += oneLine.substring(0, ret.index) + localStr;
                            }
                            else {
                                var local = this.getLocal(zh, option);
                                if (local === null || local === void 0 ? void 0 : local[option.langs[0]]) {
                                    modified = true;
                                    var localStr = this.processQuote(local[option.langs[0]], quote);
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
            var commentCnt_1 = 0;
            newContent = newContent.replace(/\[\[\[i18n-comment\]\]\]/g, function (substring) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return commentCaches[commentCnt_1++];
            });
        }
        return modified ? newContent : null;
    };
    Localizer.prototype.processZnInJSON = function (fileContent, option) {
        var modified = false;
        var newContent = '';
        var ret = fileContent.match(this.CodeZhPattern);
        while (ret) {
            var zh = '';
            var rawContent = ret[2];
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
                var localStr = void 0;
                if (zh) {
                    if (option.softReplace && option.replaceOutput) {
                        modified = true;
                        localStr = "$i18n-".concat(this.getStringMd5(zh), "$");
                    }
                    else {
                        var local = this.getLocal(zh, option);
                        if (local === null || local === void 0 ? void 0 : local[option.langs[0]]) {
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
    };
    Localizer.prototype.processZnInPrefab = function (fileContent, option) {
        var modified = false;
        var newContent = '';
        var lines = fileContent.split(/\r?\n/);
        var indent = '  ';
        // 假如是该节点是预制体实例，则是，如斗罗韩服手游WorldUIElementView.prefab
        // - target: {fileID: 114479196432416642, guid: 5d66a490e5f6da842a0990a7a99f6bf1,
        //     type: 3}
        //   propertyPath: m_Text
        //   value: "\u51A5\u738B\u9CB2+"
        //   objectReference: {fileID: 0}
        var filedName = 'm_Text';
        var quoter = '"';
        var rawLineCache;
        var crossLineCache = null;
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            var quotedContent = '';
            if (null != crossLineCache) {
                rawLineCache += '\n' + oneLine;
                crossLineCache += ' ';
                oneLine = oneLine.replace(/^\s+/, '').replace(/^\\(?=\s)/, '');
                var endRe = new RegExp('(?<!\\\\)' + quoter + '$');
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
                var ret = oneLine.match(this.PrefabZhPattern);
                if (ret) {
                    indent = oneLine.substring(0, ret.index);
                    filedName = ret[1];
                    quoter = ret[2];
                    var rawContent = ret[3];
                    if (rawContent.charAt(rawContent.length - 1) != quoter) {
                        // 多行待续
                        crossLineCache = rawContent;
                        continue;
                    }
                    quotedContent = rawContent.substring(0, rawContent.length - 1);
                }
            }
            var zh = '';
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
                var local = void 0;
                if (zh) {
                    local = this.getLocal(zh, option);
                }
                if (newContent)
                    newContent += '\n';
                if (local === null || local === void 0 ? void 0 : local[option.langs[0]]) {
                    modified = true;
                    newContent += indent + filedName + ': ' + quoter + this.utf82unicode(local[option.langs[0]]) + quoter;
                }
                else {
                    newContent += rawLineCache;
                }
            }
        }
        return modified ? newContent : null;
    };
    Localizer.prototype.containsZh = function (str) {
        if (str.search(this.HanPattern) >= 0) {
            return true;
        }
        return false;
    };
    Localizer.prototype.markTaskUsed = function (cn) {
        var _a;
        var oj = (_a = this.crtTask.option) === null || _a === void 0 ? void 0 : _a.outputJSON;
        if (oj) {
            this.outputJSONMap[oj][cn] = true;
        }
    };
    Localizer.prototype.getReplacement = function (zh, option) {
        if (option.softReplace && option.softReplacer) {
            var id = this.getStringMd5(zh);
            return option.softReplacer.replace('$STRINGID', id).replace('$LOCAL', "%$".concat(id, "$%"));
        }
        var local = this.getLocal(zh, option);
        return (local === null || local === void 0 ? void 0 : local[option.langs[0]]) || zh;
    };
    Localizer.prototype.insertString = function (cn, option) {
        this.totalCnt++;
        cn = this.formatString(cn);
        // if(cn.indexOf('{0}绑定钻石') >= 0) throw new Error('!');
        var id = this.getStringMd5(cn);
        this.fromMap[id] = this.crtFile;
        if (this.strMap[id])
            return;
        var node = { ID: id, CN: cn };
        for (var _i = 0, _a = option.langs; _i < _a.length; _i++) {
            var lang = _a[_i];
            node[lang] = '';
        }
        this.strMap[id] = node;
        this.newMap[id] = true;
        this.sheetRows.push(node);
        this.newCnt++;
    };
    Localizer.prototype.getLocal = function (cn, option) {
        cn = this.formatString(cn);
        var id = this.getStringMd5(cn);
        var oneRow = this.strMap[id];
        if (!oneRow || !oneRow[option.langs[0]]) {
            this.noLocalCnt++;
            this.addLog('NOLOCAL', cn);
        }
        return oneRow;
    };
    Localizer.prototype.formatString = function (s) {
        return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\\n');
    };
    Localizer.prototype.getStringMd5 = function (s) {
        var c = this.md5Cache[s];
        if (!c) {
            this.md5Cache[s] = c = md5(s).replace(/-/g, '').toLowerCase();
            this.md52rawStr[c] = s;
        }
        return c;
    };
    Localizer.prototype.unicode2utf8 = function (ustr) {
        return ustr.replace(/&#x([\da-f]{1,4});|\\u([\da-f]{1,4})|&#(\d+);|\\([\da-f]{1,4})/gi, function (t, e, n, o, r) { if (o)
            return String.fromCodePoint(o); var c = e || n || r; return /^\d+$/.test(c) && (c = parseInt(c, 10), !isNaN(c) && c < 256) ? unescape("%" + c) : unescape("%u" + c); });
    };
    Localizer.prototype.utf82unicode = function (ustr) {
        return ustr.replace(/[^\u0000-\u00FF]/g, function (t) { return escape(t).replace(/^%/, "\\"); });
    };
    Localizer.prototype.normalizePath = function (p) {
        // p是已linux风格的路径，需要转换成windows的
        if (/win/.test(process.platform)) {
            // a/b/c 换成 a\\\\b\\\\c
            p = path.normalize(p).replace(/\\+/g, '\\\\');
        }
        return p;
    };
    Localizer.prototype.eunsureString = function (s) {
        if (typeof (s) != 'string') {
            return s.toString();
        }
        return s;
    };
    Localizer.prototype.processQuote = function (s, quote) {
        if (quote == '"') {
            s = s.replace(/(?<!\\)"/g, '\\"');
        }
        else if (quote == "'") {
            s = s.replace(/(?<!\\)'/g, "\\'");
        }
        return s;
    };
    Localizer.prototype.ensureRegExp = function (r) {
        if (typeof (r) == 'string')
            r = new RegExp(r);
        return r;
    };
    Localizer.prototype.addLog = function (tag, text) {
        this.logContent += '[' + tag + ']' + text + '\n';
    };
    Localizer.prototype.assert = function (cond, msg) {
        if (!cond) {
            throw new Error(msg);
            process.exit(1);
        }
    };
    return Localizer;
}());
exports.Localizer = Localizer;
