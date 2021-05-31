declare type RouteStepSymbol = 'START' | 'TURN_AROUND' | 'HARD_LEFT' | 'LEFT' | 'SLIGHT_LEFT' | 'STRAIGHT' | 'SLIGHT_RIGHT' | 'RIGHT' | 'HARD_RIGHT' | 'UP_ELEVATOR' | 'UP_ESCALATOR' | 'UP_STAIRS' | 'DOWN_ELEVATOR' | 'DOWN_ESCALATOR' | 'DOWN_STAIRS' | 'FINISH';
interface RouteStepDescriptor {
    instruction: string;
    symbol: RouteStepSymbol;
}
interface RouteDescriptor {
    distanceMeters: number;
    distanceCustom?: number;
    distanceCustomUnit?: string;
    duration: number;
    destinationTitle: string;
    steps: RouteStepDescriptor[];
}
declare const example: {
    distanceMeters: number;
    distanceCustom: number;
    distanceCustomUnit: string;
    duration: number;
    destinationTitle: string;
    steps: {
        instruction: string;
        symbol: string;
    }[];
};
