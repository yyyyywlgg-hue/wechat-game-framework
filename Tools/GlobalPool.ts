import { Prefab, Node, instantiate } from "cc";
import { BasicComponent } from "../Basic/BasicComponent";

export default class GlobalPool {
    private static allPools: { [prefabName: string]: AutoNodePool } = {};

    public static createPool(prefabName: string, prefab: Prefab): void {
        if (!this.allPools.hasOwnProperty(prefabName)) {
            this.allPools[prefabName] = new AutoNodePool(prefab);
        }
    }

    public static get(nodeName: string, data?: any): Node {
        if (!this.allPools[nodeName]) {
            console.warn("对象池不存在：", nodeName);
            return null;
        }
        return this.allPools[nodeName].get(data);
    }

    public static put(node: Node, nodeName?: string) {
        if (!node) return;
        if (!nodeName) nodeName = node.name;
        if (!this.allPools[nodeName]) {
            console.warn("对象池不存在，将销毁节点：", nodeName);
            let js = node.getComponent(nodeName) as any;
            if (js && js.unuse) {
                js.unuse();
            }
            node.destroy();
            return;
        }
        this.allPools[nodeName].put(node);
    }

    public static putAllChildren(node: Node, sameNode: boolean = false) {
        if (!node || node.children.length == 0) return;
        if (sameNode) {
            let nodeName = node.children[0].name;
            if (this.allPools[nodeName]) {
                let pool = this.allPools[nodeName];
                for (let i = node.children.length - 1; i >= 0; --i) {
                    pool.put(node.children[i]);
                }
            } else {
                for (let i = node.children.length - 1; i >= 0; --i) {
                    let js = node.children[i].getComponent(nodeName) as any;
                    if (js && js.unuse) {
                        js.unuse();
                    }
                    node.children[i].destroy();
                }
            }
        } else {
            for (let i = node.children.length - 1; i >= 0; --i) {
                this.put(node.children[i]);
            }
        }
    }

    public static clear(nodeName?: string) {
        if (nodeName) {
            if (this.allPools.hasOwnProperty(nodeName)) {
                this.allPools[nodeName].clear();
                delete this.allPools[nodeName];
            }
        } else {
            for (let key in this.allPools) {
                this.allPools[key].clear();
            }
            this.allPools = {};
        }
    }

    public static preCreate(nodeName: string, count: number) {
        if (this.allPools[nodeName]) {
            this.allPools[nodeName].preCreate(count);
        } else {
            console.warn("对象池不存在，无法预创建：", nodeName);
        }
    }

    public static hasPool(nodeName: string): boolean {
        return this.allPools.hasOwnProperty(nodeName);
    }

    public static getPoolSize(nodeName: string): number {
        if (!this.allPools[nodeName]) return 0;
        return this.allPools[nodeName].size;
    }

    public static getPoolNames(): string[] {
        return Object.keys(this.allPools);
    }
}

export class AutoNodePool {
    private prefab: Prefab;
    private pool: { [key: string]: { cmp: BasicComponent, node: Node } };
    private keyArr: string[] = [];

    constructor(prefab: Prefab) {
        this.prefab = prefab;
        this.pool = {};
        this.keyArr = [];
    }

    public get size(): number { return this.keyArr.length; }

    public get(data?: any): Node {
        if (this.keyArr.length > 0) {
            let key = this.keyArr.pop();
            let ele = this.pool[key];
            ele.cmp && ele.cmp.reuse(data);
            ele.node.active = true;
            delete this.pool[key];
            return ele.node;
        } else {
            let node = instantiate(this.prefab);
            let cmp = node.getComponent(BasicComponent);
            cmp && cmp.init(data);
            node.active = true;
            return node;
        }
    }

    public put(node: Node) {
        if (!node) return;
        let cmp = node.getComponent(BasicComponent);
        if (cmp && cmp.unuse) {
            cmp.unuse();
        }
        node.removeFromParent();
        node.active = false;

        let key = node.uuid;
        if (this.keyArr.indexOf(key) < 0) {
            this.keyArr.push(key);
            if (!this.pool[key]) {
                this.pool[key] = { cmp: cmp, node: node };
            }
        }
    }

    public clear() {
        for (const key in this.pool) {
            let rec = this.pool[key];
            if (rec.cmp && rec.cmp.unuse) {
                rec.cmp.unuse();
            }
            rec.node.destroy();
        }
        this.pool = {};
        this.keyArr = [];
    }

    public preCreate(count: number) {
        let c = count - this.keyArr.length;
        if (c <= 0) return;
        for (let i = 0; i < c; ++i) {
            let node = instantiate(this.prefab);
            let cmp = node.getComponent(BasicComponent);
            cmp && cmp.init();
            this.put(node);
        }
    }
}
