import { GlobalOption } from './LocalizeOption.js';
export declare type TLangs = 'CN' | 'TW' | 'EN' | 'INA' | 'Arabic' | 'Japanese' | 'Korean' | 'Thai' | 'Russian' | 'Spanish' | 'Arabic' | 'French' | 'German' | 'Italian' | 'Portuguese';
export declare class Translator {
    private static output;
    private static logFile;
    private static readonly cacheBook;
    static setup(output: string): Promise<void>;
    static translateTo(raw: string, targetLang: TLangs, option: GlobalOption): Promise<string | null>;
    private static recoverProtecteds;
    private static protectHtmlFormats;
}
