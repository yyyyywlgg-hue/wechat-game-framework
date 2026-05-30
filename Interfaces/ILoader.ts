/**
 * 资源加载器接口
 * 定义资源加载器的公共API，用于依赖注入和解耦
 * 业务代码通过此接口访问加载功能，而非直接引用 Loader 静态类
 */
export interface ILoader {
    /** 加载子包 */
    loadBundle(name: string, cb?: Function, mask?: boolean, insert?: boolean): void;
    /** 从子包加载单个资源 */
    loadBundleRes(bundle: string, url: string, cb: (asset: any) => void, type?: any, mask?: boolean): void;
    /** 从子包加载多个资源 */
    loadBundleArray(bundle: string, urls: string[], cb: (assets: any) => void, type?: any, mask?: boolean): void;
    /** 从子包加载文件夹资源 */
    loadBundleDir(bundle: string, dir: string, cb: (assets: any[]) => void, type?: any, mask?: boolean): void;
    /** 从子包加载场景资源 */
    loadBundleScene(bundle: string, scene: string, cb: (res: any) => void, mask?: boolean): void;
}
