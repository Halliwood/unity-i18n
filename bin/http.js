"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpGet = exports.__http_record = void 0;
const axios_1 = __importDefault(require("axios"));
exports.__http_record = {
    lastURL: ''
};
async function httpGet(url, param, config) {
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
        exports.__http_record.lastURL = url;
        const opt = { timeout: 3000 };
        if (config != null)
            Object.assign(opt, config);
        let rsp = await axios_1.default.get(url, opt);
        return rsp.data;
    }
    catch (e) {
        const msg = `http get ${url}, ${e.code}`;
        console.error(msg);
        return null;
    }
}
exports.httpGet = httpGet;
//# sourceMappingURL=http.js.map