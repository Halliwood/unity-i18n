import { install } from 'source-map-support';
install();

import program from 'commander';
import fs from 'fs-extra';
import lockfile from 'proper-lockfile'
import { LocalizeTask, GlobalOption } from "./LocalizeOption.js";
import { Localizer } from "./Localizer.js";
import { exit } from 'process';
import UnityHardTasks from "./example/UnityHardTasks.js";
import LayaTasks from "./example/LayaTasks.js";
import UnitySoftTasks from './example/UnitySoftTasks.js';
import path from 'path';
import { TLangs, Translator } from './Translator.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const myPackage = await fs.readJSON(path.join(__dirname, '../package.json'));

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
    langs?: string;
    tasks?: any;
    default?: 'unity' | 'unity_hard' | 'unity_soft' | 'laya' | 'laya_hard' | 'xml2bin';
    taskReplacer?: {[key: string]: string};
    search?: boolean;
    replace?: boolean;
    softReplace?: boolean;
    silent?: boolean;
    xlsxstyle?: 'prepend' | 'append' | 'sort-by-id';
    log?: boolean;
    pretty?: boolean;
    strict?: boolean;
    lockfile?: string;
    individual?: boolean;
    validate?: string;
    autoTrans?: string;
}

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
	.option("--individual", "Make individual files for each language.")
	.option("--validate [string]", "Specify which languages to be validated.")
	.option("--auto-trans <string[]>", "Auto translate or not.")
    .parse(process.argv);

const opts = program.opts() as CmdParams;

async function main(): Promise<void> {
    if(!opts.src && !opts.tasks) {
        console.error("The --src option is MUST.");
        program.help({error:true});
    }
    if(!opts.output && !opts.tasks) {
        console.error("The --output option is MUST.");
        program.help({error:true});
    }
    if(!opts.softReplace && opts.langs && opts.langs.length > 1) {
        console.error("Hard replace mode supports only 1 language. If you want to support multiple languages, use --soft-replace.");
        program.help({error:true});
    }
    if(!opts.langs) opts.langs = 'LOCAL';
    
    // 检查lockfile，防止和版本构建冲突
    if(opts.lockfile) {
        const lf = path.join(opts.src, opts.lockfile);
        const lockStatus = await lockfile.check(lf, { realpath: false });
        if (lockStatus) {
            console.error('[unity-i18n]Workspace locked! Please wait! 正在构版本，请稍候。');
            process.exit(1);
        }
        await lockfile.lock(lf, { realpath: false });
    }

    const localizer = new Localizer();
    const globalOption: GlobalOption = { 
        inputRoot: opts.src, 
        outputRoot: opts.output, 
        langs: opts.langs.split(',') as TLangs[], 
        replacer: {}, 
        softReplace: opts.softReplace,
        autoTrans: opts.autoTrans?.split(',') as TLangs[]
    };
    
    if(opts.silent) {
        globalOption.silent = opts.silent;
    }
    if(opts.log) {
        globalOption.needLog = opts.log;
    }
    if(opts.xlsxstyle) {
        globalOption.xlsxStyle = opts.xlsxstyle;
    }
    if(opts.pretty) {
        globalOption.pretty = opts.pretty;
    }
    if(opts.strict) {
        globalOption.strict = opts.strict;
    }
    if(opts.individual && opts.langs.length > 1) {
        globalOption.individual = true;
    }
    if(opts.validate) {
        globalOption.validate = opts.validate.split(',');
    }

    if (opts.autoTrans?.length > 0) {
        Translator.setup(opts.output);
    }
    // Translator.translateTo('恭喜#M;{^%s}#暂列#C=0xf3fc00;极限挑战#第一名，凌晨3点结算排行奖励将获得#I={%d};{%d}# #I={%d};{%d}#。', 'EN');
    // Translator.translateTo('恭喜#M;{^%s}#暂列#C=0xf3fc00;极限挑战#第一名，凌晨3点结算排行奖励将获得#I={%d};{%d}# #I={%d};{%d}#。', 'Thai');
    // Translator.translateTo('您获得了：{%d} {%s}', 'EN');
    // Translator.translateTo('购买<color=#BB5959>超值礼包</color>，<color=#BB5959>大幅提升</color>战力', 'EN');
    // Translator.translateTo('对敌方2个目标攻击2次，每次造成180%X0斗气伤害，附加斗气回复效果降低60%，持续8秒', 'EN');
    // Translator.translateTo('对敌方2个目标攻击2次，每次造成180%@SH0 斗气伤害，附加斗气回复效果降低60%，持续8秒', 'EN');
    
    if(opts.default) {
        if(opts.default == 'xml2bin') {
            if(opts.replace) {
                globalOption.replacer = opts.taskReplacer || LayaTasks.replacer;
                localizer.replaceZhInFiles(LayaTasks.xml2binReplaceTasks, globalOption);
            }
        } else {
            let tasks: { searchTasks: LocalizeTask[], replaceTasks: LocalizeTask[], replacer: {[key: string]: string} };
            if (opts.default == 'unity' || opts.default == 'unity_hard') {
                tasks = UnityHardTasks;
            } else if (opts.default == 'unity_soft') {
                tasks = UnitySoftTasks;
            } else if (opts.default == 'laya' || opts.default == 'laya_hard') {
                tasks = LayaTasks;
            } 
            if (tasks) {
                globalOption.replacer = opts.taskReplacer || tasks.replacer;
                if(opts.search) {
                    await localizer.searchZhInFiles(tasks.searchTasks, globalOption);
                }
                if(opts.replace) {
                    await localizer.replaceZhInFiles(tasks.replaceTasks, globalOption);
                }
            } else {
                console.error('Cannot find default tasks for: %s', opts.default);
                exit(1);
            }
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
}
main();
