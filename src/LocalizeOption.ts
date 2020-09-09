export interface GlobalOption extends LocalizeOption {
    inputRoot?: string;
    outputRoot?: string;
    needLog?: boolean;
    silent?: boolean;
    xlsxStyle?: 'prepend' | 'append' | 'sort-by-id';
}

export interface TaskWithOption {
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