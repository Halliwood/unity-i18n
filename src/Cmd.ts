import os from 'os';
import { spawn, SpawnOptions } from "child_process";

interface CmdOption extends SpawnOptions {
    silent?: boolean;
}

export interface ExecuteError {
    code: number,
    error?: Error
}

export class Cmd {
    private _output: string = '';
    private resolved = false;

    runNodeModule(moduleName: string, params?: string[], options?: CmdOption): Promise<number> {
        if(os.type() == 'Windows_NT' && !moduleName.match(/\.cmd$/)) {
            moduleName += '.cmd';
        }
        return this.run(moduleName, params, options);
    }

    run(command: string, params?: string[], options?: CmdOption): Promise<number> {
        this._output = '';
        this.resolved = false;
        // options = Object.assign(options || {}, { cwd: this.cfg.cwd });
        return new Promise((resolve: (data: number) => void, reject: (error: ExecuteError) => void) => {
            if(!options?.silent) console.log(`run command: ${command}, params:`, params, options);
    
            if(!options) {
                options = {};
            }
            if(!params) params = [];
            options.stdio = 'pipe';
            let proc = spawn(command, params, options);
    
            proc.stdout!.on('data', (data) => {
                let dataStr = String(data);
                if (dataStr) {
                    this._output += dataStr;
                }
            });
    
            proc.stderr!.on('data', (data) => {
                // 不一定代表进程exitcode != 0，可能只是进程调用了console.error
                let dataStr = String(data);
                if (dataStr) {
                    this._output += dataStr;
                }
            });
    
            // 进程错误
            proc.on('error', (error: Error) => {
                if(!options?.silent) console.error(error);
                reject({ code: 1, error });
            });
    
            // 进程关闭
            proc.on('close', (code: number) => {
                if(!options?.silent) console.log(`process closed with exit code: ${code}`);
                if (!this.resolved) {
                    this.resolved = true;
                    if(code == 0) {
                        resolve(0);
                    } else {
                        let errMsg = `process closed with exit code: ${code}`;
                        reject({ code, error: new Error(errMsg) });
                    }
                } else {
                    console.log('already resolved, skip');
                }
            });

            proc.on('exit', (code: number) => {
                if(!options?.silent) console.log(`process exits with exit code: ${code}`);
                // 经测试，unity如调用EditorApplication.Exit，不会收到close，此处做个处理，收到exit后10秒内没有close则直接resolve
                setTimeout(() => {
                    if (!this.resolved) {
                        console.log('no close event fired, force resolve');
                        this.resolved = true;
                        if(code == 0) {
                            resolve(0);
                        } else {
                            let errMsg = `process exits with exit code: ${code}`;
                            reject({ code, error: new Error(errMsg) });
                        }
                    }
                }, 10000);
            });
        });
    }

    public get output(): string {
        return this._output;
    }
}