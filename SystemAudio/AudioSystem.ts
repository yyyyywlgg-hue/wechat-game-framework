import { AudioClip, AudioSource, warn, Node } from "cc";
import { BasicSystem } from "../Basic/BasicSystem";
import { StorageSystem } from "../SystemStorage/StorageSystem";
import Loader from "../Tools/Loader";

export class AudioSystem extends BasicSystem {
    public static audioSwitch = { Effects: true, Bgm: true };
    protected static allClips: { [key: string]: AudioClip } = {};
    protected static loopClips: string[] = [];
    protected static bgmAudioSource: AudioSource = null;
    protected static bgmAudioSourceNode: Node = null;
    protected static effectAudioSource: AudioSource = null;
    protected static effectAudioSourceNode: Node = null;
    private static audioBound = 'AudioAssets';
    private static _isPaused = false;

    public static init() {
        if (this.isInit) return;
        this.isInit = true;

        if (!this.bgmAudioSourceNode) {
            this.bgmAudioSourceNode = new Node('bgmAudioSourceNode');
            this.bgmAudioSource = this.bgmAudioSourceNode.addComponent(AudioSource);
            this.bgmAudioSource.playOnAwake = false;
        }
        if (!this.effectAudioSourceNode) {
            this.effectAudioSourceNode = new Node('effectAudioSourceNode');
            this.effectAudioSource = this.effectAudioSourceNode.addComponent(AudioSource);
            this.effectAudioSource.playOnAwake = false;
        }

        let d = StorageSystem.getData();
        if (d && d.userSetting) {
            this.audioSwitch.Effects = d.userSetting.AudioSwith;
            this.audioSwitch.Bgm = d.userSetting.AudioSwith;
        }

        this.isInitFinished = true;
    }

    public static setAudioState(isOpen: boolean) {
        if (isOpen) {
            this.audioSwitch.Bgm = true;
            this.audioSwitch.Effects = true;
            this.playBGM(this.curBGM);
        } else {
            this.audioSwitch.Bgm = false;
            this.audioSwitch.Effects = false;
            this.stopBGM();
            this.stopEffect();
        }
    }

    public static setPaused(v: boolean) {
        this._isPaused = v;
    }

    private static _limitCd = 1 / 10;
    private static limitTimeRec: { [clip: string]: number } = {};

    public static playEffectLimit(clip: string, d?: { isLoop: boolean, volume?: number }) {
        let curT = Date.now();
        if (!this.limitTimeRec[clip]) this.limitTimeRec[clip] = 0;
        let _lastTime = this.limitTimeRec[clip];
        this.limitTimeRec[clip] = curT;
        if (curT - _lastTime > this._limitCd * 1000) {
            this.playEffect(clip, d);
        }
    }

    public static playEffect(clip: string, d?: { isLoop: boolean, volume?: number }) {
        if (this._isPaused) return;
        if (undefined == d) {
            d = { isLoop: false, volume: 1 };
        } else {
            if (undefined == d.isLoop) d.isLoop = false;
            if (undefined == d.volume) d.volume = 1;
            if (d.isLoop && this.loopClips.indexOf(clip) < 0) {
                this.loopClips.push(clip);
            }
        }

        if (undefined === this.allClips[clip]) {
            Loader.loadBundle(this.audioBound, () => {
                Loader.loadBundleRes(this.audioBound, clip, (res) => {
                    if (!res) {
                        this.allClips[clip] = null;
                        warn("音效资源未找到：", clip);
                        return;
                    }
                    this.allClips[clip] = res;
                    this._playEffect(clip, d.isLoop, d.volume);
                }, false);
            }, false);
        } else {
            this._playEffect(clip, d.isLoop, d.volume);
        }
    }

    private static _playEffect(clip: string, isLoop = false, volume = 1) {
        if (!this.audioSwitch.Effects) return;
        if (null === this.allClips[clip]) return;
        let c = this.allClips[clip];
        if (!isLoop) {
            this.effectAudioSource.playOneShot(c, volume);
        } else {
            this.effectAudioSource.clip = c;
            this.effectAudioSource.loop = true;
            this.effectAudioSource.play();
        }
    }

    protected static stopEffect(clip?: string) {
        this.effectAudioSource.stop();
        if (clip && this.allClips[clip]) {
            let index = this.loopClips.indexOf(clip);
            if (index >= 0) this.loopClips.splice(index, 1);
        }
    }

    protected static curBGM: string = null;

    public static playBGM(clip: string) {
        if (!clip) return;
        if (this.audioSwitch.Bgm && this.curBGM == clip && this.allClips[this.curBGM]) {
            let c = this.allClips[this.curBGM];
            this.bgmAudioSource.clip = c;
            this.bgmAudioSource.loop = true;
            if (this.bgmAudioSource.state != 1) this.bgmAudioSource.play();
            return;
        }
        if (undefined === this.allClips[clip]) {
            Loader.loadBundle(this.audioBound, () => {
                Loader.loadBundleRes(this.audioBound, clip, (res) => {
                    if (!res) {
                        this.allClips[clip] = null;
                        warn("BGM资源未找到：", clip);
                        return;
                    }
                    this.allClips[clip] = res;
                    this._playBGM(clip);
                }, false);
            }, false);
        } else {
            this._playBGM(clip);
        }
    }

    private static _playBGM(clip: string) {
        if (!this.audioSwitch.Bgm) return;
        if (null === this.allClips[clip]) return;
        if (this.curBGM) this.bgmAudioSource.stop();
        let c = this.allClips[clip];
        this.bgmAudioSource.clip = c;
        this.bgmAudioSource.loop = true;
        this.curBGM = clip;
        this.bgmAudioSource.play();
    }

    public static stopBGM() {
        if (this.curBGM) this.bgmAudioSource.stop();
    }

    public static pauseBGM() {
        if (this.curBGM) this.bgmAudioSource.pause();
    }

    public static resumeBGM() {
        if (!this.audioSwitch.Bgm) return;
        if (this.curBGM) this.bgmAudioSource.play();
    }

    public static setAudioBound(bound: string) {
        this.audioBound = bound;
    }
}
