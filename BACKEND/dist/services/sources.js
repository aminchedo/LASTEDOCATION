"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstalledItems = getInstalledItems;
exports.getInstalledItemById = getInstalledItemById;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../middleware/logger");
function getDirectorySize(dirPath) {
    let size = 0;
    if (!fs_1.default.existsSync(dirPath))
        return 0;
    try {
        const items = fs_1.default.readdirSync(dirPath);
        for (const item of items) {
            const fullPath = path_1.default.join(dirPath, item);
            const stat = fs_1.default.statSync(fullPath);
            if (stat.isFile()) {
                size += stat.size;
            }
            else if (stat.isDirectory()) {
                size += getDirectorySize(fullPath);
            }
        }
    }
    catch (err) {
        logger_1.logger.error({ msg: 'Error reading directory', path: dirPath, err });
    }
    return size;
}
function countFiles(dirPath) {
    let count = 0;
    if (!fs_1.default.existsSync(dirPath))
        return 0;
    try {
        const items = fs_1.default.readdirSync(dirPath);
        for (const item of items) {
            const fullPath = path_1.default.join(dirPath, item);
            const stat = fs_1.default.statSync(fullPath);
            if (stat.isFile()) {
                count++;
            }
            else if (stat.isDirectory()) {
                count += countFiles(fullPath);
            }
        }
    }
    catch (err) {
        logger_1.logger.error({ msg: 'Error counting files', path: dirPath, err });
    }
    return count;
}
function readProvenance(dirPath) {
    const readmePath = path_1.default.join(dirPath, 'README.source.md');
    if (!fs_1.default.existsSync(readmePath))
        return undefined;
    try {
        const content = fs_1.default.readFileSync(readmePath, 'utf-8');
        const sourceMatch = content.match(/Source:\s*(.+)/);
        const urlMatch = content.match(/URL:\s*(.+)/);
        const licenseMatch = content.match(/License:\s*(.+)/);
        return {
            source: sourceMatch?.[1]?.trim(),
            url: urlMatch?.[1]?.trim(),
            license: licenseMatch?.[1]?.trim(),
        };
    }
    catch (err) {
        return undefined;
    }
}
function getInstalledItems() {
    const items = [];
    const baseDirs = [
        { base: 'datasets/text', type: 'dataset' },
        { base: 'datasets/speech', type: 'dataset' },
        { base: 'datasets/tts', type: 'tts' },
        { base: 'models', type: 'model' },
    ];
    for (const { base, type } of baseDirs) {
        if (!fs_1.default.existsSync(base))
            continue;
        try {
            const entries = fs_1.default.readdirSync(base);
            for (const entry of entries) {
                const fullPath = path_1.default.join(base, entry);
                const stat = fs_1.default.statSync(fullPath);
                if (stat.isDirectory()) {
                    const size = getDirectorySize(fullPath);
                    const fileCount = countFiles(fullPath);
                    if (fileCount > 0) {
                        items.push({
                            id: `${type}-${entry}`,
                            name: entry,
                            type,
                            path: fullPath,
                            size,
                            fileCount,
                            installed: true,
                            provenance: readProvenance(fullPath),
                        });
                    }
                }
            }
        }
        catch (err) {
            logger_1.logger.error({ msg: 'Error scanning directory', base, err });
        }
    }
    logger_1.logger.info({ msg: 'Scanned installed items', count: items.length });
    return items;
}
function getInstalledItemById(id) {
    const items = getInstalledItems();
    return items.find(item => item.id === id) || null;
}
//# sourceMappingURL=sources.js.map