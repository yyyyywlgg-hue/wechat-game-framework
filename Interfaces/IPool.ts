/**
 * 对象池接口
 * 定义对象池的公共API，用于依赖注入和解耦
 * 业务代码通过此接口访问对象池功能，而非直接引用 GlobalPool 静态类
 */
export interface IPool {
    /** 创建对象池 */
    createPool(prefabName: string, prefab: any): void;
    /** 从对象池获取节点实例 */
    get(nodeName: string, data?: any): any;
    /** 将节点实例回收到对象池 */
    put(node: any, nodeName?: string): void;
    /** 回收所有子节点到对象池 */
    putAllChildren(node: any, sameNode?: boolean): void;
    /** 清空对象池 */
    clear(nodeName?: string): void;
    /** 预创建对象池中的节点 */
    preCreate(nodeName: string, count: number): void;
    /** 查询对象池是否存在 */
    hasPool(nodeName: string): boolean;
    /** 获取对象池中可用节点数量 */
    getPoolSize(nodeName: string): number;
    /** 获取所有对象池名称 */
    getPoolNames(): string[];
}
