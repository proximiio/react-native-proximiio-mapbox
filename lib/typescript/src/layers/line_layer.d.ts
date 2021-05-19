import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    lineColor: string | string[];
    lineOpacity: number;
    lineTranslate: [number, number];
    lineTranslateAnchor: 'map' | 'viewport';
    lineWidth: number;
    lineGapWidth: number;
    lineOffset: number;
    lineBlur: number;
    lineDasharray?: [number, number];
    linePattern?: string;
    lineGradient?: string;
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    visibility: 'visible' | 'none';
    lineCap: 'butt' | 'round' | 'square';
    lineJoin: 'bevel' | 'round' | 'miter';
    lineMiterLimit: number;
    lineRoundLimit: number;
    constructor(data: any);
}
export default class LineLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
