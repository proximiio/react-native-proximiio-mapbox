"use strict";var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:true});exports.Eventable=void 0;var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _createClass2=_interopRequireDefault(require("@babel/runtime/helpers/createClass"));var _defineProperty2=_interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));var Eventable=function(){function Eventable(){(0,_classCallCheck2.default)(this,Eventable);(0,_defineProperty2.default)(this,"_observers",[]);}(0,_createClass2.default)(Eventable,[{key:"on",value:function on(observer){this._observers.push(observer);}},{key:"off",value:function off(observer){var index=this._observers.findIndex(function(o){return o===observer;});if(index>=0){this._observers.splice(index,1);}}},{key:"notify",value:function notify(event,data){var _this=this;this._observers.forEach(function(observer){return observer(event,data,_this);});}}]);return Eventable;}();exports.Eventable=Eventable;
//# sourceMappingURL=eventable.js.map