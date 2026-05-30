import { BasicSystem } from "../Basic/BasicSystem";
import { clog } from "../Tools/ColorLog";
import { OPPOSDK } from "./OPPOSDK";
import SDK from "./SDK";
import { TTSDK } from "./TTSDK";
import { VIVOSDK } from "./VIVOSDK";
import { WXSDK } from "./WXSDK";

export enum PlatformType {
    PCMiniGame,
    WXMiniGame,
    OPPOMiniGame,
    VIVOMiniGame,
    TTMiniGame,
    QQMiniGame,
    MEIZUMiniGame,
    HUAWEIMiniGame,
    Gamebox4399,
    Android,
}

export class SDKSystem extends BasicSystem {
    public static _curPlatform: PlatformType = PlatformType.PCMiniGame;
    private static _curSDK: SDK = null;

    public static get curSDK(): SDK { return this._curSDK; }

    public static init(d?: any) {
        if (this.isInit) return;
        this.isInit = true;
        this.checkPlatform();
        clog.warn('当前平台:' + PlatformType[this._curPlatform]);
    }

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
