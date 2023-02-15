# unity-i18n
unity/laya项目国际化工具。

## 安装

```
npm i unity-i18n -g
```

# 用法

分如下步骤：
* 通过`-S`选项执行搜索命令，搜索工程中的所有中文文本，包括代码、预制体、非二进制配置文件。可以按照文件夹和文件类型等指定搜索哪些文件。搜索完成后将所有中文文本输出到一个Excel表格中。
* 翻译中文文本，并将翻译结果写入上述Excel表格中。
* 通过`-R`选项执行替换命令，处理所有中文文本。可以直接替换为指定语言（Hard模式，硬编码翻译），也可以按照指定格式生成对应的代码语句（Soft模式，运行时翻译）。

以上步骤的细节均可通过选项`-t`提供一个任务描述配置文件进行自定义。同时，本工具分别内置了适用于Unity项目和Laya项目的预设任务，可通过选项`-d unity`或`-d laya`使用。

本工具的各个选项含义如下：

## -v, --version
查看工具版本号。

## -s, --src
\[必须选项\]。需要处理的文件目录，通常是项目根目录。

## -o, --output
\[必须选项\]。提取中文文本的输出目录。执行`-S, --search`命令后，将提取所有中文文本，并输出一个Excel表格`language.xlsx`。表格至少包含3列，包括每个文本的ID、源文本（CN），以及对应的目标语言（默认为LOCAL）。这个表格相当于是翻译字典。

## --langs
多语言代码，用逗号分开。比如`EN,FR`。默认为`LOCAL`。比如指定多语言代码为`EN,FR`，则上述`language.xlsx`将包含4列：ID/CN/EN/FR。

## -t, --tasks
转换任务描述配置文件，JSON格式。需符合以下规则：

```TypeScript
export interface LocalizeOption {
    /**指定需要处理的文件 */
    includes?: {
        /**通过文件后缀名进行指定 */
        exts?: string[], 
        /**通过目录名进行指定，支持正则表达式 */
        dirs?: (string|RegExp)[],
        /**通过文件路径名进行指定，支持正则表达式 */
        files?: (string|RegExp)[]
    };
    /**指定需要排除的文件，优先级高于includes */
    excludes?: {
        /**通过文件后缀名进行排除 */
        exts?: string[], 
        /**通过目录名进行排除，支持正则表达式 */
        dirs?: (string|RegExp)[], 
        /**通过文件路径名进行排除，支持正则表达式 */
        files?: (string|RegExp)[]
    };
    /**指定跳过符合指定规则的语句，比如输出日志中的中文，可以指定不处理 */
    skipPatterns?: (string|RegExp)[];
    /**用于替换中文串后生成新文件，而不覆盖源文件。*/
    replaceOutput?: string;
    /**
     * 用于同一个Apk支持多个语言包的情况，相对应的是Hard replace。
     * Hard replace直接将资料中的中文字符串替换成指定的语言，Soft replace则替换为指定的代码语句。
     */
    softReplacer?: string;
    /**用于将相关文字输出到指定的语言包JSON文件中。 */
    outputJSON?: string;
}
```

配置文件中支持以下通配符：
* `$LANG` - `--langs`选项指定的语言代码，适用于`outputJSON`和`replaceOutput`字段。
* `$FILENAME` - 正在处理的文件名，适用于`replaceOutput`字段。
* `$RAWSTRING` - 原本的中文文本，包括围合的单引号或双引号，适用于`softReplacer`字段。

可参考内置的任务模板：
* [laya_hard.json](bin/builtinTasks/laya_hard.json)
* [unity_hard.json](bin/builtinTasks/unity_hard.json)
* [unity_soft.json](bin/builtinTasks/unity_soft.json)

## -d, --default

指示按照内置的模板进行处理：`laya|laya_hard|unity|unity_hard|unity_soft`。其中`laya`和`laya_hard`相同，`unity`和`unity_hard`相同。

以下是内置的任务模板的相关定义：
* [LayaHardTasks.ts](src/example/LayaHardTasks.ts)
* [UnityHardTasks.ts](src/example/UnityHardTasks.ts)
* [UnitySoftTasks.ts](src/example/UnitySoftTasks.ts)
* [UnityTaskBase.ts](src/example/UnityTaskBase.ts)

## --task-replacer

任务描述配置中可以包含与环境相关的通配符，比如内置模板中包含`$workspace`。可以使用本选项将其替换为适当的值。本选项适用的场景是，多个项目共用一份较为复杂的描述配置，将其中可能有轻微差别之处用通配符进行设置。这样，不需要维护多份描述配置。

## -S, --search

执行搜索命令。

## -R, --replace

执行替换命令。

## --soft-replace

启用Soft模式。Soft模式适用于同一个Apk支持多国语言切换的情况，通过加载对应的语言包实现运行时动态切换。

## --silent

静默模式，不回显进度日志。默认情况下，会输出当前处理文件的信息日志。

## -x, --xlsxstyle

`languages.xlsx`排序规则，支持`prepend|append|sort-by-id`，分别表示“新文本居前”、“新文本居后”和“按id进行排序”。默认为`append`。

## -l, --log

输出日志文件。默认不输出。

## --pretty

以友好可读模式生成语言包json文件。

## --strict

启用严格模式后，发现以下情况将报错：
* 代码中包含拼接字符串
* 存在未翻译的字符串

## --lockfile

启用构建锁。

## -h, --help

查看帮助菜单。

# Hard模式

Hard模式是指直接将代码、非二进制配置文件、预制体内包含中文的文本直接替换成指定的语言文本。这种模式适用于单语言海外版本的制作，平时开发时在代码、表格中直接使用中文，构建版本时使用本工具替换成目标语言。效果如下：

JSON配置文件转换前
```JSON
{
    "m_szName":"在线奖励拿不完"
}
```
JSON配置文件转换后
```JSON
{
    "m_szName":"접속보상 무한증정"
}

```

# Soft模式

Soft模式通常用于代码中和预制体中的中文文本的处理，通过将中文文本`"中国万岁"`转换为类似`I18N.I18NMgr.Translate("中国万岁")`的语句，实现运行时动态切换。

比如内置的`UnityTasks`中关于TypeScript代码的处理配置：

```TypeScript
let tsTask: LocalizeTask = {
    "roots": ['TsScripts'], 
    "option": {
        "excludes": {
            "dirs": ['protocol/new'], 
            "files": ['TestView.ts', 'Macros.ts', 'ErrorId.ts', 'SendMsgUtil.ts', 'GameConfig.d.ts']
        }, 
        "includes": {
            "exts": ['.ts']
        }, 
        "skipPatterns": ["^\\s*uts\\.log", "^\\s*uts\\.assert\\(""], 
        "softReplacer": "I18N.I18NMgr.Translate($RAWSTRING)", 
        "outputJSON": "Assets/AssetSources/i18n/$LANG.json"
    }
};
```
其中`softReplacer`字段的效果如下：

TypeScript文件转换前
```TypeScript
this.dropdown.setOptions(["全  部", "1", "2", "3", "4", "5", "6"], 5)
```
TypeScript文件转换后
```TypeScript
this.dropdown.setOptions([I18N.I18NMgr.Translate("全  部"), "1", "2", "3", "4", "5", "6"], 5)
```

`outputJSON`字段的效果是将本任务（此处为所有TypeScript文件）涉及的所有中文文本及对应的语言版本的语言包以JSON格式分别输出到对应的文件中。比如指定多语言为`TW,EN`，则分别输出到`Assets/AssetSources/i18n/CN.json`、`Assets/AssetSources/i18n/TW.json`和`Assets/AssetSources/i18n/EN.json`。

语言包格式为：

```TypeScript
{
    "strings": ["ID1", "STR1", "ID2", "STR2", ...]
}
```

CN.JSON
```JSON
{"strings":["3d69a6e96ef836615a4d0988950dcaa0"," (已完成)","7f4ae9a211d22e3930c9eee0b37196c2"," (进行中)","fe058bb2bc7d6eeebe567b157b968f8c","(?D天) hh:mm:ss","fe4557e1c0b4e3a09acc147e3e5675ac","(?D天)h时","7835a8a1216f025a65fb8235bd3b7d9f","(?D天)h时m分s秒"]}
```

TW.JSON
```JSON
{"strings":["3d69a6e96ef836615a4d0988950dcaa0"," (已完成)","7f4ae9a211d22e3930c9eee0b37196c2"," (進行中)","fe058bb2bc7d6eeebe567b157b968f8c","(?D天) hh:mm:ss","fe4557e1c0b4e3a09acc147e3e5675ac","(?D天)h時","7835a8a1216f025a65fb8235bd3b7d9f","(?D天)h時m分s秒"]}
```

# @i18n-ignore

在代码中，使用`// @i18n-ignore`可指定下一行不进行翻译。使用`// @i18n-ignore:begin`和`// @i18n-ignore:end`可指定之间的所有行均不参与翻译。

# 使用示例

## 搜索中文文本

使用内置unity任务配置+Soft模式+指定多国语言为简体中文、繁体中午、英文。
```
unity-i18n -s "F:/dp/trunk/" -o "F:/dp/trunk/tools/i18n/dictionary" -d "unity_soft" -S --soft-replace --langs TW,EN
```

## 替换中文文本
```
unity-i18n -s "F:/dp/trunk/" -o "F:/dp/trunk/tools/i18n/dictionary" -d "unity_soft" -R --soft-replace --langs TW,EN
```