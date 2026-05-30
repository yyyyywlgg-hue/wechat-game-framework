/**
 * 游戏初始化模块
 * 作为游戏启动的入口组件，负责初始化所有子系统（存储、音频、SDK、UI、广告），
 * 并在所有子系统初始化完成后进入游戏主界面。
 * 同时负责预加载游戏所需的资源Bundle。
 */

import { _decorator, Component, Node, Camera } from 'cc';
import GlobalData from '../Config/GlobalData';
import { GlobalEnum } from '../Config/GlobalEnum';
import EventManager from '../Managers/EventManager';
import { EventTypes } from '../Managers/EventTypes';
import { ServiceLocator } from '../Core/ServiceLocator';
import { IStorage } from '../Interfaces/IStorage';
import { IAudio } from '../Interfaces/IAudio';
import { IUI } from '../Interfaces/IUI';
import { IPool } from '../Interfaces/IPool';
import { ISDK } from '../Interfaces/ISDK';
import { IAdvert } from '../Interfaces/IAdvert';
import { ILoader } from '../Interfaces/ILoader';
import GlobalPool from '../Tools/GlobalPool';
import { AdvertSystem } from '../SystemAdvert/AdvertSystem';
import { AudioSystem } from '../SystemAudio/AudioSystem';
import { SDKSystem } from '../SystemSDK/SDKSystem';
import { StorageSystem } from '../SystemStorage/StorageSystem';
import { UIEnum } from '../SystemUI/UIEnum';
import { UISystem } from '../SystemUI/UISystem';
import { clog } from '../Tools/ColorLog';
import Loader from '../Tools/Loader';
const { ccclass, property } = _decorator;

/** 游戏初始化组件，挂载在场景根节点上，负责系统初始化和游戏启动流程 */
@ccclass('Init')
export class Init extends Component {
    /** UI层节点引用 */
    protected uiLayer: Node = null;
    /** 所有子系统是否初始化完成的标志 */
    private isSysInitFish = false;

    /**
     * 组件加载时的生命周期方法
     * 缓存Canvas和Camera到全局数据，获取UI层节点，并初始化所有子系统
     */
    protected onLoad() {
        GlobalData.set(GlobalEnum.GlobalDataType.Canvas, this.node);
        GlobalData.set(GlobalEnum.GlobalDataType.CameraUI,
            this.node.getChildByName('CameraUI')?.getComponent(Camera));

        this.uiLayer = this.node.getChildByName('UILayer');
        this.initSystems();
    }

    /**
     * 初始化所有游戏子系统
     * 初始化顺序：存储系统 → 音频系统 → SDK系统 → UI系统 → 广告系统
     */
    protected initSystems() {
        StorageSystem.init();
        AudioSystem.init();
        SDKSystem.init();
        UISystem.init(this.uiLayer);
        AdvertSystem.init(this.uiLayer);

        ServiceLocator.register(IStorage, StorageSystem as unknown as IStorage);
        ServiceLocator.register(IAudio, AudioSystem as unknown as IAudio);
        ServiceLocator.register(IUI, UISystem as unknown as IUI);
        ServiceLocator.register(IPool, GlobalPool as unknown as IPool);
        ServiceLocator.register(ISDK, SDKSystem as unknown as ISDK);
        ServiceLocator.register(IAdvert, AdvertSystem as unknown as IAdvert);
        ServiceLocator.register(ILoader, Loader as unknown as ILoader);
    }

    /**
     * 每帧更新，检查所有子系统是否初始化完成
     * 所有子系统初始化完成后，进入游戏主界面
     * @param dt 帧间隔时间（秒）
     */
    protected update(dt: number) {
        if (!this.isSysInitFish) {
            let isFinish = true;
            isFinish = isFinish && StorageSystem.isInitFinished;
            isFinish = isFinish && AudioSystem.isInitFinished;
            isFinish = isFinish && AdvertSystem.isInitFinished;
            isFinish = isFinish && SDKSystem.isInitFinished;
            isFinish = isFinish && UISystem.isInitFinished;
            this.isSysInitFish = isFinish;
            if (this.isSysInitFish) {
                this.enterGame();
            }
        }
    }

    /**
     * 进入游戏主界面
     * 发送初始化完成事件，显示自定义广告UI和主页UI，并预加载资源Bundle
     */
    protected enterGame() {
        EventManager.emit(EventTypes.GameEvents.InitLoadFinished);
        clog.log('进入游戏');

        let timeout: number = setTimeout(() => {
            clearTimeout(timeout);
            UISystem.showUI(UIEnum.CustomAdUI);
            UISystem.showUI(UIEnum.HomeUI);
            setTimeout(() => { this.preLoadBound(); }, 100);
        }, 100);
    }

    /** 需要预加载的Bundle名称列表 */
    private preLoadBounds: string[] = ['AudioAssets', 'Game'];

    /**
     * 预加载资源Bundle
     * 在后台静默加载，不阻塞游戏运行
     */
    protected preLoadBound() {
        for (let i = 0, c = this.preLoadBounds.length; i < c; ++i) {
            Loader.loadBundle(this.preLoadBounds[i], null, false, false);
        }
    }

    /**
     * 设置需要预加载的Bundle列表
     * @param bounds Bundle名称数组
     */
    public setPreLoadBounds(bounds: string[]) {
        this.preLoadBounds = bounds;
    }
}
