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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const fs = __importStar(require("fs"));
const proper_lockfile_1 = __importDefault(require("proper-lockfile"));
const Localizer_1 = require("./Localizer");
const process_1 = require("process");
const UnityHardTasks_1 = __importDefault(require("./example/UnityHardTasks"));
const LayaTasks_1 = __importDefault(require("./example/LayaTasks"));
const UnitySoftTasks_1 = __importDefault(require("./example/UnitySoftTasks"));
const path = require("path");
const myPackage = require('../package.json');
const rmQuotes = (val) => {
    let rst = val.match(/(['"])(.+)\1/);
    if (rst)
        return rst[2];
    return val;
};
const parseTaskReplacer = (val) => {
    val = rmQuotes(val);
    let r = {};
    let varr = val.split('&');
    for (let v of varr) {
        let pair = v.split('=');
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
    .option("--pretty", "Generate pretty json files.")
    .option("--strict", "Strict mode.")
    .option("--lockfile <string>", "Lock file to check.")
    .parse(process.argv);
const opts = program.opts();
async function main() {
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
    // 检查lockfile，防止和版本构建冲突
    if (opts.lockfile) {
        const lf = path.join(opts.src, opts.lockfile);
        const lockStatus = await proper_lockfile_1.default.check(lf, { realpath: false });
        if (lockStatus) {
            console.error('[unity-i18n]Workspace locked! Please wait! 正在构版本，请稍候。');
            process.exit(1);
        }
        await proper_lockfile_1.default.lock(lf, { realpath: false });
    }
    const localizer = new Localizer_1.Localizer();
    const globalOption = {
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
    if (opts.pretty) {
        globalOption.pretty = opts.pretty;
    }
    if (opts.strict) {
        globalOption.strict = opts.strict;
    }
    if (opts.default) {
        if (opts.default == 'xml2bin') {
            if (opts.replace) {
                globalOption.replacer = opts.taskReplacer || LayaTasks_1.default.replacer;
                localizer.replaceZhInFiles(LayaTasks_1.default.xml2binReplaceTasks, globalOption);
            }
        }
        else {
            let tasks;
            if (opts.default == 'unity' || opts.default == 'unity_hard') {
                tasks = UnityHardTasks_1.default;
            }
            else if (opts.default == 'unity_soft') {
                tasks = UnitySoftTasks_1.default;
            }
            else if (opts.default == 'laya' || opts.default == 'laya_hard') {
                tasks = LayaTasks_1.default;
            }
            if (tasks) {
                globalOption.replacer = opts.taskReplacer || tasks.replacer;
                if (opts.search) {
                    localizer.searchZhInFiles(tasks.searchTasks, globalOption);
                }
                if (opts.replace) {
                    localizer.replaceZhInFiles(tasks.replaceTasks, globalOption);
                }
            }
            else {
                console.error('Cannot find default tasks for: %s', opts.default);
                (0, process_1.exit)(1);
            }
        }
    }
    else if (opts.tasks) {
        let tasksObj = null;
        if (typeof (opts.tasks) == 'object') {
            // json
            tasksObj = opts.tasks;
        }
        else if (typeof (opts.tasks) == 'string') {
            // json file
            let tasksFile = opts.tasks;
            if (!fs.existsSync(tasksFile)) {
                console.error('Cannot find tasks file: %s', tasksFile);
                (0, process_1.exit)(1);
            }
            let tasksContent = fs.readFileSync(tasksFile, 'utf-8');
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
}
main();
//# sourceMappingURL=index.js.map