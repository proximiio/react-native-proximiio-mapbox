type RouteStepSymbol = 'START' |
  'TURN_AROUND' |
  'HARD_LEFT' |
  'LEFT' |
  'SLIGHT_LEFT' |
  'STRAIGHT' |
  'SLIGHT_RIGHT' |
  'RIGHT' |
  'HARD_RIGHT' |
  'UP_ELEVATOR' |
  'UP_ESCALATOR' |
  'UP_STAIRS' |
  'DOWN_ELEVATOR' |
  'DOWN_ESCALATOR' |
  'DOWN_STAIRS' |
  'FINISH'

interface RouteStepDescriptor {
  instruction: string,
  symbol: RouteStepSymbol
}

interface RouteDescriptor {
  distanceMeters: number,
  distanceCustom?: number,
  distanceCustomUnit?: string,
  duration: number,
  destinationTitle: string,
  steps: RouteStepDescriptor[]
}

const example = {
  distanceMeters: 56,
  distanceCustom: 123,
  distanceCustomUnit: 'step',
  duration: 88,
  destinationTitle: 'My Destination',
  steps: [
    { instruction: 'In 5 meters, turn slight left', symbol: 'SLIGHT_LEFT' },
    { instruction: 'In 7 meters, turn right', symbol: 'HARD_RIGHT' }
  ]
}


