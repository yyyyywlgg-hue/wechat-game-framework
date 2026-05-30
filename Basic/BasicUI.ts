/**
 * BasicUI.ts
 * 游戏框架中所有 UI 面板的基类，继承自 BasicComponent。
 * 提供统一的 UI 显示/隐藏生命周期管理，配合 UIManager 使用。
 * 子类通过重写 onShow、onHide 等钩子方法实现 UI 的自定义显示与隐藏逻辑。
 */

import { _decorator } from 'cc';
import { BasicComponent } from './BasicComponent';
const { ccclass } = _decorator;

/** UI 面板基类，封装 show/hide 生命周期与 UI 数据管理 */
@ccclass('BasicUI')
export class BasicUI extends BasicComponent {

    /** UI 面板关联的数据对象，在 show 时传入并缓存 */
    protected _uiData: any = null;

    /**
     * 显示 UI 面板，执行顺序：
     * 1. 缓存传入数据
     * 2. 激活节点使其可见
     * 3. 注册事件监听
     * 4. 调用 onShow 钩子
     * @param d 显示时传入的数据，可选
     */
    public show(d?: any) {
        this._uiData = d;
        this.node.active = true;
        this.onEvents();
        this.onShow(d);
    }

    /**
     * 隐藏 UI 面板，执行顺序：
     * 1. 隐藏节点
     * 2. 注销事件监听
     * 3. 调用 onHide 钩子
     * @param d 隐藏时传入的数据，可选
     */
    public hide(d?: any) {
        this.node.active = false;
        this.offEvents();
        this.onHide(d);
    }

    /**
     * UI 显示后的钩子方法，子类在此方法中实现 UI 显示时的自定义逻辑
     * （如数据绑定、动画播放等）
     * @param d 显示时传入的数据，可选
     */
    protected onShow(d?: any) { }

    /**
     * UI 隐藏后的钩子方法，子类在此方法中实现 UI 隐藏时的自定义逻辑
     * （如状态清理、动画停止等）
     * @param d 隐藏时传入的数据，可选
     */
    protected onHide(d?: any) { }

    /**
     * 获取 UI 面板关联的数据对象
     * @returns show 时传入的数据对象
     */
    public get uiData() { return this._uiData; }
}
