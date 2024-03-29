import { LocalizeTask, TaskWithOption } from "../LocalizeOption.js";
import makeTasks from "./UnityTaskBase.js";

const utb = makeTasks();

utb.prefabTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];

utb.jsonTask.option.replaceOutput = "Assets/AssetSources/data$LANG/$FILENAME.json";
if (utb.jsonTask.option.excludes != null) {
    console.error('json task option not null, please modify task definition!');
    process.exit(1);
}
utb.jsonTask.option.excludes = {
    files: ['PlayerNameM\\.\\w+\\.json', 'lang\\.json']
};
utb.jsonTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];

utb.tsTask.option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
utb.tsTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];

utb.libTask.option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
utb.libTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];

utb.csTask.option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
utb.csTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json", "Assets/Resources/native$LANG.json"];

utb.svrCfgTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];

// 脚本、后台的字符串处理
// 后台某些功能会用到表格里的字符，如果某字段包含convertOption:lang属性，这些字段会打进lang.json中，也打进语言包
const langTask: TaskWithOption = {
    roots: ['Assets/AssetSources/data'], 
    option: {
        includes: {
            files: ['lang\\.json']
        },
        outputJSONs: ["Assets/AssetSources/i18n/$LANG.json"]
    },
    group: "表格",
    safeprintf: true,
    readonly: true
};

let searchTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.libTask, utb.csTask, utb.svrScriptTask, utb.svrCfgTask, langTask];
let replaceTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.libTask, utb.csTask, utb.svrCfgTask, langTask];
const replacer = utb.replacer;
let UnitySoftTasks = {searchTasks, replaceTasks, replacer};
export default UnitySoftTasks;