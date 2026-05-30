/**
 * 游戏导演模块
 * 负责游戏核心流程的控制，包括游戏开始、游戏结束、子包加载、
 * 自定义预制体加载、关卡管理器生命周期管理、触摸遮罩控制等。
 * 通过事件系统监听游戏事件，协调各模块完成游戏流程。
 */

import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import GlobalData from '../Config/GlobalData';
import { GlobalEnum } from '../Config/GlobalEnum';
import EventManager from '../Managers/EventManager';
import { EventTypes } from '../Managers/EventTypes';
import { PlatformType, SDKSystem } from '../SystemSDK/SDKSystem';
import { StorageSystem } from '../SystemStorage/StorageSystem';
import { UIEnum } from '../SystemUI/UIEnum';
import { UISystem } from '../SystemUI/UISystem';
import { clog } from '../Tools/ColorLog';
import GlobalPool from '../Tools/GlobalPool';
import Loader from '../Tools/Loader';
const { ccclass, property } = _decorator;

/** 游戏导演组件，控制游戏核心流程和资源加载 */
@ccclass('GameDirector')
export class GameDirector extends Component {
    /** 关卡管理器节点 */
    private _levelManager: Node = null;
    /** 游戏是否已结束的标志，防止重复触发结束逻辑 */
    private _isOver = false;

    /** 组件加载时注册事件监听 */
    protected onLoad() {
        this.onEvents();
    }

    /** 注册游戏相关的事件监听 */
    protected onEvents() {
        EventManager.on(EventTypes.GameEvents.GameStart, this.onGameStart, this);
        EventManager.on(EventTypes.GameEvents.GameOver, this.onGameOver, this);
        EventManager.on(EventTypes.GameEvents.SetLevelManagerEnable, this.onSetLevelManagerEnable, this);
        EventManager.on(EventTypes.GameEvents.SetTouchMaskEnable, this.onSetTouchMaskEnable, this);
        EventManager.on(EventTypes.GameEvents.LoadSubPkg, this.onLoadSubPkg, this);
    }

    /** 子包名称列表，游戏开始时按需加载 */
    private subPackgeArr: string[] = ['Game', 'Effect', 'Roles'];
    /** 子包加载状态记录，键为Bundle名，值为是否已加载 */
    private subPackgeRec: { [bound: string]: boolean } = {};

    /**
     * 加载子包资源
     * 遍历子包列表，逐个加载未加载的Bundle，所有子包加载完成后执行回调
     * @param cb 全部加载完成回调，可选
     */
    protected loadSubBound(cb?: Function) {
        if (this.subPackgeArr.length == 0) { cb && cb(); return; }

        let loadFinishCb = (boundName: string) => {
            this.subPackgeRec[boundName] = true;
            let isFinished = true;
            for (const key in this.subPackgeRec) {
                isFinished = isFinished && this.subPackgeRec[key];
            }
            if (isFinished) cb && cb();
        };

        for (let i = 0, c = this.subPackgeArr.length; i < c; ++i) {
            const boundName = this.subPackgeArr[i];
            if (undefined === this.subPackgeRec[boundName]) {
                this.subPackgeRec[boundName] = false;
            }
            if (!this.subPackgeRec[boundName]) {
                Loader.loadBundle(boundName, () => {
                    loadFinishCb(boundName);
                }, false, false);
            } else {
                loadFinishCb(boundName);
            }
        }
    }

    /** 游戏资源是否已加载完成的标志 */
    private isLoadFinish = false;

    /**
     * 加载游戏资源
     * 先加载自定义预制体并注册到对象池，然后创建关卡管理器节点
     * @param cb 加载完成回调，可选
     */
    private loadGameAssets(cb?: Function) {
        if (this.isLoadFinish) { cb && cb(); return; }
        this.loadCustomPrefabs(() => {
            this._levelManager = GlobalPool.get('LevelManager');
            if (this._levelManager) {
                this._levelManager.setPosition(Vec3.ZERO);
                this._levelManager.parent = this.node;
            }
            this.isLoadFinish = true;
            clog.log('游戏中预制体加载完成');
            cb && cb();
        });
    }

    /** 自定义预制体路径配置，键为Bundle名，值为预制体在Bundle内的相对路径 */
    private customPrefabUrl: { [bound: string]: string } = {
        'Game': 'Prefabs',
        'Effect': 'Prefabs',
    };
    /** 自定义预制体加载状态记录，键为Bundle名，值为是否已加载 */
    private customPrefabState: { [bound: string]: boolean } = {};

    /**
     * 加载自定义预制体并注册到全局对象池
     * 遍历customPrefabUrl配置，逐个Bundle加载预制体目录下的所有Prefab，
     * 加载完成后注册到GlobalPool中，所有Bundle加载完成后执行回调
     * @param cb 全部加载完成回调，可选
     */
    private loadCustomPrefabs(cb?: Function) {
        let loadPerfabFinish = (boundName: string) => {
            this.customPrefabState[boundName] = true;
            let isFinished = true;
            for (const key in this.customPrefabState) {
                isFinished = isFinished && this.customPrefabState[key];
            }
            if (isFinished) cb && cb();
        };

        for (const bound in this.customPrefabUrl) {
            if (undefined == this.customPrefabState[bound]) {
                this.customPrefabState[bound] = false;
            }
            if (!this.customPrefabState[bound]) {
                const url = this.customPrefabUrl[bound];
                Loader.loadBundle(bound, () => {
                    Loader.loadBundleDir(bound, url, (prefabs: Prefab[]) => {
                        for (let i = 0; i < prefabs.length; i++) {
                            const p = prefabs[i];
                            GlobalPool.createPool(p.data.name, p);
                        }
                        loadPerfabFinish(bound);
                    }, Prefab, false);
                }, false);
            } else {
                loadPerfabFinish(bound);
            }
        }
    }

    /** 预创建配置，键为预制体名称，值为预创建数量 */
    private preLoadCfg: { [name: string]: number } = {};

    /**
     * 根据预创建配置，提前创建对象池中的实例
     * 在游戏资源加载完成后调用，避免运行时动态创建的性能开销
     */
    private preLoadPrefabs() {
        for (const key in this.preLoadCfg) {
            if (Object.prototype.hasOwnProperty.call(this.preLoadCfg, key)) {
                const num = this.preLoadCfg[key];
                GlobalPool.preCreate(key, num);
            }
        }
    }

    /** 触摸遮罩节点引用 */
    private _touchMask: Node = null;

    /**
     * 设置触摸遮罩的启用状态
     * 遮罩启用时阻挡用户触摸操作，用于防止加载或过渡期间的误操作
     * @param isEnable 是否启用遮罩，默认为false
     */
    protected onSetTouchMaskEnable(isEnable = false) {
        if (!this._touchMask) {
            let cvs = GlobalData.get<Node>(GlobalEnum.GlobalDataType.Canvas);
            this._touchMask = cvs?.getChildByName('TouchMask');
        }
        if (this._touchMask) this._touchMask.active = isEnable;
    }

    /**
     * 设置关卡管理器的启用状态
     * @param isEnable 是否启用关卡管理器
     */
    protected onSetLevelManagerEnable(isEnable: boolean) {
        if (undefined == isEnable || !this._levelManager) return;
        this._levelManager.active = isEnable;
    }

    /**
     * 游戏开始事件处理
     * 流程：显示初始UI → 加载子包 → 加载游戏资源 → 预创建对象 → 激活关卡管理器 → 隐藏初始UI
     * @param cb 游戏开始完成回调，可选
     */
    protected onGameStart(cb?: Function) {
        EventManager.emit(EventTypes.GameEvents.SetInitUIEnable, true);
        this._isOver = false;
        this.loadSubBound(() => {
            this.loadGameAssets(() => {
                this.preLoadPrefabs();
                if (this._levelManager) this._levelManager.active = true;
                EventManager.emit(EventTypes.GameEvents.SetInitUIEnable, false);
                cb && cb();
            });
        });
    }

    /**
     * 游戏结束事件处理
     * 胜利时保存存档数据，然后重新显示主页UI
     * @param isWin 是否胜利
     */
    protected onGameOver(isWin: boolean) {
        if (this._isOver) return;
        this._isOver = true;
        UISystem.hideUI(UIEnum.HomeUI);
        if (isWin) {
            UISystem.showUI(UIEnum.HomeUI);
            StorageSystem.saveData();
        } else {
            UISystem.showUI(UIEnum.HomeUI);
        }
    }

    /** 临时加载状态记录，用于onLoadSubPkg方法 */
    private _tmpLoadState: { [bound: string]: boolean } = {};

    /**
     * 动态加载子包
     * 根据传入的配置数据，按需加载指定Bundle及其预制体资源
     * @param data 子包配置，键为Bundle名，值为配置对象：
     *   - isLoadPrefab: 是否加载预制体到对象池
     *   - prefabUrl: 预制体在Bundle内的路径
     *   - isMask: 加载时是否显示遮罩
     * @param cb 全部加载完成回调，可选
     */
    protected onLoadSubPkg(data: { [bound: string]: { isLoadPrefab: boolean, prefabUrl: string, isMask: boolean } }, cb?: Function) {
        this._tmpLoadState = {};
        let loadPerfabFinish = (boundName: string) => {
            this._tmpLoadState[boundName] = true;
            let isFinished = true;
            for (const key in this._tmpLoadState) {
                isFinished = isFinished && this._tmpLoadState[key];
            }
            if (isFinished) cb && cb();
        };

        for (const bound in data) {
            const d = data[bound];
            this._tmpLoadState[bound] = false;
            const isMask = d.isMask || false;
            Loader.loadBundle(bound, () => {
                if (d.isLoadPrefab) {
                    const url = d.prefabUrl || '';
                    Loader.loadBundleDir(bound, url, (prefabs: Prefab[]) => {
                        for (let i = 0; i < prefabs.length; i++) {
                            const p = prefabs[i];
                            GlobalPool.createPool(p.data.name, p);
                        }
                        loadPerfabFinish(bound);
                    }, Prefab, isMask);
                } else {
                    loadPerfabFinish(bound);
                }
            }, isMask);
        }
    }

    /**
     * 设置子包名称列表
     * @param arr 子包名称数组
     */
    public setSubPackages(arr: string[]) {
        this.subPackgeArr = arr;
    }

    /**
     * 设置自定义预制体路径配置
     * @param cfg 配置对象，键为Bundle名，值为预制体路径
     */
    public setCustomPrefabUrl(cfg: { [bound: string]: string }) {
        this.customPrefabUrl = cfg;
    }

    /**
     * 设置预创建配置
     * @param cfg 配置对象，键为预制体名称，值为预创建数量
     */
    public setPreLoadCfg(cfg: { [name: string]: number }) {
        this.preLoadCfg = cfg;
    }
}
