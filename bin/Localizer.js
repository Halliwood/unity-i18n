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
        this.CodeZhPattern = /(?<!\\)(["']{1})(.*?)(?<!\\)\1/;
        this.XmlZhPattern = /\s*<([\d|\w|_]+)>(.*)<\/\1>/;
        this.PrefabZhPattern = /(?<=\s)m_Text: (["']{1})([\s\S]*)/;
        this.TagID = 'ID=';
        this.TagCN = 'CN=';
        this.TagLOCAL = 'LOCAL=';
        this.OutXlsx = 'language.xlsx';
        this.OutTxt = 'languages_mid.txt';
        this.OutNewTxt = 'languages_new.txt';
        this.strMap = {};
        this.fromMap = {};
        this.newMap = {};
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
        this.strMap = {};
        this.fromMap = {};
        this.newMap = {};
        this.totalCnt = 0;
        this.newCnt = 0;
        this.modifiedFileCnt = 0;
        this.noLocalCnt = 0;
        this.logContent = '';
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
                oneRow.CN = this.eunsureString(oneRow.CN);
                oneRow.LOCAL = this.eunsureString(oneRow.LOCAL);
                this.strMap[oneRow.ID] = oneRow;
            }
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
            for (var id in this.strMap) {
                var oneRow = this.strMap[id];
                var infos = this.TagID + oneRow.ID + '\n';
                infos += this.TagCN + oneRow.CN + '\n';
                infos += this.TagLOCAL + oneRow.LOCAL + '\n';
                txtContent += infos + '\n';
                if (this.newMap[oneRow.ID]) {
                    infos += 'FROM=' + this.fromMap[oneRow.ID] + '\n';
                    txtNewContent += infos + '\n';
                }
            }
            fs.writeFileSync(path.join(outputRoot, this.OutTxt), txtContent);
            fs.writeFileSync(path.join(outputRoot, this.OutNewTxt), txtNewContent);
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
            oneRoot = this.normalizePath(oneRoot);
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
            if (newContent) {
                this.addLog('REPLACE', filePath);
                fs.writeFileSync(filePath, newContent, 'utf-8');
                this.modifiedFileCnt++;
            }
            else {
                this.addLog('NOREPLACE', filePath);
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
                }
            }
            if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                if (zh) {
                    this.insertString(zh);
                }
            }
            else {
                var local = void 0;
                if (zh) {
                    local = this.getLocal(zh);
                }
                if (local) {
                    modified = true;
                    newContent += oneLine.substr(0, ret.index) + '<' + ret[0] + '>' + local + '<' + ret[0] + '/>' + '\n';
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
                    if (oneLine.match(option.skipPatterns[j])) {
                        skip = true;
                        break;
                    }
                }
            }
            if (!skip) {
                var ret = oneLine.match(this.CodeZhPattern);
                while (ret) {
                    var zh = '';
                    var rawContent = ret[2];
                    if (this.containsZh(rawContent)) {
                        zh = rawContent;
                    }
                    if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                        if (zh) {
                            this.insertString(zh);
                        }
                    }
                    else {
                        var local = void 0;
                        if (zh) {
                            local = this.getLocal(zh);
                        }
                        if (local) {
                            modified = true;
                            newContent += oneLine.substr(0, ret.index) + ret[1] + local + ret[1];
                        }
                        else {
                            newContent += oneLine.substr(0, ret.index + ret[0].length);
                        }
                    }
                    oneLine = oneLine.substr(ret.index + ret[0].length);
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
            }
            if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                if (zh) {
                    this.insertString(zh);
                }
            }
            else {
                var local = void 0;
                if (zh) {
                    local = this.getLocal(zh);
                }
                if (local) {
                    local = local.replace(/(?<!\\)"/g, '\\"');
                    modified = true;
                    newContent += fileContent.substr(0, ret.index) + ret[1] + local + ret[1];
                }
                else {
                    newContent += fileContent.substr(0, ret.index + ret[0].length);
                }
            }
            fileContent = fileContent.substr(ret.index + ret[0].length);
            ret = fileContent.match(this.CodeZhPattern);
        }
        newContent += fileContent;
        return modified ? newContent : null;
    };
    Localizer.prototype.processZnInPrefab = function (fileContent, option) {
        var modified = false;
        var newContent = '';
        var lines = fileContent.split(/[\r\n]+/);
        var indent = '  ';
        var quoter = '"';
        var rawLineCache;
        var crossLineCache;
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            var quotedContent = '';
            if (crossLineCache) {
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
                quotedContent = crossLineCache + oneLine.substr(0, oneLine.length - 1);
            }
            else {
                rawLineCache = oneLine;
                var ret = oneLine.match(this.PrefabZhPattern);
                if (ret) {
                    indent = oneLine.substr(0, ret.index);
                    quoter = ret[1];
                    var rawContent = ret[2];
                    if (rawContent.charAt(rawContent.length - 1) != quoter) {
                        // 多行待续
                        crossLineCache = rawContent;
                        continue;
                    }
                    quotedContent = rawContent.substr(0, rawContent.length - 1);
                }
            }
            var zh = '';
            if (quotedContent) {
                quotedContent = this.unicode2utf8(quotedContent);
                if (this.containsZh(quotedContent)) {
                    zh = quotedContent;
                }
            }
            crossLineCache = null;
            if (this.mode == LocalizeOption_1.LocalizeMode.Search) {
                if (zh) {
                    this.insertString(zh);
                }
            }
            else {
                var local = void 0;
                if (zh) {
                    local = this.getLocal(zh);
                }
                if (newContent)
                    newContent += '\n';
                if (local) {
                    modified = true;
                    newContent += indent + 'm_Text: ' + quoter + this.utf82unicode(local) + quoter;
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
    Localizer.prototype.insertString = function (cn) {
        this.totalCnt++;
        cn = this.formatString(cn);
        // if(cn.indexOf('{0}绑定钻石') >= 0) throw new Error('!');
        var id = this.getStringMd5(cn);
        if (this.strMap[id])
            return;
        var node = { ID: id, CN: cn, LOCAL: '' };
        this.strMap[id] = node;
        this.fromMap[id] = this.crtFile;
        this.newMap[id] = true;
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
    Localizer.prototype.addLog = function (tag, text) {
        this.logContent += '[' + tag + ']' + text + '\n';
    };
    return Localizer;
}());
exports.Localizer = Localizer;
