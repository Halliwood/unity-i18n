"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Localizer_1 = require("./Localizer");
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
var tasks = [
    {
        "roots": ['Assets\\AssetSources\\ui\\delaySystem', 'Assets\\AssetSources\\ui\\subitem', 'Assets\\AssetSources\\ui\\system'],
        "option": {
            "includes": {
                "exts": ['.prefab']
            }
        }
    },
    {
        "roots": ['Assets\\AssetSources\\data'],
        "option": {
            "includes": {
                "exts": ['.json']
            }
        }
    },
    {
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
    },
    {
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
    },
    {
        "roots": ['serverscript'],
        "option": {
            "includes": {
                "exts": ['.cxx', '.atm']
            },
            "skipPatterns": [/^\s*ATM_DebugSystemMessage\(/]
        }
    },
    {
        "roots": ['servercfg'],
        "option": {
            "includes": {
                "exts": ['.xml']
            },
            "excludes": {
                "files": ['WorldName.xml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
            }
        }
    }
];
var localizer = new Localizer_1.Localizer();
// localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);
localizer.searchZhInFiles(tasks, { "inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\' });
// localizer.searchZhInFiles(tasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});
