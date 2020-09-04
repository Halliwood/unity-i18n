"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Localizer_1 = require("./Localizer");
var exampleOption = {
    "excludes": {
        "dirs": [/Assets\\Scripts\\.*\\Editor\\/, 'uts\\\\Wraps', 'protocol\\\\new', 'uts\\\\StaticWrap\\\\\Wraps']
    },
    "includes": {
        "dirs": ['Assets\\\\AssetSources\\\\ui', 'Assets\\\\AssetSources\\\\data', 'servercfg', 'serverscript', 'TsScripts', 'Assets\\\\Scripts'],
        "files": [/\.ts$/, /\.cs$/, /\.json$/, /\.cxx$/, /\.prefab$/, /\.xml$/]
    },
    "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/]
};
var localizer = new Localizer_1.Localizer();
localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);
