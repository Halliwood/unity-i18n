"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var UnityTaskBase_1 = __importDefault(require("./UnityTaskBase"));
UnityTaskBase_1.default.prefabTask.option.outputJSON = "Assets/AssetSources/i18n/$LANG.json";
UnityTaskBase_1.default.jsonTask.option.softReplacer = "$LOCAL";
UnityTaskBase_1.default.jsonTask.option.replaceOutput = "Assets/AssetSources/data$LANG/$FILENAME.json";
UnityTaskBase_1.default.tsTask.option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
UnityTaskBase_1.default.tsTask.option.outputJSON = "Assets/AssetSources/i18n/$LANG.json";
UnityTaskBase_1.default.csTask.option.softReplacer = "I18N.I18NMgr.Translate($RAWSTRING)";
UnityTaskBase_1.default.csTask.option.outputJSON = "Assets/AssetSources/i18n/$LANG.json";
var searchTasks = [UnityTaskBase_1.default.prefabTask, UnityTaskBase_1.default.jsonTask, UnityTaskBase_1.default.tsTask, UnityTaskBase_1.default.csTask, UnityTaskBase_1.default.svrScriptTask, UnityTaskBase_1.default.svrCfgTask];
var replaceTasks = [UnityTaskBase_1.default.prefabTask, UnityTaskBase_1.default.jsonTask, UnityTaskBase_1.default.tsTask, UnityTaskBase_1.default.csTask];
var replacer = UnityTaskBase_1.default.replacer;
var UnitySoftTasks = { searchTasks: searchTasks, replaceTasks: replaceTasks, replacer: replacer };
exports.default = UnitySoftTasks;
