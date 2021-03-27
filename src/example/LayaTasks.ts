import { LocalizeTask } from "../LocalizeOption";

let jsonTask: LocalizeTask = {
    "roots": ['bin/h5/view'], 
    "option": {
        "includes": {
            "exts": ['.json']
        }
    }
};
let asTask: LocalizeTask = {
    "roots": ['src'], 
    "option": {
        "excludes": {
            "dirs": ['automatic/cfgs', 'automatic/protocol'], 
            "files": ['TestView.as', 'Macros.as', 'ErrorId.as']
        }, 
        "includes": {
            "exts": ['.as']
        }, 
        "skipPatterns": [/^\s*console\.log/, /^\s*console\.assert\(/]
    }
};
let clientCfgTask = {
    "roots": ['../clientcfg'], 
    "option": {
        "includes": {
            "exts": ['.xml']
        }, 
        "excludes" : {
            "files": ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
        }
    }
};
let svrScriptTask = {
    "roots": ['../serverscript'], 
    "option": {
        "includes": {
            "exts": ['.cxx', '.atm']
        }, 
        "skipPatterns": [/^\s*ATM_DebugSystemMessage\(/]
    }
};
let svrCfgTask = {
    "roots": ['../servercfg'], 
    "option": {
        "includes": {
            "exts": ['.xml']
        }, 
        "excludes" : {
            "files": ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
        }
    }
};

let searchTasks: LocalizeTask[] = [jsonTask, asTask, clientCfgTask, svrScriptTask, svrCfgTask];
let replaceTasks: LocalizeTask[] = [jsonTask, asTask];
let xml2binReplaceTasks: LocalizeTask[] = [clientCfgTask];
let LayaTasks = {searchTasks, replaceTasks, xml2binReplaceTasks};
export = LayaTasks;