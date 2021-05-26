import * as React from 'react';
import MapboxGL, {Expression} from '@react-native-mapbox-gl/maps';
import ProximiioMapbox from 'react-native-proximiio-mapbox';
import Proximiio, {ProximiioLocation} from 'react-native-proximiio';
import CompassHeading from 'react-native-compass-heading';
import coneImage from './assets/cone.png';
import Annotation from '@react-native-mapbox-gl/maps/javascript/components/annotations/Annotation';
import {ProximiioMapboxEvents} from './instance';
import Constants from './constants';

interface Props {
  onAccuracyChanged: (accuracy: number) => void;
  showHeadingIndicator?: boolean;
  visible?: boolean;
}
interface State {
  heading?: number;
  location?: ProximiioLocation;
}

export class UserLocationSource extends React.Component<Props, State> {
  private accuracy = undefined;
  state = {
    location: Proximiio.location,
    heading: 0,
  } as State;

  componentDidMount() {
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.STYLE_CHANGED, this.onChange);
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange);
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.LOCATION_UPDATED, this.onLocationUpdated);
    CompassHeading.start(2, ({heading, accuracy}) => {
      this.setState({heading: heading});
      if (this.accuracy !== accuracy && this.props.onAccuracyChanged) {
        this.accuracy = accuracy;
        this.props.onAccuracyChanged(accuracy);
      }
    });
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.STYLE_CHANGED, this.onChange);
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange);
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.LOCATION_UPDATED, this.onLocationUpdated);
    CompassHeading.stop();
  }

  render() {
    if (!this.props.visible || !this.state.location) {
      return null;
    }
    return (
      <Annotation
        id="proximiUserLocation"
        animated={true}
        key={'proximiioUserAnnotation'}
        coordinates={this.state.location ? [this.state.location.lng, this.state.location.lat] : null}>
        {createIcon(this.props.showHeadingIndicator, this.state.heading)}
      </Annotation>
    );
  }

  private onLocationUpdated = (location: ProximiioLocation) => {
    this.setState({location: location});
  };

  private onChange = () => {
    this.forceUpdate();
  };
}

const getHeadingIndicatorStyle = (iconRotation?: number) => {
  return {
    iconImage: coneImage,
    iconSize: 3.2,
    iconAllowOverlap: true,
    iconRotate: iconRotation,
  };
};

export const createIcon = (showsUserHeadingIndicator?: boolean, heading?: number) => [
  (showsUserHeadingIndicator ?
    <MapboxGL.SymbolLayer
      key="proximiioUserLocationConeLayer"
      id="proximiioUserLocationConeLayer"
      aboveLayerID={Constants.LAYER_POLYGONS_ABOVE_PATHS}
      style={getHeadingIndicatorStyle(heading)}
    /> : []),
  <MapboxGL.CircleLayer
    key="proximiioUserLocationPluseCircle"
    id="proximiioUserLocationPluseCircle"
    style={layerStyles.pluse}
  />,
  <MapboxGL.CircleLayer
    key="proximiioUserLocationWhiteCircle"
    id="proximiioUserLocationWhiteCircle"
    aboveLayerID="proximiioUserLocationPluseCircle"
    style={layerStyles.background}
  />,
  <MapboxGL.CircleLayer
    key="proximiioUserLocationBlueCicle"
    id="proximiioUserLocationBlueCicle"
    aboveLayerID="proximiioUserLocationWhiteCircle"
    style={layerStyles.foreground}
  />,
];

const proximiBlue = 'rgb(59,143,214)';

const layerStyles = {
  pluse: {
    circleRadius: 25,
    circleColor: proximiBlue,
    circleOpacity: 0.2,
    circlePitchAlignment: 'map',
  },
  background: {
    circleRadius: 15,
    circleColor: '#fff',
    circlePitchAlignment: 'map',
  },
  foreground: {
    circleRadius: 10,
    circleColor: proximiBlue,
    circlePitchAlignment: 'map',
  },
};
