import { Vec2, Vec3, Vec4, v4, v3, v2, Size, Sprite, UITransform, size, Color } from "cc";

export default class Tools {
    public static roundNum(num: number, n: number): number {
        let str = num.toFixed(n);
        return n > 0 ? parseFloat(str) : parseInt(str);
    }

    public static roundVec(vec: Vec2 | Vec3 | Vec4, n: number): Vec2 | Vec3 | Vec4 {
        let v = vec as any;
        if (v.w != undefined) {
            return v4(this.roundNum(v.x, n), this.roundNum(v.y, n), this.roundNum(v.z, n), this.roundNum(v.w, n));
        } else if (v.z != undefined) {
            return v3(this.roundNum(v.x, n), this.roundNum(v.y, n), this.roundNum(v.z, n));
        } else {
            return v2(this.roundNum(v.x, n), this.roundNum(v.y, n));
        }
    }

    public static convertToString(v: number) {
        if (v < 1100) return v.toString();
        if (v < 1000000) return (v * 0.001).toFixed(1) + "K";
        return (v * 0.000001).toFixed(1) + "M";
    }

    public static getMinByScend(num: number): { min: string, scend: string } {
        if (!num || num < 0) return { min: "00", scend: "00" };
        num = Math.ceil(num);
        let min = 0;
        let scend = num;
        if (scend >= 60) {
            min = Math.floor(scend / 60);
            scend = scend % 60;
        }
        let minStr = min >= 10 ? "" + min : "0" + min;
        let scendStr = scend >= 10 ? "" + scend : "0" + scend;
        return { min: minStr, scend: scendStr };
    }

    public static getTimeByScend(num: number): { hour: string, min: string, scend: string } {
        if (!num || num < 0) return { hour: '00', min: "00", scend: "00" };
        num = Math.ceil(num);
        let hour = Math.floor(num / 3600);
        let min = Math.floor(num / 60) - hour * 60;
        let scend = num - hour * 3600 - min * 60;
        let hourStr = hour >= 10 ? "" + hour : "0" + hour;
        let minStr = min >= 10 ? "" + min : "0" + min;
        let scendStr = scend >= 10 ? "" + scend : "0" + scend;
        return { hour: hourStr, min: minStr, scend: scendStr };
    }

    public static scaleSize(size: Size, maxnum: number, isSame = false) {
        if (!isSame && size.width <= maxnum && size.height <= maxnum) return size;
        let rate = 1;
        if (size.width > size.height) {
            rate = maxnum / size.width;
            size.height = rate * size.height;
            size.width = maxnum;
        } else {
            rate = maxnum / size.height;
            size.width = rate * size.width;
            size.height = maxnum;
        }
        return size;
    }

    public static getRandomNum(max: number, except: number): number {
        if (max == except) return 1;
        let rand = except;
        do {
            rand = Math.floor(Math.random() * max) + 1;
        } while (rand == except);
        return rand;
    }

    public static getRandomFromArr(arr: any[]) {
        if (arr.length <= 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    public static randomArr(arr: any[]): any[] {
        let len = arr.length;
        for (let i = 0; i < len - 1; i++) {
            let index = Math.floor(Math.random() * len);
            let temp = arr[index];
            arr[index] = arr[len - i - 1];
            arr[len - i - 1] = temp;
        }
        return arr;
    }

    public static lerp(vec: Vec3, to: Vec3, ratioX: number, ratioY?: number, ratioZ?: number) {
        ratioY = ratioY ?? ratioX;
        ratioZ = ratioZ ?? ratioX;
        vec.x += ratioX * (to.x - vec.x);
        vec.y += ratioY * (to.y - vec.y);
        vec.z += ratioZ * (to.z - vec.z);
        return vec;
    }

    public static numberLerp(num: number, to: number, ratio: number) {
        return num + ratio * (to - num);
    }

    public static getAngIn360(ang: number) {
        return (ang % 360 + 360) % 360;
    }

    public static getAngIn180(ang: number) {
        ang = ang % 360;
        if (ang > 180) ang -= 360;
        if (ang < -180) ang += 360;
        return ang;
    }

    public static clearObj(obj: any) {
        if (!obj) return;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (typeof obj[key] === "object") {
                    obj[key] = null;
                }
            }
        }
    }
}
