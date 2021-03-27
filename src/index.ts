import program = require('commander');
import * as fs from 'fs';
import { LocalizeTask, GlobalOption } from "./LocalizeOption";
import { Localizer } from "./Localizer";
import { exit } from 'process';
import UnityTasks = require("./example/UnityTasks");
import LayaTasks = require("./example/LayaTasks");

const myPackage = require('../package.json');

const rmQuotes = (val: string): string => {
    let rst = val.match(/(['"])(.+)\1/);
    if(rst) return rst[2];

    return val;
}

// for exmaple
// unity-i18n -s 'G:\\dldlweb_kr\\trunk\\project\\'
program
	.version(myPackage.version, "-v, --version")
	.option("-s, --src <path>", "[MUST] Input files path. Both direction or single file.", rmQuotes)
	.option("-o, --output <path>", "[MUST] Outout path. Both direction or single file.", rmQuotes)
	.option("-t, --tasks <json object/.json path/.js path>", "Task json file.", rmQuotes)
	.option("-d, --default <unity|laya|xml2bin>", "Execute default tasks defined for unity/laya project.", rmQuotes)
	.option("-S, --search", "Search mode.")
	.option("-R, --replace", "Replace mode.")
	.option("--silent", "Silent mode.")
	.option("-x, --xlsxstyle <prepend|append|sort-by-id>", "Xlsx sort rule.", 'append')
	.option("-l, --log", "Generate log file.")
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
let globalOption: GlobalOption = {"inputRoot": (<any>program).src, "outputRoot": (<any>program).output};
if((<any>program).silent) {
    globalOption.silent = (<any>program).silent;
}
if((<any>program).log) {
    globalOption.needLog = (<any>program).log;
}
if((<any>program).xlsxstyle) {
    globalOption.xlsxStyle = (<any>program).xlsxstyle;
}

if((<any>program).default) {
    if((<any>program).default == 'unity') {
        if((<any>program).search) {
            localizer.searchZhInFiles(UnityTasks.searchTasks, globalOption);
        }
        if((<any>program).replace) {
            localizer.replaceZhInFiles(UnityTasks.replaceTasks, globalOption);
        }
    } else if((<any>program).default == 'laya') {
        if((<any>program).search) {
            localizer.searchZhInFiles(LayaTasks.searchTasks, globalOption);
        }
        if((<any>program).replace) {
            localizer.replaceZhInFiles(LayaTasks.replaceTasks, globalOption);
        }
    } else if((<any>program).default == 'xml2bin') {
        if((<any>program).replace) {
            localizer.replaceZhInFiles(LayaTasks.xml2binReplaceTasks, globalOption);
        }
    } else {
        console.error('Cannot find default tasks for: %s', (<any>program).default);
        exit(1);
    }
} else if((<any>program).tasks) {
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
        try {
            if((<any>program).search) {
                localizer.searchZhInFiles(tasksObj, globalOption);
            }
            if((<any>program).replace) {
                localizer.replaceZhInFiles(tasksObj, globalOption);
            } 
        } catch(e) {
            console.log(e);
            process.exit(1);
        }       
    }
}

// let localizer = new Localizer();
// // localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);
// // localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\'});
// localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});
// localizer.replaceZhInFiles(replaceTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});