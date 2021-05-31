import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    rasterOpacity: number;
    rasterHueRotate: number;
    rasterBrightnessMin: number;
    rasterBrightnessMax: number;
    rasterSaturation: number;
    rasterContrast: number;
    rasterResampling: 'linear' | 'nearest';
    rasterFadeDuration: number;
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    visibility: 'visible' | 'none';
    constructor(data: any);
}
export default class RasterLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
