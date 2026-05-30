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

@ccclass('GameDirector')
export class GameDirector extends Component {
    private _levelManager: Node = null;
    private _isOver = false;

    protected onLoad() {
        this.onEvents();
    }

    protected onEvents() {
        EventManager.on(EventTypes.GameEvents.GameStart, this.onGameStart, this);
        EventManager.on(EventTypes.GameEvents.GameOver, this.onGameOver, this);
        EventManager.on(EventTypes.GameEvents.SetLevelManagerEnable, this.onSetLevelManagerEnable, this);
        EventManager.on(EventTypes.GameEvents.SetTouchMaskEnable, this.onSetTouchMaskEnable, this);
        EventManager.on(EventTypes.GameEvents.LoadSubPkg, this.onLoadSubPkg, this);
    }

    private subPackgeArr: string[] = ['Game', 'Effect', 'Roles'];
    private subPackgeRec: { [bound: string]: boolean } = {};

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

    private isLoadFinish = false;

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

    private customPrefabUrl: { [bound: string]: string } = {
        'Game': 'Prefabs',
        'Effect': 'Prefabs',
    };
    private customPrefabState: { [bound: string]: boolean } = {};

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

    private preLoadCfg: { [name: string]: number } = {};

    private preLoadPrefabs() {
        for (const key in this.preLoadCfg) {
            if (Object.prototype.hasOwnProperty.call(this.preLoadCfg, key)) {
                const num = this.preLoadCfg[key];
                GlobalPool.preCreate(key, num);
            }
        }
    }

    private _touchMask: Node = null;

    protected onSetTouchMaskEnable(isEnable = false) {
        if (!this._touchMask) {
            let cvs = GlobalData.get<Node>(GlobalEnum.GlobalDataType.Canvas);
            this._touchMask = cvs?.getChildByName('TouchMask');
        }
        if (this._touchMask) this._touchMask.active = isEnable;
    }

    protected onSetLevelManagerEnable(isEnable: boolean) {
        if (undefined == isEnable || !this._levelManager) return;
        this._levelManager.active = isEnable;
    }

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

    private _tmpLoadState: { [bound: string]: boolean } = {};

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

    public setSubPackages(arr: string[]) {
        this.subPackgeArr = arr;
    }

    public setCustomPrefabUrl(cfg: { [bound: string]: string }) {
        this.customPrefabUrl = cfg;
    }

    public setPreLoadCfg(cfg: { [name: string]: number }) {
        this.preLoadCfg = cfg;
    }
}
