import * as fs from 'fs';
import path = require('path');
import md5 = require('md5');
import xlsx = require('xlsx');
import { GlobalOption, LocalizeTask, LocalizeOption, LocalizeMode } from './LocalizeOption';

interface LanguageRow {
    ID: string;
    CN: string; 
    LOCAL: string;
}

export class Localizer {
    private readonly HanPattern = /[\u4e00-\u9fa5]+/;
    private readonly CodeZhPattern = /(?<!\\)(["']{1})(.*?)(?<!\\)\1/;
    private readonly XmlZhPattern = /\s*<([\d|\w|_]+)>(.*)<\/\1>/;
    private readonly PrefabZhPattern = /(?<=\s)m_Text: (["']{1})(.*)\1/;

    private readonly TagID = 'ID=';
    private readonly TagCN = 'CN=';
    private readonly TagLOCAL= 'LOCAL=';
    private readonly OutXlsx = 'language.xlsx';
    private readonly OutTxt = 'languages_mid.txt';
    private readonly OutNewTxt = 'languages_new.txt';

    private sheetRows: LanguageRow[];
    private strMap: {[id: string]: LanguageRow} = {};
    private fromMap: {[id: string]: string} = {};
    private newMap: {[id: string]: boolean} = {};

    private crtFile: string;

    private totalCnt = 0;
    private newCnt = 0;

    private modifiedFileCnt = 0;
    private noLocalCnt = 0;

    private logContent: string = '';

    private mode: LocalizeMode;

    searchZhInFiles(tasks: string | LocalizeTask[], option?: GlobalOption) {
        this.mode = LocalizeMode.Search;
        this.processTasks(tasks, option);
    }

    replaceZhInFiles(tasks: string | LocalizeTask[], option?: GlobalOption) {
        this.mode = LocalizeMode.Replace;
        this.processTasks(tasks, option);
    }

    private processTasks(tasks: string | LocalizeTask[], option?: GlobalOption) {
        let startAt = (new Date()).getTime();

        this.strMap = {};
        this.fromMap = {};
        this.newMap = {};

        this.totalCnt = 0;
        this.newCnt = 0;
        this.modifiedFileCnt = 0;
        this.noLocalCnt = 0;

        this.logContent = '';

        let outputRoot = option?.outputRoot || 'output/';
        // 先读入xlsx
        let xlsxPath = path.join(outputRoot, this.OutXlsx);
        let xlsxSheet: xlsx.WorkSheet;
        let sheetName: string;
        if(fs.existsSync(xlsxPath)) {
            let xlsxBook = xlsx.readFile(xlsxPath);
            sheetName = xlsxBook.SheetNames[0];
            xlsxSheet = xlsxBook.Sheets[sheetName];
            this.sheetRows = xlsx.utils.sheet_to_json<LanguageRow>(xlsxSheet);
            for(let oneRow of this.sheetRows) {
                this.strMap[oneRow.ID] = oneRow;
            }
            console.log('[unity-i18n]读入翻译记录：\x1B[36m%d\x1B[0m', this.sheetRows.length);
        } else {
            console.log('[unity-i18n]找不到旧的翻译记录：%s', xlsxPath);
            this.sheetRows = [];
        }
        if(this.mode == LocalizeMode.Search) {
            console.log('开始搜索中文串...\n');
        } else {
            console.log('开始替换中文串...\n')
        }

        if(typeof(tasks) == 'string') {
            // 单个路径
            this.runTask(tasks, option);
        } else {
            let tasksAlias = tasks as LocalizeTask[];
            for(let oneTask of tasksAlias) {
                this.runTask(oneTask, option);
            }
        }

        if(this.sheetRows.length == 0) {
            console.log('[unity-i18n]No zh strings found.');
            return;
        }

        // 排序，没翻译的放前面
        let sortedRows: LanguageRow[] = [];
        for(let oneRow of this.sheetRows) {
            if(!oneRow.LOCAL) {
                sortedRows.push(oneRow);
            }
        }
        for(let oneRow of this.sheetRows) {
            if(oneRow.LOCAL) {
                sortedRows.push(oneRow);
            }
        }

        if(this.mode == LocalizeMode.Search) {
            let txtContent = '';
            let txtNewContent = '';
            for(let id in this.strMap) {
                let oneRow = this.strMap[id];
                let infos = this.TagID + oneRow.ID + '\n';
                infos += this.TagCN + oneRow.CN + '\n';
                infos += this.TagLOCAL + oneRow.LOCAL + '\n';
                txtContent += infos + '\n';
    
                if(this.newMap[oneRow.ID]) {
                    infos += 'FROM=' + this.fromMap[oneRow.ID] + '\n';
                    txtNewContent += infos + '\n';
                }
            }
            fs.writeFileSync(path.join(outputRoot, this.OutTxt), txtContent);
            fs.writeFileSync(path.join(outputRoot, this.OutNewTxt), txtNewContent);
        
            let newBook = xlsx.utils.book_new();
            let newSheet = xlsx.utils.json_to_sheet(sortedRows);
            if(xlsxSheet) {
                newSheet["!cols"] = xlsxSheet["!cols"];
            } else {
                newSheet["!cols"] = [{wch: 20}, {wch: 110}, {wch: 110}];
            }
            xlsx.utils.book_append_sheet(newBook, newSheet);
            xlsx.writeFile(newBook, path.join(outputRoot, this.OutXlsx));
        }

        if(!option?.noLog) {
            fs.writeFileSync('log.' + LocalizeMode[this.mode] + '.txt', this.logContent, 'utf-8');
        }

        let endAt = (new Date()).getTime();

        if(this.mode == LocalizeMode.Search) {
            console.log('[unity-i18n]搜索结束! 耗时: \x1B[36m%d\x1B[0m秒. Total: \x1B[36m%d\x1B[0m, net: \x1B[36m%d\x1B[0m, new: \x1B[36m%d\x1B[0m.', 
            ((endAt - startAt) / 1000).toFixed(), this.totalCnt, sortedRows.length, this.newCnt);
        } else {
            console.log('[unity-i18n]替换结束! 耗时: \x1B[36m%d\x1B[0m秒. Modified file: \x1B[36m%d\x1B[0m, no local: \x1B[36m%d\x1B[0m.', 
            ((endAt - startAt) / 1000).toFixed(), this.modifiedFileCnt, this.noLocalCnt);
        }
    }

    private runTask(oneTask: LocalizeTask, option: GlobalOption) {
        if(typeof(oneTask) == 'string') {
            oneTask = {
                "roots": [oneTask], 
                "option": option
            };
        }
        oneTask.option = this.mergeOption(oneTask.option, option);

        for(let oneRoot of oneTask.roots) {
            if(option.inputRoot && !path.isAbsolute(oneRoot)) {
                oneRoot = path.join(option.inputRoot, oneRoot);
            }
            let rootStat = fs.statSync(oneRoot);
            if(rootStat.isFile()) {
                this.searchZhInFile(oneRoot, oneTask.option);
            } else {
                this.searchZhInDir(oneRoot, oneTask.option);
            }
        }
    }

    private mergeOption(local: LocalizeOption, global: LocalizeOption) {
        if(!local) local = {};
        if(global) {
            for(let globalKey in global) {
                if(!local[globalKey]) {
                    local[globalKey] = global[globalKey];
                }
            }
        }
        return local;
    }

    searchZhInDir(dirPath: string, option?: GlobalOption) {
        if(path.basename(dirPath).charAt(0) == '.') {
            this.addLog('SKIP', dirPath);
            return;
        }
        
        if(option?.excludes?.dirs) {
            for(let i = 0, len = option.excludes.dirs.length; i < len; i++) {
                if(dirPath.search(option.excludes.dirs[i]) >= 0) {
                    this.addLog('SKIP', dirPath);
                    return;
                }
            }
        }
        let dirIncluded = true;
        if(option?.includes?.dirs) {
            let isIncluded = false;
            for(let i = 0, len = option.includes.dirs.length; i < len; i++) {
                if(dirPath.search(option.includes.dirs[i]) >= 0) {
                    isIncluded = true;
                    break;
                }
            }
            if(!isIncluded) {
                dirIncluded = false;
            }
        }

        let files = fs.readdirSync(dirPath);
        let r = false;
        for(let i = 0, len = files.length; i < len; i++) {
            let filename = files[i];
            let filePath = path.join(dirPath, filename);
            let fileStat = fs.statSync(filePath);
            if(fileStat.isFile()) {
                if(dirIncluded) {
                    this.searchZhInFile(filePath, option);
                } else {
                    if(!r) {
                        this.addLog('SKIP', dirPath);
                        r = true;
                    }
                }
            } else {
                this.searchZhInDir(filePath, option);
            }
        }
    }

    searchZhInFile(filePath: string, option?: GlobalOption) {
        let fileExt = path.extname(filePath).toLowerCase();
        if(option?.excludes?.exts && option.excludes.exts.indexOf(fileExt) >= 0) {
            this.addLog('SKIP', filePath);
            return;
        }
        if(option?.includes?.exts && option.includes.exts.indexOf(fileExt) < 0) {
            this.addLog('SKIP', filePath);
            return;
        }
        if(option?.excludes?.files) {
            for(let i = 0, len = option.excludes.files.length; i < len; i++) {
                if(filePath.search(option.excludes.files[i]) >= 0) {
                    this.addLog('SKIP', filePath);
                    return;
                }
            }
        }
        if(option?.includes?.files) {
            let isIncluded = false;
            for(let i = 0, len = option.includes.files.length; i < len; i++) {
                if(filePath.search(option.includes.files[i]) >= 0) {
                    isIncluded = true;
                    break;
                }
            }
            if(!isIncluded) {
                this.addLog('SKIP', filePath);
                return;
            }
        }

        this.crtFile = filePath;
        if(!option.silent) {
            console.log('\x1B[1A\x1B[Kprocessing: %s', filePath);
        }

        let fileContent = fs.readFileSync(filePath, 'utf-8');
        let newContent: string;
        if('.prefab' == fileExt) {
            newContent = this.processZnInPrefab(fileContent, option);
        } else if('.xml' == fileExt) {
            newContent = this.processZnInXml(fileContent, option);
        } else if('.json' == fileExt) {
            newContent = this.processZnInJSON(fileContent, option);
        } else {
            newContent = this.processZnInCodeFile(fileContent, option);
        }

        if(this.mode == LocalizeMode.Replace) {
            if(newContent) {
                this.addLog('REPLACE', filePath);
                fs.writeFileSync(filePath, newContent, 'utf-8');
                this.modifiedFileCnt++;
            } else {
                this.addLog('NOREPLACE', filePath);
            }
        }
    }

    private processZnInXml(fileContent: string, option?: GlobalOption): string {
        let modified = false;
        let newContent = '';
        let lines = fileContent.split(/[\r\n]+/);
        for(let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            let zh = '';
            let ret = oneLine.match(this.XmlZhPattern);
			if(ret)
			{
                let rawContent = ret[2];
                if(!rawContent.startsWith('0') && this.containsZh(rawContent)) {
                    zh = rawContent;
                }                
            }
            if(this.mode == LocalizeMode.Search) {
                if(zh) {
                    this.insertString(zh);
                }
            } else {
                let local: string;
                if(zh) {
                    local = this.getLocal(zh);
                }
                if(local) {
                    modified = true;
                    newContent += oneLine.substr(0, ret.index) + '<' + ret[0] + '>' + local + '<' + ret[0] + '/>' + '\n';
                } else {
                    newContent += oneLine + '\n';
                }
            }
        }
        return modified ? newContent : null;
    }

    private processZnInCodeFile(fileContent: string, option?: GlobalOption): string {
        let modified = false;
        let newContent = '';
        // 去掉跨行注释
        fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, '');
        let lines = fileContent.split(/[\r\n]+/);
        for(let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            // 过滤掉注释行
            let skip = oneLine.match(/^\s*\/\*/) != null;
            // 过滤掉log语句
            if(!skip && option?.skipPatterns) {
                for(let j = 0, jlen = option.skipPatterns.length; j < jlen; j++) {
                    if(oneLine.match(option.skipPatterns[j])) {
                        skip = true;
                        break;
                    }
                }
            }
            if(!skip) {
                let ret = oneLine.match(this.CodeZhPattern);
                while(ret)
                {
                    let zh = '';
                    let rawContent = ret[2];
                    if(this.containsZh(rawContent)) {
                        zh = rawContent;
                    }
                    if(this.mode == LocalizeMode.Search) {
                        if(zh) {
                            this.insertString(zh);
                        }
                    } else {
                        let local: string;
                        if(zh) {
                            local = this.getLocal(zh);
                        }
                        if(local) {
                            modified = true;
                            newContent += oneLine.substr(0, ret.index) + ret[1] + local + ret[1];
                        } else {
                            newContent += oneLine.substr(0, ret.index + ret[0].length);
                        }
                    }
                    oneLine = oneLine.substr(ret.index + ret[0].length);
                    ret = oneLine.match(this.CodeZhPattern);
                }
                newContent += oneLine + '\n';
            } else {
                newContent += oneLine + '\n';
            }
        }
        return modified ? newContent : null;
    }

    private processZnInJSON(fileContent: string, option?: GlobalOption): string {
        let modified = false;
        let newContent = '';
        let ret = fileContent.match(this.CodeZhPattern);
        while(ret)
        {
            let zh = '';
            let rawContent = ret[2];
            if(this.containsZh(rawContent)) {
                zh = rawContent;
            }
            if(this.mode == LocalizeMode.Search) {
                if(zh) {
                    this.insertString(zh);
                }
            } else {
                let local: string;
                if(zh) {
                    local = this.getLocal(zh);
                }
                if(local) {
                    modified = true;
                    newContent += fileContent.substr(0, ret.index) + ret[1] + local + ret[1];
                } else {
                    newContent += fileContent.substr(0, ret.index + ret[0].length);
                }
            }
            fileContent = fileContent.substr(ret.index + ret[0].length);
            ret = fileContent.match(this.CodeZhPattern);
        }
        newContent += fileContent;
        return modified ? newContent : null;
    }

    private processZnInPrefab(fileContent: string, option?: GlobalOption): string {
        let modified = false;
        let newContent = '';
        let lines = fileContent.split(/[\r\n]+/);
        for(let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            let zh = '';
            let ret = oneLine.match(this.PrefabZhPattern);
			if(ret)
			{
                let rawContent = this.unicode2utf8(ret[2]);
                if(this.containsZh(rawContent)) {
                    zh = rawContent;
                }
			}
            if(this.mode == LocalizeMode.Search) {
                if(zh) {
                    this.insertString(zh);
                }
            } else {
                let local: string;
                if(zh) {
                    local = this.getLocal(zh);
                }
                if(local) {
                    modified = true;
                    newContent += oneLine.substr(0, ret.index) + 'm_Text: ' + ret[1] + this.utf82unicode(local) + ret[1] + '\n';
                } else {
                    newContent += oneLine + '\n';
                }
            }
        }
        return modified ? newContent : null;
    }

    private containsZh(str: string) {
        if(str.search(this.HanPattern) >= 0) {
            return true;
        }
        return false;
    }

    private insertString(cn: string)
    {
        this.totalCnt++;
        cn = this.formatString(cn);
        // if(cn.indexOf('{0}绑定钻石') >= 0) throw new Error('!');
        let id = this.getStringMd5(cn);
        if (this.strMap[id]) return;
        let node: LanguageRow = {ID: id, CN: cn, LOCAL: ''};
        this.strMap[id] = node;
        this.fromMap[id] = this.crtFile;
        this.newMap[id] = true;
        this.sheetRows.push(node);
        this.newCnt++;
    }

    private getLocal(cn: string): string
    {
        cn = this.formatString(cn);
        let id = this.getStringMd5(cn);
        let node = this.strMap[id];
        if (!node || !node.LOCAL)
        {
            this.noLocalCnt++;
            this.addLog('NOLOCAL', cn);
            return null;
        }
        return node.LOCAL;
    }

    private formatString(s: string): string
    {
        return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\\n');
    }

    private getStringMd5(s: string): string {
        return md5(s).replace(/-/g, '').toLowerCase();
    }

    private unicode2utf8(ustr): string {
        return ustr.replace(/&#x([\da-f]{1,4});|\\u([\da-f]{1,4})|&#(\d+);|\\([\da-f]{1,4})/gi, function (t, e, n, o, r) { if (o) return String.fromCodePoint(o); var c = e || n || r; return /^\d+$/.test(c) && (c = parseInt(c, 10), !isNaN(c) && c < 256) ? unescape("%" + c) : unescape("%u" + c) })
    }

    private utf82unicode(ustr): string {
        return ustr.replace(/[^\u0000-\u00FF]/g, function (t) { return escape(t).replace(/^%/, "\\") });
    }

    private addLog(tag: 'SEARCH' | 'SKIP' | 'REPLACE' | 'NOREPLACE' | 'NOLOCAL', text: string) {
        this.logContent += '[' + tag + ']' + text + '\n';
    }
}