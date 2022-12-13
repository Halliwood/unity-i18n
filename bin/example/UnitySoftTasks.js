"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UnityTaskBase_1 = __importDefault(require("./UnityTaskBase"));
const utb = (0, UnityTaskBase_1.default)();
utb.prefabTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];
utb.jsonTask.option.replaceOutput = "Assets/AssetSources/data$LANG/$FILENAME.json";
utb.jsonTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];
utb.tsTask.option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
utb.tsTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];
utb.csTask.option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
utb.csTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json", "Assets/Resources/native$LANG.json"];
utb.svrCfgTask.option.outputJSONs = ["Assets/AssetSources/i18n/$LANG.json"];
let searchTasks = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask, utb.svrScriptTask, utb.svrCfgTask];
let replaceTasks = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask, utb.svrCfgTask];
const replacer = utb.replacer;
let UnitySoftTasks = { searchTasks, replaceTasks, replacer };
exports.default = UnitySoftTasks;
//# sourceMappingURL=UnitySoftTasks.js.map