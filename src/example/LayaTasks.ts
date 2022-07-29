import { LocalizeTask } from "../LocalizeOption";

const jsonTask: LocalizeTask = {
    "roots": ['bin/view'], 
    "option": {
        "includes": {
            "exts": ['.json']
        }
    }
};
const asTask: LocalizeTask = {
    "roots": ['src'], 
    "option": {
        "excludes": {
            "dirs": ['automatic/cfgs', 'automatic/protocol'], 
            "files": ['TestView.ts', 'Macros.ts', 'ErrorId.ts']
        }, 
        "includes": {
            "exts": ['.ts']
        }, 
        "skipPatterns": ["^\\s*console\\.log", "^\\s*FyGame\\.log", "^\\s*console\\.assert\(", "^\\s*FyGame\\.assert\\("]
    }
};
const clientCfgTask = {
    "roots": ['$workspace/clientcfg'], 
    "option": {
        "includes": {
            "exts": ['.xml']
        }, 
        "excludes" : {
            "files": ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
        }
    }
};
const svrScriptTask = {
    "roots": ['$workspace/serverscript'], 
    "option": {
        "includes": {
            "exts": ['.cxx', '.atm']
        }, 
        "skipPatterns": ["^\\s*ATM_DebugSystemMessage\\("]
    }
};
const svrCfgTask = {
    "roots": ['$workspace/servercfg'], 
    "option": {
        "includes": {
            "exts": ['.xml']
        }, 
        "excludes" : {
            "files": ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
        }
    }
};

const searchTasks: LocalizeTask[] = [jsonTask, asTask, clientCfgTask, svrScriptTask, svrCfgTask];
const replaceTasks: LocalizeTask[] = [jsonTask, asTask];
const xml2binReplaceTasks: LocalizeTask[] = [clientCfgTask];
const replacer = {'$workspace': '..'};
const LayaTasks = {searchTasks, replaceTasks, xml2binReplaceTasks, replacer};
export default LayaTasks;