import { GlobalOption, LocalizeTask } from "./LocalizeOption";
import { Localizer } from "./Localizer";

let exampleOption: GlobalOption = {
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

let prefabTask: LocalizeTask = {
    "roots": ['Assets\\AssetSources\\ui\\delaySystem', 'Assets\\AssetSources\\ui\\subitem', 'Assets\\AssetSources\\ui\\system'], 
    "option": {
        "includes": {
            "exts": ['.prefab']
        }
    }
};
let jsonTask: LocalizeTask = {
    "roots": ['Assets\\AssetSources\\data'], 
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
            "dirs": ['protocol\\\\new'], 
            "files": ['TestView.ts', 'Macros.ts', 'ErrorId.ts', 'SendMsgUtil.ts', 'GameConfig.d.ts']
        }, 
        "includes": {
            "exts": ['.ts']
        }, 
        "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/]
    }
};
let csTask: LocalizeTask = {
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
let svrScriptTask = {
    "roots": ['serverscript'], 
    "option": {
        "includes": {
            "exts": ['.cxx', '.atm']
        }, 
        "skipPatterns": [/^\s*ATM_DebugSystemMessage\(/]
    }
};
let svrCfgTask = {
    "roots": ['servercfg'], 
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
let replaceTasks: LocalizeTask[] = [prefabTask, tsTask, csTask];

let localizer = new Localizer();
// localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);
// localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\'});
// localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});
localizer.replaceZhInFiles(replaceTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});