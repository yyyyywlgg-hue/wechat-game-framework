export default class GlobalData {
    protected static data: { [type: number]: any } = {};

    public static get<T = any>(type: number): T {
        return this.data[type] as T;
    }

    public static set<T = any>(type: number, value: T): void {
        this.data[type] = value;
    }

    public static has(type: number): boolean {
        return this.data.hasOwnProperty(type);
    }

    public static remove(type: number): void {
        delete this.data[type];
    }

    public static clear(): void {
        this.data = {};
    }
}
