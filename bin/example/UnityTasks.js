"use strict";
var prefabTask = {
    "roots": ['Assets/AssetSources/ui', 'Assets/Arts/sequenceAnim'],
    "option": {
        "includes": {
            "exts": ['.prefab']
        },
        "outputJSON": "Assets/AssetSources/i18n/$LANG.json"
    }
};
var jsonTask = {
    "roots": ['Assets/AssetSources/data'],
    "option": {
        "includes": {
            "exts": ['.json']
        },
        "softReplacer": "$LOCAL",
        "replaceOutput": "Assets/AssetSources/data$LANG/$FILENAME.json"
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
        "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/],
        "softReplacer": "I18N.I18NMgr.Get($RAWSTRING)",
        "outputJSON": "Assets/AssetSources/i18n/$LANG.json"
    }
};
var csTask = {
    "roots": ['Assets/Scripts', 'Assets/Editor/XCodeBuilder'],
    "option": {
        "excludes": {
            "dirs": ['uts/StaticWrap/Wraps', 'i18n']
        },
        "includes": {
            "exts": ['.cs']
        },
        "skipPatterns": [/^\s*Debug\.Log/],
        "softReplacer": "I18N.I18NMgr.Get($RAWSTRING)",
        "outputJSON": "Assets/AssetSources/i18n/$LANG.json"
    }
};
var svrScriptTask = {
    "roots": ['$workspace/serverscript'],
    "option": {
        "includes": {
            "exts": ['.cxx', '.atm']
        },
        "skipPatterns": [/^\s*ATM_DebugSystemMessage\(/]
    }
};
var svrCfgTask = {
    "roots": ['$workspace/servercfg'],
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
var replacer = { '$workspace': '..' };
var UnityTasks = { searchTasks: searchTasks, replaceTasks: replaceTasks, replacer: replacer };
module.exports = UnityTasks;
