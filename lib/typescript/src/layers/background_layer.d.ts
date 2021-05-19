import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    backgroundColor: string;
    backgroundPattern?: string;
    backgroundOpacity: string;
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    visibility: 'visible' | 'none';
    constructor(data: any);
}
export default class BackgroundLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
