// import React, { Context } from 'react';
// import { StyleProp, Platform } from 'react-native';
// import MapboxGL, {
//   Expression,
//   FillLayerStyle,
//   SymbolLayerStyle,
//   FillLayerProps,
// } from '@react-native-mapbox-gl/maps';
// import Proximiio, { ProximiioEvents, ProximiioLocation, ProximiioContext, ProximiioContextType } from 'react-native-proximiio';
// import ProximiioMapbox, { ProximiioMapboxEvents } from './instance';
//
// import Constants from './constants';
// import { isIOS, createGeoJSONCircle } from './helpers';
// import { ProximiioFeatureType, FeatureCollection } from './types';
//
// export type UserLocationSourceOptions = {
//   aboveLayer?: string
//   markerStyle?: StyleProp<SymbolLayerStyle>
//   accuracyStyle?: StyleProp<FillLayerStyle>
// };
//
// interface Props {
//   level: number
//   options?: UserLocationSourceOptions
// }
//
// const accuracyFilterFor = (level: number) => (isIOS ?
//   [
//     'all',
//     ['==', 'usecase', 'user-location-accuracy'],
//     ['==', 'level', level],
//   ] :
//   [
//     'all',
//     ['==', ['get', 'usecase'], 'user-location-accuracy'],
//     ['==', ['to-number', ['get', 'level']], level],
//   ]
// ) as Expression;
//
// const markerFilterFor = (level: number) => (isIOS ?
//   [
//     'all',
//     ['==', 'usecase', 'user-location'],
//     ['==', 'level', level]
//   ] :
//   [
//     'all',
//     ['==', ['get', 'usecase'], 'user-location'],
//     ['==', ['to-number', ['get', 'level']], level],
//   ]
// ) as Expression;
//
// const defaultOptions = {
//   aboveLayer: Constants.LAYER_POLYGONS_ABOVE_PATHS,
//   markerStyle: {
//     iconImage: ['get', 'icon'] as Expression,
//     iconSize: 0.5,
//     iconAllowOverlap: true
//   },
//   accuracyStyle: {
//     fillColor: '#0080c0',
//     fillOpacity: 0.3,
//   },
// };
//
// const getCollection = (location: ProximiioLocation, level: number = 0): FeatureCollection => ({
//   type: 'FeatureCollection',
//   features: [
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Polygon',
//         coordinates: [
//           createGeoJSONCircle(
//             [location.lng, location.lat],
//             (location.accuracy || 50) / 1000,
//             50
//           ),
//         ],
//       },
//       properties: {
//         usecase: 'user-location-accuracy',
//         level,
//       },
//     } as ProximiioFeatureType,
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [location.lng, location.lat],
//       },
//       properties: {
//         usecase: 'user-location',
//         icon: 'bluedot',
//         level,
//       },
//     } as ProximiioFeatureType
//   ],
// })
//
// interface State {
//   accuracyIndex: number
//   markerIndex: number
//   accuracyFilter: any
//   markerFilter: any
//   location?: ProximiioLocation
//   collection: {
//     type: 'FeatureCollection',
//     features: ProximiioFeatureType[]
//   }
// }
//
// export class UserLocationSource extends React.Component<Props, State> {
//   static contextType: Context<ProximiioContextType> = ProximiioContext
//
//   state = {
//     accuracyFilter: accuracyFilterFor(this.context.level || 0),
//     markerFilter: markerFilterFor(this.context.level || 0),
//     accuracyIndex: 200,
//     markerIndex: 201,
//     collection: {
//       type: 'FeatureCollection',
//       features: []
//     }
//   } as State
//
//   componentDidMount() {
//     ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange);
//     Proximiio.subscribe(ProximiioEvents.PositionUpdated, this.onPositionUpdate);
//     const idx = ProximiioMapbox.style.layers.length
//     this.setState({
//       accuracyIndex: idx ,
//       markerIndex: idx + 1,
//       location: Proximiio.location,
//     })
//   }
//
//   componentWillUnmount() {
//     ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange);
//     Proximiio.unsubscribe(ProximiioEvents.PositionUpdated, this.onPositionUpdate);
//   }
//
//   componentDidUpdate(prevProps: Props) {
//     const newState = {} as State
//     if (this.context.location) {
//       newState.location = this.context.location
//     }
//
//     if (prevProps.level !== this.props.level) {
//       newState.accuracyFilter = accuracyFilterFor(this.context.level || 0)
//       newState.markerFilter = markerFilterFor(this.context.level || 0)
//     }
//
//     this.setState(newState);
//   }
//
//   shouldComponentUpdate(nextProps: Props, nextState: State) {
//     if (this.props.level !== nextProps.level) {
//       console.log('locationSource: shouldUpdate - level');
//       return true
//     }
//
//     if (this.context.location && !nextState.location) {
//       console.log('locationSource: shouldUpdate - location');
//       return true
//     }
//
//     if (this.context.location && nextState.location) {
//       if ((this.context.location.lng !== nextState.location.lng) ||
//           (this.context.location.lat !== nextState.location.lat)) {
//         console.log('locationSource: shouldUpdate - location change');
//         return true
//       }
//     }
//
//     return false
//   }
//
//   onChange = () => {
//     if (!this.context.location) {
//       console.log('locationSource: onChange no location');
//       return
//     }
//
//     console.log('locationSource: onChange');
//
//     const idx = ProximiioMapbox.style.layers.length
//     this.setState({
//       accuracyIndex: idx,
//       markerIndex: idx + 1,
//       collection: getCollection(this.context.location, this.context.level)
//     })
//   }
//
//   onPositionUpdate = (location: ProximiioLocation) => {
//     this.setState({location: location});
//   }
//
//   public render() {
//     const _options = {
//       ...defaultOptions,
//       ...this.props.options
//     };
//
//     let location = this.getLocation();
//     if (!location) {
//       console.log('locationSource: orender no location');
//       return null
//     }
//
//     const collection = getCollection(location, this.context.level);
//
//     return (
//       <MapboxGL.ShapeSource
//         id={Constants.SOURCE_USER_LOCATION}
//         key={Constants.SOURCE_USER_LOCATION + new Date().getTime()}
//         shape={collection}
//         cluster={false}
//         maxZoomLevel={24}
//       >
//         <MapboxGL.FillLayer
//           id={Constants.LAYER_USER_ACCURACY}
//           key={Constants.LAYER_USER_ACCURACY + new Date().getTime()}
//           filter={this.state.accuracyFilter}
//           style={_options.accuracyStyle}
//           aboveLayerID={Constants.LAYER_POLYGONS_ABOVE_PATHS}
//         />
//
//         <MapboxGL.SymbolLayer
//           id={Constants.LAYER_USER_MARKER}
//           key={Constants.LAYER_USER_MARKER}
//           filter={this.state.markerFilter}
//           style={_options.markerStyle}
//           aboveLayerID={Constants.LAYER_USER_ACCURACY}
//         />
//       </MapboxGL.ShapeSource>
//     )
//   }
//
//   private getLocation(): ProximiioLocation {
//     let location = this.context.location;
//     if (!location) {
//       location = Proximiio.location;
//     }
//     return location;
//   }
//
// }
