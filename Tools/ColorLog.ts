/**
 * 彩色日志工具
 * 提供带颜色标记的控制台日志输出功能，方便在开发调试时区分不同级别的日志信息。
 * 支持普通日志、标记日志、警告日志和错误日志四种级别，每种级别使用不同的颜色样式。
 */

/** 彩色日志命名空间，提供分级别的彩色控制台输出方法 */
export namespace clog {
    /** 日志开关，为 false 时所有日志方法将不输出任何内容 */
    private static _enabled: boolean = true;

    /**
     * 设置日志开关
     * @param v true 启用日志输出，false 禁用日志输出
     */
    export function setEnabled(v: boolean) {
        clog._enabled = v;
    }

    /**
     * 输出普通级别的日志（蓝色标签）
     * 标题背景色为深蓝灰(#35495E)，消息背景色为蓝色(#409EFF)
     * @param title 日志标题，显示在左侧深色背景中
     * @param msg 可选的日志消息内容，显示在右侧蓝色背景中
     */
    export function log(title: any, msg?: any): void {
        if (!clog._enabled) return;
        if (msg) {
            console.log(
                `%c ${title} %c ${msg} `,
                'background: #35495E;padding: 1px;border-radius: 2px 0 0 2px;color: #fff;',
                'background: #409EFF;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;'
            );
        } else {
            console.log(
                `%c ${title} `,
                'background: #409EFF;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;',
            );
        }
    }

    /**
     * 输出标记级别的日志（紫色标签）
     * 标题背景色为紫色(#DD55FF)，消息背景色为蓝色(#409EFF)
     * 用于需要特别关注的调试信息
     * @param title 日志标题，显示在左侧紫色背景中
     * @param msg 可选的日志消息内容，显示在右侧蓝色背景中
     */
    export function mark(title: any, msg?: any): void {
        if (!clog._enabled) return;
        if (msg) {
            console.log(
                `%c ${title} %c ${msg} `,
                'background: #DD55FF;padding: 1px;border-radius: 2px 0 0 2px;color: #fff;',
                'background: #409EFF;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;'
            );
        } else {
            console.log(
                `%c ${title} `,
                'background: #409EFF;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;',
            );
        }
    }

    /**
     * 输出警告级别的日志（橙色标签）
     * 标题背景色为橙色(#FF7026)，消息背景色为蓝色(#409EFF)
     * 用于输出警告信息，提示可能的问题
     * @param title 日志标题，显示在左侧橙色背景中
     * @param msg 可选的日志消息内容，显示在右侧蓝色背景中
     */
    export function warn(title: any, msg?: any): void {
        if (!clog._enabled) return;
        if (msg) {
            console.log(
                `%c ${title} %c ${msg} `,
                'background: #FF7026;padding: 1px;border-radius: 2px 0 0 2px;color: #fff;',
                'background: #409EFF;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;'
            );
        } else {
            console.log(
                `%c ${title} `,
                'background: #FF7026;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;',
            );
        }
    }

    /**
     * 输出错误级别的日志（红色标签）
     * 标题背景色为红色(#FF2626)，消息背景色为黄色(#FFA800)
     * 用于输出错误信息，标识严重问题
     * @param title 日志标题，显示在左侧红色背景中
     * @param msg 可选的日志消息内容，显示在右侧黄色背景中
     */
    export function error(title: any, msg?: any): void {
        if (!clog._enabled) return;
        if (msg) {
            console.log(
                `%c ${title} %c ${msg} `,
                'background: #FF2626;padding: 1px;border-radius: 2px 0 0 2px;color: #fff;',
                'background: #FFA800;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;'
            );
        } else {
            console.log(
                `%c ${title} `,
                'background: #FF2626;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;',
            );
        }
    }
}
