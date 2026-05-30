/**
 * EventManager.ts
 * 全局事件管理器，采用静态类设计，提供事件的注册、注销、触发等功能。
 * 支持持久事件（on）和一次性事件（once）两种监听模式，
 * 并提供按类型、按处理器、按目标等多种注销方式。
 * 所有事件类型使用数字枚举，通过 Handler 类封装回调与目标。
 */

/** 事件处理器类，封装回调函数、执行目标及唯一标识，用于事件的精确匹配与移除 */
export class Handler {

    /** 全局自增 ID 计数器，确保每个 Handler 实例拥有唯一标识 */
    private static idCount = 0;

    /** 当前 Handler 实例的唯一标识 */
    private _id: number;

    /** 获取 Handler 的唯一标识 */
    public get id() { return this._id; }

    /** 事件触发时执行的回调函数 */
    public cb: Function;

    /** 回调函数的执行上下文（this 指向） */
    public target: Object;

    /**
     * 构造函数，创建事件处理器实例并分配唯一 ID
     * @param cb 回调函数
     * @param target 回调函数的执行上下文
     */
    constructor(cb: Function, target: Object) {
        this._id = Handler.idCount++;
        this.target = target;
        this.cb = cb;
    }

    /**
     * 判断当前 Handler 是否与指定的回调和目标匹配
     * @param cb 待比较的回调函数
     * @param target 待比较的执行上下文
     * @returns 回调和目标均相等时返回 true
     */
    equal(cb: Function, target: Object): boolean {
        return this.target === target && this.cb == cb;
    }
}

/** 全局事件管理器，管理所有事件的注册、注销和分发 */
export default class EventManager {

    /** 持久事件监听器字典，按事件类型分组存储 Handler 数组 */
    private static events: { [type: number]: Handler[] } = {};

    /** 一次性事件监听器字典，按事件类型分组存储 Handler 数组 */
    private static onceEvents: { [type: number]: Handler[] } = {};

    /** 事件触发总次数计数器，可用于调试或性能监控 */
    private static _emitCount: number = 0;

    /** 获取事件触发总次数 */
    public static get emitCount() { return this._emitCount; }

    /**
     * 注册持久性事件监听。同一事件类型下，相同的回调和目标不会重复注册。
     * @param type 事件类型（数字枚举值）
     * @param cb 事件回调函数
     * @param target 回调函数的执行上下文
     * @returns 返回新创建的 Handler，若已存在相同监听则返回 null
     */
    public static on(type: number, cb: Function, target: Object): Handler {
        if (!this.events.hasOwnProperty(type)) {
            this.events[type] = [];
        }
        for (let i = this.events[type].length - 1; i >= 0; --i) {
            if (this.events[type][i].equal(cb, target)) {
                return null;
            }
        }
        let h = new Handler(cb, target);
        this.events[type].push(h);
        return h;
    }

    /**
     * 注册一次性事件监听，事件触发后自动移除。同一事件类型下，相同的回调和目标不会重复注册。
     * @param type 事件类型（数字枚举值）
     * @param cb 事件回调函数
     * @param target 回调函数的执行上下文
     * @returns 返回新创建的 Handler，若已存在相同监听则返回 null
     */
    public static once(type: number, cb: Function, target: Object): Handler {
        if (!this.onceEvents.hasOwnProperty(type)) {
            this.onceEvents[type] = [];
        }
        for (let i = this.onceEvents[type].length - 1; i >= 0; --i) {
            if (this.onceEvents[type][i].equal(cb, target)) {
                return null;
            }
        }
        let h = new Handler(cb, target);
        this.onceEvents[type].push(h);
        return h;
    }

    /**
     * 注销事件监听，支持多种调用方式：
     * 1. 仅传入 type：移除该类型下所有监听器
     * 2. 传入 type + Handler 实例：按 Handler ID 精确移除
     * 3. 传入 type + 回调函数 + target：按回调和目标匹配移除
     * @param type 事件类型
     * @param h Handler 实例或回调函数，可选
     * @param target 回调函数的执行上下文，当 h 为 Function 时使用，可选
     */
    public static off(type: number | string, h?: Handler | Function, target?: Object) {
        if (!h) {
            this.events[type] = [];
            this.onceEvents[type] = [];
            return;
        }
        if (h instanceof Handler) {
            this._removeHandler(this.events, type, h);
            this._removeHandler(this.onceEvents, type, h);
        } else {
            this._removeByCbTarget(this.events, type, h, target);
            this._removeByCbTarget(this.onceEvents, type, h, target);
        }
    }

    /**
     * 批量注销同一事件类型下的多个 Handler
     * @param type 事件类型
     * @param h 要移除的 Handler 数组
     */
    public static offGroup(type: number | string, h: Handler[]) {
        for (let i = h.length - 1; i >= 0; --i) {
            this._removeHandler(this.events, type, h[i]);
            this._removeHandler(this.onceEvents, type, h[i]);
        }
    }

    /**
     * 注销指定目标（target）上的所有事件监听。
     * 遍历所有事件类型，移除 target 匹配的全部 Handler。
     * @param target 要注销的目标对象
     */
    public static targetOff(target: Object) {
        for (let key in this.events) {
            let arr = this.events[key];
            for (let i = arr.length - 1; i >= 0; --i) {
                if (arr[i].target === target) {
                    arr.splice(i, 1);
                }
            }
        }
        for (let key in this.onceEvents) {
            let arr = this.onceEvents[key];
            for (let i = arr.length - 1; i >= 0; --i) {
                if (arr[i].target === target) {
                    arr.splice(i, 1);
                }
            }
        }
    }

    /**
     * 触发指定类型的事件，通知所有监听该事件的回调函数执行。
     * 先执行持久事件回调，再执行一次性事件回调，执行后自动清除一次性监听器。
     * @param type 事件类型（数字枚举值）
     * @param args 传递给事件回调的可变参数
     */
    public static emit(type: number, ...args: any[]) {
        this._emitCount++;
        if (this.events.hasOwnProperty(type)) {
            let handlers = this.events[type];
            for (let i = 0; i < handlers.length; ++i) {
                handlers[i].cb.apply(handlers[i].target, args);
            }
        }
        if (this.onceEvents.hasOwnProperty(type)) {
            let handlers = this.onceEvents[type];
            for (let i = 0; i < handlers.length; ++i) {
                handlers[i].cb.apply(handlers[i].target, args);
            }
            delete this.onceEvents[type];
        }
    }

    /**
     * 重置事件管理器，清空所有事件监听和触发计数。
     * 通常在场景切换或游戏重启时调用。
     */
    public static reset() {
        this.events = {};
        this.onceEvents = {};
        this._emitCount = 0;
    }

    /**
     * 根据 Handler 实例的 ID 从指定事件字典中移除匹配的处理器。
     * 找到匹配项后立即移除并跳出循环（ID 唯一，最多匹配一个）。
     * @param dict 事件字典（events 或 onceEvents）
     * @param type 事件类型
     * @param h 要移除的 Handler 实例
     */
    private static _removeHandler(dict: { [type: string | number]: Handler[] }, type: string | number, h: Handler) {
        if (dict.hasOwnProperty(type)) {
            for (let i = dict[type].length - 1; i >= 0; --i) {
                if (dict[type][i].id == h.id) {
                    dict[type].splice(i, 1);
                    break;
                }
            }
        }
    }

    /**
     * 根据回调函数和目标从指定事件字典中移除匹配的处理器。
     * 找到匹配项后立即移除并跳出循环（同一回调和目标最多注册一次）。
     * @param dict 事件字典（events 或 onceEvents）
     * @param type 事件类型
     * @param cb 要移除的回调函数
     * @param target 回调函数的执行上下文，可选
     */
    private static _removeByCbTarget(dict: { [type: string | number]: Handler[] }, type: string | number, cb: Function, target?: Object) {
        if (dict.hasOwnProperty(type)) {
            for (let i = dict[type].length - 1; i >= 0; --i) {
                if (dict[type][i].equal(cb, target)) {
                    dict[type].splice(i, 1);
                    break;
                }
            }
        }
    }
}
