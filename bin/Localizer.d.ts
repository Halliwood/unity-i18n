import { GlobalOption, LocalizeTask } from './LocalizeOption.js';
export declare class Localizer {
    private readonly IgnorePattern;
    private readonly IgnoreBeginPattern;
    private readonly IgnoreEndPattern;
    private readonly HanPattern;
    private readonly CodeZhPattern;
    private readonly XmlZhPattern;
    private readonly PrefabZhPattern;
    private readonly TagID;
    private readonly TagCN;
    private readonly OutXlsx;
    private readonly OutTxt;
    private readonly OutNewTxt;
    private readonly OutSrcTxt;
    private readonly BlacklistTxt;
    private readonly SettingJson;
    /**存储search捕获的文字 */
    private sheetRows;
    /**存储search捕获的文字表 */
    private capturedMap;
    /**存储所有文字表（包括本次捕获的和历史上捕获的） */
    private strMap;
    private groupMap;
    private fromMap;
    private newMap;
    private crtTask;
    private crtTaskErrors;
    private crtFile;
    private totalCnt;
    private modifiedFileCnt;
    private noLocals;
    private jsonSafeErrors;
    private logContent;
    private mode;
    private md5Cache;
    private md52rawStr;
    private outputJSONMap;
    private setting?;
    private colInfoMap;
    searchZhInFiles(tasks: string | LocalizeTask[], option?: GlobalOption): Promise<void>;
    replaceZhInFiles(tasks: string | LocalizeTask[], option?: GlobalOption): Promise<void>;
    private processTasks;
    private sortRows;
    private readXlsx;
    private smartDerive;
    private writeXlsx;
    private getTranslateState;
    private runTask;
    private mergeOption;
    searchZhInDir(dirPath: string, option?: GlobalOption): void;
    searchZhInFile(filePath: string, option?: GlobalOption): void;
    private processZnInXml;
    private processZnInCodeFile;
    private makeCommentReplacer;
    private processZnInJSON;
    private processZnInPrefab;
    private containsZh;
    private markTaskUsed;
    private checkJsonSafe;
    private insertString;
    private getLocal;
    private formatString;
    private safeprintf;
    private getStringMd5;
    private unicode2utf8;
    private utf82unicode;
    private normalizePath;
    private ensureString;
    private validate;
    private correct;
    private processQuote;
    private processQuoteInJson;
    private ensureRegExp;
    private getIndividualXlsx;
    private addLog;
    private assert;
}
