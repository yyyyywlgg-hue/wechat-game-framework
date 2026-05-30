/**
 * BasicLayer.ts
 * 游戏框架中逻辑层（Layer）的基类。
 * 与 BasicComponent 不同，Layer 不依赖 Cocos Creator 的组件系统，
 * 而是通过持有父级引用来与外部对象交互。
 * 适用于不需要挂载到节点上、但需要统一生命周期管理的逻辑模块
 * （如游戏逻辑层、数据层等）。
 */

/** 逻辑层基类，提供初始化、重置、数据设置和帧更新的模板方法 */
export class BasicLayer {

    /** 父级引用，用于与外部对象（如组件、管理器等）进行交互 */
    protected _parent: any = null;

    /**
     * 构造函数，保存父级引用
     * @param parent 父级对象引用
     */
    constructor(parent: any) {
        this._parent = parent;
    }

    /**
     * 层初始化的钩子方法，子类在此方法中执行初始化逻辑
     */
    public initLayer() { }

    /**
     * 重置层状态的钩子方法，子类在此方法中清除数据恢复初始状态
     */
    public reset() { }

    /**
     * 设置层数据的钩子方法，子类在此方法中根据传入数据更新自身状态
     * @param d 传入的数据，可选
     */
    public setData(d?: any) { }

    /**
     * 自定义帧更新的钩子方法，由外部调度器在每帧调用
     * @param dt 距上一帧的时间间隔（秒）
     */
    public customUpdate(dt: number) { }

    /**
     * 自定义延迟帧更新的钩子方法，由外部调度器在每帧后期调用
     * @param dt 距上一帧的时间间隔（秒）
     */
    public customLateUpdate(dt: number) { }
}
