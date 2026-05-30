/**
 * 存储系统接口
 * 定义存储系统的公共API，用于依赖注入和解耦
 * 业务代码通过此接口访问存储功能，而非直接引用 StorageSystem 静态类
 */
export interface IStorage {
    /** 获取存档数据对象 */
    getData(): any;
    /** 获取指定名称的JSON配置数据 */
    getJsonData(key: string): any;
    /** 修改存档数据并可选立即保存 */
    setData(cb: (d: any) => void, isSave?: boolean): void;
    /** 通知用户资产变化，触发UI更新 */
    updateToAssets(isAnim?: boolean, isMask?: boolean): void;
    /** 手动保存存档到本地存储 */
    saveData(): void;
    /** 获取指定关卡的数据配置 */
    getLevelData(lv?: number): any;
    /** 获取最大关卡数量 */
    getMaxLvCount(): number;
}
