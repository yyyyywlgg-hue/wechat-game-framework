/**
 * 全局枚举定义
 * 定义游戏中使用的全局枚举类型，用于统一管理各类枚举常量。
 */

/** 全局枚举命名空间，包含所有全局枚举定义 */
export namespace GlobalEnum {
    /**
     * 全局数据类型枚举
     * 用于 GlobalData 中存取数据的键值，标识不同类型的全局数据
     */
    export enum GlobalDataType {
        /** 首页/入口场景 */
        Index = 0,
        /** 画布节点（Canvas） */
        Canvas,
        /** UI 摄像机 */
        CameraUI,
        /** 3D 摄像机 */
        Camera3D,
    }
}
