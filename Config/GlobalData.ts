/**
 * 全局数据管理器
 * 提供全局的数据存取功能，通过数字类型键（type）来存储和获取任意类型的数据。
 * 适用于在游戏各模块间共享全局数据，如画布节点、摄像机等。
 */

/** 全局数据管理类，使用静态方法提供全局数据的增删改查操作 */
export default class GlobalData {
    /** 数据存储对象，以数字类型为键，存储任意类型的值 */
    protected static data: { [type: number]: any } = {};

    /**
     * 根据类型键获取全局数据
     * @param type 数据类型键，对应 GlobalDataType 枚举值
     * @returns 对应类型的数据，如果不存在则返回 undefined
     */
    public static get<T = any>(type: number): T {
        return this.data[type] as T;
    }

    /**
     * 设置全局数据
     * @param type 数据类型键，对应 GlobalDataType 枚举值
     * @param value 要存储的数据值
     */
    public static set<T = any>(type: number, value: T): void {
        this.data[type] = value;
    }

    /**
     * 判断指定类型键的全局数据是否存在
     * @param type 数据类型键
     * @returns 存在返回 true，否则返回 false
     */
    public static has(type: number): boolean {
        return this.data.hasOwnProperty(type);
    }

    /**
     * 移除指定类型键的全局数据
     * @param type 要移除的数据类型键
     */
    public static remove(type: number): void {
        delete this.data[type];
    }

    /**
     * 清空所有全局数据
     * 将数据对象重置为空对象
     */
    public static clear(): void {
        this.data = {};
    }
}
