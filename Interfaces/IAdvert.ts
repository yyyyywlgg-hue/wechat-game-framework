/**
 * 广告系统接口
 * 定义广告系统的公共API，用于依赖注入和解耦
 * 业务代码通过此接口访问广告功能，而非直接引用 AdvertSystem 静态类
 */
import { AdUIConfig } from '../SystemAdvert/AdvertSystem';

export interface IAdvert {
    /** 初始化广告系统 */
    init(uiLayer?: any): void;
    /** 设置指定平台的广告UI配置 */
    setAdUIConfig(platform: number, config: AdUIConfig): void;
}
