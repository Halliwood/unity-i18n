"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var UnityTasks = require("./example/UnityTasks");
var LayaTasks = require("./example/LayaTasks");
var myPackage = require('../package.json');
var rmQuotes = function (val) {
    var rst = val.match(/(['"])(.+)\1/);
    if (rst)
        return rst[2];
    return val;
};
var parseTaskReplacer = function (val) {
    val = rmQuotes(val);
    var r = {};
    var varr = val.split('&');
    for (var _i = 0, varr_1 = varr; _i < varr_1.length; _i++) {
        var v = varr_1[_i];
        var pair = v.split('=');
        r[pair[0]] = pair[1];
    }
    return r;
};
// for exmaple
program
    .version(myPackage.version, "-v, --version")
    .option("-s, --src <path>", "[MUST] Input files path. Both direction or single file.", rmQuotes)
    .option("-o, --output <path>", "[MUST] Outout path. Both direction or single file.", rmQuotes)
    .option("--langs <string[]>", "Language codes, seperated by comma. Like EN,FR. LOCAL as defaults")
    .option("-t, --tasks <json object/.json path/.js path>", "Task json file.", rmQuotes)
    .option("-d, --default <unity|laya|xml2bin>", "Execute default tasks defined for unity/laya/xml2bin project.", rmQuotes)
    .option("--task-replacer <string>", "Replace variants in default tasks, if not giver, default will be used.", parseTaskReplacer)
    .option("-S, --search", "Search mode.")
    .option("-R, --replace", "Replace mode.")
    .option("--soft-replace", "Soft replace mode.")
    .option("--silent", "Silent mode.")
    .option("-x, --xlsxstyle <prepend|append|sort-by-id>", "Xlsx sort rule.", 'append')
    .option("-l, --log", "Generate log file.")
    .parse(process.argv);
var opts = program.opts();
console.log("i18n params: ".concat(JSON.stringify(opts)));
if (!opts.src && !opts.tasks) {
    console.error("The --src option is MUST.");
    program.help({ error: true });
}
if (!opts.output && !opts.tasks) {
    console.error("The --output option is MUST.");
    program.help({ error: true });
}
if (!opts.softReplace && opts.langs && opts.langs.length > 1) {
    console.error("Hard replace mode supports only 1 language. If you want to support multiple languages, use --soft-replace.");
    program.help({ error: true });
}
if (!opts.langs)
    opts.langs = 'LOCAL';
var localizer = new Localizer_1.Localizer();
var globalOption = {
    inputRoot: opts.src,
    outputRoot: opts.output,
    langs: opts.langs.split(','),
    replacer: {},
    softReplace: opts.softReplace
};
if (opts.silent) {
    globalOption.silent = opts.silent;
}
if (opts.log) {
    globalOption.needLog = opts.log;
}
if (opts.xlsxstyle) {
    globalOption.xlsxStyle = opts.xlsxstyle;
}
if (opts.default) {
    if (opts.default == 'unity') {
        globalOption.replacer = opts.taskReplacer || UnityTasks.replacer;
        if (opts.search) {
            localizer.searchZhInFiles(UnityTasks.searchTasks, globalOption);
        }
        if (opts.replace) {
            localizer.replaceZhInFiles(UnityTasks.replaceTasks, globalOption);
        }
    }
    else if (opts.default == 'laya') {
        globalOption.replacer = opts.taskReplacer || LayaTasks.replacer;
        if (opts.search) {
            localizer.searchZhInFiles(LayaTasks.searchTasks, globalOption);
        }
        if (opts.replace) {
            localizer.replaceZhInFiles(LayaTasks.replaceTasks, globalOption);
        }
    }
    else if (opts.default == 'xml2bin') {
        if (opts.replace) {
            globalOption.replacer = opts.taskReplacer || LayaTasks.replacer;
            localizer.replaceZhInFiles(LayaTasks.xml2binReplaceTasks, globalOption);
        }
    }
    else {
        console.error('Cannot find default tasks for: %s', opts.default);
        (0, process_1.exit)(1);
    }
}
else if (opts.tasks) {
    var tasksObj = null;
    if (typeof (opts.tasks) == 'object') {
        // json
        tasksObj = opts.tasks;
    }
    else if (typeof (opts.tasks) == 'string') {
        // json file
        var tasksFile = opts.tasks;
        if (!fs.existsSync(tasksFile)) {
            console.error('Cannot find tasks file: %s', tasksFile);
            (0, process_1.exit)(1);
        }
        var tasksContent = fs.readFileSync(tasksFile, 'utf-8');
        tasksObj = JSON.parse(tasksContent);
    }
    if (tasksObj) {
        try {
            if (opts.search) {
                localizer.searchZhInFiles(tasksObj, globalOption);
            }
            if (opts.replace) {
                localizer.replaceZhInFiles(tasksObj, globalOption);
            }
        }
        catch (e) {
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
