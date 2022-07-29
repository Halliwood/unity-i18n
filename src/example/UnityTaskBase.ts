import { LocalizeTask } from "../LocalizeOption";

function makeTasks() {
    const prefabTask: LocalizeTask = {
        "roots": ['Assets/AssetSources/ui', 'Assets/Arts/sequenceAnim'], 
        "option": {
            "includes": {
                "exts": ['.prefab']
            }
        }
    };
    const jsonTask: LocalizeTask = {
        "roots": ['Assets/AssetSources/data'], 
        "option": {
            "includes": {
                "exts": ['.json']
            }
        }
    };
    const tsTask: LocalizeTask = {
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
    const csTask: LocalizeTask = {
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
    
    const replacer = {'$workspace': '..'};
    return { prefabTask, jsonTask, tsTask, csTask, svrScriptTask, svrCfgTask, replacer };
}

const UnityTaskBase = makeTasks();
export default UnityTaskBase;
