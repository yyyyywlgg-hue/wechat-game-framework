import { _decorator, Component, Node, Camera } from 'cc';
import GlobalData from '../Config/GlobalData';
import { GlobalEnum } from '../Config/GlobalEnum';
import EventManager from '../Managers/EventManager';
import { EventTypes } from '../Managers/EventTypes';
import { AdvertSystem } from '../SystemAdvert/AdvertSystem';
import { AudioSystem } from '../SystemAudio/AudioSystem';
import { SDKSystem } from '../SystemSDK/SDKSystem';
import { StorageSystem } from '../SystemStorage/StorageSystem';
import { UIEnum } from '../SystemUI/UIEnum';
import { UISystem } from '../SystemUI/UISystem';
import { clog } from '../Tools/ColorLog';
import Loader from '../Tools/Loader';
const { ccclass, property } = _decorator;

@ccclass('Init')
export class Init extends Component {
    protected uiLayer: Node = null;
    private isSysInitFish = false;

    protected onLoad() {
        GlobalData.set(GlobalEnum.GlobalDataType.Canvas, this.node);
        GlobalData.set(GlobalEnum.GlobalDataType.CameraUI,
            this.node.getChildByName('CameraUI')?.getComponent(Camera));

        this.uiLayer = this.node.getChildByName('UILayer');
        this.initSystems();
    }

    protected initSystems() {
        StorageSystem.init();
        AudioSystem.init();
        SDKSystem.init();
        UISystem.init(this.uiLayer);
        AdvertSystem.init(this.uiLayer);
    }

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

    private preLoadBounds: string[] = ['AudioAssets', 'Game'];
    protected preLoadBound() {
        for (let i = 0, c = this.preLoadBounds.length; i < c; ++i) {
            Loader.loadBundle(this.preLoadBounds[i], null, false, false);
        }
    }

    public setPreLoadBounds(bounds: string[]) {
        this.preLoadBounds = bounds;
    }
}
