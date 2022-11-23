"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UnityTaskBase_1 = __importDefault(require("./UnityTaskBase"));
const searchTasks = [UnityTaskBase_1.default.prefabTask, UnityTaskBase_1.default.jsonTask, UnityTaskBase_1.default.tsTask, UnityTaskBase_1.default.csTask, UnityTaskBase_1.default.svrScriptTask, UnityTaskBase_1.default.svrCfgTask];
const replaceTasks = [UnityTaskBase_1.default.prefabTask, UnityTaskBase_1.default.jsonTask, UnityTaskBase_1.default.tsTask, UnityTaskBase_1.default.csTask];
const replacer = UnityTaskBase_1.default.replacer;
const UnityHardTasks = { searchTasks, replaceTasks, replacer };
exports.default = UnityHardTasks;
//# sourceMappingURL=UnityHardTasks.js.map