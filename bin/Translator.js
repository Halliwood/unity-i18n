import fs from 'fs-extra';
import dotenv from 'dotenv';
import md5 from 'md5';
import { httpGet } from './http.js';
import path from 'path';
const LangMap = {
    'Thai': 'TH'
};
export class Translator {
    static output;
    static logFile;
    static cacheBook = {};
    static async setup(output) {
        Translator.output = output;
        const env = path.join(output, '.translatorenv');
        let envOutput = dotenv.config({ path: env });
        if (envOutput.error) {
            console.error('env configuration read error', envOutput.error);
            console.error('auto translation service failed.');
        }
        Translator.logFile = path.join(output, 'log.txt');
        if (fs.existsSync(Translator.logFile))
            await fs.unlink(Translator.logFile);
    }
    static async translateTo(raw, targetLang, option) {
        // 先读入缓存
        const cacheFile = path.join(Translator.output, `${targetLang}.cache.txt`);
        let cache = Translator.cacheBook[targetLang];
        if (cache == null) {
            Translator.cacheBook[targetLang] = cache = {};
            if (fs.existsSync(cacheFile)) {
                const content = await fs.readFile(cacheFile, 'utf-8');
                const lines = content.split(/\r?\n/);
                for (let i = 0, cnt = Math.floor(lines.length / 2); i <= cnt; i++) {
                    cache[lines[i * 2]] = lines[i * 2 + 1];
                }
            }
        }
        // 先将<xxx></xxx>格式符保护起来
        const str = Translator.protectHtmlFormats(raw);
        let translated = cache[str];
        if (translated == null) {
            const target = LangMap[targetLang] || targetLang;
            const uin = 100032, seq = 1, time = new Date().getTime();
            const sign = md5(`${uin}${seq}${target}${str}${time}${process.env.TRANSLATE_KEY}`).replaceAll('-', '').toLowerCase();
            const param = {
                uin,
                seq,
                target,
                str: encodeURIComponent(str),
                time,
                sign
            };
            let res, tryTimes = 0;
            while (tryTimes < 3) {
                res = await httpGet(process.env.TRANSLATE_URL, param, { timeout: 10000 });
                if (res != null && res.ret == 0) {
                    break;
                }
                tryTimes++;
            }
            if (res == null || res.ret != 0) {
                // console.error('translate failed: ', raw);
                // console.error(res);
                return null;
            }
            // 记录到缓存
            cache[str] = res.str;
            await fs.appendFile(cacheFile, str + '\n' + res.str + '\n');
            translated = res.str;
        }
        // 恢复被保护的内容
        const out = Translator.recoverProtecteds(translated);
        // console.log('Translate success: ');
        // console.log(raw);
        // console.log(str);
        // console.log(out);
        return out;
    }
    static recoverProtecteds(raw) {
        return raw.replace(/\^\|(.*?)\|\$/g, (substring, ...args) => args[0]);
    }
    static protectHtmlFormats(raw) {
        let out = raw.replace(/<\/?.+?>/g, (substring, ...args) => `^|${substring}|$`);
        out = out.replace(/#N/g, (substring, ...args) => '^|#N|$');
        out = out.replace(/#.+?#/g, (substring, ...args) => `^|${substring}|$`);
        out = raw.replace(/\{.+?\}/g, (substring, ...args) => `^|${substring}|$`);
        return out;
    }
}
//# sourceMappingURL=Translator.js.map