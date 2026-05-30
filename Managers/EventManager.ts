export default class EventManager {
    private static events: { [type: number]: Handler[] } = {};
    private static onceEvents: { [type: number]: Handler[] } = {};
    private static _emitCount: number = 0;

    public static get emitCount() { return this._emitCount; }

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

    public static offGroup(type: number | string, h: Handler[]) {
        for (let i = h.length - 1; i >= 0; --i) {
            this._removeHandler(this.events, type, h[i]);
            this._removeHandler(this.onceEvents, type, h[i]);
        }
    }

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

    public static reset() {
        this.events = {};
        this.onceEvents = {};
        this._emitCount = 0;
    }

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

export class Handler {
    private static idCount = 0;
    private _id: number;
    public get id() { return this._id; }
    public cb: Function;
    public target: Object;

    constructor(cb: Function, target: Object) {
        this._id = Handler.idCount++;
        this.target = target;
        this.cb = cb;
    }

    equal(cb: Function, target: Object): boolean {
        return this.target === target && this.cb == cb;
    }
}
