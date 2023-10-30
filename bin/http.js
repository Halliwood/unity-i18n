import axios from "axios";
export const __http_record = {
    lastURL: ''
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
    try {
        __http_record.lastURL = url;
        const opt = { timeout: 3000 };
        if (config != null)
            Object.assign(opt, config);
        let rsp = await axios.get(url, opt);
        return rsp.data;
    }
    catch (e) {
        const msg = `http get ${url}, ${e.code}`;
        console.error(msg);
        return null;
    }
}
//# sourceMappingURL=http.js.map