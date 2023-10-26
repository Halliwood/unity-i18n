import md5 from 'md5';
import { __http_record, httpGet } from './http.js';

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

export class Translator {
    public static async setup(env: string): Promise<void> {
        const dotenv = require('dotenv');
        let envOutput = dotenv.config({ path: env });
        if(envOutput.error) {
            console.error('env configuration read error', envOutput.error);
            console.error('auto translation service failed.');
        }
    }

    public static async translateTo(raw: string, targetLang: TLangs): Promise<string> {
        // 先将<xxx></xxx>格式符保护起来
        const pho = Translator.protectHtmlFormats(raw);

        // 再将#xxx#格式符保护起来
        const pro = Translator.protectRichFormats(pho.out);

        // 再将{xx}保护起来
        const ppo = Translator.protectPlaceholders(pro.out);
        
        const str = ppo.out;

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
        if (res.ret == 0) {
            // 恢复被保护的内容
            let out = Translator.recoverProtecteds(res.str, ppo);
            out = Translator.recoverProtecteds(out, pro);
            out = Translator.recoverProtecteds(out, pho);
            console.log('translate succeed:');
            console.log(raw);
            console.log(out);
            return out;
        }
        console.error('translate failed, url: ', __http_record.lastURL);
        console.error(res);
        return null;
    }

    private static recoverProtecteds(raw: string, protectOut: IProtectOut): string {
        let out = raw;
        for (const key in protectOut.map) {
            out = out.replace(key, protectOut.map[key]);
        }
        return out;
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
        let out = raw.replace(/#.+?#/g, (substring: string, ...args: any[]) => {
            let v = `<N${protectedIndex++}>`;
            while (raw.includes(v)) {
                v = `<N${protectedIndex++}>`;
            }
            map[v] = substring;
            return v;
        });
        out = out.replace(/#.+?#/g, (substring: string, ...args: any[]) => {
            let v = `<R${protectedIndex++}>`;
            while (raw.includes(v)) {
                v = `<R${protectedIndex++}>`;
            }
            map[v] = substring;
            return v;
        });
        return { out, map };
    }

    private static protectPlaceholders(raw: string): IProtectOut {
        let protectedIndex = 0, map: { [key: string]: string } = {};
        const out = raw.replace(/\{.+?\}/g, (substring: string, ...args: any[]) => {
            let v = `X${protectedIndex++}`;
            while (raw.includes(v)) {
                v = `X${protectedIndex++}`;
            }
            map[v] = substring;
            return v;
        });
        return { out, map };
    }
}
