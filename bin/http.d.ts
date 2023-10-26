import { AxiosRequestConfig } from "axios";
export declare const __http_record: {
    lastURL: string;
};
export declare function httpGet<T>(url: string, param?: object | string | null, config?: AxiosRequestConfig<T>): Promise<T | null>;
