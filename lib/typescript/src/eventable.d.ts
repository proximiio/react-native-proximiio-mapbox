export declare type Observer = (event?: string, data?: any, eventable?: Eventable) => any;
export declare class Eventable {
    _observers: Observer[];
    on(observer: Observer): void;
    off(observer: Observer): void;
    notify(event?: string, data?: any): void;
}
