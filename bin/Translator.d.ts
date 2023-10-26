export declare type TLangs = 'CN' | 'TW' | 'EN' | 'INA' | 'Arabic' | 'Japanese' | 'Korean' | 'Thai' | 'Russian' | 'Spanish' | 'Arabic' | 'French' | 'German' | 'Italian' | 'Portuguese';
export declare class Translator {
    static setup(env: string): Promise<void>;
    static translateTo(raw: string, targetLang: TLangs): Promise<string>;
    private static recoverProtecteds;
    private static protectHtmlFormats;
    private static protectRichFormats;
    private static protectPlaceholders;
}
