"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var exampleOption = {
    "excludes": {
        "dirs": ['Editor\\\\', 'uts\\\\Wraps', 'protocol\\\\new', 'uts\\\\StaticWrap\\\\\Wraps']
    },
    "includes": {
        "dirs": ['Assets\\\\AssetSources\\\\ui', 'Assets\\\\AssetSources\\\\data', 'servercfg', 'serverscript', 'TsScripts', 'Assets\\\\Scripts'],
        "files": [/\.ts$/, /\.cs$/, /\.json$/, /\.cxx$/, /\.prefab$/, /\.xml$/]
    },
    "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/],
    "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'
};
var prefabTask = {
    "roots": ['Assets\\AssetSources\\ui\\delaySystem', 'Assets\\AssetSources\\ui\\subitem', 'Assets\\AssetSources\\ui\\system'],
    "option": {
        "includes": {
            "exts": ['.prefab']
        }
    }
};
var jsonTask = {
    "roots": ['Assets\\AssetSources\\data'],
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
            "dirs": ['protocol\\\\new'],
            "files": ['TestView.ts', 'Macros.ts', 'ErrorId.ts', 'SendMsgUtil.ts', 'GameConfig.d.ts']
        },
        "includes": {
            "exts": ['.ts']
        },
        "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/]
    }
};
var csTask = {
    "roots": ['Assets\\Scripts'],
    "option": {
        "excludes": {
            "dirs": ['uts\\\\StaticWrap\\\\\Wraps', '\\\\Editor\\\\']
        },
        "includes": {
            "exts": ['.cs']
        },
        "skipPatterns": [/^\s*Debug\.Log/],
    }
};
var svrScriptTask = {
    "roots": ['serverscript'],
    "option": {
        "includes": {
            "exts": ['.cxx', '.atm']
        },
        "skipPatterns": [/^\s*ATM_DebugSystemMessage\(/]
    }
};
var svrCfgTask = {
    "roots": ['servercfg'],
    "option": {
        "includes": {
            "exts": ['.xml']
        },
        "excludes": {
            "files": ['WorldName.x--ml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
        }
    }
};
var searchTasks = [prefabTask, jsonTask, tsTask, csTask, svrScriptTask, svrCfgTask];
var replaceTasks = [prefabTask, jsonTask, tsTask, csTask];
exports.default = { searchTasks: searchTasks, replaceTasks: replaceTasks };
