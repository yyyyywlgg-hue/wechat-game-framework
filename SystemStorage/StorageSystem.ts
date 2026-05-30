import { JsonAsset, sys } from "cc";
import { BasicSystem } from "../Basic/BasicSystem";
import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { clog } from "../Tools/ColorLog";
import Loader from "../Tools/Loader";
import { StorageTemp } from "./StorageTemp";

export class StorageSystem extends BasicSystem {
    private static _storageName = 'GameFramework01';
    private static _data: StorageTemp;
    private static _levelDataBound = 'LevelData';
    private static _levelDataJson = 'LevelData';
    private static _levelData: { [lv: number]: any } = {};
    private static _allJsonData: { [name: string]: any } = {};

    public static init(d?: any): void {
        if (this.isInit) return;
        this.isInit = true;

        let newData = new StorageTemp();
        let data = null;
        try {
            let raw = sys.localStorage.getItem(this._storageName);
            if (raw) {
                let parsed = JSON.parse(raw);
                if (parsed) {
                    this.copyObject(parsed, newData);
                    data = parsed;
                }
            }
        } catch (e) {
            clog.error("存档解析失败，使用新存档", e);
            data = null;
        }

        this._data = data || newData;
        this.saveData();
        this.loadLevelData();
    }

    public static getData(): StorageTemp {
        return this._data;
    }

    public static getJsonData(key: string) {
        return this._allJsonData[key];
    }

    public static setData(cb: (d: StorageTemp) => void, isSave = false) {
        cb(this._data);
        if (isSave) this.saveData();
    }

    public static updateToAssets(isAnim = false, isMask = true) {
        EventManager.emit(EventTypes.GameEvents.UserAssetsChanged, isAnim, isMask);
    }

    public static saveData() {
        try {
            sys.localStorage.setItem(this._storageName, JSON.stringify(this._data));
        } catch (e) {
            clog.error("存档保存失败", e);
        }
    }

    public static getLevelData(lv?: number): any {
        if (undefined === lv) {
            lv = this._data.levelAssets?.curLv || 1;
        }
        return this._levelData[lv];
    }

    public static getMaxLvCount() {
        return Object.keys(this._levelData).length;
    }

    private static loadLevelData() {
        Loader.loadBundle(this._levelDataBound, () => {
            Loader.loadBundleDir(this._levelDataBound, '/', (res: JsonAsset[]) => {
                res.forEach(e => {
                    this._allJsonData[e.name] = e.json;
                });
                this._levelData = this._allJsonData[this._levelDataJson] || {};
                this.isInitFinished = true;
            }, JsonAsset, false);
        });
    }

    public static setStorageName(name: string) {
        this._storageName = name;
    }

    public static setLevelDataConfig(bound: string, jsonName: string) {
        this._levelDataBound = bound;
        this._levelDataJson = jsonName;
    }

    private static copyObject(oldData: any, newData: any) {
        for (let key in newData) {
            switch (typeof newData[key]) {
                case "number":
                case "boolean":
                case "string": {
                    oldData[key] = undefined !== oldData[key] ? oldData[key] : newData[key];
                    break;
                }
                case "object": {
                    if (Array.isArray(newData[key])) {
                        if (undefined == oldData[key]) {
                            oldData[key] = [].concat(newData[key]);
                        }
                    } else {
                        if (undefined == oldData[key]) oldData[key] = {};
                        this.copyObject(oldData[key], newData[key]);
                    }
                    break;
                }
            }
        }
    }
}
