import * as fs from 'fs';
import path = require('path');
import md5 = require('md5');
import xlsx = require('xlsx');
import { GlobalOption, LocalizeTask, LocalizeOption } from './LocalizeOption';

interface LanguageRow {
    ID: string;
    CN: string; 
    LOCAL: string;
}

export class Localizer {
    private readonly HanPattern = /[\u4e00-\u9fa5]+/;
    private readonly CodeZhPattern = /(?<!\\)(["|']{1})(.*?)(?<!\\)\1/g;
    private readonly XmlZhPattern = /\s*<([\d|\w|_]+)>(.*)<\/\1>/;
    private readonly PrefabZhPattern = /^\s+m_Text: "(.*)"/;

    private readonly TagID = 'ID=';
    private readonly TagCN = 'CN=';
    private readonly TagLOCAL= 'LOCAL=';
    private readonly OutXlsx = 'language.xlsx';
    private readonly OutTxt = 'languages_mid.txt';

    private sheetRows: LanguageRow[];
    private strMap: {[zh: string]: LanguageRow} = {};

    private newCnt = 0;
    private fileLog = '';
    private skipLogs = [];
    private crtFile: string;

    searchZhInFiles(tasks: string | LocalizeTask[], option?: GlobalOption) {
        let startAt = (new Date()).getTime();

        this.newCnt = 0;

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
        console.log('start....');

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

        let txtContent = '';
        for(let id in this.strMap) {
            let oneRow = this.strMap[id];
            txtContent += this.TagID + oneRow.ID + '\n';
            txtContent += this.TagCN + oneRow.CN + '\n';
            txtContent += this.TagLOCAL + oneRow.LOCAL + '\n\n';
            // txtContent += 'FROM=' + (oneRow as any).FROM + '\n\n';
        }
        fs.writeFileSync(path.join(outputRoot, this.OutTxt), txtContent);
        let newBook = xlsx.utils.book_new();
        let newSheet = xlsx.utils.json_to_sheet(sortedRows);
        if(xlsxSheet) {
            newSheet["!cols"] = xlsxSheet["!cols"];
        } else {
            newSheet["!cols"] = [{wch: 20}, {wch: 110}, {wch: 110}];
        }
        xlsx.utils.book_append_sheet(newBook, newSheet);
        xlsx.writeFile(newBook, path.join(outputRoot, this.OutXlsx));

        fs.writeFileSync('log.txt', this.fileLog + this.skipLogs.join('\n'), 'utf-8');

        let endAt = (new Date()).getTime();
        console.log('[unity-i18n]Done! \x1B[36m%d\x1B[0ms costed. Total: \x1B[36m%d\x1B[0m, new: \x1B[36m%d\x1B[0m.', 
        ((endAt - startAt) / 1000).toFixed(), sortedRows.length, this.newCnt);
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
            this.skipLogs.push('--: ' + dirPath);
            return;
        }
        
        if(option?.excludes?.dirs) {
            for(let i = 0, len = option.excludes.dirs.length; i < len; i++) {
                if(dirPath.search(option.excludes.dirs[i]) >= 0) {
                    this.skipLogs.push('--: ' + dirPath);
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
                        this.skipLogs.push('--: ' + dirPath);
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
            this.skipLogs.push('--: ' + filePath);
            return;
        }
        if(option?.includes?.exts && option.includes.exts.indexOf(fileExt) < 0) {
            this.skipLogs.push('--: ' + filePath);
            return;
        }
        if(option?.excludes?.files) {
            for(let i = 0, len = option.excludes.files.length; i < len; i++) {
                if(filePath.search(option.excludes.files[i]) >= 0) {
                    this.skipLogs.push('--: ' + filePath);
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
                this.skipLogs.push('--: ' + filePath);
                return;
            }
        }

        this.crtFile = filePath;
        console.log('\x1B[1A\x1B[Kprocessing: %s', filePath);
        this.fileLog += '++' + filePath + '\n';

        if('.prefab' == fileExt) {
            this.searchZnInPrefab(filePath, option);
        } else if('.xml' == fileExt) {
            this.searchZnInXml(filePath, option);
        } else if('.json' == fileExt) {
            this.searchZnInJSON(filePath, option);
        } else {
            this.searchZnInCodeFile(filePath, option);
        }
    }

    private searchZnInXml(filePath: string, option?: GlobalOption) {
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        let lines = fileContent.split(/[\r\n]+/);
        for(let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            let ret = oneLine.match(this.XmlZhPattern);
			if(ret)
			{
                let rawContent = ret[2];
                if(!rawContent.startsWith('0') && rawContent.search(this.HanPattern) >= 0) {
                    this.insertString(rawContent);
                }
			}
        }
    }

    private searchZnInCodeFile(filePath: string, option?: GlobalOption) {
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        // 去掉跨行注释
        fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, '');
        let lines = fileContent.split(/[\r|\n]+/);
        for(let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            // 过滤掉注释行
            if(oneLine.match(/^\s*\/\*/) || oneLine.match(/^\s*\/{2}/) || oneLine.match(/^\s*\*+/)) continue;
            // 过滤掉log语句
            if(option?.skipPatterns) {
                let skip = false;
                for(let j = 0, jlen = option.skipPatterns.length; j < jlen; j++) {
                    if(oneLine.match(option.skipPatterns[j])) {
                        skip = true;
                        break;
                    }
                }
                if(skip) continue;
            }
            let ret = oneLine.match(this.CodeZhPattern);
			if(ret)
			{
                for(let j = 0, jlen = ret.length; j < jlen; j++) {
                    let rawContent = ret[j];
                    if(rawContent.search(this.HanPattern) >= 0) {
                        this.insertString(rawContent.substr(1, rawContent.length - 2));
                    }
                }
			}
        }
    }

    private searchZnInJSON(filePath: string, option?: GlobalOption) {
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        let ret = fileContent.match(this.CodeZhPattern);
        if(ret)
        {
            for(let i = 0, len = ret.length; i < len; i++) {
                let rawContent = ret[i];
                if(rawContent.search(this.HanPattern) >= 0) {
                    this.insertString(rawContent.substr(1, rawContent.length - 2));
                }
            }
        }
    }

    private searchZnInPrefab(filePath: string, option?: GlobalOption) {
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        let lines = fileContent.split(/[\r\n]+/);
        for(let i = 0, len = lines.length; i < len; i++) {
            let oneLine = lines[i];
            // 过滤掉注释行
            let ret = oneLine.match(this.PrefabZhPattern);
			if(ret)
			{
                let rawContent = ret[1];
                if(rawContent.search(this.HanPattern) >= 0) {
                    this.insertString(rawContent);
                }
			}
        }
    }

    private insertString(cn: string)
    {
        cn = this.formatString(cn);
        // if(cn.indexOf('{0}绑定钻石') >= 0) throw new Error('!');
        let id = this.getStringMd5(cn);
        if (this.strMap[id]) return;
        let node: LanguageRow = {ID: id, CN: cn, LOCAL: ''};
        this.strMap[id] = node;
        (node as any).FROM = this.crtFile;
        this.sheetRows.push(node);
        this.newCnt++;
    }

    private getLocal(cn: string): string
    {
        let id = this.getStringMd5(this.formatString(cn));
        let node = this.strMap[id];
        if (!node || !node.LOCAL)
        {
            console.warn("not find Local:" + cn);
            return cn;
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
}