import { _decorator } from 'cc';
import { BasicComponent } from './BasicComponent';
const { ccclass } = _decorator;

@ccclass('BasicUI')
export class BasicUI extends BasicComponent {
    protected _uiData: any = null;

    public show(d?: any) {
        this._uiData = d;
        this.node.active = true;
        this.onEvents();
        this.onShow(d);
    }

    public hide(d?: any) {
        this.node.active = false;
        this.offEvents();
        this.onHide(d);
    }

    protected onShow(d?: any) { }
    protected onHide(d?: any) { }

    public get uiData() { return this._uiData; }
}
