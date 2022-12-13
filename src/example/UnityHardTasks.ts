import { LocalizeTask } from "../LocalizeOption";
import makeTasks from "./UnityTaskBase";

const utb = makeTasks();

const searchTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask, utb.svrScriptTask, utb.svrCfgTask];
const replaceTasks: LocalizeTask[] = [utb.prefabTask, utb.jsonTask, utb.tsTask, utb.csTask];
const replacer = utb.replacer;
const UnityHardTasks = {searchTasks, replaceTasks, replacer};
export default UnityHardTasks;