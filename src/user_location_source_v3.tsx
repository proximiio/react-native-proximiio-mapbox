import * as React from 'react';
import MapboxGL, {
  CircleLayerStyle,
  SymbolLayerStyle
} from '@react-native-mapbox-gl/maps';
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
  markerOuterRingStyle?: CircleLayerStyle
  markerMiddleRingStyle?: CircleLayerStyle
  markerInnerRingStyle?: CircleLayerStyle
  headingStyle?: SymbolLayerStyle
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

    let styles = getDefaultStyle(this.state.heading || 0);
    styles.outerRing = {...styles.outerRing, ...this.props.markerOuterRingStyle};
    styles.middleRing = {...styles.middleRing, ...this.props.markerMiddleRingStyle};
    styles.innerRing = {...styles.innerRing, ...this.props.markerInnerRingStyle};
    styles.heading = {...styles.heading, ...this.props.headingStyle};

    return (
      <Annotation
        id="proximiUserLocation"
        animated={true}
        key={'proximiioUserAnnotation'}
        coordinates={this.state.location ? [this.state.location.lng, this.state.location.lat] : null}>
        {createIcon(this.props.showHeadingIndicator, styles)}
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

export const createIcon = (showsUserHeadingIndicator?: boolean, styles: Styles) => [
  (showsUserHeadingIndicator ?
    <MapboxGL.SymbolLayer
      key={Constants.LAYER_USER_MARKER_CONE}
      id={Constants.LAYER_USER_MARKER_CONE}
      aboveLayerID={Constants.LAYER_POLYGONS_ABOVE_PATHS}
      style={styles.heading}
    /> : []),
  <MapboxGL.CircleLayer
    key={Constants.LAYER_USER_MARKER_1}
    id={Constants.LAYER_USER_MARKER_1}
    aboveLayerID={Constants.LAYER_USER_MARKER_CONE}
    style={styles.outerRing}
  />,
  <MapboxGL.CircleLayer
    key={Constants.LAYER_USER_MARKER_2}
    id={Constants.LAYER_USER_MARKER_2}
    aboveLayerID={Constants.LAYER_USER_MARKER_1}
    style={styles.middleRing}
  />,
  <MapboxGL.CircleLayer
    key={Constants.LAYER_USER_MARKER_3}
    id={Constants.LAYER_USER_MARKER_3}
    aboveLayerID={Constants.LAYER_USER_MARKER_2}
    style={styles.innerRing}
  />,
];

const proximiBlue = 'rgb(59,143,214)';


interface Styles {
  heading: SymbolLayerStyle;
  outerRing: CircleLayerStyle;
  middleRing: CircleLayerStyle;
  innerRing: CircleLayerStyle;
}

const getDefaultStyle = (heading: number): Styles => {
  return {
    heading: getHeadingIndicatorStyle(heading),
    outerRing: {
      circleRadius: 25,
      circleColor: proximiBlue,
      circleOpacity: 0.2,
      circlePitchAlignment: 'map',
    },
    middleRing: {
      circleRadius: 15,
      circleColor: '#fff',
      circlePitchAlignment: 'map',
    },
    innerRing: {
      circleRadius: 10,
      circleColor: proximiBlue,
      circlePitchAlignment: 'map',
    }
  };
};

const getHeadingIndicatorStyle = (iconRotation?: number) => {
  return {
    iconImage: coneImage,
    iconSize: 2.4,
    iconAllowOverlap: true,
    iconRotate: iconRotation,
  };
};
