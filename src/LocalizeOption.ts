export interface GlobalOption extends LocalizeOption {
    inputRoot?: string;
    outputRoot?: string;
    langs: string[];
    replacer?: {[key: string]: string};
    softReplace?: boolean;
    needLog?: boolean;
    silent?: boolean;
    xlsxStyle?: 'prepend' | 'append' | 'sort-by-id';
}

export interface TaskWithOption {
    /**任务执行路径，需采用linux风格，即以“/”为分隔符。绝对路径或相对路径均可 */
    roots: string[];
    option?: LocalizeOption;
}

export interface LocalizeOption {
    includes?: {
        exts?: string[], 
        dirs?: (string|RegExp)[],
        files?: (string|RegExp)[]
    };
    excludes?: {
        exts?: string[], 
        dirs?: (string|RegExp)[], 
        files?: (string|RegExp)[]
    };
    skipPatterns?: (string|RegExp)[];
    /**
     * 用于替换中文串后生成新文件，而不覆盖源文件。
     */
    replaceOutput?: string;
    /**
     * 用于同一个apk支持多个语言包的情况，相对应的是hard replace。
     * hard replace直接将资料中的中文字符串替换成指定的语言，soft replace则替换为指定的代码语句。
     */
    softReplacer?: string;
    /**
     * 用于将相关文字输出到语言包JSON文件中。
     */
    outputJSON?: string;
}

export type LocalizeTask = string | TaskWithOption;

export enum LocalizeMode {
    Search, 
    Replace
}