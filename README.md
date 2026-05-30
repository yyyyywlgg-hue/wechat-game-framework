# GameFramework - Cocos Creator 小游戏通用框架

基于 Cocos Creator 3.x 的小游戏通用框架，从实际上线项目中提取并优化，适用于跑酷、塔防、合成、放置、卡牌等关卡制+广告变现类小游戏。

## 目录结构

```
game-framework/
├── Core/                           核心层
│   └── ServiceLocator.ts           服务定位器（依赖注入容器）
├── Interfaces/                     接口层
│   ├── IStorage.ts                 存储系统接口
│   ├── IAudio.ts                   音频系统接口
│   ├── IUI.ts                      UI系统接口
│   ├── IPool.ts                    对象池接口
│   ├── ISDK.ts                     SDK系统接口
│   ├── IAdvert.ts                  广告系统接口
│   └── ILoader.ts                  资源加载器接口
├── Basic/                          基础层
│   ├── BasicComponent.ts           组件基类（对象池生命周期 + 事件自动管理）
│   ├── BasicSystem.ts              系统基类
│   ├── BasicUI.ts                  UI基类
│   └── BasicLayer.ts               层级基类
├── Config/                         配置层
│   ├── GlobalData.ts               全局数据（泛型类型安全）
│   ├── GlobalEnum.ts               框架枚举
│   └── GlobalTmpData.ts            框架临时数据
├── Managers/                       管理器层
│   ├── EventManager.ts             事件总线
│   └── EventTypes.ts               框架事件枚举
├── InitScripts/                    入口层
│   ├── Init.ts                     初始化入口
│   └── GameDirector.ts             游戏导演
├── SystemUI/                       UI系统
│   ├── UISystem.ts                 UI管理（栈管理 + 优先级）
│   └── UIEnum.ts                   UI枚举
├── SystemAudio/                    音频系统
│   ├── AudioSystem.ts              音频管理
│   └── AudioEnum.ts                音频枚举
├── SystemStorage/                  存储系统
│   ├── StorageSystem.ts            存档管理
│   └── StorageTemp.ts              存储数据结构
├── SystemSDK/                      SDK适配层
│   ├── SDKSystem.ts                平台检测 + SDK实例化
│   ├── SDK.ts                      SDK基类
│   ├── WXSDK.ts                    微信SDK
│   ├── TTSDK.ts                    抖音SDK
│   ├── OPPOSDK.ts                  OPPO SDK
│   └── VIVOSDK.ts                  VIVO SDK
├── SystemAdvert/                   广告系统
│   └── AdvertSystem.ts             广告管理
└── Tools/                          工具层
    ├── ColorLog.ts                 彩色日志
    ├── GlobalPool.ts               对象池
    ├── Loader.ts                   资源加载器
    ├── Tools.ts                    通用工具
    └── UIAnimations.ts             UI动画组件
```

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        mainScene                            │
│                                                             │
│  ┌──────────────┐    ┌───────────────────────────────────┐ │
│  │    Init       │    │           GameDirector             │ │
│  │  系统初始化    │    │         游戏流程控制                │ │
│  │              │    │  分包加载 → 资源加载 → 对象池创建    │ │
│  └──────────────┘    └───────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    UI 层 (UISystem)                    │  │
│  │  栈式管理 │ 优先级排序 │ 模态遮罩 │ 按需加载            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 基础设施层                              │  │
│  │  EventManager │ AudioSystem │ StorageSystem            │  │
│  │  SDKSystem    │ AdvertSystem │ GlobalPool │ Loader    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 启动流程

```
Init.onLoad()
  ├─ GlobalData.set(Canvas, CameraUI)
  ├─ StorageSystem.init()          加载存档 + 关卡JSON
  ├─ AudioSystem.init()            初始化音频
  ├─ SDKSystem.init()              检测平台 + 实例化SDK
  ├─ UISystem.init(uiLayer)       加载UI分包 + 创建对象池
  ├─ AdvertSystem.init()           初始化广告
  │
  └─ 每帧检测 isInitFinished ──→ enterGame()
       ├─ emit(InitLoadFinished)
       ├─ showUI(CustomAdUI)
       ├─ showUI(HomeUI)
       └─ preLoadBound()           预加载分包

GameDirector.onGameStart()         用户点击开始
  ├─ loadSubBound()                加载游戏分包
  ├─ loadCustomPrefabs()           加载预制体 → 创建对象池
  ├─ preLoadPrefabs()              预创建对象
  └─ LevelManager.active = true    激活关卡
```

## 核心模块详解

### 1. BasicComponent - 组件基类

所有自定义组件和UI的基类，提供两大核心能力：

**对象池生命周期：**

```
首次创建:  init(data) → initSub → onEvents → setData
从池中取出: reuse(data) → reset → onEvents → setData
放回池中:  unuse() → reset → offEvents
```

**事件自动管理：**

```typescript
// 注册事件时自动记录，onDestroy时自动全部注销
this.on(EventTypes.GameEvents.GameOver, this.onGameOver, this);
this.once(EventTypes.GameEvents.GameRun, this.onGameRun, this);

// 主动注销所有事件
this.offEvents();

// 检查是否注册了某事件
if (this.hasEvent(EventTypes.GameEvents.GameRun)) { }
```

**emit支持可变参数：**

```typescript
this.emit(EventTypes.RoleEvents.HpChanged, hp, maxHp, ratio);
```

### 2. EventManager - 事件总线

全局事件管理器，模块间通信的核心枢纽。

```typescript
// 注册
EventManager.on(EventTypes.GameEvents.GameStart, this.onGameStart, this);
EventManager.once(EventTypes.GameEvents.GameOver, this.onGameOver, this);

// 触发（支持可变参数）
EventManager.emit(EventTypes.GameEvents.GameStart, levelId, difficulty);

// 注销
EventManager.off(EventTypes.GameEvents.GameStart, this.onGameStart, this);

// 按target批量注销（适用于对象销毁时清理）
EventManager.targetOff(this);

// 调试：查看事件触发次数
console.log('emit count:', EventManager.emitCount);

// 重置（场景切换时使用）
EventManager.reset();
```

**事件类型分区：**

```
SDKEvents     Index = 0       SDK相关事件
GameEvents    Index = 1000    游戏流程事件
TouchEvents   Index = 1100    触摸事件
CameraEvents  Index = 1200    相机事件
UIEvents      Index = 1300    UI事件
WXCustomAD    Index = 1400    微信广告事件
```

每个分区预留100个枚举值，扩展业务事件时在对应分区后追加，避免冲突。

### 3. GlobalPool - 对象池

与 BasicComponent 生命周期深度绑定的对象池系统。

```typescript
// 创建对象池（通常在加载预制体后）
GlobalPool.createPool('enemyNormal', prefab);

// 获取实例（池空时自动创建）
let node = GlobalPool.get('enemyNormal', { hp: 10, speed: 5 });

// 回收实例
GlobalPool.put(node);

// 回收所有子节点
GlobalPool.putAllChildren(containerNode);

// 预创建
GlobalPool.preCreate('bullet', 50);

// 查询
GlobalPool.hasPool('enemyNormal');
GlobalPool.getPoolSize('enemyNormal');
GlobalPool.getPoolNames();
```

**对象池与组件联动流程：**

```
get('enemyNormal', data)
  ├─ 池中有 → node.active = true → cmp.reuse(data)
  └─ 池中空 → instantiate(prefab) → cmp.init(data)

put(node)
  → cmp.unuse() → removeFromParent() → node.active = false → 放回池中
```

### 4. UISystem - UI管理

栈式UI管理，支持优先级、模态遮罩。

```typescript
// 显示UI
UISystem.showUI(UIEnum.HomeUI);
UISystem.showUI(UIEnum.ShopUI, { itemId: 1 });
UISystem.showUI(UIEnum.SettingUI, null, { priority: 10, modal: true });

// 隐藏UI
UISystem.hideUI(UIEnum.HomeUI);

// 隐藏最顶层UI
UISystem.hideTopUI();

// 隐藏所有UI
UISystem.hideAllUI();

// 查询
UISystem.isUIShowing(UIEnum.ShopUI);
UISystem.getTopUI();
UISystem.getActiveStack();
```

**UIOptions参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| priority | number | 0 | 优先级，数值越大越靠上 |
| modal | boolean | false | 是否模态（遮挡下层交互） |
| closeOnBack | boolean | true | 是否响应返回键关闭 |

**UI按需加载：** UI首次show时才加载对应Prefab，后续show直接复用。

### 5. StorageSystem - 存档系统

本地持久化存储，支持版本兼容。

```typescript
// 获取存档
let data = StorageSystem.getData();
let gold = data.userAssets.asset;

// 修改存档
StorageSystem.setData((d) => {
    d.userAssets.asset += 100;
}, true);  // 第二个参数true表示立即保存

// 通知UI更新
StorageSystem.updateToAssets(true);  // true表示带动画

// 手动保存
StorageSystem.saveData();

// 获取关卡数据
let lvData = StorageSystem.getLevelData(5);
```

**版本兼容机制：** 新版本增加字段时，旧存档会自动补全缺失字段的默认值，不会丢失已有数据。

**配置：**

```typescript
StorageSystem.setStorageName('MyGame01');           // 存档key
StorageSystem.setLevelDataConfig('LevelData', 'LevelData');  // 关卡数据分包名和JSON名
```

### 6. AudioSystem - 音频系统

```typescript
// 播放BGM
AudioSystem.playBGM(AudioEnum.homeBgm);

// 播放音效
AudioSystem.playEffect(AudioEnum.BtnClick);
AudioSystem.playEffect(AudioEnum.boom, { isLoop: true, volume: 0.8 });

// 限频播放（同一种音效间隔100ms）
AudioSystem.playEffectLimit(AudioEnum.MachineGun);

// 控制
AudioSystem.stopBGM();
AudioSystem.pauseBGM();
AudioSystem.resumeBGM();
AudioSystem.stopEffect();
AudioSystem.setAudioState(false);  // 关闭所有音频
AudioSystem.setPaused(true);       // 暂停音效（游戏暂停时）

// 配置
AudioSystem.setAudioBound('AudioAssets');  // 音频分包名
```

### 7. SDKSystem - 多平台SDK适配

```typescript
// 自动检测平台（init时自动执行）
let platform = SDKSystem.curPlatform;
// PlatformType.PCMiniGame / WXMiniGame / TTMiniGame / OPPOMiniGame / VIVOMiniGame

// 获取当前SDK实例
let sdk = SDKSystem.curSDK;

// 通过事件调用SDK功能
EventManager.emit(EventTypes.SDKEvents.ShowBanner);
EventManager.emit(EventTypes.SDKEvents.HideBanner);
EventManager.emit(EventTypes.SDKEvents.ShowVideo, {
    success: () => { console.log('观看完毕'); },
    fail: () => { console.log('加载失败'); },
    cancel: () => { console.log('取消观看'); }
});
EventManager.emit(EventTypes.SDKEvents.Share);
EventManager.emit(EventTypes.SDKEvents.ExitApp);
```

**平台特有功能：**

```typescript
// 抖音录屏
EventManager.emit(EventTypes.SDKEvents.StartRecord);
EventManager.emit(EventTypes.SDKEvents.StopRecord);
EventManager.emit(EventTypes.SDKEvents.ShareRecord, successCb, failCb);

// 微信原生模板广告
EventManager.emit(EventTypes.SDKEvents.ShowCustomAd, 0);
EventManager.emit(EventTypes.SDKEvents.HideCustomAd, 0);
```

**扩展新平台：**

```typescript
// 1. 创建SDK子类
import SDK from "./SDK";
export class HuaweiSDK extends SDK {
    protected setAdCfg(): void {
        this.adConfig.adBannerIdList = ["your_id"];
    }
    protected onExitApp() {
        window["hbs"].exitApplication({});
    }
}

// 2. 在SDKSystem.checkPlatform()中添加检测逻辑
if (typeof window['hbs'] !== "undefined") {
    this._curPlatform = PlatformType.HUAWEIMiniGame;
    this.instanceSDK(new HuaweiSDK());
    return;
}
```

### 8. AdvertSystem - 广告系统

根据当前UI状态自动切换广告展示。

```typescript
// 配置各平台的广告UI映射
AdvertSystem.setAdUIConfig(PlatformType.WXMiniGame, {
    'HomeUI': { banner: true, customAd: [1, 2] },
    'WinUI': { banner: false },
    'LevelInfoUI': { banner: true },
});

AdvertSystem.setAdUIConfig(PlatformType.TTMiniGame, {
    'HomeUI': { banner: true },
});

// 设置广告起始关卡（前N关不显示广告）
AdvertSystem.startLv = 3;
```

### 9. Loader - 资源加载器

支持分包队列加载、进度条、插队、失败重试。

```typescript
// 加载分包
Loader.loadBundle('Game', () => {
    console.log('Game分包加载完成');
}, false, false);  // (name, cb, mask, insert)

// 加载单个资源
Loader.loadBundleRes('Game', 'Prefabs/Player', (prefab) => {
    // 使用prefab
}, Prefab, false);  // (bundle, url, cb, type, mask)

// 加载文件夹
Loader.loadBundleDir('Game', 'Prefabs', (prefabs) => {
    for (let p of prefabs) {
        GlobalPool.createPool(p.data.name, p);
    }
}, Prefab, false);

// 加载场景
Loader.loadBundleScene('Game', 'mainScene', (sceneAsset) => {
    // 使用sceneAsset
});

// 预加载
Loader.preLoadBundleRes('Game', 'Prefabs/Boss', Prefab);
Loader.preLoadBundleDir('Game', 'Textures');
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| mask | 加载时是否显示遮罩阻止用户操作 |
| insert | 是否插队加载（优先于队列中的其他任务） |

### 10. BasicLayer - 层级基类

用于LevelManager中的游戏世界分层管理。

```typescript
class RoadLayer extends BasicLayer {
    initLayer() { /* 初始化道路 */ }
    reset() { /* 重置道路 */ }
    setData(d) { /* 设置关卡数据 */ }
    customUpdate(dt) { /* 每帧更新 */ }
    customLateUpdate(dt) { /* 延迟更新 */ }
}

class RoleLayer extends BasicLayer {
    // ...
}

// 在LevelManager中使用
class LevelManager extends Component {
    private customLayers: BasicLayer[] = [];

    initCustomLayers() {
        this.customLayers.push(new RoadLayer(this.perfabsLayer));
        this.customLayers.push(new RoleLayer(this.perfabsLayer));
    }

    update(dt) {
        for (let layer of this.customLayers) {
            layer.customUpdate(dt);
        }
    }
}
```

### 11. UIAnimations - UI动画组件

挂载到UI节点上，自动播放入场/出场动画。

```typescript
// 在编辑器中配置：
// enterDirection: 入场方向（Top/Bottom/Left/Right/Center_zoomIn/Center_zoomOut）
// easingType: 缓动类型
// moveDistRate: 移动距离比例
// delayTime: 延迟时间
// animTime: 动画时长
// isOpacityAnim: 是否同时播放透明度动画
// isDelayShowChildren: 是否延迟显示子节点
```

### 12. Tools - 通用工具

```typescript
Tools.roundNum(3.1415, 2);              // 3.14
Tools.convertToString(1500);            // "1.5K"
Tools.getMinByScend(125);               // { min: "02", scend: "05" }
Tools.getTimeByScend(3661);             // { hour: "01", min: "01", scend: "01" }
Tools.getRandomFromArr([1,2,3,4,5]);    // 随机元素
Tools.randomArr([1,2,3,4,5]);          // 随机排序
Tools.lerp(vec, target, 0.1);          // 插值
Tools.numberLerp(10, 20, 0.5);         // 15
Tools.getAngIn360(-30);                 // 330
Tools.clearObj(obj);                    // 清空对象所有属性引用
```

### 13. ColorLog - 彩色日志

```typescript
import { clog } from '../Tools/ColorLog';

clog.log('标题', '内容');      // 蓝色
clog.mark('标记', '内容');     // 紫色
clog.warn('警告', '内容');     // 橙色
clog.error('错误', '内容');    // 红色

clog.setEnabled(false);        // 关闭所有日志（上线时使用）
```

### 14. ServiceLocator - 服务定位器

依赖注入容器，解耦业务代码与具体系统实现。所有系统在 Init.ts 中注册，业务代码通过接口获取服务。

**生产环境使用：**

```typescript
import { ServiceLocator } from '../Core/ServiceLocator';
import { IStorage } from '../Interfaces/IStorage';
import { IAudio } from '../Interfaces/IAudio';

class BattleUI extends BasicUI {
    private storage: IStorage = ServiceLocator.get(IStorage);
    private audio: IAudio = ServiceLocator.get(IAudio);

    protected onShow(d?: any) {
        let gold = this.storage.getData().userAssets.asset;
        this.audio.playEffect('BtnClick');
    }
}
```

**测试环境注入Mock：**

```typescript
import { ServiceLocator } from '../Core/ServiceLocator';
import { IStorage } from '../Interfaces/IStorage';

class MockStorage implements IStorage {
    private mockData = { userAssets: { asset: 9999 } };
    getData() { return this.mockData; }
    setData(cb: Function) { cb(this.mockData); }
    saveData() { }
    getJsonData() { return null; }
    updateToAssets() { }
    getLevelData() { return {}; }
    getMaxLvCount() { return 0; }
}

// 测试前注入Mock
beforeEach(() => {
    ServiceLocator.register(IStorage, new MockStorage());
});

// 测试后清理
afterEach(() => {
    ServiceLocator.reset();
});
```

**ServiceLocator API：**

| 方法 | 说明 |
|------|------|
| `register(key, impl)` | 注册服务实现 |
| `get<T>(key)` | 获取服务实例 |
| `has(key)` | 检查服务是否已注册 |
| `resetOne(key)` | 重置单个服务 |
| `reset()` | 重置所有服务 |
| `getRegisteredKeys()` | 获取所有已注册的key |

**接口列表：**

| 接口 | 对应系统 | 说明 |
|------|---------|------|
| IStorage | StorageSystem | 存档读写 |
| IAudio | AudioSystem | 音频播放 |
| IUI | UISystem | UI管理 |
| IPool | GlobalPool | 对象池 |
| ISDK | SDKSystem | SDK适配 |
| IAdvert | AdvertSystem | 广告管理 |
| ILoader | Loader | 资源加载 |

**渐进式迁移：** 旧代码可以直接使用静态类调用（`StorageSystem.getData()`），新代码推荐通过接口调用（`ServiceLocator.get(IStorage).getData()`），两种方式可以共存。

## 快速接入指南

### 第一步：复制框架

将 `game-framework/` 目录复制到 Cocos Creator 项目的 `assets/` 下。

### 第二步：扩展业务枚举

```typescript
// UIEnum.ts - 添加业务UI
export enum UIEnum {
    // 框架UI
    HomeUI = 'HomeUI',
    SettingUI = 'SettingUI',
    // 业务UI
    BattleUI = 'BattleUI',
    ShopUI = 'ShopUI',
    WinUI = 'WinUI',
    LoseUI = 'LoseUI',
}

// AudioEnum.ts - 添加业务音效
export enum AudioEnum {
    BtnClick = 'BtnClick',
    homeBgm = 'homeBgm',
    // 业务音效
    FireGun = 'FireGun',
    boom = 'boom',
}

// EventTypes.ts - 添加业务事件
export namespace EventTypes {
    // 框架事件...
    
    // 业务事件
    export enum BattleEvents {
        Index = 3000,
        EnemyDeath,
        PlayerHit,
        WaveClear,
    }
}

// GlobalEnum.ts - 添加业务枚举
export namespace GlobalEnum {
    // 框架枚举...
    
    // 业务枚举
    export enum EnemyType {
        Normal = 0,
        Boss = 1,
    }
}
```

### 第三步：配置SDK广告ID

```typescript
// WXSDK.ts
protected setAdCfg(): void {
    this.adConfig.adBannerIdList = ["your_banner_id"];
    this.adConfig.adVideoIdList = ["your_video_id"];
    this.adConfig.adInterstitialId = "your_interstitial_id";
    this.adConfig.adCustomIdList = ["your_custom_id"];
    this.adConfig.shareInfoArr = [{ title: "一起来玩吧!", img: '' }];
}

// TTSDK.ts
protected setAdCfg(): void {
    this.adConfig.adBannerIdList = ["your_banner_id"];
    this.adConfig.adVideoIdList = ["your_video_id"];
}
```

### 第四步：配置广告UI映射

```typescript
// 在Init.ts的enterGame()中
AdvertSystem.setAdUIConfig(PlatformType.WXMiniGame, {
    'HomeUI': { banner: true, customAd: [1, 2] },
    'WinUI': { banner: false },
    'LoseUI': { banner: true },
});

AdvertSystem.setAdUIConfig(PlatformType.TTMiniGame, {
    'HomeUI': { banner: true },
});
```

### 第五步：配置GameDirector

```typescript
// 在Init.ts或场景初始化时
let director = this.getComponent(GameDirector);
director.setSubPackages(['Game', 'Effect', 'Roles']);
director.setCustomPrefabUrl({
    'Game': 'Prefabs',
    'Effect': 'Prefabs',
});
director.setPreLoadCfg({
    'bullet': 20,
    'enemyNormal': 10,
});
```

### 第六步：创建UI面板

```typescript
import { _decorator } from 'cc';
import { BasicUI } from '../Basic/BasicUI';
const { ccclass, property } = _decorator;

@ccclass('ShopUI')
export class ShopUI extends BasicUI {
    
    protected onShow(d?: any) {
        this.refreshList();
    }
    
    protected onHide(d?: any) {
        // 清理
    }
    
    private refreshList() {
        // 刷新商店列表
    }
}
```

### 第七步：创建游戏层级

```typescript
import { BasicLayer } from '../Basic/BasicLayer';

export class EnemyLayer extends BasicLayer {
    private enemies: Node[] = [];

    initLayer() {
        this.enemies = [];
    }

    reset() {
        for (let e of this.enemies) {
            GlobalPool.put(e);
        }
        this.enemies = [];
    }

    setData(d?: any) {
        // 根据关卡数据生成敌人
    }

    customUpdate(dt: number) {
        for (let e of this.enemies) {
            // 更新敌人逻辑
        }
    }
}
```

## 设计原则

### 事件驱动解耦

模块间通过 EventManager 通信，不直接引用对方。BasicComponent 在 onDestroy 时自动注销所有事件，从根本上避免事件泄漏。

### 对象池优先

所有频繁创建/销毁的游戏对象（子弹、敌人、特效）必须使用 GlobalPool。对象池与 BasicComponent 生命周期绑定，业务层无需关心池化细节。

### 配置注入

广告ID、UI映射、分包路径等通过配置方法注入，框架本身不包含任何业务硬编码。

### 依赖注入（ServiceLocator）

所有系统通过接口+ServiceLocator解耦，业务代码不直接依赖静态类，测试时可注入Mock实现。

### 分层职责

| 层 | 职责 | 依赖 |
|----|------|------|
| Interfaces | 定义系统接口契约 | 无 |
| Core | 服务定位器（依赖注入） | 无 |
| Basic | 定义生命周期和基类 | 无 |
| Config | 全局数据和枚举 | 无 |
| Managers | 事件通信 | 无 |
| System* | 各子系统实现（实现接口） | Basic, Config, Managers |
| Tools | 通用工具 | Basic, Config |
| InitScripts | 启动和流程控制 | 所有层 |

## 适配游戏类型

| 类型 | 适配度 | 说明 |
|------|--------|------|
| 跑酷/生存/Roguelike | ★★★★★ | 原生适配 |
| 塔防 | ★★★★★ | 实体管理+关卡+广告 |
| 合成/放置 | ★★★★ | 对象池+UI+存档 |
| 卡牌/策略 | ★★★★ | UI管理+数据驱动 |
| 消除/益智 | ★★★★ | 关卡+广告+UI |
| 模拟经营 | ★★★★ | UI+存档+多平台 |
| IO对战 | ★★★ | 缺网络层，需补充 |
| 棋牌 | ★★★ | 缺网络层，需补充 |
| MMORPG | ★★ | 缺网络+大世界 |
| MOBA/射击 | ★★ | 缺网络+ECS |

## 扩展指南

### 添加新平台SDK

1. 在 `SystemSDK/` 下创建新SDK类，继承 `SDK`
2. 重写 `setAdCfg()` 配置广告ID
3. 重写需要定制的方法（showBanner、showRewardedVideo等）
4. 在 `SDKSystem.ts` 的 `checkPlatform()` 中添加平台检测
5. 在 `PlatformType` 枚举中添加新平台

### 添加新系统

1. 在根目录创建 `SystemXxx/` 文件夹
2. 系统类继承 `BasicSystem`，实现 `init()` 方法
3. 在 `Init.ts` 的 `initSystems()` 中调用初始化
4. 在 `Init.ts` 的 `update()` 中检测 `isInitFinished`

### 添加网络层（扩展IO/棋牌类）

建议在框架基础上新增 `SystemNet/` 模块：

```
SystemNet/
├── NetSystem.ts          WebSocket管理
├── Protocol.ts           协议定义
├── PacketHandler.ts      消息分发
└── Reconnect.ts          断线重连
```

### 添加ECS层（扩展MOBA/射击类）

建议在框架基础上新增 `ECS/` 模块：

```
ECS/
├── Entity.ts             实体（纯ID + 组件容器）
├── IComponent.ts         组件接口（纯数据）
├── System.ts             系统基类（纯逻辑）
├── World.ts              ECS世界管理
└── Archetype.ts          原型优化（连续内存）
```
