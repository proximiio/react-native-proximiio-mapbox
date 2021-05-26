var _interopRequireWildcard=require("@babel/runtime/helpers/interopRequireWildcard");var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.LayoutProperties=exports.PaintProperties=void 0;var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _assertThisInitialized2=_interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));var _inherits2=_interopRequireDefault(require("@babel/runtime/helpers/inherits"));var _possibleConstructorReturn2=_interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));var _getPrototypeOf2=_interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));var _defineProperty2=_interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));var _base_layer=_interopRequireWildcard(require("./base_layer"));function _createSuper(Derived){var hasNativeReflectConstruct=_isNativeReflectConstruct();return function _createSuperInternal(){var Super=(0,_getPrototypeOf2.default)(Derived),result;if(hasNativeReflectConstruct){var NewTarget=(0,_getPrototypeOf2.default)(this).constructor;result=Reflect.construct(Super,arguments,NewTarget);}else{result=Super.apply(this,arguments);}return(0,_possibleConstructorReturn2.default)(this,result);};}function _isNativeReflectConstruct(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Date.prototype.toString.call(Reflect.construct(Date,[],function(){}));return true;}catch(e){return false;}}var PaintProperties=function(_Serializable){(0,_inherits2.default)(PaintProperties,_Serializable);var _super=_createSuper(PaintProperties);function PaintProperties(data){var _this;(0,_classCallCheck2.default)(this,PaintProperties);_this=_super.call(this);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleRadius",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleColor",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleBlur",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleOpacity",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleTranslate",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleTranslateAnchor",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circlePitchScale",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circlePitchAlignment",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleStrokeWidth",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleStrokeColor",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"circleStrokeOpacity",void 0);_this.circleRadius=data['circle-radius']||5;_this.circleColor=data['circle-color']||'#000000';_this.circleBlur=data['circle-blur']||0;_this.circleOpacity=data['circle-opacity']||1;_this.circleTranslate=data['circle-translate']||[0,0];_this.circleTranslateAnchor=data['circle-translate-anchor']||'map';_this.circlePitchScale=data['circle-pitch-scale']||'map';_this.circlePitchAlignment=data['circle-pitch-alignment']||'viewport';_this.circleStrokeWidth=data['circle-stroke-width']||1;_this.circleStrokeColor=data['circle-stroke-color']||'#000000';_this.circleStrokeOpacity=data['circle-stroke-opacity']||1;return _this;}return PaintProperties;}(_base_layer.Serializable);exports.PaintProperties=PaintProperties;var LayoutProperties=function(_Serializable2){(0,_inherits2.default)(LayoutProperties,_Serializable2);var _super2=_createSuper(LayoutProperties);function LayoutProperties(data){var _this2;(0,_classCallCheck2.default)(this,LayoutProperties);_this2=_super2.call(this);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this2),"visibility",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this2),"circleSortKey",void 0);_this2.visibility=data.visibility||'visible';_this2.circleSortKey=data['circle-sort-key']||0;return _this2;}return LayoutProperties;}(_base_layer.Serializable);exports.LayoutProperties=LayoutProperties;var CircleLayer=function(_BaseLayer){(0,_inherits2.default)(CircleLayer,_BaseLayer);var _super3=_createSuper(CircleLayer);function CircleLayer(data){var _this3;(0,_classCallCheck2.default)(this,CircleLayer);_this3=_super3.call(this,data);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this3),"paint",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this3),"layout",void 0);_this3.type='circle';_this3.paint=new PaintProperties(data.paint||{});_this3.layout=new LayoutProperties(data.layout||{});return _this3;}return CircleLayer;}(_base_layer.default);exports.default=CircleLayer;
//# sourceMappingURL=circle_layer.js.map