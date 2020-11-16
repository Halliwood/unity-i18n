import { LocalizeTask } from "../LocalizeOption";

let prefabTask: LocalizeTask = {
    "roots": ['Assets/AssetSources/ui'], 
    "option": {
        "includes": {
            "exts": ['.prefab']
        }
    }
};
let jsonTask: LocalizeTask = {
    "roots": ['Assets/AssetSources/data'], 
    "option": {
        "includes": {
            "exts": ['.json']
        }
    }
};
let tsTask: LocalizeTask = {
    "roots": ['TsScripts'], 
    "option": {
        "excludes": {
            "dirs": ['protocol/new'], 
            "files": ['TestView.ts', 'Macros.ts', 'ErrorId.ts', 'SendMsgUtil.ts', 'GameConfig.d.ts']
        }, 
        "includes": {
            "exts": ['.ts']
        }, 
        "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/]
    }
};
let csTask: LocalizeTask = {
    "roots": ['Assets/Scripts', 'Assets/Editor/XCodeBuilder'], 
    "option": {
        "excludes": {
            "dirs": ['uts/StaticWrap/Wraps']
        }, 
        "includes": {
            "exts": ['.cs']
        }, 
        "skipPatterns": [/^\s*Debug\.Log/], 
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

let searchTasks: LocalizeTask[] = [prefabTask, jsonTask, tsTask, csTask, svrScriptTask, svrCfgTask];
let replaceTasks: LocalizeTask[] = [prefabTask, jsonTask, tsTask, csTask];
let DefaultTasks = {searchTasks: searchTasks, replaceTasks: replaceTasks};
export = DefaultTasks;