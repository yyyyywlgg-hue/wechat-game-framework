export namespace EventTypes {
    export enum SDKEvents {
        Index = 0,
        ShowBanner,
        HideBanner,
        ShowVideo,
        ShowInsertAd,
        ShowCustomAd,
        HideCustomAd,
        Share,
        ExitApp,
        StartRecord,
        PauseRecord,
        ResumeRecord,
        StopRecord,
        RecordSaved,
        ShareRecord,
        ReportAldEvent,
        ReportAldStageStart,
        ReportAldStageWin,
        ReportAldStageFail,
        ReportAldStageAward,
        ReportAldStageTools,
        ReportEvent,
    }

    export enum GameEvents {
        Index = 1000,
        InitLoadFinished,
        GameStart,
        GameLoadFinish,
        GameRun,
        GamePause,
        GameResume,
        GameOver,
        SetInitUIEnable,
        SetLevelManagerEnable,
        SetGameTimeScale,
        UserAssetsChanged,
        SetTouchMaskEnable,
        LoadSubPkg,
        ShowTips,
        UIChanged,
        EnterChooseLv,
    }

    export enum TouchEvents {
        Index = 1100,
        SetTouchEnable,
        TouchStart,
        TouchMove,
        TouchEnd,
        TouchStartObj,
        TouchMoveObj,
        TouchEndObj,
    }

    export enum CameraEvents {
        Index = 1200,
        SetCameraPos,
        SetFollowPos,
        SetCameraSelfRot,
        SetCameraSelfPos,
        SetCameraSelfOffset,
        SetCameraOrthoHeightOffset,
    }

    export enum UIEvents {
        Index = 1300,
        PrivacyConfirm,
    }

    export enum WXCustomAD {
        Index = 1400,
        ShowGridAd,
        ShowHorizonAd,
        ShowVerticalAd,
        HideAdByAdId,
    }
}
