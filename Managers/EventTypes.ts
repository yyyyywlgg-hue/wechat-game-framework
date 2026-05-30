/**
 * EventTypes.ts
 * 全局事件类型定义文件，使用命名空间 + 枚举的方式组织所有事件类型。
 * 每个枚举的 Index 值作为该分类的起始编号，后续枚举值自动递增，
 * 确保不同分类的事件类型值不会冲突。
 */

export namespace EventTypes {

    /**
     * SDK 相关事件，起始编号 0
     * 涵盖广告展示/隐藏、分享、录屏、数据上报等平台 SDK 功能
     */
    export enum SDKEvents {
        Index = 0,              // 起始编号
        ShowBanner,             // 显示 Banner 广告
        HideBanner,             // 隐藏 Banner 广告
        ShowVideo,              // 显示视频广告（激励视频）
        ShowInsertAd,           // 显示插屏广告
        ShowCustomAd,           // 显示自定义广告
        HideCustomAd,           // 隐藏自定义广告
        Share,                  // 触发分享
        ExitApp,                // 退出应用
        StartRecord,            // 开始录屏
        PauseRecord,            // 暂停录屏
        ResumeRecord,           // 恢复录屏
        StopRecord,             // 停止录屏
        RecordSaved,            // 录屏已保存
        ShareRecord,            // 分享录屏视频
        ReportAldEvent,         // 上报阿拉丁自定义事件
        ReportAldStageStart,    // 上报阿拉丁关卡开始
        ReportAldStageWin,      // 上报阿拉丁关卡胜利
        ReportAldStageFail,     // 上报阿拉丁关卡失败
        ReportAldStageAward,    // 上报阿拉丁关卡奖励
        ReportAldStageTools,    // 上报阿拉丁关卡道具使用
        ReportEvent,            // 通用事件上报
    }

    /**
     * 游戏核心事件，起始编号 1000
     * 涵盖游戏生命周期、时间缩放、资源变化、UI 切换等核心流程
     */
    export enum GameEvents {
        Index = 1000,           // 起始编号
        InitLoadFinished,       // 初始加载完成
        GameStart,              // 游戏开始
        GameLoadFinish,         // 游戏关卡加载完成
        GameRun,                // 游戏运行中
        GamePause,              // 游戏暂停
        GameResume,             // 游戏恢复
        GameOver,               // 游戏结束
        SetInitUIEnable,        // 设置初始 UI 是否可用
        SetLevelManagerEnable,  // 设置关卡管理器是否可用
        SetGameTimeScale,       // 设置游戏时间缩放比例
        UserAssetsChanged,      // 用户资产（金币/钻石等）发生变化
        SetTouchMaskEnable,     // 设置触摸遮罩是否启用（防止误触）
        LoadSubPkg,             // 加载分包
        ShowTips,               // 显示提示信息
        UIChanged,              // UI 状态变化
        EnterChooseLv,          // 进入关卡选择
    }

    /**
     * 触摸输入事件，起始编号 1100
     * 涵盖触摸开关控制及触摸开始/移动/结束的通用和对象级事件
     */
    export enum TouchEvents {
        Index = 1100,           // 起始编号
        SetTouchEnable,         // 设置触摸是否可用
        TouchStart,             // 触摸开始（通用）
        TouchMove,              // 触摸移动（通用）
        TouchEnd,               // 触摸结束（通用）
        TouchStartObj,          // 触摸开始（对象级，针对特定游戏对象）
        TouchMoveObj,           // 触摸移动（对象级）
        TouchEndObj,            // 触摸结束（对象级）
    }

    /**
     * 摄像机事件，起始编号 1200
     * 涵盖摄像机位置、旋转、偏移等控制事件
     */
    export enum CameraEvents {
        Index = 1200,               // 起始编号
        SetCameraPos,               // 设置摄像机位置
        SetFollowPos,               // 设置摄像机跟随目标位置
        SetCameraSelfRot,           // 设置摄像机自身旋转
        SetCameraSelfPos,           // 设置摄像机自身位置
        SetCameraSelfOffset,        // 设置摄像机自身偏移量
        SetCameraOrthoHeightOffset, // 设置正交摄像机高度偏移量
    }

    /**
     * UI 交互事件，起始编号 1300
     * 涵盖 UI 相关的交互确认等事件
     */
    export enum UIEvents {
        Index = 1300,           // 起始编号
        PrivacyConfirm,         // 隐私协议确认
    }

    /**
     * 微信自定义广告事件，起始编号 1400
     * 涵盖不同样式的自定义广告展示与隐藏
     */
    export enum WXCustomAD {
        Index = 1400,           // 起始编号
        ShowGridAd,             // 显示网格广告
        ShowHorizonAd,          // 显示横向广告
        ShowVerticalAd,         // 显示纵向广告
        HideAdByAdId,           // 根据广告 ID 隐藏指定广告
    }
}
