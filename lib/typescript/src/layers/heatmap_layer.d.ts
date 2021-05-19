import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    heatmapRadius: number;
    heatmapWeight: number;
    heatmapIntensity: number;
    heatmapOpacity: number;
    heatmapColor: string;
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    visibility: 'visible' | 'none';
    constructor(data: any);
}
export default class HeatmapLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
