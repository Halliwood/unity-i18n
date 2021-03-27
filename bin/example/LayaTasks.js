"use strict";
var jsonTask = {
    "roots": ['bin/h5/view'],
    "option": {
        "includes": {
            "exts": ['.json']
        }
    }
};
var asTask = {
    "roots": ['src'],
    "option": {
        "excludes": {
            "dirs": ['automatic/cfgs', 'automatic/protocol'],
            "files": ['TestView.as', 'Macros.as', 'ErrorId.as']
        },
        "includes": {
            "exts": ['.as']
        },
        "skipPatterns": [/^\s*console\.log/, /^\s*FyGame\.log/, /^\s*console\.assert\(/, /^\s*FyGame\.assert\(/]
    }
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
var searchTasks = [jsonTask, asTask, clientCfgTask, svrScriptTask, svrCfgTask];
var replaceTasks = [jsonTask, asTask];
var xml2binReplaceTasks = [clientCfgTask];
var replacer = { '$workspace': '..' };
var LayaTasks = { searchTasks: searchTasks, replaceTasks: replaceTasks, xml2binReplaceTasks: xml2binReplaceTasks, replacer: replacer };
module.exports = LayaTasks;
