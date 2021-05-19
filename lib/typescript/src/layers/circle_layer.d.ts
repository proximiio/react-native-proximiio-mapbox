import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    circleRadius: number;
    circleColor: string;
    circleBlur: number;
    circleOpacity: number;
    circleTranslate: [number, number];
    circleTranslateAnchor: 'map' | 'viewport';
    circlePitchScale: 'map' | 'viewport';
    circlePitchAlignment: 'map' | 'viewport';
    circleStrokeWidth: number;
    circleStrokeColor: string;
    circleStrokeOpacity: number;
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    visibility: 'visible' | 'none';
    circleSortKey: number;
    constructor(data: any);
}
export default class CircleLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
