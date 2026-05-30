/**
 * SDK系统模块
 * 负责检测当前运行平台并初始化对应的SDK实例。
 * 支持多平台识别：微信、OPPO、VIVO、抖音、QQ、魅族、华为、4399游戏盒、Android等。
 * 每个平台对应不同的SDK实现类，通过统一的SDK接口调用各平台功能。
 */

import { ISDK } from '../Interfaces/ISDK';
import { BasicSystem } from "../Basic/BasicSystem";
import { clog } from "../Tools/ColorLog";
import { OPPOSDK } from "./OPPOSDK";
import SDK from "./SDK";
import { TTSDK } from "./TTSDK";
import { VIVOSDK } from "./VIVOSDK";
import { WXSDK } from "./WXSDK";

/** 平台类型枚举，标识当前游戏运行的平台 */
export enum PlatformType {
    /** PC小游戏（默认/未知平台） */
    PCMiniGame,
    /** 微信小游戏 */
    WXMiniGame,
    /** OPPO小游戏 */
    OPPOMiniGame,
    /** VIVO小游戏 */
    VIVOMiniGame,
    /** 抖音小游戏 */
    TTMiniGame,
    /** QQ小游戏 */
    QQMiniGame,
    /** 魅族小游戏 */
    MEIZUMiniGame,
    /** 华为小游戏 */
    HUAWEIMiniGame,
    /** 4399游戏盒 */
    Gamebox4399,
    /** Android原生 */
    Android,
}

/** SDK系统类，负责平台检测和SDK实例化 */
export class SDKSystem extends BasicSystem implements ISDK {
    /** 当前运行平台类型，默认为PCMiniGame */
    private static _curPlatform: PlatformType = PlatformType.PCMiniGame;
    /** 当前平台的SDK实例 */
    public static get curPlatform(): PlatformType { return this._curPlatform; }
    private static _curSDK: SDK = null;

    public static get curSDK(): SDK { return this._curSDK; }

    /**
     * 初始化SDK系统
     * 检测当前运行平台并实例化对应的SDK
     * @param d 初始化参数（当前未使用），可选
     */
    public static init(d?: any) {
        if (this.isInit) return;
        this.isInit = true;
        this.checkPlatform();
        clog.warn('当前平台:' + PlatformType[this._curPlatform]);
    }

    /**
     * 检测当前运行平台
     * 通过检测全局变量（如wx、tt、qg等）判断当前平台，
     * 并实例化对应的SDK实现类。检测顺序：OPPO → VIVO → QQ → 抖音 → 魅族 → 微信 → 华为 → 4399 → Android → 默认
     */
    private static checkPlatform() {
        if (this._curSDK) return;

        if (typeof window['qg'] !== "undefined" && window['qg'].getProvider().toLowerCase().indexOf("oppo") > -1) {
            this._curPlatform = PlatformType.OPPOMiniGame;
            this.instanceSDK(new OPPOSDK());
            return;
        }
        if (typeof window['qg'] !== "undefined" && window['qg'].getProvider().toLowerCase().indexOf("vivo") > -1) {
            this._curPlatform = PlatformType.VIVOMiniGame;
            this.instanceSDK(new VIVOSDK());
            return;
        }
        if (typeof window['qq'] !== "undefined") {
            this._curPlatform = PlatformType.QQMiniGame;
            this.instanceSDK(new SDK());
            return;
        }
        if (typeof window['tt'] !== "undefined") {
            this._curPlatform = PlatformType.TTMiniGame;
            this.instanceSDK(new TTSDK());
            return;
        }
        if (typeof window['mz'] !== "undefined" && window['mz'].getProvider().toLowerCase().indexOf("meizu") > -1) {
            this._curPlatform = PlatformType.MEIZUMiniGame;
            this.instanceSDK(new SDK());
            return;
        }
        if (typeof window['wx'] !== "undefined") {
            this._curPlatform = PlatformType.WXMiniGame;
            this.instanceSDK(new WXSDK());
            return;
        }
        if (typeof window['hbs'] !== "undefined") {
            this._curPlatform = PlatformType.HUAWEIMiniGame;
            this.instanceSDK(new SDK());
            return;
        }
        if (typeof window['gamebox'] !== "undefined") {
            this._curPlatform = PlatformType.Gamebox4399;
            this.instanceSDK(new SDK());
            return;
        }
        if (typeof window.jsb !== "undefined" || typeof window['conch'] !== "undefined" || window["DBApp"] != null) {
            this._curPlatform = PlatformType.Android;
            this.instanceSDK(new SDK());
            return;
        }
        this.instanceSDK(new SDK());
    }

    /**
     * 实例化SDK并初始化
     * 设置10秒超时保护，防止SDK初始化回调未触发导致系统卡住
     * @param sdk SDK实例
     */
    private static instanceSDK(sdk: SDK) {
        this._curSDK = sdk;
        this._curSDK.init(() => {
            SDKSystem.isInitFinished = true;
        });
        let timeout: number = setTimeout(() => {
            clearTimeout(timeout);
            SDKSystem.isInitFinished = true;
        }, 10000);
    }
}
