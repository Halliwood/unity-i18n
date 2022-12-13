"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UnityTaskBase_1 = __importDefault(require("./UnityTaskBase"));
const utb = (0, UnityTaskBase_1.default)();
const searchTasks = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask, utb.svrScriptTask, utb.svrCfgTask];
const replaceTasks = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask];
const replacer = utb.replacer;
const UnityHardTasks = { searchTasks, replaceTasks, replacer };
exports.default = UnityHardTasks;
//# sourceMappingURL=UnityHardTasks.js.map