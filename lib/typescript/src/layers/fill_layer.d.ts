import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    fillAntialias: boolean;
    fillOpacity: number;
    fillColor: string | string[];
    fillOutlineColor?: string | string[];
    fillTranslate: [number, number];
    fillTranslateAnchor: 'map' | 'viewport';
    fillPattern?: string | string[];
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    fillSortKey?: number;
    visibility: 'visible' | 'none';
    constructor(data: any);
}
export default class FillLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
