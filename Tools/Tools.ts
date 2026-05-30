/**
 * 通用工具类
 * 提供数值处理、向量运算、时间格式化、尺寸缩放、随机数生成、
 * 数组操作、插值计算、角度转换、对象清理等常用工具方法。
 */

import { Vec2, Vec3, Vec4, v4, v3, v2, Size, size } from "cc";

/** 通用工具类，所有方法为静态方法，提供各种常用计算功能 */
export default class Tools {
    /**
     * 将数字四舍五入到指定小数位数
     * @param num 要处理的数字
     * @param n 保留的小数位数，0 则取整
     * @returns 四舍五入后的数字，n > 0 返回浮点数，n = 0 返回整数
     */
    public static roundNum(num: number, n: number): number {
        let str = num.toFixed(n);
        return n > 0 ? parseFloat(str) : parseInt(str);
    }

    /**
     * 将向量的各分量四舍五入到指定小数位数
     * 自动识别 Vec2/Vec3/Vec4 类型并返回对应类型的向量
     * @param vec 输入向量（Vec2、Vec3 或 Vec4）
     * @param n 保留的小数位数
     * @returns 各分量四舍五入后的新向量，类型与输入一致
     */
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

    /**
     * 将数字转换为简写字符串
     * 小于 1100 直接显示数字，1100~999999 显示为 "x.xK"，1000000 以上显示为 "x.xM"
     * @param v 输入数值
     * @returns 格式化后的字符串，如 "1.5K"、"2.3M"
     */
    public static convertToString(v: number) {
        if (v < 1100) return v.toString();
        if (v < 1000000) return (v * 0.001).toFixed(1) + "K";
        return (v * 0.000001).toFixed(1) + "M";
    }

    /**
     * 将秒数转换为分钟和秒的格式化字符串
     * @param num 秒数
     * @returns 包含 min（分钟）和 scend（秒）的对象，均为两位数字符串，如 { min: "02", scend: "05" }
     */
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

    /**
     * 将秒数转换为小时、分钟和秒的格式化字符串
     * @param num 秒数
     * @returns 包含 hour（小时）、min（分钟）和 scend（秒）的对象，均为两位数字符串
     */
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

    /**
     * 按最大边等比缩放尺寸
     * 将 Size 的较大边缩放到 maxnum，另一边按比例缩放
     * @param size 原始尺寸
     * @param maxnum 最大边的目标值
     * @param isSame 是否强制缩放（为 true 时即使尺寸未超出也会缩放，为 false 时仅在超出时缩放）
     * @returns 缩放后的尺寸（直接修改传入的 size 对象）
     */
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

    /**
     * 获取 1~max 之间的随机整数，排除指定值
     * @param max 随机数上限（包含）
     * @param except 要排除的值
     * @returns 不等于 except 的随机整数（1~max）
     */
    public static getRandomNum(max: number, except: number): number {
        if (max == except) return 1;
        let rand = except;
        do {
            rand = Math.floor(Math.random() * max) + 1;
        } while (rand == except);
        return rand;
    }

    /**
     * 从数组中随机获取一个元素
     * @param arr 源数组
     * @returns 随机选中的元素，数组为空时返回 null
     */
    public static getRandomFromArr(arr: any[]) {
        if (arr.length <= 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * 随机打乱数组（Fisher-Yates 洗牌算法变体）
     * 直接修改原数组
     * @param arr 要打乱的数组
     * @returns 打乱后的数组（与传入数组为同一引用）
     */
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

    /**
     * 三维向量插值（可分别指定各轴的插值比例）
     * 直接修改传入的 vec 对象
     * @param vec 起始向量（会被修改）
     * @param to 目标向量
     * @param ratioX X 轴插值比例（0~1，值越大越接近目标）
     * @param ratioY Y 轴插值比例，默认与 ratioX 相同
     * @param ratioZ Z 轴插值比例，默认与 ratioX 相同
     * @returns 插值后的向量（与 vec 为同一引用）
     */
    public static lerp(vec: Vec3, to: Vec3, ratioX: number, ratioY?: number, ratioZ?: number) {
        ratioY = ratioY ?? ratioX;
        ratioZ = ratioZ ?? ratioX;
        vec.x += ratioX * (to.x - vec.x);
        vec.y += ratioY * (to.y - vec.y);
        vec.z += ratioZ * (to.z - vec.z);
        return vec;
    }

    /**
     * 数值插值
     * @param num 起始值
     * @param to 目标值
     * @param ratio 插值比例（0~1，值越大越接近目标）
     * @returns 插值后的数值
     */
    public static numberLerp(num: number, to: number, ratio: number) {
        return num + ratio * (to - num);
    }

    /**
     * 将角度归一化到 0~360 度范围
     * @param ang 输入角度
     * @returns 0~360 范围内的角度值
     */
    public static getAngIn360(ang: number) {
        return (ang % 360 + 360) % 360;
    }

    /**
     * 将角度归一化到 -180~180 度范围
     * @param ang 输入角度
     * @returns -180~180 范围内的角度值
     */
    public static getAngIn180(ang: number) {
        ang = ang % 360;
        if (ang > 180) ang -= 360;
        if (ang < -180) ang += 360;
        return ang;
    }

    /**
     * 清空对象中的所有属性值
     * 将对象中所有自有属性的类型为 "object" 的值设为 null
     * @param obj 要清空的对象
     */
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
