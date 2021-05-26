var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:true});exports.Feature=exports.Geometry=exports.PoiType=exports.POI_TYPE=void 0;var _createClass2=_interopRequireDefault(require("@babel/runtime/helpers/createClass"));var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _defineProperty2=_interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));var POI_TYPE={POI:'poi',HAZARD:'hazard',DOOR:'door',ENTRANCE:'entrance',TICKET_GATE:'ticket_gate',DECISION:'decision',LANDMARK:'landmark',ELEVATOR:'elevator',ESCALATOR:'escalator',STAIRCASE:'staircase',TEXT:'text'};exports.POI_TYPE=POI_TYPE;var PoiType=function PoiType(type,title,icon){(0,_classCallCheck2.default)(this,PoiType);(0,_defineProperty2.default)(this,"type",void 0);(0,_defineProperty2.default)(this,"title",void 0);(0,_defineProperty2.default)(this,"icon",void 0);this.type=type;this.title=title;this.icon=icon;};exports.PoiType=PoiType;var recursiveSearch=function recursiveSearch(object,_query){var query=_query.trim().toLocaleLowerCase();var keys=Object.keys(object);var found=false;for(var k=0;k<keys.length;k++){var key=keys[k];if(typeof object[key]==='string'){if(object[key].trim().toLocaleLowerCase().match(query)){found=true;break;}}if(typeof object[key]==='object'){found=recursiveSearch(object[key],query);if(found){break;}}}return found;};var Geometry=function Geometry(data){(0,_classCallCheck2.default)(this,Geometry);(0,_defineProperty2.default)(this,"type",void 0);(0,_defineProperty2.default)(this,"coordinates",void 0);this.type=data.type;this.coordinates=data.coordinates;};exports.Geometry=Geometry;var Feature=function(){function Feature(data){var _this=this;(0,_classCallCheck2.default)(this,Feature);(0,_defineProperty2.default)(this,"type",'Feature');(0,_defineProperty2.default)(this,"id",void 0);(0,_defineProperty2.default)(this,"geometry",void 0);(0,_defineProperty2.default)(this,"properties",void 0);this.id=data.id;this.geometry=new Geometry(data.geometry);this.properties=data.properties||{};if(typeof this.properties.title_i18n==='string'){this.properties.title_i18n=JSON.parse(this.properties.title_i18n);}if(this.isPoint){if(!this.properties.images){this.properties.images=[];}if(!this.properties.range){this.properties.range=3;}}if(typeof this.properties.images==='string'){this.properties.images=JSON.parse(this.properties.images);}if(this.isLevelChanger&&Array.isArray(this.properties.levels)){this.properties.levels.forEach(function(level){return _this.properties["__level_".concat(level)]=true;});}}(0,_createClass2.default)(Feature,[{key:"hasTitle",value:function hasTitle(lang){if(typeof this.properties==='undefined'){return false;}if(lang){return typeof this.properties.title_18n[lang]!=='undefined';}return typeof this.properties.title!=='undefined'||this.properties.title_i18n&&typeof this.properties.title_18n['en']!=='undefined';}},{key:"getTitle",value:function getTitle(){var lang=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'en';if(this.properties.title_18n){return this.properties.title_18n[lang];}return this.properties.title;}},{key:"getDescription",value:function getDescription(){var lang=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'en';if(this.properties.description_i18n){return this.properties.description_i18n[lang];}return this.properties.description;}},{key:"getImageUrls",value:function getImageUrls(proximiioToken){if(!this.properties.images){return[];}return this.properties.images.map(function(it){return'https://api.proximi.fi/v5/geo/'+it+'?token='+proximiioToken;});}},{key:"contains",value:function contains(query){var _this$properties=this.properties,title_i18n=_this$properties.title_i18n,description_i18n=_this$properties.description_i18n,metadata=_this$properties.metadata;if(title_i18n){if(recursiveSearch(title_i18n,query)){return true;}}if(description_i18n){if(recursiveSearch(description_i18n,query)){return true;}}if(metadata){if(recursiveSearch(metadata,query)){return true;}}return false;}},{key:"hasLevel",value:function hasLevel(level){if(this.isLevelChanger){return this.properties.levels.includes(level);}else{return this.properties.level===level;}}},{key:"isPoint",get:function get(){return this.geometry.type==='Point';}},{key:"isPolygon",get:function get(){return this.geometry.type==='Polygon'||this.geometry.type==='MultiPolygon';}},{key:"isLineString",get:function get(){return this.geometry.type==='LineString'||this.geometry.type==='MultiLineString';}},{key:"isPoi",get:function get(){return this.properties&&this.properties.type==='poi';}},{key:"isHazard",get:function get(){return this.properties.type===POI_TYPE.HAZARD;}},{key:"isLandmark",get:function get(){return this.properties.type===POI_TYPE.LANDMARK;}},{key:"isDoor",get:function get(){return this.properties.type===POI_TYPE.DOOR;}},{key:"isEntrance",get:function get(){return this.properties.type===POI_TYPE.ENTRANCE;}},{key:"isDecisionPoint",get:function get(){return this.properties.type===POI_TYPE.DECISION;}},{key:"isTicketGate",get:function get(){return this.properties.type===POI_TYPE.TICKET_GATE;}},{key:"isElevator",get:function get(){return this.properties.type===POI_TYPE.ELEVATOR;}},{key:"isEscalator",get:function get(){return this.properties.type===POI_TYPE.ESCALATOR;}},{key:"isStairCase",get:function get(){return this.properties.type===POI_TYPE.STAIRCASE;}},{key:"isLevelChanger",get:function get(){return this.isElevator||this.isEscalator||this.isStairCase;}},{key:"isText",get:function get(){return this.properties.type==='text';}},{key:"isRoom",get:function get(){return this.properties.room;}},{key:"isRouting",get:function get(){return this.properties.usecase==='routing';}},{key:"json",get:function get(){var clone=JSON.parse(JSON.stringify(this));if(clone.properties.metadata&&typeof clone.properties.metadata!=='object'){try{clone.properties.metadata=JSON.parse(clone.properties.metadata);}catch(e){console.log('feature parsing failed:',clone.properties.metadata);}}Object.keys(clone.properties).forEach(function(key){if(key.match('__level')){delete clone.properties.key;}});return clone;}}],[{key:"point",value:function point(id,latitude,longitude,properties){return new Feature({id:id,geometry:{type:'Point',coordinates:[longitude,latitude]},properties:properties});}}]);return Feature;}();exports.Feature=Feature;
//# sourceMappingURL=feature.js.map