export const POI_TYPE = {
  POI: 'poi',
  HAZARD: 'hazard',
  DOOR: 'door',
  ENTRANCE: 'entrance',
  TICKET_GATE: 'ticket_gate',
  DECISION: 'decision',
  LANDMARK: 'landmark',
  ELEVATOR: 'elevator',
  ESCALATOR: 'escalator',
  STAIRCASE: 'staircase',
  TEXT: 'text'
}

export class PoiType {
  type: string
  title: string
  icon: string

  constructor(type: string, title: string, icon: string) {
    this.type = type
    this.title = title
    this.icon = icon
  }
}

export class Geometry {
  type: string
  coordinates: Array<any>

  constructor(data: any) {
    this.type = data.type
    this.coordinates = data.coordinates
  }
}

export class Feature {
  type: "Feature" = 'Feature'
  id: string
  geometry: Geometry
  properties: any

  constructor(data: any) {
    this.id = data.id
    this.geometry = new Geometry(data.geometry)
    this.properties = data.properties || {}

    if (typeof this.properties.title_i18n === 'string') {
      this.properties.title_i18n = JSON.parse(this.properties.title_i18n)
    }

    if (this.isPoint) {
      if (!this.properties.images) {
        this.properties.images = []
      }

      if (!this.properties.range) {
        this.properties.range = 3
      }
    }

    if (typeof this.properties.images === 'string') {
      this.properties.images = JSON.parse(this.properties.images)
    }

    if (this.isLevelChanger && Array.isArray(this.properties.levels)) {
      this.properties.levels.forEach((level: number) => this.properties[`__level_${level}`] = true)
    }
  }

  hasTitle(lang?: string) {
    if (typeof this.properties === 'undefined') {
      return false
    }

    if (lang) {
      return typeof this.properties.title_18n[lang] !== 'undefined'
    }

    return typeof this.properties.title !== 'undefined' || (this.properties.title_i18n && typeof this.properties.title_18n['en'] !== 'undefined')
  }

  getTitle(lang = 'en') {
    if (this.properties.title_18n) {
      return this.properties.title_18n[lang]
    }

    return this.properties.title
  }

  hasLevel(level: number) {
    if (this.isLevelChanger) {
      return this.properties.levels.includes(level)
    } else {
      return this.properties.level === level
    }
  }

  get isPoint() {
    return this.geometry.type === 'Point'
  }

  get isPolygon() {
    return this.geometry.type === 'Polygon' || this.geometry.type === 'MultiPolygon'
  }

  get isLineString() {
    return this.geometry.type === 'LineString' || this.geometry.type === 'MultiLineString'
  }

  get isHazard() {
    return this.properties.type === POI_TYPE.HAZARD
  }

  get isLandmark() {
    return this.properties.type === POI_TYPE.LANDMARK
  }

  get isDoor() {
    return this.properties.type === POI_TYPE.DOOR
  }

  get isEntrance() {
    return this.properties.type === POI_TYPE.ENTRANCE
  }

  get isDecisionPoint() {
    return this.properties.type === POI_TYPE.DECISION
  }

  get isTicketGate() {
    return this.properties.type === POI_TYPE.TICKET_GATE
  }

  get isElevator() {
    return this.properties.type === POI_TYPE.ELEVATOR
  }

  get isEscalator() {
    return this.properties.type === POI_TYPE.ESCALATOR
  }

  get isStairCase() {
    return this.properties.type === POI_TYPE.STAIRCASE
  }

  get isLevelChanger() {
    return this.isElevator || this.isEscalator || this.isStairCase
  }

  get isText() {
    return this.properties.type === 'text'
  }

  get isRoom() {
    return this.properties.room
  }

  get isRouting() {
    return this.properties.usecase === 'routing'
  }

  get json() {
    const clone = JSON.parse(JSON.stringify(this))
    if (clone.properties.metadata && typeof clone.properties.metadata !== 'object') {
      try {
        clone.properties.metadata = JSON.parse(clone.properties.metadata)
      } catch (e) {
        console.log('feature parsing failed:', clone.properties.metadata)
      }
    }
    Object.keys(clone.properties).forEach(key => {
      if (key.match('__level')) {
        delete clone.properties.key
      }
    })
    return clone
  }

  static point(id: string, latitude: number, longitude: number, properties?: any) {
    return new Feature({
      id,
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      properties
    })
  }
}
