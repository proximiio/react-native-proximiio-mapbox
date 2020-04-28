import {
  FeatureType,
  ProximiioMapboxRouteAndroid,
  ProximiioMapboxRouteIOS,
  ProximiioMapboxRouteUpdate,
  ProximiioMapboxRouteNode
} from "./types";

import { isIOS } from "./helpers";

export class ProximiioRoute {
  features: FeatureType[] = []
  lastUpdate?: ProximiioMapboxRouteUpdate

  constructor(features: FeatureType[]) {
    this.features = features
  }

  update = (update: ProximiioMapboxRouteUpdate) => {
    if (!isIOS) {
      this.lastUpdate = update
      this.features = update.remaining
    }
  }

  static fromAndroid(route: ProximiioMapboxRouteAndroid) {
    return new ProximiioRoute(route)
  }

  static getIOSFeatures(nodes: ProximiioMapboxRouteNode[], nodeIndex: number, level: number) {
    const features = [] as FeatureType[]
    const remainingCoordinates = nodes
      .filter(node => node.level === level)
      .slice(nodeIndex, nodes.length)
      .map(node => node.coordinates)

    const completedCoordinates = nodes
      .filter(node => node.level === level)
      .slice(0, nodeIndex)
      .map(node => node.coordinates)

    const lineStringRemaining = {
      id: 'proximiio-route-remaining',
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: remainingCoordinates
      },
      properties: {
        level: 0
      }
    } as FeatureType

    const lineStringCompleted = {
      id: 'proximiio-route-completed',
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: completedCoordinates
      },
      properties: {
        level: 0,
        completed: true
      }
    } as FeatureType

    if (remainingCoordinates.length > 0) {
      features.push(lineStringRemaining)
    }
    if (completedCoordinates.length > 0) {
      features.push(lineStringCompleted)
    }

    return features
  }

  static fromIOS(_route: ProximiioMapboxRouteIOS) {
    return new ProximiioRoute(_route.linestringList)
  }
}
