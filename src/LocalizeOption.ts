export interface LocalizeOption {
    includes?: {
        dirs?: (string|RegExp)[],
        files?: (string|RegExp)[]
    };
    excludes?: {
        dirs?: (string|RegExp)[], 
        files?: (string|RegExp)[]
    };
    skipPatterns?: (string|RegExp)[];
    outputRoot?: string;
}