import { LocalizeTask, TaskWithOption } from "../LocalizeOption";
import utb from "./UnityTaskBase";

(utb.prefabTask as TaskWithOption).option.outputJSON = "Assets/AssetSources/i18n/$LANG.json";

(utb.jsonTask as TaskWithOption).option.softReplacer = "$LOCAL";
(utb.jsonTask as TaskWithOption).option.replaceOutput = "Assets/AssetSources/data$LANG/$FILENAME.json";

(utb.tsTask as TaskWithOption).option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
(utb.tsTask as TaskWithOption).option.outputJSON = "Assets/AssetSources/i18n/$LANG.json";

(utb.csTask as TaskWithOption).option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
(utb.csTask as TaskWithOption).option.outputJSON = "Assets/AssetSources/i18n/$LANG.json";

let searchTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask, utb.svrScriptTask, utb.svrCfgTask];
let replaceTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask];
const replacer = utb.replacer;
let UnitySoftTasks = {searchTasks, replaceTasks, replacer};
export default UnitySoftTasks;