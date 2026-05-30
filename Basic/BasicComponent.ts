import { Component } from 'cc';
import EventManager, { Handler } from '../Managers/EventManager';

export class BasicComponent extends Component {
    private events: { [type: number]: Handler[] } = {};
    private onceEvents: { [type: number]: Handler[] } = {};

    public init(data?: any) {
        this.initSub(data);
        this.onEvents();
        this.setData(data);
    }
    protected initSub(data?: any) { }
    protected onEvents() { }
    protected setData(data?: any) { }

    public reuse(data?: any) {
        this.reset();
        this.onEvents();
        this.setData(data);
    }
    public unuse() {
        this.reset();
        this.offEvents();
    }
    public reset() { }

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

    public emit(type: number, ...args: any[]) {
        EventManager.emit(type, ...args);
        if (this.onceEvents.hasOwnProperty(type)) delete this.onceEvents[type];
    }

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

    public hasEvent(type: number): boolean {
        return (this.events.hasOwnProperty(type) && this.events[type].length > 0) ||
            (this.onceEvents.hasOwnProperty(type) && this.onceEvents[type].length > 0);
    }

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

    public customUpdate(dt: number) { }
    public customLateUpdate(dt: number) { }

    public onDestroy() {
        this.offEvents();
    }
}
