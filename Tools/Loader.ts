import { Asset, assetManager, BlockInputEvents, clamp1, Label, log, Node, ProgressBar } from "cc";
import GlobalData from "../Config/GlobalData";
import { GlobalEnum } from "../Config/GlobalEnum";
import { clog } from "./ColorLog";

export interface LoaderOptions {
    mask?: boolean;
    insert?: boolean;
    timeout?: number;
    retryCount?: number;
}

export default class Loader {
    protected static dirAsset: { [key: string]: Asset[] } = {};
    protected static singleAsset: { [key: string]: Asset } = {};

    private static isInitLoaderUI = false;
    private static loadUIData: { ui: Node, progressBar: ProgressBar, blockInput: BlockInputEvents } =
        { ui: null, progressBar: null, blockInput: null };

    public static initLoaderUI() {
        if (this.isInitLoaderUI) return;
        let cvas = GlobalData.get<Node>(GlobalEnum.GlobalDataType.Canvas);
        if (!cvas) return;
        let ui = cvas.getChildByName('LoaderUI');
        if (!ui) return;
        this.loadUIData.ui = ui;
        this.loadUIData.progressBar = ui.getComponentInChildren(ProgressBar);
        this.loadUIData.blockInput = ui.getComponent(BlockInputEvents);
        this.isInitLoaderUI = true;
    }

    protected static showProgressBar(rate?: number) {
        this.showMask();
        if (this.loadUIData.ui) {
            this.loadUIData.ui.active = true;
        }
    }

    protected static updateProgress(completedCount: number, totalCount: number, item: any) {
        let rate = clamp1(completedCount / totalCount);
        if (this.loadUIData.progressBar) {
            this.loadUIData.progressBar.progress = clamp1(rate);
        }
    }

    protected static hideProgressBar() {
        if (this.loadUIData.ui) {
            this.loadUIData.ui.active = false;
        }
        this.hideMask();
    }

    protected static showMask() {
        if (this.loadUIData.blockInput) {
            this.loadUIData.blockInput.enabled = true;
        }
    }

    protected static hideMask() {
        if (this.loadUIData.blockInput) {
            this.loadUIData.blockInput.enabled = false;
        }
    }

    protected static subpackageRecords: { [name: string]: SubpackageRecord } = {};
    protected static subpackageSequence: string[] = [];

    public static loadBundle(name: string, cb?: Function, mask = false, insert: boolean = false) {
        this.initLoaderUI();
        this.loadSubpackage(name, cb, mask, insert);
    }

    private static loadSubpackage(name: string, cb?: Function, mask?: boolean, insert?: boolean) {
        if (undefined === mask) mask = false;
        if (undefined === insert) insert = false;

        let record = this.subpackageRecords[name];
        if (!record) {
            record = new SubpackageRecord(name, cb, mask);
            this.subpackageRecords[name] = record;
        }
        switch (record.state) {
            case LoadState.inited: {
                if (mask) this.showSubpackageProgress();
                if (insert && this.subpackageSequence.length > 0) {
                    this.subpackageSequence.splice(1, 0, name);
                    record.enterSequence();
                } else {
                    this.subpackageSequence.push(name);
                    if (this.subpackageSequence.length > 1) {
                        record.enterSequence();
                    } else {
                        this._loadSubpackage(name);
                    }
                }
                break;
            }
            case LoadState.waiting: {
                if (mask) this.showSubpackageProgress();
                record.pushCb(cb, mask);
                if (insert && this.subpackageSequence.length > 0) {
                    let index = this.subpackageSequence.indexOf(name);
                    if (index > 1) {
                        this.subpackageSequence.splice(index, 1);
                        this.subpackageSequence.splice(1, 0, name);
                        record.enterSequence();
                    }
                }
                break;
            }
            case LoadState.turnTo: {
                if (mask) this.showSubpackageProgress();
                record.pushCb(cb, mask);
                this._loadSubpackage(name);
                break;
            }
            case LoadState.loading: {
                if (mask) this.showSubpackageProgress();
                record.pushCb(cb, mask);
                break;
            }
            case LoadState.finished: {
                setTimeout(() => {
                    cb && cb();
                }, 0);
                break;
            }
        }
    }

    private static _loadSubpackage(name: string, retryCount = 0) {
        clog.log("Loader: 开始加载子包：", name);
        this.subpackageRecords[name].loadStart();

        assetManager.loadBundle(name, (err, bundle) => {
            if (err) {
                clog.error("Loader: 子包加载出错：", name);
                clog.error(err.message || err);
                if (retryCount < 2) {
                    clog.warn("Loader: 重试加载子包：", name, `(${retryCount + 1}/2)`);
                    this._loadSubpackage(name, retryCount + 1);
                    return;
                }
                this.subpackageRecords[name].loadFinish();
                this.hideSubpackageProgress();
                return;
            }
            clog.log("Loader: 子包加载完成：", name);
            let index = this.subpackageSequence.indexOf(name);
            this.subpackageSequence.splice(index, 1);
            this.hideSubpackageProgress();
            this.subpackageRecords[name].loadFinish();
            if (this.subpackageSequence.length > 0) {
                let str = this.subpackageSequence[0];
                let record = this.subpackageRecords[str];
                if (record) {
                    record.turnToLoad();
                }
                this.loadSubpackage(str, null, !!this.subpackageRecords[str].maskCount);
            }
        });
    }

    protected static subpackageProgressTimer: number = null;
    protected static subpackageProgress: number = 0;

    protected static showSubpackageProgress() {
        if (null === this.subpackageProgressTimer) {
            this.showProgressBar();
            this.subpackageProgress = 0;
            this.subpackageProgressTimer = setInterval(this.updateSubpackageProgress.bind(this), 100);
        }
    }

    protected static updateSubpackageProgress() {
        this.subpackageProgress += 0.03;
        if (this.subpackageProgress >= 1) {
            this.subpackageProgress = 0;
        }
    }

    protected static hideSubpackageProgress() {
        if (null !== this.subpackageProgressTimer) {
            let count = 0;
            for (let i = this.subpackageSequence.length - 1; i >= 0; --i) {
                count += this.subpackageRecords[this.subpackageSequence[i]].maskCount;
            }
            if (count == 0) {
                clearInterval(this.subpackageProgressTimer);
                this.subpackageProgressTimer = null;
                this.subpackageProgress = 0;
                this.hideProgressBar();
            }
        }
    }

    public static loadBundleRes(bundle: string, url: string, cb: (asset: any) => void, type?: typeof Asset | boolean, mask?: boolean) {
        let b = assetManager.getBundle(bundle);
        if (!b) {
            console.error("资源包 " + bundle + " 尚未加载，无法获取资源:", url);
            cb(null);
            return;
        }
        let assetType = null;
        if (undefined === type) {
            mask = true;
        } else if (typeof type === "boolean") {
            mask = !!type;
        } else {
            assetType = type;
            if (undefined === mask) mask = true;
        }
        if (mask) this.showMask();
        if (assetType) {
            b.load(url, assetType, (err, res) => {
                if (mask) this.hideMask();
                if (err) {
                    error(err.message || err);
                    cb(null);
                    return;
                }
                cb(res);
            });
        } else {
            b.load(url, (err, res) => {
                if (mask) this.hideMask();
                if (err) {
                    error(err.message || err);
                    cb(null);
                    return;
                }
                cb(res);
            });
        }
    }

    public static loadBundleArray(bundle: string, urls: string[], cb: (assets: any) => void, type?: typeof Asset | boolean, mask?: boolean) {
        let b = assetManager.getBundle(bundle);
        if (!b) {
            console.error("资源包 " + bundle + " 尚未加载，无法获取资源数组:", urls);
            cb(null);
            return;
        }
        let assetType = null;
        if (undefined === type) {
            mask = true;
        } else if (typeof type === "boolean") {
            mask = !!type;
        } else {
            assetType = type;
            if (undefined === mask) mask = true;
        }
        if (mask) this.showProgressBar();
        if (assetType) {
            b.load(urls, assetType, this.updateProgress.bind(this), (err, res) => {
                if (mask) this.hideProgressBar();
                if (err) { error(err.message || err); cb(null); return; }
                cb(res);
            });
        } else {
            b.load(urls, this.updateProgress.bind(this), (err, res) => {
                if (mask) this.hideProgressBar();
                if (err) { error(err.message || err); cb(null); return; }
                cb(res);
            });
        }
    }

    public static loadBundleDir(bundle: string, dir: string, cb: (assets: any[]) => void, type?: typeof Asset | boolean, mask?: boolean) {
        let b = assetManager.getBundle(bundle);
        if (!b) {
            console.error("资源包 " + bundle + " 尚未加载，无法获取资源文件夹:", dir);
            cb(null);
            return;
        }
        let assetType = null;
        if (undefined === type) {
            mask = true;
        } else if (typeof type === "boolean") {
            mask = !!type;
        } else {
            assetType = type;
            if (undefined === mask) mask = true;
        }
        if (mask) this.showProgressBar();
        if (assetType) {
            b.loadDir(dir, assetType, this.updateProgress.bind(this), (err, arr) => {
                if (mask) this.hideProgressBar();
                if (err) { log(err); cb(null); return; }
                cb(arr);
            });
        } else {
            b.loadDir(dir, this.updateProgress.bind(this), (err, arr) => {
                if (mask) this.hideProgressBar();
                if (err) { log(err); cb(null); return; }
                cb(arr);
            });
        }
    }

    public static loadBundleScene(bundle: string, scene: string, cb: (res: any) => void, mask?: boolean) {
        let b = assetManager.getBundle(bundle);
        if (!b) {
            console.error("资源包 " + bundle + " 尚未加载，无法加载场景:", scene);
            cb(null);
            return;
        }
        if (undefined === mask) mask = true;
        if (mask) this.showProgressBar();
        b.loadScene(scene, this.updateProgress.bind(this), (err, res) => {
            if (mask) this.hideProgressBar();
            if (err) { console.error(err); return; }
            cb(res);
        });
    }

    public static preLoadBundleRes(bundle: string, url: string, assetType?: typeof Asset) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        if (assetType) {
            b.preload(url, assetType);
        } else {
            b.preload(url);
        }
    }

    public static preLoadBundleArray(bundle: string, urls: string[], assetType?: typeof Asset) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        if (assetType) {
            b.preload(urls, assetType);
        } else {
            b.preload(urls);
        }
    }

    public static preLoadBundleDir(bundle: string, dir: string, assetType?: typeof Asset) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        if (assetType) {
            b.preloadDir(dir, assetType);
        } else {
            b.preloadDir(dir);
        }
    }

    public static preLoadBundleScene(bundle: string, scene: string) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        b.preloadScene(scene);
    }
}

class SubpackageRecord {
    public name: string;
    public state: LoadState;
    public cbs: Function[];
    public maskCount: number;

    constructor(name: string, cb: Function, mask: boolean) {
        this.name = name;
        this.state = LoadState.inited;
        this.cbs = [];
        if (cb) this.pushCb(cb);
        this.maskCount = mask ? 1 : 0;
    }

    public pushCb(cb: Function, mask?: boolean) {
        if (cb) this.cbs.push(cb);
        if (mask) this.maskCount++;
    }
    public enterSequence() { this.state = LoadState.waiting; }
    public loadStart() { this.state = LoadState.loading; }
    public loadFinish() {
        while (this.cbs.length > 0) {
            let cb = this.cbs.shift();
            if (cb) cb();
        }
        this.state = LoadState.finished;
        this.maskCount = 0;
    }
    public turnToLoad() { this.state = LoadState.turnTo; }
}

enum LoadState {
    inited = 1,
    waiting,
    loading,
    finished,
    turnTo,
}
