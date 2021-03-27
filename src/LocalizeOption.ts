export interface GlobalOption extends LocalizeOption {
    inputRoot?: string;
    outputRoot?: string;
    replacer?: {[key: string]: string};
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
}

export type LocalizeTask = string | TaskWithOption;

export enum LocalizeMode {
    Search, 
    Replace
}