export declare const POI_TYPE: {
    POI: string;
    HAZARD: string;
    DOOR: string;
    ENTRANCE: string;
    TICKET_GATE: string;
    DECISION: string;
    LANDMARK: string;
    ELEVATOR: string;
    ESCALATOR: string;
    STAIRCASE: string;
    TEXT: string;
};
export declare class PoiType {
    type: string;
    title: string;
    icon: string;
    constructor(type: string, title: string, icon: string);
}
export declare class Geometry {
    type: string;
    coordinates: Array<any>;
    constructor(data: any);
}
export declare class Feature {
    type: "Feature";
    id: string;
    geometry: Geometry;
    properties: any;
    constructor(data: any);
    hasTitle(lang?: string): any;
    getTitle(lang?: string): any;
    getDescription(lang?: string): any;
    getImageUrls(proximiioToken: String): any;
    contains(query: string): boolean;
    hasLevel(level: number): any;
    get isPoint(): boolean;
    get isPolygon(): boolean;
    get isLineString(): boolean;
    get isPoi(): boolean;
    get isHazard(): boolean;
    get isLandmark(): boolean;
    get isDoor(): boolean;
    get isEntrance(): boolean;
    get isDecisionPoint(): boolean;
    get isTicketGate(): boolean;
    get isElevator(): boolean;
    get isEscalator(): boolean;
    get isStairCase(): boolean;
    get isLevelChanger(): boolean;
    get isText(): boolean;
    get isRoom(): any;
    get isRouting(): boolean;
    get json(): any;
    static point(id: string, latitude: number, longitude: number, properties?: any): Feature;
}
