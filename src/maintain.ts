import fs from 'fs-extra';
import path from 'path';
import LayaTasks from './example/LayaTasks.js';
import UnityHardTasks from "./example/UnityHardTasks.js";
import UnitySoftTasks from "./example/UnitySoftTasks.js";

async function makeTaskJson(): Promise<void> {
    const jsonRoot = path.join(__dirname, 'builtinTasks');
    await fs.ensureDir(jsonRoot);
    await fs.writeJSON(path.join(jsonRoot, 'unity_hard.json'), UnityHardTasks, { spaces: 4, EOL: '\r\n' });
    await fs.writeJSON(path.join(jsonRoot, 'unity_soft.json'), UnitySoftTasks, { spaces: 4, EOL: '\r\n' });
    await fs.writeJSON(path.join(jsonRoot, 'laya_hard.json'), LayaTasks, { spaces: 4, EOL: '\r\n' });
}

makeTaskJson();