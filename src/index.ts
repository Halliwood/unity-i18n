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

const parseTaskReplacer = (val: string): {[key: string]: string} => {
    val = rmQuotes(val);
    let r = {};
    let varr = val.split('&');
    for(let v of varr) {
        let pair = v.split('=');
        r[pair[0]] = pair[1];
    }
    return r;
}

interface CmdParams {
    src: string;
    output: string;
    tasks?: any;
    default?: 'unity' | 'laya' | 'xml2bin';
    taskReplacer?: {[key: string]: string};
    search?: boolean;
    replace?: boolean;
    silent?: boolean;
    xlsxstyle?: 'prepend' | 'append' | 'sort-by-id';
    log?: boolean;
}

// for exmaple
program
	.version(myPackage.version, "-v, --version")
	.option("-s, --src <path>", "[MUST] Input files path. Both direction or single file.", rmQuotes)
	.option("-o, --output <path>", "[MUST] Outout path. Both direction or single file.", rmQuotes)
	.option("-t, --tasks <json object/.json path/.js path>", "Task json file.", rmQuotes)
	.option("-d, --default <unity|laya|xml2bin>", "Execute default tasks defined for unity/laya/xml2bin project.", rmQuotes)
	.option("--task-replacer <string>", "Replace variants in default tasks, if not giver, default will be used.", parseTaskReplacer)
	.option("-S, --search", "Search mode.")
	.option("-R, --replace", "Replace mode.")
	.option("--silent", "Silent mode.")
	.option("-x, --xlsxstyle <prepend|append|sort-by-id>", "Xlsx sort rule.", 'append')
	.option("-l, --log", "Generate log file.")
    .parse(process.argv);

let opts = program.opts() as CmdParams;
console.log(`i18n params: ${JSON.stringify(opts)}`);

if(!opts.src && !opts.tasks) {
    console.warn("The --src option is MUST.");
    program.help({error:true});
}
if(!opts.output && !opts.tasks) {
    console.warn("The --output option is MUST.");
    program.help({error:true});
}

let localizer = new Localizer();
let globalOption: GlobalOption = {"inputRoot": opts.src, "outputRoot": opts.output, "replacer": {}};
if(opts.silent) {
    globalOption.silent = opts.silent;
}
if(opts.log) {
    globalOption.needLog = opts.log;
}
if(opts.xlsxstyle) {
    globalOption.xlsxStyle = opts.xlsxstyle;
}

if(opts.default) {
    if(opts.default == 'unity') {
        globalOption.replacer = opts.taskReplacer || UnityTasks.replacer;
        if(opts.search) {
            localizer.searchZhInFiles(UnityTasks.searchTasks, globalOption);
        }
        if(opts.replace) {
            localizer.replaceZhInFiles(UnityTasks.replaceTasks, globalOption);
        }
    } else if(opts.default == 'laya') {
        globalOption.replacer = opts.taskReplacer || LayaTasks.replacer;
        if(opts.search) {
            localizer.searchZhInFiles(LayaTasks.searchTasks, globalOption);
        }
        if(opts.replace) {
            localizer.replaceZhInFiles(LayaTasks.replaceTasks, globalOption);
        }
    } else if(opts.default == 'xml2bin') {
        if(opts.replace) {
            globalOption.replacer = opts.taskReplacer || LayaTasks.replacer;
            localizer.replaceZhInFiles(LayaTasks.xml2binReplaceTasks, globalOption);
        }
    } else {
        console.error('Cannot find default tasks for: %s', opts.default);
        exit(1);
    }
} else if(opts.tasks) {
    let tasksObj: LocalizeTask[] = null;
    if(typeof(opts.tasks) == 'object') {
        // json
        tasksObj = opts.tasks as LocalizeTask[];
    } else if(typeof(opts.tasks) == 'string') {
        // json file
        let tasksFile = opts.tasks as string;
        if(!fs.existsSync(tasksFile)) {
            console.error('Cannot find tasks file: %s', tasksFile);
            exit(1);
        }
        let tasksContent = fs.readFileSync(tasksFile, 'utf-8');
        tasksObj = JSON.parse(tasksContent) as LocalizeTask[];
    }
    if(tasksObj) {
        try {
            if(opts.search) {
                localizer.searchZhInFiles(tasksObj, globalOption);
            }
            if(opts.replace) {
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