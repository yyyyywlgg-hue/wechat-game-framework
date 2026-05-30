export class BasicSystem {
    public static isInit = false;
    public static isInitFinished = false;
    public static init(d?: any) { }
    public static destroy() {
        this.isInit = false;
        this.isInitFinished = false;
    }
}
