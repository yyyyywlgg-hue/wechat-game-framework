/**
 * SDK系统接口
 * 定义SDK系统的公共API，用于依赖注入和解耦
 * 业务代码通过此接口访问SDK功能，而非直接引用 SDKSystem 静态类
 */
export interface ISDK {
    /** 当前运行平台类型 */
    readonly curPlatform: number;
    /** 当前SDK实例 */
    readonly curSDK: any;
    /** 初始化SDK系统 */
    init(d?: any): void;
}
