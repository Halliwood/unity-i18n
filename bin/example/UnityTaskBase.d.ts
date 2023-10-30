import { TaskWithOption } from "../LocalizeOption.js";
declare function makeTasks(): {
    prefabTask: TaskWithOption;
    jsonTask: TaskWithOption;
    tsTask: TaskWithOption;
    libTask: TaskWithOption;
    csTask: TaskWithOption;
    svrScriptTask: TaskWithOption;
    svrCfgTask: TaskWithOption;
    replacer: {
        $workspace: string;
    };
};
export default makeTasks;
