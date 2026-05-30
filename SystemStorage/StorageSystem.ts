/**
 * 存储系统模块
 * 负责游戏数据的持久化存储和读取，使用localStorage实现本地存档。
 * 支持存档数据的合并迁移（新增字段自动补全）、关卡数据加载、JSON配置数据缓存等功能。
 */

import { JsonAsset, sys } from "cc";
import { BasicSystem } from "../Basic/BasicSystem";
import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { clog } from "../Tools/ColorLog";
import Loader from "../Tools/Loader";
import { StorageTemp } from "./StorageTemp";

/** 存储系统类，管理游戏数据的持久化和关卡配置数据的加载 */
export class StorageSystem extends BasicSystem {
    /** localStorage存储的键名，默认为'GameFramework01' */
    private static _storageName = 'GameFramework01';
    /** 当前游戏存档数据实例 */
    private static _data: StorageTemp;
    /** 关卡数据所在的Bundle名称，默认为'LevelData' */
    private static _levelDataBound = 'LevelData';
    /** 关卡数据JSON文件名，默认为'LevelData' */
    private static _levelDataJson = 'LevelData';
    /** 关卡数据缓存，键为关卡编号，值为关卡配置数据 */
    private static _levelData: { [lv: number]: any } = {};
    /** 所有JSON配置数据缓存，键为JSON文件名，值为解析后的数据 */
    private static _allJsonData: { [name: string]: any } = {};

    /**
     * 初始化存储系统
     * 从localStorage读取存档数据，与默认模板合并后保存，并加载关卡配置数据
     * @param d 初始化参数（当前未使用），可选
     */
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

    /**
     * 获取当前游戏存档数据
     * @returns 存档数据对象
     */
    public static getData(): StorageTemp {
        return this._data;
    }

    /**
     * 根据键名获取JSON配置数据
     * @param key JSON文件名
     * @returns 对应的JSON数据
     */
    public static getJsonData(key: string) {
        return this._allJsonData[key];
    }

    /**
     * 通过回调函数修改存档数据
     * @param cb 修改数据的回调函数，参数为存档数据对象
     * @param isSave 是否在修改后立即保存到localStorage，默认为false
     */
    public static setData(cb: (d: StorageTemp) => void, isSave = false) {
        cb(this._data);
        if (isSave) this.saveData();
    }

    /**
     * 通知用户资产数据变更，触发UI更新
     * @param isAnim 是否播放动画效果，默认为false
     * @param isMask 是否显示遮罩，默认为true
     */
    public static updateToAssets(isAnim = false, isMask = true) {
        EventManager.emit(EventTypes.GameEvents.UserAssetsChanged, isAnim, isMask);
    }

    /** 将当前存档数据序列化并保存到localStorage */
    public static saveData() {
        try {
            sys.localStorage.setItem(this._storageName, JSON.stringify(this._data));
        } catch (e) {
            clog.error("存档保存失败", e);
        }
    }

    /**
     * 获取指定关卡的数据配置
     * @param lv 关卡编号，不传则使用当前关卡编号
     * @returns 关卡配置数据
     */
    public static getLevelData(lv?: number): any {
        if (undefined === lv) {
            lv = this._data.levelAssets?.curLv || 1;
        }
        return this._levelData[lv];
    }

    /**
     * 获取关卡总数
     * @returns 关卡数据中的关卡数量
     */
    public static getMaxLvCount() {
        return Object.keys(this._levelData).length;
    }

    /**
     * 从Bundle中加载关卡配置JSON数据
     * 加载完成后将所有JSON文件缓存到_allJsonData中，并标记初始化完成
     */
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

    /**
     * 设置localStorage存储的键名
     * @param name 存储键名
     */
    public static setStorageName(name: string) {
        this._storageName = name;
    }

    /**
     * 设置关卡数据的Bundle和JSON文件名配置
     * @param bound Bundle名称
     * @param jsonName JSON文件名
     */
    public static setLevelDataConfig(bound: string, jsonName: string) {
        this._levelDataBound = bound;
        this._levelDataJson = jsonName;
    }

    /**
     * 递归合并对象数据
     * 将新数据模板(newData)中的字段与旧数据(oldData)合并：
     * - 基本类型：旧数据有值则保留，无值则使用新数据的默认值
     * - 数组类型：旧数据无值则深拷贝新数据的数组
     * - 对象类型：旧数据无值则创建空对象，递归合并子字段
     * @param oldData 旧数据对象（从存档中读取）
     * @param newData 新数据模板对象（默认值）
     */
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
