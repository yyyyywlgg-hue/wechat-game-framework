export class BasicLayer {
    protected _parent: any = null;

    constructor(parent: any) {
        this._parent = parent;
    }

    public initLayer() { }
    public reset() { }
    public setData(d?: any) { }
    public customUpdate(dt: number) { }
    public customLateUpdate(dt: number) { }
}
