import fs from 'fs-extra';
import dotenv from 'dotenv';
import md5 from 'md5';
import { httpGet } from './http.js';
import path from 'path';
const LangMap = {
    'Thai': 'TH'
};
export class Translator {
    static HanPattern = /[\u4e00-\u9fa5]+/;
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
        if (raw.includes('#N')) {
            const arr = raw.split('#N');
            for (let i = 0, len = arr.length; i < len; i++) {
                const out = await Translator.translateSingleLine(arr[i], targetLang, option, cache, cacheFile);
                if (out != null)
                    arr[i] = out;
            }
            return arr.join('#N');
        }
        if (raw.includes('\\n')) {
            const arr = raw.split('\\n');
            for (let i = 0, len = arr.length; i < len; i++) {
                const out = await Translator.translateSingleLine(arr[i], targetLang, option, cache, cacheFile);
                if (out != null)
                    arr[i] = out;
            }
            return arr.join('\\n');
        }
        return await this.translateSingleLine(raw, targetLang, option, cache, cacheFile);
    }
    static async translateSingleLine(raw, targetLang, option, cache, cacheFile) {
        // 先将<xxx></xxx>格式符保护起来
        const pho = Translator.protectHtmlFormats(raw);
        // 再将#xxx#格式符保护起来
        const pro = Translator.protectRichFormats(pho.out);
        // 再将{xx}保护起来
        const str = Translator.protectPlaceholders(pro.out);
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
        const r1 = Translator.recoverProtecteds(translated, pro, /<\s?\/?\s?R\s?\d+\s?>/g);
        const r2 = Translator.recoverProtecteds(r1.out, pho, /<\s?\/?\s?F\s?\d+\s?>/g);
        const out = Translator.recoverPlaceholders(r2.out);
        if (r1.success && r2.success) {
            // console.log('translate succeed:');
            // console.log(raw);
            // console.log(str);
            // console.log(translated);
            return out;
        }
        if (option.needLog)
            await fs.appendFile(Translator.logFile, `[RECOVER]${raw}\n${translated}\n`, 'utf-8');
        return null;
    }
    // private static recoverProtecteds(raw: string, protectOut: IProtectOut): IRecoverOut {
    //     let out = raw;
    //     let success = true;
    //     for (const key in protectOut.map) {
    //         if (out.includes(key)) {
    //             out = out.replace(key, protectOut.map[key]);
    //         } else if (out.includes(key.trimEnd())) {
    //             // 某些情况下会丢失末尾的空格
    //             out = out.replace(key.trimEnd(), protectOut.map[key]);
    //         } else if (out.includes(key[0] + ' ' + key.substring(1))) {
    //             // 某些情况下中间会插个空格
    //             out = out.replace(key[0] + ' ' + key.substring(1), protectOut.map[key]);
    //         } else if (out.includes(key[0] + ' ' + key.substring(1).trimEnd())) {
    //             out = out.replace(key[0] + ' ' + key.substring(1).trimEnd(), protectOut.map[key]);
    //         } else {
    //             success = false;
    //         }            
    //     }
    //     return { out, success };
    // }
    static recoverProtecteds(raw, protectOut, r) {
        const out = raw.replace(r, (substring, ...args) => {
            const trimed = substring.replace(/\s+/g, '');
            const s = protectOut.map[trimed];
            delete protectOut.map[trimed];
            return s;
        });
        return { out, success: Object.keys(protectOut.map).length == 0 };
    }
    static recoverPlaceholders(raw) {
        return raw.replace(/\^\|(.+?)\|\$/g, (substring, ...args) => args[0]);
    }
    static protectHtmlFormats(raw) {
        let protectedIndex = 0, map = {};
        const out = raw.replace(/<\/?.+?>/g, (substring, ...args) => {
            let v = `<F${protectedIndex++}>`;
            while (raw.includes(v)) {
                v = `<F${protectedIndex++}>`;
            }
            map[v] = substring;
            return v;
        });
        return { out, map };
    }
    static protectRichFormats(raw) {
        let protectedIndex = 0, map = {};
        const out = raw.replace(/#.+?#/g, (substring, ...args) => {
            if (substring.search(Translator.HanPattern) >= 0) {
                // 针对例如#C=0x5CC5F2,URL=0;集市#这类情形，分号后面部分是需要翻译的，需要拆成两部分进行保护
                const pairs = substring.split(';');
                let v1 = `<R${protectedIndex++}>`;
                while (raw.includes(v1)) {
                    v1 = `<R${protectedIndex++}>`;
                }
                if (pairs.length == 1) {
                    map[v1] = pairs[0];
                    return v1;
                }
                map[v1] = pairs[0] + ';';
                const v2 = '</' + v1.substring(1);
                map[v2] = '#';
                return v1 + pairs[1].substring(0, pairs[1].length - 1) + v2;
            }
            else {
                let v = `<R${protectedIndex++}>`;
                while (raw.includes(v)) {
                    v = `<R${protectedIndex++}>`;
                }
                map[v] = substring;
                return v;
            }
        });
        return { out, map };
    }
    static protectPlaceholders(raw) {
        const out = raw.replace(/\{.+?\}/g, (substring, ...args) => `^|${substring}|$`);
        return out;
    }
}
//# sourceMappingURL=Translator.js.map