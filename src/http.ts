import axios, { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { Cmd } from "./Cmd.js";

export const __http_record = {
    lastURL: ''
}

const http_cfg = {
    tool: 'curl'
}

export async function httpGet<T>(url: string, param?: object | string | null, config?: AxiosRequestConfig<T>): Promise<T | null> {
    if (param != null) {
        let pstr = '';
        if (typeof (param) === 'object') {
            pstr = Object.keys(param).map((value) => value + '=' + (param as any)[value]).join('&');
        } else {
            pstr = param;
        }
        if (url.includes('?')) {
            if (url.endsWith('?')) url += pstr;
            else url += '&' + pstr;
        } else {
            url = url + '?' + pstr;
        }
    }
    let out: T | null = null, errMsg: string | null = null;
    try {
        __http_record.lastURL = url;
        if (http_cfg.tool == 'axios') {
            const opt: AxiosRequestConfig = { timeout: 3000 };
            if (config != null) Object.assign(opt, config);
            let rsp = await axios.get<T>(url, opt);
            out = rsp.data;       
        } else {
            const cmd = new Cmd();
            await cmd.run('curl', [url, '--silent'], { silent: true });
            if (cmd.output.startsWith('Curl error')) {
                errMsg = cmd.output;
            } else {
                out = JSON.parse(cmd.output);
            }
        }
        if (out != null) return out;
    } catch(e) {
        if (errMsg == null) {
            errMsg = `http get ${url}, ${(<AxiosError>e).code}`;
        }
    }
    console.error('[ERROR]', errMsg);
    return null;
}
