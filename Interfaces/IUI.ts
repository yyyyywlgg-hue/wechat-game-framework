/**
 * UI系统接口
 * 定义UI系统的公共API，用于依赖注入和解耦
 * 业务代码通过此接口访问UI管理功能，而非直接引用 UISystem 静态类
 */
import { UIOptions } from '../SystemUI/UISystem';

export interface IUI {
    /** 初始化UI系统 */
    init(uiLayer: any): void;
    /** 显示指定UI面板 */
    showUI(ui: string, d?: any, options?: UIOptions): void;
    /** 隐藏指定UI面板 */
    hideUI(ui: string, d?: any): void;
    /** 隐藏最顶层的UI面板 */
    hideTopUI(d?: any): string | null;
    /** 隐藏所有UI面板 */
    hideAllUI(): void;
    /** 查询指定UI是否正在显示 */
    isUIShowing(ui: string): boolean;
    /** 获取当前最顶层的UI名称 */
    getTopUI(): string | null;
    /** 获取当前活跃的UI栈 */
    getActiveStack(): string[];
}
