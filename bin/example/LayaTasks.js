"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsonTask = {
    "roots": ['bin/view'],
    "option": {
        "includes": {
            "exts": ['.json']
        }
    },
    "group": "UI"
};
var asTask = {
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
    },
    "group": "代码"
};
var clientCfgTask = {
    "roots": ['$workspace/clientcfg'],
    "option": {
        "includes": {
            "exts": ['.xml']
        },
        "excludes": {
            "files": ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
        }
    },
    "group": "表格"
};
var svrScriptTask = {
    "roots": ['$workspace/serverscript'],
    "option": {
        "includes": {
            "exts": ['.cxx', '.atm']
        },
        "skipPatterns": ["^\\s*ATM_DebugSystemMessage\\("]
    },
    "group": "脚本"
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
    },
    "group": "表格"
};
var searchTasks = [jsonTask, asTask, clientCfgTask, svrScriptTask, svrCfgTask];
var replaceTasks = [jsonTask, asTask];
var xml2binReplaceTasks = [clientCfgTask];
var replacer = { '$workspace': '..' };
var LayaTasks = { searchTasks: searchTasks, replaceTasks: replaceTasks, xml2binReplaceTasks: xml2binReplaceTasks, replacer: replacer };
exports.default = LayaTasks;
