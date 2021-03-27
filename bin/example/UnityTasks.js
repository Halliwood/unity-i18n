"use strict";
var prefabTask = {
    "roots": ['Assets/AssetSources/ui', 'Assets/Arts/sequenceAnim'],
    "option": {
        "includes": {
            "exts": ['.prefab']
        }
    }
};
var jsonTask = {
    "roots": ['Assets/AssetSources/data'],
    "option": {
        "includes": {
            "exts": ['.json']
        }
    }
};
var tsTask = {
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
var csTask = {
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
var svrScriptTask = {
    "roots": ['../serverscript'],
    "option": {
        "includes": {
            "exts": ['.cxx', '.atm']
        },
        "skipPatterns": [/^\s*ATM_DebugSystemMessage\(/]
    }
};
var svrCfgTask = {
    "roots": ['../servercfg'],
    "option": {
        "includes": {
            "exts": ['.xml']
        },
        "excludes": {
            "files": ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
        }
    }
};
var searchTasks = [prefabTask, jsonTask, tsTask, csTask, svrScriptTask, svrCfgTask];
var replaceTasks = [prefabTask, jsonTask, tsTask, csTask];
var UnityTasks = { searchTasks: searchTasks, replaceTasks: replaceTasks };
module.exports = UnityTasks;
