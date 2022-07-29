"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var UnityTaskBase_1 = __importDefault(require("./UnityTaskBase"));
var searchTasks = [UnityTaskBase_1.default.prefabTask, UnityTaskBase_1.default.jsonTask, UnityTaskBase_1.default.tsTask, UnityTaskBase_1.default.csTask, UnityTaskBase_1.default.svrScriptTask, UnityTaskBase_1.default.svrCfgTask];
var replaceTasks = [UnityTaskBase_1.default.prefabTask, UnityTaskBase_1.default.jsonTask, UnityTaskBase_1.default.tsTask, UnityTaskBase_1.default.csTask];
var replacer = UnityTaskBase_1.default.replacer;
var UnityHardTasks = { searchTasks: searchTasks, replaceTasks: replaceTasks, replacer: replacer };
exports.default = UnityHardTasks;
