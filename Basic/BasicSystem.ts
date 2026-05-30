/**
 * BasicSystem.ts
 * 游戏框架中所有系统（System）的基类。
 * 系统类通常为纯逻辑单例，不依赖 Cocos Creator 的组件生命周期，
 * 用于管理全局性的游戏功能模块（如音效系统、资源系统等）。
 * 所有成员均为 static，子类应重写 init 和 destroy 方法来实现自身逻辑。
 */

/** 系统基类，提供统一的初始化与销毁模板，所有成员为静态方法/属性 */
export class BasicSystem {

    /** 标记系统是否已调用 init 方法进行初始化 */
    public static isInit = false;

    /** 标记系统是否已完成全部初始化流程（包括异步加载等） */
    public static isInitFinished = false;

    /**
     * 系统初始化方法，子类应重写此方法实现自身的初始化逻辑。
     * 调用后应将 isInit 设为 true。
     * @param d 初始化时传入的参数，可选
     */
    public static init(d?: any) { }

    /**
     * 系统销毁方法，重置初始化状态标志。
     * 子类若重写此方法，应先调用自身清理逻辑，再调用 super.destroy()。
     */
    public static destroy() {
        this.isInit = false;
        this.isInitFinished = false;
    }
}
