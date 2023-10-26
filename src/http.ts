import axios, { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";

export const __http_record = {
    lastURL: ''
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
    try {
        __http_record.lastURL = url;
        const opt: AxiosRequestConfig = { timeout: 3000 };
        if (config != null) Object.assign(opt, config);
        let rsp = await axios.get<T>(url, opt);
        return rsp.data;
    } catch (e) {
        const msg = `http get ${url}, ${(<AxiosError>e).code}`;
        console.error(msg);
        return null;
    }
}
