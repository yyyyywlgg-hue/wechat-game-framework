/**
 * 全局对象池管理器
 * 提供节点对象的池化管理功能，通过复用节点来减少频繁创建和销毁带来的性能开销。
 * 支持对象池的创建、获取、回收、预创建、批量回收子节点等操作。
 * 配合 BasicComponent 的 init/reuse/unuse 生命周期方法使用。
 */

import { Prefab, Node, instantiate } from "cc";
import { BasicComponent } from "../Basic/BasicComponent";

/**
 * 全局对象池管理类
 * 管理所有预制体对应的对象池，提供统一的节点获取和回收接口
 */
export default class GlobalPool {
    /** 所有对象池的映射表，键为预制体名称，值为对应的自动节点池 */
    private static allPools: { [prefabName: string]: AutoNodePool } = {};

    /**
     * 创建对象池
     * 如果指定名称的对象池已存在，则不会重复创建
     * @param prefabName 预制体名称，作为对象池的唯一标识
     * @param prefab 预制体资源，用于实例化新节点
     */
    public static createPool(prefabName: string, prefab: Prefab): void {
        if (!this.allPools.hasOwnProperty(prefabName)) {
            this.allPools[prefabName] = new AutoNodePool(prefab);
        }
    }

    /**
     * 从对象池中获取一个节点
     * 如果池中有可用节点则复用，否则实例化新节点
     * @param nodeName 对象池名称（即预制体名称）
     * @param data 可选的初始化数据，传递给 BasicComponent 的 reuse 或 init 方法
     * @returns 获取到的节点，对象池不存在时返回 null
     */
    public static get(nodeName: string, data?: any): Node {
        if (!this.allPools[nodeName]) {
            console.warn("对象池不存在：", nodeName);
            return null;
        }
        return this.allPools[nodeName].get(data);
    }

    /**
     * 将节点回收到对象池
     * 如果对象池不存在，则调用节点的 unuse 方法后销毁节点
     * @param node 要回收的节点
     * @param nodeName 可选的对象池名称，不传则使用节点名称
     */
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

    /**
     * 将指定节点的所有子节点回收到各自的对象池
     * @param node 父节点，其所有子节点将被回收
     * @param sameNode 是否所有子节点为同一种类型。为 true 时统一处理提高效率，为 false 时逐个回收
     */
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

    /**
     * 清空对象池
     * @param nodeName 指定对象池名称则只清空该池，不传则清空所有对象池
     */
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

    /**
     * 预创建指定数量的节点到对象池中
     * 提前创建好节点，避免运行时实例化的卡顿
     * @param nodeName 对象池名称
     * @param count 预创建的节点数量
     */
    public static preCreate(nodeName: string, count: number) {
        if (this.allPools[nodeName]) {
            this.allPools[nodeName].preCreate(count);
        } else {
            console.warn("对象池不存在，无法预创建：", nodeName);
        }
    }

    /**
     * 判断指定名称的对象池是否存在
     * @param nodeName 对象池名称
     * @returns 存在返回 true，否则返回 false
     */
    public static hasPool(nodeName: string): boolean {
        return this.allPools.hasOwnProperty(nodeName);
    }

    /**
     * 获取指定对象池中可用节点的数量
     * @param nodeName 对象池名称
     * @returns 可用节点数量，对象池不存在时返回 0
     */
    public static getPoolSize(nodeName: string): number {
        if (!this.allPools[nodeName]) return 0;
        return this.allPools[nodeName].size;
    }

    /**
     * 获取所有对象池的名称列表
     * @returns 对象池名称数组
     */
    public static getPoolNames(): string[] {
        return Object.keys(this.allPools);
    }
}

/**
 * 自动节点池
 * 管理单个预制体对应的节点池，负责节点的获取（复用或新建）和回收
 */
export class AutoNodePool {
    /** 预制体资源，用于实例化新节点 */
    private prefab: Prefab;
    /** 节点池，以节点 uuid 为键存储节点及其组件引用 */
    private pool: { [key: string]: { cmp: BasicComponent, node: Node } };
    /** 可用节点的 uuid 键数组，用于快速获取和统计池中可用节点数 */
    private keyArr: string[] = [];

    /**
     * 构造函数
     * @param prefab 预制体资源
     */
    constructor(prefab: Prefab) {
        this.prefab = prefab;
        this.pool = {};
        this.keyArr = [];
    }

    /** 获取对象池中可用节点的数量 */
    public get size(): number { return this.keyArr.length; }

    /**
     * 从池中获取一个节点
     * 池中有可用节点时复用（调用 reuse），否则实例化新节点（调用 init）
     * @param data 可选的初始化/复用数据，传递给 BasicComponent 的 reuse 或 init 方法
     * @returns 获取到的节点
     */
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

    /**
     * 将节点回收到池中
     * 调用节点的 unuse 方法，从父节点移除并设为不可见
     * @param node 要回收的节点
     */
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

    /**
     * 清空对象池
     * 对所有池中节点调用 unuse 方法后销毁，并重置池数据
     */
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

    /**
     * 预创建节点到池中
     * 当池中可用节点数不足时，实例化新节点并回收到池中
     * @param count 需要的可用节点总数（非新增数量）
     */
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
