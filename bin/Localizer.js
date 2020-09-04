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
var Localizer = /** @class */ (function () {
    function Localizer() {
        this.HanPattern = /[\u4e00-\u9fa5]+/;
        this.CodeZhPattern = /(?<!\\)(["|']{1})(.*?)(?<!\\)\1/g;
        this.XmlZhPattern = /\s*<([\d|\w|_]+)>(.*)<\/\1>/g;
        this.PrefabZhPattern = /^\s+m_Text: "(.*)"/;
        this.TagID = 'ID=';
        this.TagCN = 'CN=';
        this.TagLOCAL = 'LOCAL=';
        this.OutXlsx = 'language.xlsx';
        this.OutTxt = 'languages_mid.txt';
        this.sheetJson = [];
        this.strMap = {};
        this.newCnt = 0;
        this.fileLog = '';
        this.skipLogs = [];
    }
    Localizer.prototype.searchZhInFiles = function (root, option) {
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
            this.sheetJson = xlsx.utils.sheet_to_json(xlsxSheet);
            for (var i = 0, len = this.sheetJson.length; i < len; i++) {
                var strNode = this.sheetJson[i];
                this.strMap[strNode.ID] = strNode;
            }
            console.log('[unity-i18n]读入翻译记录：%d', this.sheetJson.length);
        }
        else {
            console.log('[unity-i18n]找不到旧的翻译记录：%s', xlsxPath);
            this.sheetJson = [];
        }
        var rootStat = fs.statSync(root);
        if (rootStat.isFile()) {
            this.searchZhInFile(root, option);
        }
        else {
            this.searchZhInDir(root, option);
        }
        if (this.sheetJson.length == 0) {
            console.log('[unity-i18n]No zh strings found.');
            return;
        }
        var txtContent = '';
        for (var i = 0, len = this.sheetJson.length; i < len; i++) {
            var row = this.sheetJson[i];
            txtContent += this.TagID + row.ID + '\n';
            txtContent += this.TagCN + row.CN + '\n';
            txtContent += this.TagLOCAL + row.LOCAL + '\n\n';
        }
        fs.writeFileSync(path.join(outputRoot, this.OutTxt), txtContent);
        var newBook = xlsx.utils.book_new();
        var newSheet = xlsx.utils.json_to_sheet(this.sheetJson);
        if (xlsxSheet) {
            newSheet["!cols"] = xlsxSheet["!cols"];
        }
        else {
            newSheet["!cols"] = [{ wch: 20 }, { wch: 110 }, { wch: 110 }];
        }
        xlsx.utils.book_append_sheet(newBook, newSheet);
        xlsx.writeFile(newBook, path.join(outputRoot, this.OutXlsx));
        fs.writeFileSync('log.txt', this.fileLog + this.skipLogs.join('\n'), 'utf-8');
        var endAt = (new Date()).getTime();
        console.log('[unity-i18n]Done! \x1B[36m%d\x1B[0m s costed. Total: \x1B[36m%d\x1B[0m, new: \x1B[36m%d\x1B[0m', ((endAt - startAt) / 1000).toFixed(), this.sheetJson.length, this.newCnt);
    };
    Localizer.prototype.searchZhInDir = function (dirPath, option) {
        var _a, _b;
        if (path.basename(dirPath).charAt(0) == '.') {
            return;
        }
        if ((_a = option === null || option === void 0 ? void 0 : option.excludes) === null || _a === void 0 ? void 0 : _a.dirs) {
            for (var i = 0, len = option.excludes.dirs.length; i < len; i++) {
                if (dirPath.search(option.excludes.dirs[i]) >= 0) {
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
                        this.skipLogs.push('--: ' + dirPath);
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
        var _a, _b;
        if ((_a = option === null || option === void 0 ? void 0 : option.excludes) === null || _a === void 0 ? void 0 : _a.files) {
            for (var i = 0, len = option.excludes.files.length; i < len; i++) {
                if (filePath.search(option.excludes.files[i]) >= 0) {
                    return;
                }
            }
        }
        if ((_b = option === null || option === void 0 ? void 0 : option.includes) === null || _b === void 0 ? void 0 : _b.files) {
            var isIncluded = false;
            for (var i = 0, len = option.includes.files.length; i < len; i++) {
                if (filePath.search(option.includes.files[i]) >= 0) {
                    isIncluded = true;
                    break;
                }
            }
            if (!isIncluded) {
                return;
            }
        }
        var fileExt = path.extname(filePath).toLowerCase();
        if ('.svn' == fileExt)
            return;
        // console.log('\x1B[1A\x1B[Kprocessing: %s', filePath);
        this.fileLog += '++' + filePath + '\n';
        if ('.prefab' == fileExt) {
            this.searchZnInPrefab(filePath, option);
        }
        else if ('.xml' == fileExt) {
            this.searchZnInXml(filePath, option);
        }
        else if ('.json' == fileExt) {
            this.searchZnInJSON(filePath, option);
        }
        else {
            this.searchZnInCodeFile(filePath, option);
        }
    };
    Localizer.prototype.searchZnInXml = function (filePath, option) {
        var fileContent = fs.readFileSync(filePath, 'utf-8');
        var lines = fileContent.split(/[\r\n]+/);
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            var ret = oneLine.match(this.XmlZhPattern);
            if (ret) {
                for (var j = 0, jlen = ret.length; j < jlen; j++) {
                    var rawContent = ret[j];
                    if (rawContent.search(this.HanPattern) >= 0) {
                        this.insertString(rawContent);
                        ret = oneLine.match(this.CodeZhPattern);
                    }
                }
            }
        }
    };
    Localizer.prototype.searchZnInCodeFile = function (filePath, option) {
        var fileContent = fs.readFileSync(filePath, 'utf-8');
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
                        this.insertString(rawContent.substr(1, rawContent.length - 2));
                    }
                }
            }
        }
    };
    Localizer.prototype.searchZnInJSON = function (filePath, option) {
        var fileContent = fs.readFileSync(filePath, 'utf-8');
        var ret = fileContent.match(this.CodeZhPattern);
        if (ret) {
            for (var i = 0, len = ret.length; i < len; i++) {
                var rawContent = ret[i];
                if (rawContent.search(this.HanPattern) >= 0) {
                    this.insertString(rawContent);
                }
            }
        }
    };
    Localizer.prototype.searchZnInPrefab = function (filePath, option) {
        var fileContent = fs.readFileSync(filePath, 'utf-8');
        var lines = fileContent.split(/[\r\n]+/);
        for (var i = 0, len = lines.length; i < len; i++) {
            var oneLine = lines[i];
            // 过滤掉注释行
            var ret = oneLine.match(this.PrefabZhPattern);
            if (ret) {
                var rawContent = ret[0];
                if (rawContent.search(this.HanPattern) >= 0) {
                    this.insertString(rawContent);
                    ret = oneLine.match(this.CodeZhPattern);
                }
            }
        }
    };
    Localizer.prototype.insertString = function (cn) {
        cn = this.formatString(cn);
        var id = this.getStringMd5(cn);
        if (this.strMap[id])
            return;
        var node = { ID: id, CN: cn, LOCAL: '' };
        this.strMap[id] = node;
        this.sheetJson.unshift(node);
        this.newCnt++;
    };
    Localizer.prototype.getLocal = function (cn) {
        var id = this.getStringMd5(this.formatString(cn));
        var node = this.strMap[id];
        if (!node || !node.LOCAL) {
            console.warn("not find Local:" + cn);
            return cn;
        }
        return node.LOCAL;
    };
    Localizer.prototype.formatString = function (s) {
        return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\\n');
    };
    Localizer.prototype.getStringMd5 = function (s) {
        return md5(s).replace(/-/g, '').toLowerCase();
    };
    return Localizer;
}());
exports.Localizer = Localizer;
