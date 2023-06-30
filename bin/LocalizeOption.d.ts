export interface GlobalOption extends LocalizeOption {
    inputRoot?: string;
    outputRoot?: string;
    langs: string[];
    replacer?: {
        [key: string]: string;
    };
    softReplace?: boolean;
    needLog?: boolean;
    silent?: boolean;
    xlsxStyle?: 'prepend' | 'append' | 'sort-by-id';
    pretty?: boolean;
    strict?: boolean;
    individual?: boolean;
}
export interface TaskWithOption {
    /**任务执行路径，需采用linux风格，即以“/”为分隔符。绝对路径或相对路径均可 */
    roots: string[];
    option?: LocalizeOption;
    /**文字分类 */
    group?: string;
    /**是否需要对拼接字符串%s进行安全处理 */
    safeprintf?: boolean;
    /**是否只读不修改（即便是replace模式） */
    readonly?: boolean;
    strict?: boolean;
}
export interface LocalizeOption {
    /**指定需要处理的文件 */
    includes?: {
        /**通过文件后缀名进行指定 */
        exts?: string[];
        /**通过目录名进行指定，支持正则表达式 */
        dirs?: (string | RegExp)[];
        /**通过文件路径名进行指定，支持正则表达式 */
        files?: (string | RegExp)[];
    };
    /**指定需要排除的文件，优先级高于includes */
    excludes?: {
        /**通过文件后缀名进行排除 */
        exts?: string[];
        /**通过目录名进行排除，支持正则表达式 */
        dirs?: (string | RegExp)[];
        /**通过文件路径名进行排除，支持正则表达式 */
        files?: (string | RegExp)[];
    };
    /**指定跳过符合指定规则的语句，比如输出日志中的中文，可以指定不处理 */
    skipPatterns?: (string | RegExp)[];
    /**用于替换中文串后生成新文件，而不覆盖源文件。*/
    replaceOutput?: string;
    /**
     * 用于同一个Apk支持多个语言包的情况，相对应的是Hard replace。
     * Hard replace直接将资料中的中文字符串替换成指定的语言，Soft replace则替换为指定的代码语句。
     */
    softReplacer?: string;
    /**用于将相关文字输出到指定的语言包JSON文件中。 */
    outputJSONs?: string[];
}
export type LocalizeTask = string | TaskWithOption;
export declare enum LocalizeMode {
    Search = 0,
    Replace = 1
}
