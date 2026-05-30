/**
 * 音频系统模块
 * 负责管理游戏中的背景音乐（BGM）和音效（Effect）的播放、暂停、停止等操作。
 * 支持音效开关控制、循环音效管理、音效播放频率限制，以及从本地存储读取音频开关状态。
 */

import { IAudio } from '../Interfaces/IAudio';
import { AudioClip, AudioSource, warn, Node } from "cc";
import { BasicSystem } from "../Basic/BasicSystem";
import { StorageSystem } from "../SystemStorage/StorageSystem";
import Loader from "../Tools/Loader";

/** 音频系统类，管理BGM和音效的播放控制 */
export class AudioSystem extends BasicSystem implements IAudio {
    /** 音频开关状态，Effects控制音效，Bgm控制背景音乐 */
    public static audioSwitch = { Effects: true, Bgm: true };
    /** 所有已加载的音频剪辑缓存，键为音频名称，值为AudioClip对象 */
    protected static allClips: { [key: string]: AudioClip } = {};
    /** 循环播放的音效名称列表 */
    protected static loopClips: string[] = [];
    /** BGM音频源组件 */
    protected static bgmAudioSource: AudioSource = null;
    /** BGM音频源所在节点 */
    protected static bgmAudioSourceNode: Node = null;
    /** 音效音频源组件 */
    protected static effectAudioSource: AudioSource = null;
    /** 音效音频源所在节点 */
    protected static effectAudioSourceNode: Node = null;
    /** 音频资源所在的Bundle名称，默认为'AudioAssets' */
    private static audioBound = 'AudioAssets';
    /** 音频是否处于暂停状态（游戏暂停时使用） */
    private static _isPaused = false;

    /**
     * 初始化音频系统
     * 创建BGM和音效的AudioSource节点，并从本地存储中读取音频开关状态
     */
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

    /**
     * 设置音频总开关状态
     * 开启时恢复BGM播放，关闭时停止所有BGM和音效
     * @param isOpen 是否开启音频
     */
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

    /**
     * 设置音频暂停状态
     * 暂停时所有音效播放请求将被忽略
     * @param v 是否暂停
     */
    public static setPaused(v: boolean) {
        this._isPaused = v;
    }

    /** 音效播放频率限制的冷却时间（秒），默认1/10秒 */
    private static _limitCd = 1 / 10;
    /** 音效上次播放时间记录，用于频率限制 */
    private static limitTimeRec: { [clip: string]: number } = {};

    /**
     * 带频率限制的音效播放
     * 同一音效在冷却时间内不会重复播放，防止音效叠加过于密集
     * @param clip 音效名称
     * @param d 播放参数，包含是否循环和音量，可选
     */
    public static playEffectLimit(clip: string, d?: { isLoop: boolean, volume?: number }) {
        let curT = Date.now();
        if (!this.limitTimeRec[clip]) this.limitTimeRec[clip] = 0;
        let _lastTime = this.limitTimeRec[clip];
        this.limitTimeRec[clip] = curT;
        if (curT - _lastTime > this._limitCd * 1000) {
            this.playEffect(clip, d);
        }
    }

    /**
     * 播放音效
     * 如果音效资源尚未加载，会先从Bundle中异步加载
     * @param clip 音效名称
     * @param d 播放参数，包含是否循环和音量，可选
     */
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

    /**
     * 内部音效播放实现
     * 非循环音效使用playOneShot播放（可叠加），循环音效设置clip并循环播放
     * @param clip 音效名称
     * @param isLoop 是否循环播放，默认false
     * @param volume 音量，默认1
     */
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

    /**
     * 停止音效播放
     * @param clip 指定要停止的循环音效名称，可选。不传则停止所有音效
     */
    protected static stopEffect(clip?: string) {
        this.effectAudioSource.stop();
        if (clip && this.allClips[clip]) {
            let index = this.loopClips.indexOf(clip);
            if (index >= 0) this.loopClips.splice(index, 1);
        }
    }

    /** 当前正在播放的BGM名称 */
    protected static curBGM: string = null;

    /**
     * 播放背景音乐
     * 如果当前BGM与请求相同且正在播放，则不重复加载
     * 如果BGM资源尚未加载，会先从Bundle中异步加载
     * @param clip BGM名称
     */
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

    /**
     * 内部BGM播放实现
     * 先停止当前BGM，再设置新的clip并循环播放
     * @param clip BGM名称
     */
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

    /** 停止当前背景音乐 */
    public static stopBGM() {
        if (this.curBGM) this.bgmAudioSource.stop();
    }

    /** 暂停当前背景音乐 */
    public static pauseBGM() {
        if (this.curBGM) this.bgmAudioSource.pause();
    }

    /** 恢复背景音乐播放，仅在BGM开关开启时生效 */
    public static resumeBGM() {
        if (!this.audioSwitch.Bgm) return;
        if (this.curBGM) this.bgmAudioSource.play();
    }

    /**
     * 设置音频资源所在的Bundle名称
     * @param bound Bundle名称
     */
    public static setAudioBound(bound: string) {
        this.audioBound = bound;
    }
}
