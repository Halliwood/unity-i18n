import fs from 'fs-extra';
import dotenv from 'dotenv';
import md5 from 'md5';
import { __http_record, httpGet } from './http.js';
import path from 'path';
import { GlobalOption } from './LocalizeOption.js';

export declare type TLangs = 'CN' | 'TW' | 'EN' | 'INA' | 'Arabic' | 'Japanese' | 'Korean' | 'Thai' | 'Russian' | 'Spanish' | 'Arabic' | 'French' | 'German' | 'Italian' | 'Portuguese';

const LangMap: Partial<Record<TLangs, Uppercase<string>>> = {
    'Thai': 'TH'
}

interface ITranslateRes {
    ret: number
    str: string
}

interface IProtectOut {
    out: string
    map: { [key: string]: string }
}

interface IRecoverOut {
    out: string
    success: boolean
}

export class Translator {
    private static output: string;
    private static readonly cacheBook: { [lang: string]: { [raw: string]: string } } = {};

    public static async setup(output: string): Promise<void> {
        Translator.output = output;
        const env = path.join(output, '.translatorenv');
        let envOutput = dotenv.config({ path: env });
        if(envOutput.error) {
            console.error('env configuration read error', envOutput.error);
            console.error('auto translation service failed.');
        }
    }

    public static async translateTo(raw: string, targetLang: TLangs, option: GlobalOption): Promise<string | null> {
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
        const pho = Translator.protectHtmlFormats(raw);

        // 再将#xxx#格式符保护起来
        const pro = Translator.protectRichFormats(pho.out);

        // 再将{xx}保护起来
        const ppo = Translator.protectPlaceholders(pro.out);
        
        const str = ppo.out;
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
            }
            const res = await httpGet<ITranslateRes>(process.env.TRANSLATE_URL, param, { timeout: 10000 });
            if (res == null || res.ret != 0) {
                console.error('translate failed, url: ', __http_record.lastURL);
                console.error(res);
                return null;
            }

            // 记录到缓存
            cache[str] = res.str;
            await fs.appendFile(cacheFile, str + '\n' + res.str + '\n');
            translated = res.str;
        }

        // 恢复被保护的内容
        const r0 = Translator.recoverProtecteds(translated, ppo);
        const r1 = Translator.recoverProtecteds(r0.out, pro);
        const r2 = Translator.recoverProtecteds(r1.out, pho);

        if (r0.success && r1.success && r2.success) {
            // console.log('translate succeed:');
            // console.log(raw);
            // console.log(r2.out);
            return r2.out;
        }
        if (option.needLog) await fs.appendFile(path.join(option.outputRoot, 'log.txt'), `[RECOVER]${raw}\n${translated}\n`, 'utf-8');
        return null;
    }

    private static recoverProtecteds(raw: string, protectOut: IProtectOut): IRecoverOut {
        let out = raw;
        let success = true;
        for (const key in protectOut.map) {
            if (out.includes(key)) {
                out = out.replace(key, protectOut.map[key]);
            } else if (out.includes(key.trimEnd())) {
                out = out.replace(key.trimEnd(), protectOut.map[key]);
            } else {
                success = false;
            }
            
        }
        return { out, success };
    }

    private static protectHtmlFormats(raw: string): IProtectOut {
        let protectedIndex = 0, map: { [key: string]: string } = {};
        const out = raw.replace(/<\/?.+?>/g, (substring: string, ...args: any[]) => {
            let v = `<F${protectedIndex++}>`;
            while (raw.includes(v)) {
                v = `<F${protectedIndex++}>`;
            }
            map[v] = substring;
            return v;
        });
        return { out, map };
    }

    private static protectRichFormats(raw: string): IProtectOut {
        let protectedIndex = 0, map: { [key: string]: string } = {};
        let out = raw.replace(/#N/g, (substring: string, ...args: any[]) => {
            let v = `@N${protectedIndex++} `;
            while (raw.includes(v)) {
                v = `@N${protectedIndex++} `;
            }
            map[v] = substring;
            return v;
        });
        out = out.replace(/#.+?#/g, (substring: string, ...args: any[]) => {
            let v = `@R${protectedIndex++} `;
            while (raw.includes(v)) {
                v = `@R${protectedIndex++} `;
            }
            map[v] = substring;
            return v;
        });
        return { out, map };
    }

    private static protectPlaceholders(raw: string): IProtectOut {
        let protectedIndex = 0, map: { [key: string]: string } = {};
        const out = raw.replace(/\{.+?\}/g, (substring: string, ...args: any[]) => {
            let v = `@X${protectedIndex++} `;
            while (raw.includes(v)) {
                v = `@X${protectedIndex++} `;
            }
            map[v] = substring;
            return v;
        });
        return { out, map };
    }
}
