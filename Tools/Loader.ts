/**
 * 资源加载管理器
 * 提供子包（Bundle）加载、资源加载、文件夹加载、场景加载等功能，
 * 并支持加载进度条显示、遮罩屏蔽输入、加载重试、排队加载等机制。
 * 所有加载方法均为静态方法，全局统一管理加载流程。
 */

import { Asset, assetManager, BlockInputEvents, clamp01, error, log, Node, ProgressBar } from "cc";
import GlobalData from "../Config/GlobalData";
import { GlobalEnum } from "../Config/GlobalEnum";
import { clog } from "./ColorLog";

/**
 * 加载选项接口
 * 用于配置加载行为的可选参数
 */
export interface LoaderOptions {
    /** 是否显示遮罩，阻止用户输入 */
    mask?: boolean;
    /** 是否插入到加载队列前方（优先加载） */
    insert?: boolean;
    /** 加载超时时间（毫秒） */
    timeout?: number;
    /** 加载失败重试次数 */
    retryCount?: number;
}

/**
 * 资源加载管理类
 * 管理子包加载队列、资源加载、进度条显示等，所有方法为静态方法
 */
export default class Loader {
    /** 已加载的文件夹资源缓存，键为路径，值为资源数组 */
    protected static dirAsset: { [key: string]: Asset[] } = {};
    /** 已加载的单个资源缓存，键为路径，值为资源对象 */
    protected static singleAsset: { [key: string]: Asset } = {};

    /** 加载 UI 是否已初始化 */
    private static isInitLoaderUI = false;
    /** 加载 UI 相关数据，包含 UI 节点、进度条组件和输入屏蔽组件 */
    private static loadUIData: { ui: Node, progressBar: ProgressBar, blockInput: BlockInputEvents } =
        { ui: null, progressBar: null, blockInput: null };

    /**
     * 初始化加载 UI
     * 从 Canvas 中查找名为 'LoaderUI' 的子节点，获取进度条和输入屏蔽组件
     * 仅在首次调用时执行初始化
     */
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

    /**
     * 显示进度条
     * 同时显示遮罩屏蔽用户输入
     * @param rate 可选的进度比例（0~1），当前未使用
     */
    protected static showProgressBar(rate?: number) {
        this.showMask();
        if (this.loadUIData.ui) {
            this.loadUIData.ui.active = true;
        }
    }

    /**
     * 更新进度条进度
     * @param completedCount 已完成加载的资源数量
     * @param totalCount 总资源数量
     * @param item 当前加载项信息
     */
    protected static updateProgress(completedCount: number, totalCount: number, item: any) {
        let rate = clamp01(completedCount / totalCount);
        if (this.loadUIData.progressBar) {
            this.loadUIData.progressBar.progress = clamp01(rate);
        }
    }

    /**
     * 隐藏进度条
     * 同时隐藏遮罩恢复用户输入
     */
    protected static hideProgressBar() {
        if (this.loadUIData.ui) {
            this.loadUIData.ui.active = false;
        }
        this.hideMask();
    }

    /**
     * 显示输入屏蔽遮罩
     * 启用 BlockInputEvents 组件，阻止用户在加载期间进行操作
     */
    protected static showMask() {
        if (this.loadUIData.blockInput) {
            this.loadUIData.blockInput.enabled = true;
        }
    }

    /**
     * 隐藏输入屏蔽遮罩
     * 禁用 BlockInputEvents 组件，恢复用户操作
     */
    protected static hideMask() {
        if (this.loadUIData.blockInput) {
            this.loadUIData.blockInput.enabled = false;
        }
    }

    /** 子包加载记录映射表，键为子包名称，值为加载记录对象 */
    protected static subpackageRecords: { [name: string]: SubpackageRecord } = {};
    /** 子包加载队列，按顺序存储待加载的子包名称 */
    protected static subpackageSequence: string[] = [];

    /**
     * 加载子包（对外接口）
     * 初始化加载 UI 后调用内部加载方法
     * @param name 子包名称
     * @param cb 加载完成回调函数
     * @param mask 是否显示遮罩，默认 false
     * @param insert 是否插入到队列前方优先加载，默认 false
     */
    public static loadBundle(name: string, cb?: Function, mask = false, insert: boolean = false) {
        this.initLoaderUI();
        this.loadSubpackage(name, cb, mask, insert);
    }

    /**
     * 加载子包（内部实现）
     * 根据子包当前状态执行不同的处理逻辑：
     * - inited: 新子包，加入加载队列
     * - waiting: 已在队列中等待，追加回调和遮罩设置
     * - turnTo: 即将轮到加载，追加回调并启动加载
     * - loading: 正在加载中，追加回调
     * - finished: 已加载完成，直接执行回调
     * @param name 子包名称
     * @param cb 加载完成回调函数
     * @param mask 是否显示遮罩
     * @param insert 是否插入到队列前方
     */
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

    /**
     * 执行子包加载
     * 调用 assetManager.loadBundle 加载子包，支持失败重试（最多2次）
     * 加载完成后从队列中移除，并触发队列中下一个子包的加载
     * @param name 子包名称
     * @param retryCount 当前重试次数
     */
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

    /** 子包加载进度定时器 ID */
    protected static subpackageProgressTimer: number = null;
    /** 子包加载模拟进度值（0~1 循环） */
    protected static subpackageProgress: number = 0;

    /**
     * 显示子包加载进度
     * 启动定时器模拟进度条动画，进度值在 0~1 之间循环
     */
    protected static showSubpackageProgress() {
        if (null === this.subpackageProgressTimer) {
            this.showProgressBar();
            this.subpackageProgress = 0;
            this.subpackageProgressTimer = setInterval(this.updateSubpackageProgress.bind(this), 100);
        }
    }

    /**
     * 更新子包加载模拟进度
     * 每次增加 0.03，达到 1 后重置为 0，形成循环效果
     */
    protected static updateSubpackageProgress() {
        this.subpackageProgress += 0.03;
        if (this.subpackageProgress >= 1) {
            this.subpackageProgress = 0;
        }
    }

    /**
     * 隐藏子包加载进度
     * 当所有队列中的子包都不再需要遮罩时，停止定时器并隐藏进度条
     */
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

    /**
     * 从指定子包中加载单个资源
     * @param bundle 子包名称
     * @param url 资源路径
     * @param cb 加载完成回调，参数为加载到的资源对象
     * @param type 资源类型（typeof Asset）或布尔值（作为 mask 参数）。不传时默认显示遮罩
     * @param mask 是否显示遮罩。type 为 Asset 类型时默认 true
     */
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

    /**
     * 从指定子包中加载多个资源
     * @param bundle 子包名称
     * @param urls 资源路径数组
     * @param cb 加载完成回调，参数为加载到的资源数组
     * @param type 资源类型（typeof Asset）或布尔值（作为 mask 参数）。不传时默认显示进度条
     * @param mask 是否显示进度条。type 为 Asset 类型时默认 true
     */
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

    /**
     * 从指定子包中加载整个文件夹的资源
     * @param bundle 子包名称
     * @param dir 文件夹路径
     * @param cb 加载完成回调，参数为加载到的资源数组
     * @param type 资源类型（typeof Asset）或布尔值（作为 mask 参数）。不传时默认显示进度条
     * @param mask 是否显示进度条。type 为 Asset 类型时默认 true
     */
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

    /**
     * 从指定子包中加载场景资源
     * @param bundle 子包名称
     * @param scene 场景名称
     * @param cb 加载完成回调，参数为场景资源对象
     * @param mask 是否显示进度条，默认 true
     */
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

    /**
     * 预加载指定子包中的单个资源（不等待完成）
     * @param bundle 子包名称
     * @param url 资源路径
     * @param assetType 可选的资源类型
     */
    public static preLoadBundleRes(bundle: string, url: string, assetType?: typeof Asset) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        if (assetType) {
            b.preload(url, assetType);
        } else {
            b.preload(url);
        }
    }

    /**
     * 预加载指定子包中的多个资源（不等待完成）
     * @param bundle 子包名称
     * @param urls 资源路径数组
     * @param assetType 可选的资源类型
     */
    public static preLoadBundleArray(bundle: string, urls: string[], assetType?: typeof Asset) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        if (assetType) {
            b.preload(urls, assetType);
        } else {
            b.preload(urls);
        }
    }

    /**
     * 预加载指定子包中整个文件夹的资源（不等待完成）
     * @param bundle 子包名称
     * @param dir 文件夹路径
     * @param assetType 可选的资源类型
     */
    public static preLoadBundleDir(bundle: string, dir: string, assetType?: typeof Asset) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        if (assetType) {
            b.preloadDir(dir, assetType);
        } else {
            b.preloadDir(dir);
        }
    }

    /**
     * 预加载指定子包中的场景资源（不等待完成）
     * @param bundle 子包名称
     * @param scene 场景名称
     */
    public static preLoadBundleScene(bundle: string, scene: string) {
        let b = assetManager.getBundle(bundle);
        if (!b) return;
        b.preloadScene(scene);
    }
}

/**
 * 子包加载记录
 * 记录单个子包的加载状态、回调列表和遮罩计数
 */
class SubpackageRecord {
    /** 子包名称 */
    public name: string;
    /** 当前加载状态 */
    public state: LoadState;
    /** 加载完成回调列表 */
    public cbs: Function[];
    /** 需要遮罩的请求数量，用于判断是否可以隐藏遮罩 */
    public maskCount: number;

    /**
     * 构造函数
     * @param name 子包名称
     * @param cb 加载完成回调
     * @param mask 是否需要遮罩
     */
    constructor(name: string, cb: Function, mask: boolean) {
        this.name = name;
        this.state = LoadState.inited;
        this.cbs = [];
        if (cb) this.pushCb(cb);
        this.maskCount = mask ? 1 : 0;
    }

    /**
     * 追加回调函数和遮罩计数
     * @param cb 加载完成回调
     * @param mask 是否需要遮罩，为 true 时遮罩计数加1
     */
    public pushCb(cb: Function, mask?: boolean) {
        if (cb) this.cbs.push(cb);
        if (mask) this.maskCount++;
    }

    /** 进入等待队列，状态设为 waiting */
    public enterSequence() { this.state = LoadState.waiting; }

    /** 开始加载，状态设为 loading */
    public loadStart() { this.state = LoadState.loading; }

    /**
     * 加载完成处理
     * 依次执行所有回调函数，状态设为 finished，重置遮罩计数
     */
    public loadFinish() {
        while (this.cbs.length > 0) {
            let cb = this.cbs.shift();
            if (cb) cb();
        }
        this.state = LoadState.finished;
        this.maskCount = 0;
    }

    /** 轮到加载，状态设为 turnTo */
    public turnToLoad() { this.state = LoadState.turnTo; }
}

/**
 * 加载状态枚举
 * 标识子包在加载流程中的不同阶段
 */
enum LoadState {
    /** 已初始化，尚未加入队列 */
    inited = 1,
    /** 在队列中等待加载 */
    waiting,
    /** 正在加载中 */
    loading,
    /** 加载完成 */
    finished,
    /** 轮到加载（即将开始） */
    turnTo,
}
