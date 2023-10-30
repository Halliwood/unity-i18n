import { LocalizeTask } from "../LocalizeOption.js";
import makeTasks from "./UnityTaskBase.js";

const utb = makeTasks();

const searchTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask, utb.svrScriptTask, utb.svrCfgTask];
const replaceTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask];
const replacer = utb.replacer;
const UnityHardTasks = {searchTasks, replaceTasks, replacer};
export default UnityHardTasks;