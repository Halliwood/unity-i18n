"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translator = void 0;
const md5_1 = __importDefault(require("md5"));
const http_js_1 = require("./http.js");
const LangMap = {
    'Thai': 'TH'
};
class Translator {
    static async setup(env) {
        const dotenv = require('dotenv');
        let envOutput = dotenv.config({ path: env });
        if (envOutput.error) {
            console.error('env configuration read error', envOutput.error);
            console.error('auto translation service failed.');
        }
    }
    static async translateTo(raw, targetLang) {
        // 先将<xxx></xxx>格式符保护起来
        const pho = Translator.protectHtmlFormats(raw);
        // 再将#xxx#格式符保护起来
        const pro = Translator.protectRichFormats(pho.out);
        // 再将{xx}保护起来
        const ppo = Translator.protectPlaceholders(pro.out);
        const str = ppo.out;
        const target = LangMap[targetLang] || targetLang;
        const uin = 100032, seq = 1, time = new Date().getTime();
        const sign = (0, md5_1.default)(`${uin}${seq}${target}${str}${time}${process.env.TRANSLATE_KEY}`).replaceAll('-', '').toLowerCase();
        const param = {
            uin,
            seq,
            target,
            str: encodeURIComponent(str),
            time,
            sign
        };
        const res = await (0, http_js_1.httpGet)(process.env.TRANSLATE_URL, param, { timeout: 10000 });
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
        console.error('translate failed, url: ', http_js_1.__http_record.lastURL);
        console.error(res);
        return null;
    }
    static recoverProtecteds(raw, protectOut) {
        let out = raw;
        for (const key in protectOut.map) {
            out = out.replace(key, protectOut.map[key]);
        }
        return out;
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
        let out = raw.replace(/#.+?#/g, (substring, ...args) => {
            let v = `<N${protectedIndex++}>`;
            while (raw.includes(v)) {
                v = `<N${protectedIndex++}>`;
            }
            map[v] = substring;
            return v;
        });
        out = out.replace(/#.+?#/g, (substring, ...args) => {
            let v = `<R${protectedIndex++}>`;
            while (raw.includes(v)) {
                v = `<R${protectedIndex++}>`;
            }
            map[v] = substring;
            return v;
        });
        return { out, map };
    }
    static protectPlaceholders(raw) {
        let protectedIndex = 0, map = {};
        const out = raw.replace(/\{.+?\}/g, (substring, ...args) => {
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
exports.Translator = Translator;
//# sourceMappingURL=Translator.js.map