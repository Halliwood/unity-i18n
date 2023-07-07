"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const LayaTasks_1 = __importDefault(require("./example/LayaTasks"));
const UnityHardTasks_1 = __importDefault(require("./example/UnityHardTasks"));
const UnitySoftTasks_1 = __importDefault(require("./example/UnitySoftTasks"));
async function makeTaskJson() {
    const jsonRoot = path_1.default.join(__dirname, 'builtinTasks');
    await fs_extra_1.default.ensureDir(jsonRoot);
    await fs_extra_1.default.writeJSON(path_1.default.join(jsonRoot, 'unity_hard.json'), UnityHardTasks_1.default, { spaces: 4, EOL: '\r\n' });
    await fs_extra_1.default.writeJSON(path_1.default.join(jsonRoot, 'unity_soft.json'), UnitySoftTasks_1.default, { spaces: 4, EOL: '\r\n' });
    await fs_extra_1.default.writeJSON(path_1.default.join(jsonRoot, 'laya_hard.json'), LayaTasks_1.default, { spaces: 4, EOL: '\r\n' });
}
makeTaskJson();
//# sourceMappingURL=maintain.js.map