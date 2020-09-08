import program = require('commander');
import * as fs from 'fs';
import { LocalizeTask, GlobalOption } from "./LocalizeOption";
import { Localizer } from "./Localizer";
import { exit } from 'process';
import DefaultTasks = require("./example/ExampleTasks");

const myPackage = require('../package.json');

const getPath = (val: string): string => {
    let rst = val.match(/(['"])(.+)\1/);
    if(rst) return rst[2];

    return val;
}

// for exmaple
// unity-i18n -s 'G:\\dldlweb_kr\\trunk\\project\\'
program
	.version(myPackage.version, "-v, --version")
	.option("-s, --src <path>", "[MUST] Input files path. Both direction or single file.", getPath)
	.option("-o, --output <path>", "[MUST] Outout path. Both direction or single file.", getPath)
	.option("-t, --tasks <json object/.json path/.js path>", "Task json file.", getPath)
	.option("-d, --default", "Execute default tasks defined in the ExampleTasks.ts.")
	.option("-S, --search", "Search mode.")
	.option("-R, --replace", "Replace mode.")
	.option("--silent", "Silent mode.")
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

if((<any>program).default) {
    if((<any>program).search) {
        localizer.searchZhInFiles(DefaultTasks.searchTasks, globalOption);
    }
    if((<any>program).replace) {
        localizer.replaceZhInFiles(DefaultTasks.replaceTasks, globalOption);
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
        if((<any>program).search) {
            localizer.searchZhInFiles(tasksObj, globalOption);
        }
        if((<any>program).replace) {
            localizer.replaceZhInFiles(tasksObj, globalOption);
        }        
    }
}

// let localizer = new Localizer();
// // localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);
// // localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\'});
// localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});
// localizer.replaceZhInFiles(replaceTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});