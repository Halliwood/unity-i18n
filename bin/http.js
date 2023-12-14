import axios from "axios";
import { Cmd } from "./Cmd.js";
export const __http_record = {
    lastURL: ''
};
const http_cfg = {
    tool: 'curl'
};
export async function httpGet(url, param, config) {
    if (param != null) {
        let pstr = '';
        if (typeof (param) === 'object') {
            pstr = Object.keys(param).map((value) => value + '=' + param[value]).join('&');
        }
        else {
            pstr = param;
        }
        if (url.includes('?')) {
            if (url.endsWith('?'))
                url += pstr;
            else
                url += '&' + pstr;
        }
        else {
            url = url + '?' + pstr;
        }
    }
    let out = null, errMsg = null;
    try {
        __http_record.lastURL = url;
        if (http_cfg.tool == 'axios') {
            const opt = { timeout: 3000 };
            if (config != null)
                Object.assign(opt, config);
            let rsp = await axios.get(url, opt);
            out = rsp.data;
        }
        else {
            const cmd = new Cmd();
            await cmd.run('curl', [url, '--silent'], { silent: true });
            if (cmd.output.startsWith('Curl error')) {
                errMsg = cmd.output;
            }
            else {
                out = JSON.parse(cmd.output);
            }
        }
        if (out != null)
            return out;
    }
    catch (e) {
        if (errMsg == null) {
            errMsg = `http get ${url}, ${e.code}`;
        }
    }
    console.error('[ERROR]', errMsg);
    return null;
}
//# sourceMappingURL=http.js.map