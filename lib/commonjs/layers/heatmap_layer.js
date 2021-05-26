"use strict";var _interopRequireWildcard=require("@babel/runtime/helpers/interopRequireWildcard");var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.LayoutProperties=exports.PaintProperties=void 0;var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _assertThisInitialized2=_interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));var _inherits2=_interopRequireDefault(require("@babel/runtime/helpers/inherits"));var _possibleConstructorReturn2=_interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));var _getPrototypeOf2=_interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));var _defineProperty2=_interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));var _base_layer=_interopRequireWildcard(require("./base_layer"));function _createSuper(Derived){var hasNativeReflectConstruct=_isNativeReflectConstruct();return function _createSuperInternal(){var Super=(0,_getPrototypeOf2.default)(Derived),result;if(hasNativeReflectConstruct){var NewTarget=(0,_getPrototypeOf2.default)(this).constructor;result=Reflect.construct(Super,arguments,NewTarget);}else{result=Super.apply(this,arguments);}return(0,_possibleConstructorReturn2.default)(this,result);};}function _isNativeReflectConstruct(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Date.prototype.toString.call(Reflect.construct(Date,[],function(){}));return true;}catch(e){return false;}}var PaintProperties=function(_Serializable){(0,_inherits2.default)(PaintProperties,_Serializable);var _super=_createSuper(PaintProperties);function PaintProperties(data){var _this;(0,_classCallCheck2.default)(this,PaintProperties);_this=_super.call(this);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"heatmapRadius",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"heatmapWeight",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"heatmapIntensity",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"heatmapOpacity",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this),"heatmapColor",void 0);_this.heatmapRadius=data['heatmap-radius']||30;_this.heatmapWeight=data['heatmap-weight']||1;_this.heatmapIntensity=data['heatmap-intensity']||1;_this.heatmapOpacity=data['heatmap-opacity']||1;_this.heatmapColor=data['heatmap-color']||'';return _this;}return PaintProperties;}(_base_layer.Serializable);exports.PaintProperties=PaintProperties;var LayoutProperties=function(_Serializable2){(0,_inherits2.default)(LayoutProperties,_Serializable2);var _super2=_createSuper(LayoutProperties);function LayoutProperties(data){var _this2;(0,_classCallCheck2.default)(this,LayoutProperties);_this2=_super2.call(this);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this2),"visibility",void 0);_this2.visibility=data.visibility||'visible';return _this2;}return LayoutProperties;}(_base_layer.Serializable);exports.LayoutProperties=LayoutProperties;var HeatmapLayer=function(_BaseLayer){(0,_inherits2.default)(HeatmapLayer,_BaseLayer);var _super3=_createSuper(HeatmapLayer);function HeatmapLayer(data){var _this3;(0,_classCallCheck2.default)(this,HeatmapLayer);_this3=_super3.call(this,data);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this3),"paint",void 0);(0,_defineProperty2.default)((0,_assertThisInitialized2.default)(_this3),"layout",void 0);_this3.paint=new PaintProperties(data.paint||{});_this3.layout=new LayoutProperties(data.layout||{});return _this3;}return HeatmapLayer;}(_base_layer.default);exports.default=HeatmapLayer;
//# sourceMappingURL=heatmap_layer.js.map