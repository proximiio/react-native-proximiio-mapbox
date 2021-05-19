export declare class Serializable {
    get json(): any;
}
export default class BaseLayer {
    id: string;
    source?: string;
    sourceLayer?: string;
    type: 'background' | 'fill' | 'line' | 'symbol' | 'raster' | 'circle' | 'fill-extrusion' | 'heatmap' | 'hillshade';
    minZoomLevel?: number;
    maxZoomLevel?: number;
    filter?: any;
    paint?: Serializable;
    layout?: Serializable;
    metadata?: any;
    constructor(data: any);
    get json(): any;
    get style(): any;
    setFilterLevel(level: number): void;
}
