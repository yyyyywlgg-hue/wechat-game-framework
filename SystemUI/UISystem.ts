/**
 * UI系统模块
 * 负责管理游戏内所有UI界面的加载、显示、隐藏和层级排序。
 * 采用栈结构管理当前活跃的UI，支持优先级排序、模态遮罩和返回键关闭等功能。
 */

import { IUI } from '../Interfaces/IUI';
import { _decorator, Node, Prefab, instantiate } from 'cc';
import { BasicSystem } from '../Basic/BasicSystem';
import { BasicUI } from '../Basic/BasicUI';
import { clog } from '../Tools/ColorLog';
import GlobalPool from '../Tools/GlobalPool';
import Loader from '../Tools/Loader';
import { UIEnum } from './UIEnum';

/** UI显示选项配置接口 */
export interface UIOptions {
    /** UI优先级，数值越大越靠前显示，默认为0 */
    priority?: number;
    /** 是否为模态UI（模态UI会阻挡下层交互） */
    modal?: boolean;
    /** 是否支持返回键关闭，默认为true */
    closeOnBack?: boolean;
}

/** UI记录接口，存储单个UI的运行时信息 */
interface UIRecord {
    /** UI组件实例，继承自BasicUI */
    cmp: BasicUI;
    /** UI节点实例 */
    node: Node;
    /** UI优先级 */
    priority: number;
    /** 是否为模态UI */
    modal: boolean;
    /** 是否支持返回键关闭 */
    closeOnBack: boolean;
}

/** UI系统类，管理所有UI界面的生命周期和层级关系 */
@_decorator.ccclass('UISystem')
export class UISystem extends BasicSystem implements IUI {
    /** UI层节点，所有UI界面的父节点 */
    private static uiLayer: Node;
    /** UI记录字典，键为UI名称，值为UIRecord */
    private static uiRecs: { [ui: string]: UIRecord } = {};
    /** UI资源所在的Bundle名称，默认为'UI' */
    private static uiBound: string = 'UI';
    /** 活跃UI栈，按优先级排序，栈顶为最上层UI */
    private static activeStack: string[] = [];
    /** 自定义预制体在Bundle中的相对路径，默认为'Assets/CustomPerfabs' */
    private static _customPrefabUrl: string = 'Assets/CustomPerfabs';

    /**
     * 初始化UI系统
     * @param uiLayer UI层的父节点，UI界面将作为其子节点挂载
     */
    public static init(uiLayer: Node) {
        if (this.isInit) return;
        this.isInit = true;
        this.uiLayer = uiLayer;
        this.uiRecs = {};
        this.activeStack = [];
        this.loadUIBound();
    }

    /**
     * 显示指定UI界面
     * 如果UI尚未加载，会先从Bundle中加载预制体并实例化
     * @param ui UI名称，对应UIEnum中的枚举值
     * @param d 传递给UI的显示数据，可选
     * @param options UI显示选项（优先级、模态、返回键关闭），可选
     */
    public static showUI(ui: string, d?: any, options?: UIOptions) {
        this.loadUI(ui, (node: Node) => {
            let record = this.uiRecs[ui];
            if (options) {
                record.priority = options.priority ?? 0;
                record.modal = options.modal ?? false;
                record.closeOnBack = options.closeOnBack ?? true;
            }
            record.cmp.show(d);
            this.pushToStack(ui);
            clog.log('show UI:', ui);
        });
    }

    /**
     * 隐藏指定UI界面
     * @param ui UI名称
     * @param d 传递给UI的隐藏数据，可选
     */
    public static hideUI(ui: string, d?: any) {
        if (this.uiRecs[ui]) {
            this.uiRecs[ui].cmp.hide(d);
            this.removeFromStack(ui);
            clog.warn('hide UI:', ui);
        }
    }

    /**
     * 隐藏栈顶UI界面
     * @param d 传递给UI的隐藏数据，可选
     * @returns 被隐藏的UI名称，如果栈为空则返回null
     */
    public static hideTopUI(d?: any): string | null {
        if (this.activeStack.length === 0) return null;
        let topUI = this.activeStack[this.activeStack.length - 1];
        this.hideUI(topUI, d);
        return topUI;
    }

    /** 隐藏所有活跃的UI界面，并清空活跃栈 */
    public static hideAllUI() {
        for (let i = this.activeStack.length - 1; i >= 0; --i) {
            let ui = this.activeStack[i];
            if (this.uiRecs[ui]) {
                this.uiRecs[ui].cmp.hide();
            }
        }
        this.activeStack = [];
    }

    /**
     * 判断指定UI是否正在显示中
     * @param ui UI名称
     * @returns 是否正在显示
     */
    public static isUIShowing(ui: string): boolean {
        return this.activeStack.indexOf(ui) >= 0;
    }

    /**
     * 获取当前栈顶UI名称
     * @returns 栈顶UI名称，栈为空时返回null
     */
    public static getTopUI(): string | null {
        if (this.activeStack.length === 0) return null;
        return this.activeStack[this.activeStack.length - 1];
    }

    /**
     * 获取当前活跃UI栈的副本
     * @returns 活跃UI名称数组的浅拷贝
     */
    public static getActiveStack(): string[] {
        return [...this.activeStack];
    }

    /**
     * 将UI压入活跃栈
     * 如果UI已在栈中，先移除再重新压入，然后按优先级重新排序
     * @param ui UI名称
     */
    private static pushToStack(ui: string) {
        let idx = this.activeStack.indexOf(ui);
        if (idx >= 0) this.activeStack.splice(idx, 1);
        this.activeStack.push(ui);
        this.sortStack();
    }

    /**
     * 从活跃栈中移除指定UI
     * @param ui UI名称
     */
    private static removeFromStack(ui: string) {
        let idx = this.activeStack.indexOf(ui);
        if (idx >= 0) this.activeStack.splice(idx, 1);
    }

    /** 按优先级对活跃栈进行升序排序，优先级高的UI在栈顶 */
    private static sortStack() {
        this.activeStack.sort((a, b) => {
            let ra = this.uiRecs[a];
            let rb = this.uiRecs[b];
            let pa = ra ? ra.priority : 0;
            let pb = rb ? rb.priority : 0;
            return pa - pb;
        });
    }

    /** 加载UI资源Bundle，加载完成后继续加载自定义预制体 */
    private static loadUIBound() {
        Loader.loadBundle(this.uiBound, () => {
            this.loadUICustomPerfabs(() => {
                this.isInitFinished = true;
            });
        });
    }

    /**
     * 加载UI Bundle中的自定义预制体，并注册到全局对象池
     * @param cb 加载完成回调函数
     */
    private static loadUICustomPerfabs(cb: Function) {
        Loader.loadBundleDir(this.uiBound, this._customPrefabUrl, (perfabs: Prefab[]) => {
            for (let i = 0; i < perfabs.length; i++) {
                const p = perfabs[i];
                GlobalPool.createPool(p.data.name, p);
            }
            cb && cb();
        }, Prefab, true);
    }

    /**
     * 加载指定UI的预制体并实例化到场景中
     * 如果UI已加载过，直接使用缓存的记录
     * @param ui UI名称
     * @param cb 加载完成回调，传入实例化的节点
     */
    private static loadUI(ui: string, cb: (node: Node) => void) {
        if (!this.uiRecs[ui]) {
            Loader.loadBundleRes(this.uiBound, ui + "/" + ui, (res: Prefab) => {
                if (!res) {
                    console.error('UI不存在:', ui);
                    return;
                }
                let node = instantiate(res);
                node.active = false;
                let cmp = node.getComponent(BasicUI);
                let parent = this.uiLayer.getChildByName(ui);
                if (parent) {
                    node.parent = parent;
                } else {
                    console.error('UILayer 子节点中不存在:', ui);
                    return;
                }
                this.uiRecs[ui] = { cmp, node, priority: 0, modal: false, closeOnBack: true };
                cb && cb(node);
            }, Prefab, true);
        } else {
            cb && cb(this.uiRecs[ui].node);
        }
    }

    /**
     * 设置自定义预制体的Bundle内相对路径
     * @param url 自定义预制体路径
     */
    public static setCustomPrefabUrl(url: string) {
        this._customPrefabUrl = url;
    }

    /**
     * 设置UI资源所在的Bundle名称
     * @param bound Bundle名称
     */
    public static setUIBound(bound: string) {
        this.uiBound = bound;
    }
}
