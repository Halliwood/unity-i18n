"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var fs = __importStar(require("fs"));
var path = require("path");
var md5 = require("md5");
var xlsx = require("xlsx");
var LocalizeOption_1 = require("./LocalizeOption");
var Localizer = /** @class */ (function () {
    function Localizer() {
        this.HanPattern = /[\u4e00-\u9fa5]+/;
        this.CodeZhPattern = /(?<!\\)(["|']{1})(.*?)(?<!\\)\1/g;
        this.XmlZhPattern = /\s*<([\d|\w|_]+)>(.*)<\/\1>/;
        this.PrefabZhPattern = /^\s+m_Text: "(.*)"/;
        this.TagID = 'ID=';
        this.TagCN = 'CN=';
        this.TagLOCAL = 'LOCAL=';
        this.OutXlsx = 'language.xlsx';
        this.OutTxt = 'languages_mid.txt';
        this.strMap = {};
        this.totalCnt = 0;
        this.newCnt = 0;
        this.modifiedFileCnt = 0;
        this.noLocalCnt = 0;
        this.logContent = '';
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
        this.newCnt = 0;
        var outputRoot = (option === null || option === void 0 ? void 0 : option.outputRoot) || 'output/';
        // 先读入xlsx
        var xlsxPath = path.join(outputRoot, this.OutXlsx);
        var xlsxSheet;
        var sheetName;
        if (fs.existsSync(xlsxPath)) {
            var xlsxBook = xlsx.readFile(xlsxPath);
            sheetName = xlsxBook.SheetNames[0];
            xlsxSheet = xlsxBook.Sheets[sheetName];
            this.sheetRows = xlsx.utils.sheet_to_json(xlsxSheet);
            for (var _i = 0, _a = this.sheetRows; _i < _a.length; _i++) {
                var oneRow = _a[_i];
                this.strMap[oneRow.ID] = oneRow;
            }
            console.log('[unity-i18n]读入翻译记录：\x1B[36m%d\x1B[0m', this.sheetRows.length);
        }
        else {
            console.log('[unity-i18n]找不到旧的翻译记录：%s', xlsxPath);
            this.sheetRows = [];
        }
        console.log('start....');
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
        var sortedRows = [];
        for (var _c = 0, _d = this.sheetRows; _c < _d.length; _c++) {
            var oneRow = _d[_c];
            if (!oneRow.LOCAL) {
                sortedRows.push(oneRow);
            }
        }
        for (var _e = 0, _f = this.sheetRows; _e < _f.length; _e++) {
            var oneRow = _f[_e];
            if (oneRow.LOCAL) {
                sortedRows.push(oneRow);
            }
        }
        var txtContent = '';
        for (var id in this.strMap) {
            var oneRow = this.strMap[id];
            txtContent += this.TagID + oneRow.ID + '\n';
            txtContent += this.TagCN + oneRow.CN + '\n';
            txtContent += this.TagLOCAL + oneRow.LOCAL + '\n\n';
            // txtContent += 'FROM=' + (oneRow as any).FROM + '\n\n';
        }
        fs.writeFileSync(path.join(outputRoot, this.OutTxt), txtContent);
        var newBook = xlsx.utils.book_new();
        var newSheet = xlsx.utils.json_to_sheet(sortedRows);
        if (xlsxSheet) {
            newSheet["!cols"] = xlsxSheet["!cols"];
        }
        else {
            newSheet["!cols"] = [{ wch: 20 }, { wch: 110 }, { wch: 110 }];
        }
        xlsx.utils.book_append_sheet(newBook, newSheet);
        xlsx.writeFile(newBook, path.join(outputRoot, this.OutXlsx));
        fs.writeFileSync('log.txt', this.logContent, 'utf-8');
        var endAt = (new Date()).getTime();
        if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
            console.log('[unity-i18n]Done! \x1B[36m%d\x1B[0ms costed. Total: \x1B[36m%d\x1B[0m, net: \x1B[36m%d\x1B[0m, new: \x1B[36m%d\x1B[0m.', ((endAt - startAt) / 1000).toFixed(), this.totalCnt, sortedRows.length, this.newCnt);
        }
        else {
            console.log('[unity-i18n]Done! \x1B[36m%d\x1B[0ms costed. Modified file: \x1B[36m%d\x1B[0m, no local: \x1B[36m%d\x1B[0m.', ((endAt - startAt) / 1000).toFixed(), this.modifiedFileCnt, this.noLocalCnt);
        }
    };
    Localizer.prototype.runTask = function (oneTask, option) {
        if (typeof (oneTask) == 'string') {
            oneTask = {
                "roots": [oneTask],
                "option": option
            };
        }
        oneTask.option = this.mergeOption(oneTask.option, option);
        for (var _i = 0, _a = oneTask.roots; _i < _a.length; _i++) {
            var oneRoot = _a[_i];
            if (option.inputRoot && !path.isAbsolute(oneRoot)) {
                oneRoot = path.join(option.inputRoot, oneRoot);
            }
            var rootStat = fs.statSync(oneRoot);
            if (rootStat.isFile()) {
                this.searchZhInFile(oneRoot, oneTask.option);
            }
            else {
                this.searchZhInDir(oneRoot, oneTask.option);
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
                if (dirPath.search(option.excludes.dirs[i]) >= 0) {
                    this.addLog('SKIP', dirPath);
                    return;
                }
            }
        }
        var dirIncluded = true;
        if ((_b = option === null || option === void 0 ? void 0 : option.includes) === null || _b === void 0 ? void 0 : _b.dirs) {
            var isIncluded = false;
            for (var i = 0, len = option.includes.dirs.length; i < len; i++) {
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
                if (filePath.search(option.excludes.files[i]) >= 0) {
                    this.addLog('SKIP', filePath);
                    return;
                }
            }
        }
        if ((_d = option === null || option === void 0 ? void 0 : option.includes) === null || _d === void 0 ? void 0 : _d.files) {
            var isIncluded = false;
            for (var i = 0, len = option.includes.files.length; i < len; i++) {
                if (filePath.search(option.includes.files[i]) >= 0) {
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
        console.log('\x1B[1A\x1B[Kprocessing: %s', filePath);
        var fileContent = fs.readFileSync(filePath, 'utf-8');
        var zhs;
        if ('.prefab' == fileExt) {
            zhs = this.processZnInPrefab(fileContent, option);
        }
        else if ('.xml' == fileExt) {
            zhs = this.processZnInXml(fileContent, option);
        }
        else if ('.json' == fileExt) {
            zhs = this.processZnInJSON(fileContent, option);
        }
        else {
            zhs = this.processZnInCodeFile(fileContent, option);
        }
        if (zhs.length > 0) {
            if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                this.addLog('SEARCH', filePath);
                for (var _i = 0, zhs_1 = zhs; _i < zhs_1.length; _i++) {
                    var zh = zhs_1[_i];
                    this.insertString(zh);
                }
            }
            else {
                var modified = false;
                for (var _e = 0, zhs_2 = zhs; _e < zhs_2.length; _e++) {
                    var zh = zhs_2[_e];
                    var local = this.getLocal(zh);
                    if (local) {
                        fileContent = fileContent.replace(zh, local);
                        modified = true;
                    }
                }
                if (modified) {
                    this.addLog('REPLACE', filePath);
                    fs.writeFileSync(filePath, fileContent, 'utf-8');
                    this.modifiedFileCnt++;
                }
            }
        }
    };
    Localizer.prototype.processZnInXml = function (fileContent, option) {
        var zhs = [];
        var lines = fileContent.split(/[\r\n]+/);
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            var ret = oneLine.match(this.XmlZhPattern);
            if (ret) {
                var rawContent = ret[2];
                if (!rawContent.startsWith('0') && rawContent.search(this.HanPattern) >= 0) {
                    zhs.push(rawContent);
                }
            }
        }
        return zhs;
    };
    Localizer.prototype.processZnInCodeFile = function (fileContent, option) {
        var zhs = [];
        // 去掉跨行注释
        fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, '');
        var lines = fileContent.split(/[\r|\n]+/);
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            // 过滤掉注释行
            if (oneLine.match(/^\s*\/\*/) || oneLine.match(/^\s*\/{2}/) || oneLine.match(/^\s*\*+/))
                continue;
            // 过滤掉log语句
            if (option === null || option === void 0 ? void 0 : option.skipPatterns) {
                var skip = false;
                for (var j = 0, jlen = option.skipPatterns.length; j < jlen; j++) {
                    if (oneLine.match(option.skipPatterns[j])) {
                        skip = true;
                        break;
                    }
                }
                if (skip)
                    continue;
            }
            var ret = oneLine.match(this.CodeZhPattern);
            if (ret) {
                for (var j = 0, jlen = ret.length; j < jlen; j++) {
                    var rawContent = ret[j];
                    if (rawContent.search(this.HanPattern) >= 0) {
                        zhs.push(rawContent.substr(1, rawContent.length - 2));
                    }
                }
            }
        }
        return zhs;
    };
    Localizer.prototype.processZnInJSON = function (fileContent, option) {
        var zhs = [];
        var ret = fileContent.match(this.CodeZhPattern);
        if (ret) {
            for (var i = 0, len = ret.length; i < len; i++) {
                var rawContent = ret[i];
                if (rawContent.search(this.HanPattern) >= 0) {
                    zhs.push(rawContent.substr(1, rawContent.length - 2));
                }
            }
        }
        return zhs;
    };
    Localizer.prototype.processZnInPrefab = function (fileContent, option) {
        var zhs = [];
        var lines = fileContent.split(/[\r\n]+/);
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            // 过滤掉注释行
            var ret = oneLine.match(this.PrefabZhPattern);
            if (ret) {
                var rawContent = ret[1];
                if (rawContent.search(this.HanPattern) >= 0) {
                    zhs.push(rawContent);
                }
            }
        }
        return zhs;
    };
    Localizer.prototype.insertString = function (cn) {
        this.totalCnt++;
        cn = this.formatString(cn);
        // if(cn.indexOf('{0}绑定钻石') >= 0) throw new Error('!');
        var id = this.getStringMd5(cn);
        if (this.strMap[id])
            return;
        var node = { ID: id, CN: cn, LOCAL: '' };
        this.strMap[id] = node;
        node.FROM = this.crtFile;
        this.sheetRows.push(node);
        this.newCnt++;
    };
    Localizer.prototype.getLocal = function (cn) {
        cn = this.formatString(cn);
        var id = this.getStringMd5(cn);
        var node = this.strMap[id];
        if (!node || !node.LOCAL) {
            this.noLocalCnt++;
            this.addLog('NOLOCAL', cn);
            return null;
        }
        return node.LOCAL;
    };
    Localizer.prototype.formatString = function (s) {
        return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\\n');
    };
    Localizer.prototype.getStringMd5 = function (s) {
        return md5(s).replace(/-/g, '').toLowerCase();
    };
    Localizer.prototype.addLog = function (tag, text) {
        this.logContent += '[' + tag + ']' + text + '\n';
    };
    return Localizer;
}());
exports.Localizer = Localizer;
