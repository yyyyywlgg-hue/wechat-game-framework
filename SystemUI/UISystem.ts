import { _decorator, Node, Prefab, instantiate } from 'cc';
import { BasicSystem } from '../Basic/BasicSystem';
import { BasicUI } from '../Basic/BasicUI';
import { clog } from '../Tools/ColorLog';
import GlobalPool from '../Tools/GlobalPool';
import Loader from '../Tools/Loader';
import { UIEnum } from './UIEnum';

export interface UIOptions {
    priority?: number;
    modal?: boolean;
    closeOnBack?: boolean;
}

interface UIRecord {
    cmp: BasicUI;
    node: Node;
    priority: number;
    modal: boolean;
    closeOnBack: boolean;
}

@_decorator.ccclass('UISystem')
export class UISystem extends BasicSystem {
    private static uiLayer: Node;
    private static uiRecs: { [ui: string]: UIRecord } = {};
    private static uiBound: string = 'UI';
    private static activeStack: string[] = [];
    private static _customPrefabUrl: string = 'Assets/CustomPerfabs';

    public static init(uiLayer: Node) {
        if (this.isInit) return;
        this.isInit = true;
        this.uiLayer = uiLayer;
        this.uiRecs = {};
        this.activeStack = [];
        this.loadUIBound();
    }

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

    public static hideUI(ui: string, d?: any) {
        if (this.uiRecs[ui]) {
            this.uiRecs[ui].cmp.hide(d);
            this.removeFromStack(ui);
            clog.warn('hide UI:', ui);
        }
    }

    public static hideTopUI(d?: any): string | null {
        if (this.activeStack.length === 0) return null;
        let topUI = this.activeStack[this.activeStack.length - 1];
        this.hideUI(topUI, d);
        return topUI;
    }

    public static hideAllUI() {
        for (let i = this.activeStack.length - 1; i >= 0; --i) {
            let ui = this.activeStack[i];
            if (this.uiRecs[ui]) {
                this.uiRecs[ui].cmp.hide();
            }
        }
        this.activeStack = [];
    }

    public static isUIShowing(ui: string): boolean {
        return this.activeStack.indexOf(ui) >= 0;
    }

    public static getTopUI(): string | null {
        if (this.activeStack.length === 0) return null;
        return this.activeStack[this.activeStack.length - 1];
    }

    public static getActiveStack(): string[] {
        return [...this.activeStack];
    }

    private static pushToStack(ui: string) {
        let idx = this.activeStack.indexOf(ui);
        if (idx >= 0) this.activeStack.splice(idx, 1);
        this.activeStack.push(ui);
        this.sortStack();
    }

    private static removeFromStack(ui: string) {
        let idx = this.activeStack.indexOf(ui);
        if (idx >= 0) this.activeStack.splice(idx, 1);
    }

    private static sortStack() {
        this.activeStack.sort((a, b) => {
            let ra = this.uiRecs[a];
            let rb = this.uiRecs[b];
            let pa = ra ? ra.priority : 0;
            let pb = rb ? rb.priority : 0;
            return pa - pb;
        });
    }

    private static loadUIBound() {
        Loader.loadBundle(this.uiBound, () => {
            this.loadUICustomPerfabs(() => {
                this.isInitFinished = true;
            });
        });
    }

    private static loadUICustomPerfabs(cb: Function) {
        Loader.loadBundleDir(this.uiBound, this._customPrefabUrl, (perfabs: Prefab[]) => {
            for (let i = 0; i < perfabs.length; i++) {
                const p = perfabs[i];
                GlobalPool.createPool(p.data.name, p);
            }
            cb && cb();
        }, Prefab, true);
    }

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

    public static setCustomPrefabUrl(url: string) {
        this._customPrefabUrl = url;
    }

    public static setUIBound(bound: string) {
        this.uiBound = bound;
    }
}
