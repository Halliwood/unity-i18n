import { TaskWithOption } from "../LocalizeOption";

function makeTasks() {
    const prefabTask: TaskWithOption = {
        roots: ['Assets/AssetSources/ui', 'Assets/Arts/sequenceAnim'], 
        option: {
            includes: {
                exts: ['.prefab']
            }
        },
        group: "UI"
    };
    const jsonTask: TaskWithOption = {
        roots: ['Assets/AssetSources/data'], 
        option: {
            includes: {
                exts: ['.json']
            }
        },
        group: "表格"
    };
    const tsTask: TaskWithOption = {
        roots: ['TsScripts'], 
        option: {
            excludes: {
                dirs: ['protocol/new'], 
                files: ['TestView.ts', 'Macros.ts', 'ErrorId.ts', 'SendMsgUtil.ts', 'GameConfig.d.ts', 'RawString.ts']
            }, 
            includes: {
                exts: ['.ts']
            }, 
            skipPatterns: ["^\\s*uts\\.log", "^\\s*uts\\.assert\\(", "^\\s*console\\.log", "^\\s*console\\.assert\\(", "^\\s*(CS\\.)?UnityEngine\\.Debug\\.Log\w*\\("]
        },
        group: "代码",
        strict: true
    };
    const libTask: TaskWithOption = {
        roots: ['libs'], 
        option: {
            includes: {
                exts: ['.js']
            }, 
            skipPatterns: tsTask.option.skipPatterns
        },
        group: "代码"
    };
    const csTask: TaskWithOption = {
        roots: ['Assets/Scripts', 'Assets/Editor/XCodeBuilder'], 
        option: {
            excludes: {
                dirs: ['uts/StaticWrap/Wraps', 'i18n']
            }, 
            includes: {
                exts: ['.cs']
            }, 
            skipPatterns: ["^\\s*Debug\\.Log", "^\\s*UnityEngine\\.Debug\\.Log"]
        },
        group: "代码"
    };
    const svrScriptTask: TaskWithOption = {
        roots: ['$workspace/serverscript'], 
        option: {
            includes: {
                exts: ['.cxx', '.atm']
            }, 
            skipPatterns: ["^\\s*ATM_DebugSystemMessage\\("]
        },
        group: "脚本",
        safeprintf: true,
        readonly: true
    };
    const svrCfgTask: TaskWithOption = {
        roots: ['$workspace/servercfg'], 
        option: {
            includes: {
                exts: ['.xml']
            }, 
            excludes: {
                files: ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
            }
        },
        group: "表格",
        safeprintf: true,
        readonly: true
    };
    
    const replacer = {'$workspace': '..'};
    return { prefabTask, jsonTask, tsTask, libTask, csTask, svrScriptTask, svrCfgTask, replacer };
}

export default makeTasks;
