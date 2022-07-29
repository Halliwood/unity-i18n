"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeTasks() {
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
            "skipPatterns": ["^\\s*uts\\.log", "^\\s*uts\\.assert\\("]
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
            "skipPatterns": ["^\\s*Debug\\.Log"]
        }
    };
    var svrScriptTask = {
        "roots": ['$workspace/serverscript'],
        "option": {
            "includes": {
                "exts": ['.cxx', '.atm']
            },
            "skipPatterns": ["^\\s*ATM_DebugSystemMessage\\("]
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
    var replacer = { '$workspace': '..' };
    return { prefabTask: prefabTask, jsonTask: jsonTask, tsTask: tsTask, csTask: csTask, svrScriptTask: svrScriptTask, svrCfgTask: svrCfgTask, replacer: replacer };
}
var UnityTaskBase = makeTasks();
exports.default = UnityTaskBase;
