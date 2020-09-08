import program = require('commander');
import * as fs from 'fs';
import { GlobalOption, LocalizeTask } from "./LocalizeOption";
import { Localizer } from "./Localizer";
import { exit } from 'process';

const myPackage = require('../package.json');

const getPath = (val: string): string => {
    let rst = val.match(/(['"])(.+)\1/);
    if(rst) return rst[2];

    return val;
}

// for exmaple
// unity-i18n -s 'G:\\dldlweb_kr\\trunk\\project\\'
// unity-i18n -o {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'}
program
	.version(myPackage.version, "-v, --version")
	.option("-s, --src <path>", "[MUST] Input files path. Both direction or single file.", getPath)
	.option("-o, --output <path>", "[MUST] Outout path. Both direction or single file.", getPath)
	.option("-t, --tasks <json object/.json path/.js path>", "Task json file.", getPath)
	.option("-S, --search", "Search mode.")
	.option("-R, --replace", "Replace mode.")
    .parse(process.argv);

if(!(<any>program).src && !(<any>program).tasks) {
    console.warn("The --src option is MUST.");
    program.help();
}
if(!(<any>program).output && !(<any>program).tasks) {
    console.warn("The --output option is MUST.");
    program.help();
}

let localizer = new Localizer();
if((<any>program).tasks) {
    let tasksObj: LocalizeTask[] = null;
    if(typeof((<any>program).tasks) == 'object') {
        // json
        tasksObj = (<any>program).tasks as LocalizeTask[];
    } else if(typeof((<any>program).tasks) == 'string') {
        // json file
        let tasksFile = (<any>program).tasks as string;
        if(!fs.existsSync(tasksFile)) {
            console.error('Cannot find tasks file: %s', tasksFile);
            exit(1);
        }
        let tasksContent = fs.readFileSync(tasksFile, 'utf-8');
        tasksObj = JSON.parse(tasksContent) as LocalizeTask[];
    }
    if(tasksObj) {
        if((<any>program).search) {
            localizer.searchZhInFiles(tasksObj, {"inputRoot": (<any>program).src, "outputRoot": (<any>program).output});
        }
        
    }
}

// let exampleOption: GlobalOption = {
//     "excludes": {
//         "dirs": ['Editor\\\\', 'uts\\\\Wraps', 'protocol\\\\new', 'uts\\\\StaticWrap\\\\\Wraps']
//     }, 
//     "includes": {
//         "dirs": ['Assets\\\\AssetSources\\\\ui', 'Assets\\\\AssetSources\\\\data', 'servercfg', 'serverscript', 'TsScripts', 'Assets\\\\Scripts'], 
//         "files": [/\.ts$/, /\.cs$/, /\.json$/, /\.cxx$/, /\.prefab$/, /\.xml$/]
//     }, 
//     "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/], 
//     "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'
// };

// let prefabTask: LocalizeTask = {
//     "roots": ['Assets\\AssetSources\\ui\\delaySystem', 'Assets\\AssetSources\\ui\\subitem', 'Assets\\AssetSources\\ui\\system'], 
//     "option": {
//         "includes": {
//             "exts": ['.prefab']
//         }
//     }
// };
// let jsonTask: LocalizeTask = {
//     "roots": ['Assets\\AssetSources\\data'], 
//     "option": {
//         "includes": {
//             "exts": ['.json']
//         }
//     }
// };
// let tsTask: LocalizeTask = {
//     "roots": ['TsScripts'], 
//     "option": {
//         "excludes": {
//             "dirs": ['protocol\\\\new'], 
//             "files": ['TestView.ts', 'Macros.ts', 'ErrorId.ts', 'SendMsgUtil.ts', 'GameConfig.d.ts']
//         }, 
//         "includes": {
//             "exts": ['.ts']
//         }, 
//         "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/]
//     }
// };
// let csTask: LocalizeTask = {
//     "roots": ['Assets\\Scripts'], 
//     "option": {
//         "excludes": {
//             "dirs": ['uts\\\\StaticWrap\\\\\Wraps', '\\\\Editor\\\\']
//         }, 
//         "includes": {
//             "exts": ['.cs']
//         }, 
//         "skipPatterns": [/^\s*Debug\.Log/], 
//     }
// };
// let svrScriptTask = {
//     "roots": ['serverscript'], 
//     "option": {
//         "includes": {
//             "exts": ['.cxx', '.atm']
//         }, 
//         "skipPatterns": [/^\s*ATM_DebugSystemMessage\(/]
//     }
// };
// let svrCfgTask = {
//     "roots": ['servercfg'], 
//     "option": {
//         "includes": {
//             "exts": ['.xml']
//         }, 
//         "excludes" : {
//             "files": ['WorldName.x--ml', 'RobotNameConfig.xml', 'NewbieTutorial.config.xml']
//         }
//     }
// };

// let searchTasks: LocalizeTask[] = [prefabTask, jsonTask, tsTask, csTask, svrScriptTask, svrCfgTask];
// let replaceTasks: LocalizeTask[] = [prefabTask, jsonTask, tsTask, csTask];

// let localizer = new Localizer();
// // localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);
// // localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\'});
// localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});
// localizer.replaceZhInFiles(replaceTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});