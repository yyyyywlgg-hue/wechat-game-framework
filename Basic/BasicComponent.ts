/**
 * BasicComponent.ts
 * 游戏框架中所有组件的基类，继承自 Cocos Creator 的 Component。
 * 提供统一的生命周期管理（初始化、复用、销毁）和事件监听/分发机制。
 * 子类可通过重写 initSub、onEvents、setData 等模板方法来实现自定义逻辑。
 */

import { Component } from 'cc';
import EventManager, { Handler } from '../Managers/EventManager';

/** 游戏组件基类，封装事件管理与生命周期模板方法 */
export class BasicComponent extends Component {

    /** 当前组件注册的持久事件监听器，按事件类型分组存储 */
    private events: { [type: number]: Handler[] } = {};

    /** 当前组件注册的一次性事件监听器，按事件类型分组存储 */
    private onceEvents: { [type: number]: Handler[] } = {};

    /**
     * 组件初始化入口方法，按顺序调用三个模板方法：
     * 1. initSub - 子类初始化
     * 2. onEvents - 注册事件监听
     * 3. setData - 设置数据
     * @param data 初始化时传入的数据，可选
     */
    public init(data?: any) {
        this.initSub(data);
        this.onEvents();
        this.setData(data);
    }

    /**
     * 子类初始化的钩子方法，用于执行子类特有的初始化逻辑
     * @param data 初始化时传入的数据，可选
     */
    protected initSub(data?: any) { }

    /**
     * 事件注册的钩子方法，子类在此方法中调用 on/once 注册事件监听
     */
    protected onEvents() { }

    /**
     * 数据设置的钩子方法，子类在此方法中根据传入数据更新自身状态
     * @param data 初始化时传入的数据，可选
     */
    protected setData(data?: any) { }

    /**
     * 组件复用方法，用于对象池场景下重新激活组件时调用。
     * 执行顺序：重置状态 → 注册事件 → 设置数据
     * @param data 复用时传入的数据，可选
     */
    public reuse(data?: any) {
        this.reset();
        this.onEvents();
        this.setData(data);
    }

    /**
     * 组件回收方法，用于对象池场景下组件被回收时调用。
     * 执行顺序：重置状态 → 注销事件
     */
    public unuse() {
        this.reset();
        this.offEvents();
    }

    /**
     * 重置组件状态的钩子方法，子类在此方法中清除自身数据恢复初始状态
     */
    public reset() { }

    /**
     * 注册持久性事件监听，事件触发后不会被自动移除，需手动调用 off 注销。
     * 同一事件类型、回调和目标不会重复注册。
     * @param type 事件类型（枚举值）
     * @param cb 事件回调函数
     * @param target 回调函数的执行上下文（this 指向）
     * @returns 返回事件处理器 Handler，若已存在相同监听则返回 null
     */
    public on(type: number, cb: Function, target: Object): Handler {
        let h = EventManager.on(type, cb, target);
        if (h) {
            if (!this.events.hasOwnProperty(type)) {
                this.events[type] = [];
            }
            this.events[type].push(h);
        }
        return h;
    }

    /**
     * 注册一次性事件监听，事件触发后自动移除。
     * 同一事件类型、回调和目标不会重复注册。
     * @param type 事件类型（枚举值）
     * @param cb 事件回调函数
     * @param target 回调函数的执行上下文（this 指向）
     * @returns 返回事件处理器 Handler，若已存在相同监听则返回 null
     */
    public once(type: number, cb: Function, target: Object): Handler {
        let h = EventManager.once(type, cb, target);
        if (h) {
            if (!this.onceEvents.hasOwnProperty(type)) {
                this.onceEvents[type] = [];
            }
            this.onceEvents[type].push(h);
        }
        return h;
    }

    /**
     * 触发指定类型的事件，通知所有监听该事件的回调函数执行。
     * 触发后会自动清除该类型下所有一次性监听器。
     * @param type 事件类型（枚举值）
     * @param args 传递给事件回调的可变参数
     */
    public emit(type: number, ...args: any[]) {
        EventManager.emit(type, ...args);
        if (this.onceEvents.hasOwnProperty(type)) delete this.onceEvents[type];
    }

    /**
     * 注销指定事件监听，同时从持久事件和一次性事件中查找并移除匹配的监听器。
     * @param type 事件类型（枚举值）
     * @param cb 要注销的回调函数
     * @param target 回调函数的执行上下文，用于精确匹配
     */
    public off(type: number, cb: Function, target: Object) {
        let events = this.events[type];
        if (events) {
            for (let i = events.length - 1; i >= 0; --i) {
                if (events[i].cb === cb && events[i].target === target) {
                    EventManager.off(type, events[i]);
                    events.splice(i, 1);
                }
            }
        }
        events = this.onceEvents[type];
        if (events) {
            for (let i = events.length - 1; i >= 0; --i) {
                if (events[i].cb === cb && events[i].target === target) {
                    EventManager.off(type, events[i]);
                    events.splice(i, 1);
                }
            }
        }
    }

    /**
     * 判断当前组件是否注册了指定类型的事件监听
     * @param type 事件类型（枚举值）
     * @returns 存在持久监听或一次性监听时返回 true，否则返回 false
     */
    public hasEvent(type: number): boolean {
        return (this.events.hasOwnProperty(type) && this.events[type].length > 0) ||
            (this.onceEvents.hasOwnProperty(type) && this.onceEvents[type].length > 0);
    }

    /**
     * 注销当前组件注册的所有事件监听，包括持久事件和一次性事件。
     * 通过 EventManager.offGroup 批量移除，并清空本地记录。
     */
    public offEvents() {
        for (let key in this.events) {
            EventManager.offGroup(+key, this.events[key]);
        }
        this.events = {};
        for (let key in this.onceEvents) {
            EventManager.offGroup(+key, this.onceEvents[key]);
        }
        this.onceEvents = {};
    }

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

    /**
     * 组件销毁时自动调用，确保注销所有事件监听，防止内存泄漏
     */
    public onDestroy() {
        this.offEvents();
    }
}
