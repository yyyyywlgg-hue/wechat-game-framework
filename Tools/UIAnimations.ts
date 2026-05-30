/**
 * UI 动画组件
 * 为 UI 节点提供入场动画效果，支持从上/下/左/右方向滑入、中心缩放等动画类型，
 * 可配合缓动函数、透明度动画、延迟显示子节点等功能使用。
 * 挂载到 UI 节点上，在节点启用时自动播放入场动画。
 */

import { _decorator, Component, Node, v3, Widget, UITransform, Enum, UIOpacity, Tween, tween } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 入场方向枚举
 * 定义 UI 入场动画的方向类型
 */
enum EnterDirection {
    /** 无动画 */
    None,
    /** 从顶部滑入 */
    Top,
    /** 从底部滑入 */
    Bottom,
    /** 从左侧滑入 */
    Left,
    /** 从右侧滑入 */
    Right,
    /** 从中心缩小到正常大小（从小到大） */
    Center_zoomOut,
    /** 从中心放大到正常大小（从大到小） */
    Center_zoomIn,
}

/**
 * 缓动类型枚举
 * 定义动画的缓动曲线类型
 */
enum EasingType {
    /** 正弦缓入 */
    SineIn,
    /** 正弦缓出 */
    SineOut,
    /** 正弦缓入缓出 */
    SineInOut,
    /** 回弹缓入 */
    BackIn,
    /** 回弹缓出 */
    BackOut,
    /** 回弹缓入缓出 */
    BackInOut,
}

/**
 * UI 动画组件
 * 挂载到 UI 节点上，在节点启用（onEnable）时自动播放入场动画。
 * 支持多种入场方向、缓动函数、透明度渐变、延迟显示子节点等功能。
 */
@ccclass('UIAnimations')
export class UIAnimations extends Component {
    /** 入场动画方向，默认无动画 */
    @property({ type: Enum(EnterDirection) })
    enterDirection: EnterDirection = EnterDirection.None;

    /** 缓动函数类型，仅在入场方向不为 None 时显示 */
    @property({ type: Enum(EasingType), visible() { return this.enterDirection != EnterDirection.None } })
    easingType: EasingType = EasingType.BackInOut;

    /** 移动距离倍率，相对于节点尺寸的偏移倍数，仅在方向为 Top/Bottom/Left/Right/Center_zoomIn 时显示 */
    @property({ visible() { return this.enterDirection != EnterDirection.None && this.enterDirection != EnterDirection.Center_zoomOut } })
    moveDistRate = 1.5;

    /** 动画延迟时间（秒），动画开始前的等待时间 */
    @property
    delayTime = 0;

    /** 动画持续时间（秒） */
    @property
    animTime = 0.5;

    /** 是否启用透明度渐变动画 */
    @property
    isOpacityAnim = false;

    /** 是否延迟显示子节点（动画播放后再显示子节点） */
    @property
    isDelayShowChildren = false;

    /** 延迟显示子节点的时间（秒），仅在 isDelayShowChildren 为 true 时显示 */
    @property({ visible() { return this.isDelayShowChildren } })
    delayShowChildrenTime = 0;

    /** 延迟动画的 tween 目标对象，用于控制延迟显示子节点的动画 */
    _delayTween = { a: 0 };
    /** 节点初始位置，在 onLoad 时记录 */
    _initPos = v3();
    /** 节点初始缩放，在 onLoad 时记录 */
    _initScale = v3();
    /** 缓动函数名称数组，与 EasingType 枚举值对应 */
    _cfg = ['sineIn', 'sineOut', 'sineInOut', 'backIn', 'backOut', 'backInOut'];
    /** 动画完成回调函数 */
    _finishCb = null;
    /** 完成回调的 tween 目标对象，用于控制回调的延迟执行 */
    _cbTween = { a: 0 };
    /** 子节点激活状态记录数组，用于延迟显示子节点时恢复原始激活状态 */
    _childrenRecs: { isActive: boolean, node: Node }[] = [];

    /**
     * 组件加载时调用
     * 记录节点的初始位置和缩放值，并根据配置隐藏子节点
     */
    onLoad() {
        this._initPos.set(this.node.position);
        this._initScale.set(this.node.scale);
        this.recordChildren(true);
    }

    /**
     * 记录子节点的激活状态
     * @param isHide 是否同时隐藏子节点，为 true 时将所有子节点设为不可见
     */
    recordChildren(isHide = false) {
        this._childrenRecs = [];
        if (this.isDelayShowChildren) {
            for (let i = 0; i < this.node.children.length; i++) {
                const e = this.node.children[i];
                this._childrenRecs.push({ isActive: e.active, node: e });
                if (isHide) e.active = false;
            }
        }
    }

    /**
     * 设置动画延迟时间
     * @param delayTime 延迟时间（秒）
     */
    seDelayTime(delayTime: number) {
        this.delayTime = delayTime;
    }

    /**
     * 节点启用时自动播放入场动画
     */
    onEnable() {
        this.showAnim();
    }

    /**
     * 节点禁用时停止所有动画并记录子节点状态
     */
    onDisable() {
        this.recordChildren();
        Tween.stopAllByTarget(this._cbTween);
        Tween.stopAllByTarget(this._toPos);
        Tween.stopAllByTarget(this._toScale);
        Tween.stopAllByTarget(this._delayTween);
        Tween.stopAllByTarget(this._opacity);
    }

    /**
     * 设置动画完成回调
     * @param cb 动画播放完成后的回调函数
     */
    setFinishAnim(cb: Function) {
        this._finishCb = cb;
    }

    /** 位置动画的目标位置向量 */
    _toPos = v3();
    /** 缩放动画的目标缩放向量 */
    _toScale = v3();

    /**
     * 播放入场动画
     * 根据配置的入场方向执行对应的动画效果，同时处理透明度动画、完成回调和延迟显示子节点
     */
    showAnim() {
        Tween.stopAllByTarget(this._cbTween);
        Tween.stopAllByTarget(this._toPos);
        Tween.stopAllByTarget(this._toScale);

        if (this.enterDirection != EnterDirection.None) {
            let wg = this.node.getComponent(Widget);
            if (wg) {
                wg.enabled = true;
                wg.updateAlignment();
                wg.enabled = false;
                this._toPos.set(this.node.position);
            } else {
                this._toPos.set(this._initPos);
            }
            let trans = this.node.getComponent(UITransform);
            switch (this.enterDirection) {
                case EnterDirection.Top: this.topAnim(trans); break;
                case EnterDirection.Bottom: this.bottomAnim(trans); break;
                case EnterDirection.Left: this.leftAnim(trans); break;
                case EnterDirection.Right: this.rightAnim(trans); break;
                case EnterDirection.Center_zoomIn: this.centerZoomOutAnim(trans); break;
                case EnterDirection.Center_zoomOut: this.centerZoomInAnim(trans); break;
            }
        }
        if (this.isOpacityAnim) this.opacityAnim();
        if (this._finishCb) {
            tween(this._cbTween).delay(this.delayTime + this.animTime).call(() => {
                this._finishCb && this._finishCb();
                this._finishCb = null;
            }).start();
        }
        Tween.stopAllByTarget(this._delayTween);
        if (this.isDelayShowChildren) {
            tween(this._delayTween).delay(this.delayShowChildrenTime).call(() => {
                for (let i = 0; i < this._childrenRecs.length; i++) {
                    const e = this._childrenRecs[i];
                    e.node.active = e.isActive;
                }
            }).start();
        }
    }

    /** 动画播放完成的回调占位方法，可由子类重写 */
    showAnimFinished() { }

    /**
     * 从顶部滑入动画
     * 将节点先移动到目标位置上方（偏移量为节点高度 × moveDistRate），然后缓动滑入
     * @param trans 节点的 UITransform 组件，用于获取节点高度
     */
    topAnim(trans: UITransform) {
        let toY = this._toPos.y;
        this._toPos.y += trans.height * this.moveDistRate;
        this.node.setPosition(this._toPos);
        let easing: any = this._cfg[this.easingType];
        tween(this._toPos).delay(this.delayTime).to(this.animTime, { y: toY }, {
            easing, onUpdate: () => { this.node.setPosition(this._toPos); }
        }).call(() => { this.showAnimFinished(); }).start();
    }

    /**
     * 从底部滑入动画
     * 将节点先移动到目标位置下方（偏移量为节点高度 × moveDistRate），然后缓动滑入
     * @param trans 节点的 UITransform 组件，用于获取节点高度
     */
    bottomAnim(trans: UITransform) {
        let toY = this._toPos.y;
        this._toPos.y -= trans.height * this.moveDistRate;
        this.node.setPosition(this._toPos);
        let easing: any = this._cfg[this.easingType];
        tween(this._toPos).delay(this.delayTime).to(this.animTime, { y: toY }, {
            easing, onUpdate: () => { this.node.setPosition(this._toPos); }
        }).call(() => { this.showAnimFinished(); }).start();
    }

    /**
     * 从左侧滑入动画
     * 将节点先移动到目标位置左侧（偏移量为节点宽度 × moveDistRate），然后缓动滑入
     * @param trans 节点的 UITransform 组件，用于获取节点宽度
     */
    leftAnim(trans: UITransform) {
        let toX = this._toPos.x;
        this._toPos.x -= trans.width * this.moveDistRate;
        this.node.setPosition(this._toPos);
        let easing: any = this._cfg[this.easingType];
        tween(this._toPos).delay(this.delayTime).to(this.animTime, { x: toX }, {
            easing, onUpdate: () => { this.node.setPosition(this._toPos); }
        }).call(() => { this.showAnimFinished(); }).start();
    }

    /**
     * 从右侧滑入动画
     * 将节点先移动到目标位置右侧（偏移量为节点宽度 × moveDistRate），然后缓动滑入
     * @param trans 节点的 UITransform 组件，用于获取节点宽度
     */
    rightAnim(trans: UITransform) {
        let toX = this._toPos.x;
        this._toPos.x += trans.width * this.moveDistRate;
        this.node.setPosition(this._toPos);
        let easing: any = this._cfg[this.easingType];
        tween(this._toPos).delay(this.delayTime).to(this.animTime, { x: toX }, {
            easing, onUpdate: () => { this.node.setPosition(this._toPos); }
        }).call(() => { this.showAnimFinished(); }).start();
    }

    /**
     * 中心缩小入场动画（从 0 缩放到 1）
     * 节点从缩放为 0 的状态缓动放大到正常大小
     * @param trans 节点的 UITransform 组件（当前未使用，保留接口一致性）
     */
    centerZoomOutAnim(trans: UITransform) {
        this._toScale.set(0, 0, 0);
        this.node.setScale(this._toScale);
        let easing: any = this._cfg[this.easingType];
        tween(this._toScale).delay(this.delayTime).to(this.animTime, { x: 1, y: 1, z: 1 }, {
            easing, onUpdate: () => { this.node.setScale(this._toScale); }
        }).call(() => { this.showAnimFinished(); }).start();
    }

    /**
     * 中心放大入场动画（从 moveDistRate 缩放到 1）
     * 节点从放大状态缓动缩小到正常大小
     * @param trans 节点的 UITransform 组件（当前未使用，保留接口一致性）
     */
    centerZoomInAnim(trans: UITransform) {
        this._toScale.set(this.moveDistRate, this.moveDistRate, this.moveDistRate);
        this.node.setScale(this._toScale);
        let easing: any = this._cfg[this.easingType];
        tween(this._toScale).delay(this.delayTime).to(this.animTime, { x: 1, y: 1, z: 1 }, {
            easing, onUpdate: () => { this.node.setScale(this._toScale); }
        }).call(() => { this.showAnimFinished(); }).start();
    }

    /** UIOpacity 组件引用，用于控制节点透明度 */
    _uiOpacityCmp: UIOpacity = null;
    /** 透明度动画的目标值对象 */
    _opacity = { opacity: 255 };

    /**
     * 透明度渐变动画
     * 从透明（opacity=0）缓动到不透明（opacity=255）
     * 如果节点没有 UIOpacity 组件则自动添加
     */
    opacityAnim() {
        if (!this._uiOpacityCmp) {
            this._uiOpacityCmp = this.node.getComponent(UIOpacity);
            if (!this._uiOpacityCmp) {
                this._uiOpacityCmp = this.node.addComponent(UIOpacity);
            }
        }
        Tween.stopAllByTarget(this._opacity);
        if (this._uiOpacityCmp) {
            this._opacity.opacity = 0;
            this._uiOpacityCmp.opacity = 0;
            tween(this._opacity).delay(this.delayTime).to(this.animTime, { opacity: 255 }, {
                onUpdate: () => { this._uiOpacityCmp.opacity = this._opacity.opacity; }
            }).start();
        }
    }
}
