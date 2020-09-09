"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var fs = __importStar(require("fs"));
var Localizer_1 = require("./Localizer");
var process_1 = require("process");
var DefaultTasks = require("./example/ExampleTasks");
var myPackage = require('../package.json');
var getPath = function (val) {
    var rst = val.match(/(['"])(.+)\1/);
    if (rst)
        return rst[2];
    return val;
};
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
    .option("-x, --xlsxstyle <prepend|append|sort-by-id>", "Xlsx sort rule.", 'prepend')
    .option("-l, --log", "Generate log file.")
    .parse(process.argv);
if (!program.src && !program.tasks) {
    console.warn("The --src option is MUST.");
    program.help();
}
if (!program.output && !program.tasks) {
    console.warn("The --output option is MUST.");
    program.help();
}
var localizer = new Localizer_1.Localizer();
var globalOption = { "inputRoot": program.src, "outputRoot": program.output };
if (program.silent) {
    globalOption.silent = program.silent;
}
if (program.log) {
    globalOption.needLog = program.log;
}
if (program.xlsxstyle) {
    globalOption.xlsxStyle = program.xlsxstyle;
}
if (program.default) {
    if (program.search) {
        localizer.searchZhInFiles(DefaultTasks.searchTasks, globalOption);
    }
    if (program.replace) {
        localizer.replaceZhInFiles(DefaultTasks.replaceTasks, globalOption);
    }
}
else if (program.tasks) {
    var tasksObj = null;
    if (typeof (program.tasks) == 'object') {
        // json
        tasksObj = program.tasks;
    }
    else if (typeof (program.tasks) == 'string') {
        // json file
        var tasksFile = program.tasks;
        if (!fs.existsSync(tasksFile)) {
            console.error('Cannot find tasks file: %s', tasksFile);
            process_1.exit(1);
        }
        var tasksContent = fs.readFileSync(tasksFile, 'utf-8');
        tasksObj = JSON.parse(tasksContent);
    }
    if (tasksObj) {
        if (program.search) {
            localizer.searchZhInFiles(tasksObj, globalOption);
        }
        if (program.replace) {
            localizer.replaceZhInFiles(tasksObj, globalOption);
        }
    }
}
// let localizer = new Localizer();
// // localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);
// // localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\'});
// localizer.searchZhInFiles(searchTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});
// localizer.replaceZhInFiles(replaceTasks, {"inputRoot": 'G:\\dldlweb_kr\\trunk\\project\\', "outputRoot": 'G:\\dldlweb_kr\\trunk\\project\\tools\\i18n\\dictionary\\tw'});
