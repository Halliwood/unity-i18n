/// <reference types="node" />
import { SpawnOptions } from "child_process";
interface CmdOption extends SpawnOptions {
    silent?: boolean;
}
export interface ExecuteError {
    code: number;
    error?: Error;
}
export declare class Cmd {
    private _output;
    private resolved;
    runNodeModule(moduleName: string, params?: string[], options?: CmdOption): Promise<number>;
    run(command: string, params?: string[], options?: CmdOption): Promise<number>;
    get output(): string;
}
export {};
