import { LocalizeOption } from "./LocalizeOption";
import { Localizer } from "./Localizer";

let exampleOption: LocalizeOption = {
    "excludes": {
        "dirs": [/Assets\\Scripts\\.*\\Editor\\/, 'uts\\\\Wraps', 'protocol\\\\new', 'uts\\\\StaticWrap\\\\\Wraps']
    }, 
    "includes": {
        "dirs": ['Assets\\\\AssetSources\\\\ui', 'Assets\\\\AssetSources\\\\data', 'servercfg', 'serverscript', 'TsScripts', 'Assets\\\\Scripts'], 
        "files": [/\.ts$/, /\.cs$/, /\.json$/, /\.cxx$/, /\.prefab$/, /\.xml$/]
    }, 
    "skipPatterns": [/^\s*uts\.log/, /^\s*uts\.assert\(/]
}

let localizer = new Localizer();
localizer.searchZhInFiles('G:\\dldlweb_kr\\trunk\\project\\', exampleOption);