package com.reactnativeproximiiomapbox

import android.util.Log
import android.location.Location
import android.os.Handler
import androidx.lifecycle.Observer
import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.mapbox.geojson.Point
import convertJsonToMap
import io.proximi.mapbox.data.model.Amenity
import io.proximi.mapbox.data.model.AmenityCategory
import io.proximi.mapbox.data.model.Feature
import io.proximi.mapbox.library.*
import io.proximi.mapbox.library.NavigationInterface.HazardCallback
import io.proximi.mapbox.navigation.LandmarkSide
import org.json.JSONObject
import kotlinx.coroutines.*
import kotlin.coroutines.CoroutineContext


class ProximiioMapboxModule(
    private val reactContext: ReactApplicationContext
):
    ReactContextBaseJavaModule(reactContext),
    LifecycleEventListener,
    NavigationInterface.LandmarkCallback,
    HazardCallback,
    NavigationInterface.SegmentCallback,
    NavigationInterface.DecisionCallback,
    CoroutineScope
{
    private val gson = Gson()
    private lateinit var proximiioMapbox : ProximiioMapbox
    private var emitter: DeviceEventManagerModule.RCTDeviceEventEmitter? = null
    private var location : Location? = null
    private var level : Int = 0
    private var route : Route? = null
    private var amenityCache: WritableArray = Arguments.createArray()
    private var featureCache: WritableArray = Arguments.createArray()
    override val coroutineContext: CoroutineContext
      get() = Dispatchers.IO

    override fun getName(): String {
        return "ProximiioMapboxNative"
    }

    @ReactMethod
    fun authorize(token: String, promise: Promise) {
      val mainHandler = Handler(reactApplicationContext.mainLooper)
        val runnable = Runnable {
        log("initializing with token: $token")
        proximiioMapbox = ProximiioMapbox.getInstance(reactApplicationContext, token)
        proximiioMapbox.hazardCallback(this)
        proximiioMapbox.landmarksCallback(this)
        proximiioMapbox.segmentCallback(this)
        proximiioMapbox.decisionCallback(this)
        proximiioMapbox.onStart()

        proximiioMapbox.syncStatus.observeForever {
          log("SyncStatus: $it")
          sendEvent(EVENT_SYNC_STATUS, it.name, null)
        }

        proximiioMapbox.amenities.observeForever {
          log("amenities changed:" + it.count())
          val amenities = Arguments.createArray()
          it.map { convertAmenity(it); }.forEach { amenities.pushMap(it) }
          this.amenityCache = amenities
          sendEvent(EVENT_AMENITIES_CHANGED, amenities, null)
        }

        proximiioMapbox.features.observeForever { list ->
          log("features changed:" + list.count())
          val features = Arguments.createArray()
          list.map { feature -> feature.toMapboxFeature().toJson(); }.forEach { features.pushString(it) }
          this.featureCache = features;
          log("features cached")
          sendEvent(EVENT_FEATURES_CHANGED, features, null)
        }

        proximiioMapbox.style.observeForever { style ->
          log("style changed: $style")
          if (style != null) {
            sendEvent(EVENT_STYLE_CHANGED, style, null)
          }
        }

        sendEvent(EVENT_INITIALIZED, "", promise)
      }
      mainHandler.post(runnable)
    }

    /* ------------------------------------------------------------------------------------------ */
    /* Sync */

    @ReactMethod
    fun startSyncNow() {
      proximiioMapbox.startSyncNow()
    }

    /* ------------------------------------------------------------------------------------------ */
    /* Route calculation */

    @ReactMethod
    fun routeCalculate(routeConfigurationString: String, promise: Promise) {
      val routeConfiguration = deserializeRouteConfiguration(routeConfigurationString)
      proximiioMapbox.routeCalculate(routeConfiguration, object: RouteCallback {
        override fun onRoute(route: Route?) {
          if (route != null) {
            promise.resolve(convertJsonToMap(route.asJsonObject()))
          }
        }

        override fun routeEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
          promise.reject(gson.toJson(eventType), "")
        }
      })
    }

  /* ------------------------------------------------------------------------------------------ */
  /* Route navigation */

    @ReactMethod
    fun routeFind(routeConfigurationString: String) {
        val routeConfiguration = deserializeRouteConfiguration(routeConfigurationString)
        proximiioMapbox.routeFind(routeConfiguration, routeNavigationCallback)
    }

    @ReactMethod
    fun routeFindAndPreview(routeConfigurationString: String) {
      val routeConfiguration = deserializeRouteConfiguration(routeConfigurationString)
      proximiioMapbox.routeFindAndPreview(routeConfiguration, routeNavigationCallback)
    }

    @ReactMethod
    fun routeFindAndStart(routeConfigurationString: String) {
      val routeConfiguration = deserializeRouteConfiguration(routeConfigurationString)
      proximiioMapbox.routeFindAndStart(routeConfiguration, routeNavigationCallback)
    }

    private val routeNavigationCallback = object: RouteCallback {
      override fun onRoute(route: Route?) {
          this@ProximiioMapboxModule.route = route
          val routeData = route?.let { convertRoute(route) }
          sendEvent(EVENT_ROUTE, routeData)
      }

      override fun routeEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
        sendRouteUpdateEvent(eventType, text, additionalText, data)
        if (eventType.isRouteEnd()) {
          route = null
        }
      }
    }

    @ReactMethod
    fun routeStart(promise: Promise) {
      promise.resolve(proximiioMapbox.routeStart())
    }

    @ReactMethod
    fun routeCancel(promise: Promise) {
      proximiioMapbox.routeCancel()
      route = null
      promise.resolve(Arguments.createMap())
    }

    /* ------------------------------------------------------------------------------------------ */
    /* Data update and access methods */

    @ReactMethod
    fun updateLocation(latitude: Double, longitude: Double, sourceType: String?, accuracy: Double, promise: Promise) {
      location = Location("")
      location?.latitude = latitude
      location?.longitude = longitude
      val result = proximiioMapbox.updateUserLocation(location)
      val map = Arguments.createMap()
      map.putDouble("lat", result!!.latitude)
      map.putDouble("lng", result!!.longitude)
      map.putString("source", sourceType)
      map.putDouble("accuracy", accuracy)
      promise.resolve(map)
    }

    @ReactMethod
    fun updateLevel(level: Int, promise: Promise) {
      this.level = level
      proximiioMapbox.updateUserLevel(level)
      promise.resolve(Arguments.createMap())
    }

    @ReactMethod
    fun getAmenities(promise: Promise) {
      log("getAmenities cache: " + this.amenityCache.size());
//      promise.resolve(Arguments.fromList(this.amenityCache.toArrayList()))
      launch(Dispatchers.Main) {
        proximiioMapbox.amenities.observeForever(object: Observer<List<Amenity>> {
          override fun onChanged(amenities: List<Amenity>) {
            proximiioMapbox.amenities.removeObserver(this)
            log("getAmenities observer: " + amenities?.size);
            val items = Arguments.createArray()
            amenities?.forEach { items.pushMap(convertAmenity(it)) }
            promise.resolve(items)
          }
        })
      }
    }

    @ReactMethod
    fun getAmenityCategories(promise: Promise) {
      val categories = proximiioMapbox.amenityCategories.value
      val items = Arguments.createArray()
      categories?.forEach { items.pushMap(convertAmenityCategory(it)); }
      promise.resolve(items)
    }

    @ReactMethod
    fun getFeatures(promise: Promise) {
      promise.resolve(Arguments.fromList(this.featureCache.toArrayList()))
    }

    @ReactMethod
    fun getStyle(promise: Promise) {
      val style = proximiioMapbox.style.value
      promise.resolve(style.toString())
    }

    /* ------------------------------------------------------------------------------------------ */
    /* Configuration methods */

    @ReactMethod
    fun setLevelOverrideMap(rnLevelOverrideMap: ReadableMap) {
      val levelOverrideMap = mutableMapOf<Int, Int>()
      val iterator = rnLevelOverrideMap.keySetIterator()
      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        levelOverrideMap[key.toInt()] = rnLevelOverrideMap.getInt(key)
      }
      proximiioMapbox.levelOverrideMap(levelOverrideMap)
    }

    @ReactMethod
    fun setUnitConversion(unitConversionString: String) {
      val unitConversion = gson.fromJson<UnitConversion>(unitConversionString, UnitConversion::class.java)
      proximiioMapbox.setUnitConversion(unitConversion)
    }

    @ReactMethod
    fun setStepImmediateThreshold(thresholdInMeters: Double) {
      proximiioMapbox.setStepImmediateThreshold(thresholdInMeters)
    }

    @ReactMethod
    fun setStepPreparationThreshold(thresholdInMeters: Double) {
      proximiioMapbox.setStepPreparationThreshold(thresholdInMeters)
    }

    @ReactMethod
    fun setRouteFinishThreshold(thresholdInMeters: Double) {
      proximiioMapbox.setRouteFinishThreshold(thresholdInMeters)
    }

    @ReactMethod
    fun setRerouteEnabled(enabled: Boolean) {
      proximiioMapbox.setRerouteEnabled(enabled)
    }

    @ReactMethod
    fun setReRouteThreshold(thresholdInMeters: Double) {
      proximiioMapbox.setRerouteThreshold(thresholdInMeters)
    }

    private var tts: TextToSpeech? = null

    @ReactMethod
    fun ttsEnable(promise: Promise) {
      tts = TextToSpeech(reactContext.baseContext) { status ->
        if (status == TextToSpeech.SUCCESS) {
          proximiioMapbox.ttsEnable(tts!!)
          promise.resolve(true)
        } else {
          proximiioMapbox.ttsDisable()
          promise.reject("TTS_ERROR", "TTS could not be intialized!")
        }
      }
    }

    @ReactMethod
    fun ttsDisable() {
      proximiioMapbox.ttsDisable()
    }

    @ReactMethod
    fun ttsHeadingCorrectionEnabled(enabled: Boolean) {
      proximiioMapbox.ttsHeadingCorrectionEnabled(enabled)
    }

    @ReactMethod
    fun ttsReassuranceInstructionEnabled(enabled: Boolean) {
      proximiioMapbox.ttsReassuranceInstructionEnabled(enabled)
    }

    @ReactMethod
    fun ttsReassuranceInstructionDistance(distance: Double) {
      proximiioMapbox.ttsReassuranceInstructionDistance(distance)
    }

    @ReactMethod
    fun ttsRepeatLastInstruction() {
      proximiioMapbox.ttsRepeatLastInstruction()
    }

    @ReactMethod
    fun ttsHazardAlert(enabled: Boolean,  metadataKeys: ReadableArray?) {
      proximiioMapbox.ttsHazardAlert(enabled, metadataKeys.toIntList())
    }

    @ReactMethod
    fun ttsSegmentAlert(enterEnabled: Boolean, exitEnabled: Boolean,  metadataKeys: ReadableArray?) {
      proximiioMapbox.ttsSegmentAlert(enterEnabled, exitEnabled, metadataKeys.toIntList())
    }

    @ReactMethod
    fun ttsDecisionAlert(enabled: Boolean,  metadataKeys: ReadableArray?) {
      proximiioMapbox.ttsDecisionAlert(enabled, metadataKeys.toIntList())
    }

    @ReactMethod
    fun ttsLandmarkAlert(enabled: Boolean,  metadataKeys: ReadableArray?) {
      proximiioMapbox.ttsLandmarkAlert(enabled, metadataKeys.toIntList())
    }

    @ReactMethod
    fun setUserLocationToRouteSnappingEnabled(enabled: Boolean) {
      proximiioMapbox.setUserLocationToRouteSnappingEnabled(enabled)
    }

    @ReactMethod
    fun ttsLevelChangerMetadataKeys(metadataKeys: ReadableArray?) {
      proximiioMapbox.ttsLevelChangerMetadataKeys(metadataKeys.toIntList())
    }

    @ReactMethod
    fun ttsDestinationMetadataKeys(metadataKeys: ReadableArray?) {
      proximiioMapbox.ttsDestinationMetadataKeys(metadataKeys.toIntList())
    }

    /* ------------------------------------------------------------------------------------------ */
    /* Private methods */

    private fun ReadableArray?.toIntList(): List<Int> {
      if (this == null) {
        return listOf<Int>()
      }
      val mutableList = mutableListOf<Int>()
      for (index in 0 until size()) {
        mutableList.add(getInt(index))
      }
      return mutableList
    }

    companion object {
        private const val EVENT_INITIALIZED = "ProximiioMapboxInitialized"

        /**
         * General route events
         */
        private const val EVENT_ROUTE = "ProximiioMapbox.RouteEvent"
        private const val EVENT_ROUTE_UPDATE = "ProximiioMapbox.RouteEventUpdate"

        /**
         * Special navigation events
         */
        private const val EVENT_ON_LANDMARK = "ProximiioMapboxOnNavigationLandmark"
        private const val EVENT_ON_HAZARD = "ProximiioMapboxOnNavigationHazard"
        private const val EVENT_ON_SEGMENT = "ProximiioMapboxOnNavigationSegment"
        private const val EVENT_ON_DECISION = "ProximiioMapboxOnNavigationDecision"
        private const val EVENT_AMENITIES_CHANGED = "ProximiioMapboxAmenitiesChangedInternal"
        private const val EVENT_SYNC_STATUS = "ProximiioMapboxSyncStatusChanged"
        private const val EVENT_FEATURES_CHANGED = "ProximiioMapboxFeaturesChangedInternal"
        private const val EVENT_STYLE_CHANGED = "ProximiioMapboxStyleChanged"
    }

    private fun deserializeRouteConfiguration(routeConfigurationString: String): RouteConfiguration {
        val jsonObject = gson.fromJson<JsonObject>(routeConfigurationString, JsonObject::class.java)
        val builder = RouteConfiguration.Builder()

        // Start point
        if (jsonObject.has("startFeatureId") && jsonObject.get("startFeatureId").isJsonPrimitive) {
            val startFeatureId = jsonObject.get("startFeatureId").asString
            builder.setStart(getFeatureById(startFeatureId))
        } else if (jsonObject.has("startLatLonLevel") && jsonObject.get("startLatLonLevel").isJsonArray) {
            val startLatLonLevel = jsonObject.get("startLatLonLevel").asJsonArray
            val lat = startLatLonLevel.get(0).asDouble
            val lon = startLatLonLevel.get(1).asDouble
            val level = startLatLonLevel.get(2).asInt
            builder.setStart(lat, lon, level)
        }

        // Destination point
        if (jsonObject.has("destinationFeatureId") && jsonObject.get("destinationFeatureId").isJsonPrimitive) {
            val destinationFeatureId = jsonObject.get("destinationFeatureId").asString
            builder.setDestination(getFeatureById(destinationFeatureId))
        } else if (jsonObject.has("destinationLatLonLevel") && jsonObject.get("destinationLatLonLevel").isJsonArray) {
            val destinationLatLonLevel = jsonObject.get("destinationLatLonLevel").asJsonArray
            val destinationTitle = jsonObject.get("destinationTitle")?.asString
            val lat = destinationLatLonLevel.get(0).asDouble
            val lon = destinationLatLonLevel.get(1).asDouble
            val level = destinationLatLonLevel.get(2).asInt
            builder.setDestination(lat, lon, destinationTitle, level)
        } else {
          error("No destination was set!")
        }

        // Wayfinding options
        jsonObject.getAsJsonObject("wayfindingOptions")?.let { wayfindingOptionsJson ->
            wayfindingOptionsJson.get("avoidBarriers")?.asBoolean?.let { builder.setAvoidBarriers(it) }
            wayfindingOptionsJson.get("avoidElevators")?.asBoolean?.let { builder.setAvoidElevators(it) }
            wayfindingOptionsJson.get("avoidEscalators")?.asBoolean?.let { builder.setAvoidEscalators(it) }
            wayfindingOptionsJson.get("avoidNarrowPaths")?.asBoolean?.let { builder.setAvoidNarrowPaths(it) }
            wayfindingOptionsJson.get("avoidRamps")?.asBoolean?.let { builder.setAvoidRamps(it) }
            wayfindingOptionsJson.get("avoidRevolvingDoors")?.asBoolean?.let { builder.setAvoidRevolvingDoors(it) }
            wayfindingOptionsJson.get("avoidStaircases")?.asBoolean?.let { builder.setAvoidStaircases(it) }
            wayfindingOptionsJson.get("avoidTicketGates")?.asBoolean?.let { builder.setAvoidTicketGates(it) }
            wayfindingOptionsJson.get("pathFixDistance")?.asDouble?.let { builder.setPathFixThreshold(it) }
        }

        // Waypoints
        jsonObject.getAsJsonArray("waypointFeatureIdList")?.let { waypointList ->
            waypointList.forEach { waypoint ->
                if (!waypoint.isJsonArray) {
                    val size = waypoint.asJsonArray.size()
                    val featureList = waypoint.asJsonArray.map { getFeatureById(it.asString) }
                    if (size == 0) {
                      builder.addWaypoints(RouteConfiguration.SimpleWaypoint(featureList[0]))
                    } else {
                      builder.addWaypoints(RouteConfiguration.VariableWaypoint(featureList))
                    }
                }
            }
        }
      return builder.build()
    }

    private fun getFeatureById(featureId: String): Feature {
        return proximiioMapbox.features.value!!.find { it.id == featureId }!!
    }

//    private fun processRoute(route: Route?, start: Boolean, promise: Promise) {
//      processRoute(route, start, false, promise)
//    }
//
//    private fun processRoute(route: Route?, start: Boolean, processOnly: Boolean, promise: Promise) {
//      if (route != null) {
//        this.route = route
//        val routeData = Arguments.createMap()
//        val distanceInMeters = route.nodeList.fold(0.0) { acc, node -> acc + node.distanceFromLastNode }
//        val descriptor = convertJsonToMap(route.asJsonObject())
//        if (descriptor != null) {
//          descriptor.putDouble("distanceMeters", distanceInMeters)
//          descriptor.putDouble("duration", distanceInMeters  / 0.833)
//        }
//        routeData.putMap("descriptor", descriptor)
//        val features = Arguments.createArray()
//        route.getLineStringFeatureList().map { convertMapboxFeature(it) }.forEach {
//          features.pushMap(convertJsonToMap(JSONObject(it)))
//        }
//        routeData.putArray("features", features)
////        if (!processOnly) {
////          sendEvent(EVENT_ROUTE_STARTED, routeData, promise)
////        }
//        promise.resolve(routeData)
//      } else {
//        promise.reject("NotFound", "Route not found")
//      }
//    }

    private fun sendRouteUpdateEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
      log("route event: $eventType $text")
      val event = convertJsonToMap(JSONObject(Gson().toJson(RouteEvent(eventType, text, additionalText, data))))!!

      route?.let { route ->
          val routeMap = convertRoute(route, data?.nodeIndex, data?.position)
          event.putMap("route", routeMap)
      } ?: log("route is null")
      sendEvent(EVENT_ROUTE_UPDATE, event, null)
//      when (eventType) {
//          RouteUpdateType.CANCELED -> sendEvent(EVENT_ROUTE, Arguments.createMap(), null)
//          RouteUpdateType.DIRECTION_IMMEDIATE -> sendEvent(EVENT_ROUTE, event, null)
//          RouteUpdateType.DIRECTION_NEW -> sendEvent(EVENT_ROUTE, event, null)
//          RouteUpdateType.DIRECTION_SOON -> sendEvent(EVENT_ROUTE, event, null)
//          RouteUpdateType.DIRECTION_UPDATE -> sendEvent(EVENT_ROUTE, event, null)
//          RouteUpdateType.ROUTE_NOT_FOUND -> sendEvent(EVENT_ROUTE, event, null)
//          else error('unsupported event type!')
//      }
    }

    private fun convertRoute(route: Route, nodeIndex: Int? = null, location: Point? = null): WritableMap {
      val routeMap = convertJsonToMap(this.route!!.asJsonObject())
      val features = Arguments.createArray()
      if (nodeIndex != null && location != null) {
        route.getLineStringListFrom(nodeIndex, location).forEach {
          features.pushMap(convertJsonToMap(JSONObject(it.toJson())))
        }
        route.getLineStringListUntil(nodeIndex, location).forEach {
          features.pushMap(convertJsonToMap(JSONObject(it.toJson())))
        }
      } else {
        route.getLineStringFeatureList().forEach {
          features.pushMap(convertJsonToMap(JSONObject(it.toJson())))
        }
      }
      routeMap!!.putArray("features", features)
      return routeMap
    }

    private fun convertAmenity(amenity: Amenity): WritableMap {
      val map = Arguments.createMap()
      map.putString("id", amenity.id)
      map.putString("categoryId", amenity.categoryId)
      map.putString("icon", amenity.icon)
      map.putString("title", amenity.getTitle())
      map.putString("description", amenity.getDescription())
      return map
    }

    private fun convertAmenityCategory(category: AmenityCategory): WritableMap {
      val map = Arguments.createMap()
      map.putString("id", category.id)
      map.putString("title", category.getTitle())
      map.putString("description", category.getDescription())
      return map
    }

    private fun convertMapboxFeature(feature: com.mapbox.geojson.Feature): String {
      return feature.toJson()
    }

    private fun convertFeature(feature: Feature): WritableMap {
      val json = JSONObject(feature.toMapboxFeature().toJson())
      return convertJsonToMap(json)!!
    }

    private fun sendEvent(event: String, data: Any?, promise: Promise? = null) {
        if (emitter == null) {
            emitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        }

        log("event:$event data:$data")
        emitter?.emit(event, data)
        promise?.resolve(Arguments.createMap())
    }

    override fun onLandmarkEnteredRange(landmarkList: List<Pair<LandmarkSide, Feature>>) {
      val map = Arguments.createMap()
      val landmarks = Arguments.createArray()
      landmarkList.forEach { landmarks.pushMap(convertFeature(it.second)) }
      map.putString("type", "enter")
      map.putArray("landmarks", landmarks)
      sendEvent(EVENT_ON_LANDMARK, map, null)
    }

    override fun onLandmarkExitedRange(landmarkList: List<Feature>) {
      val map = Arguments.createMap()
      val landmarks = Arguments.createArray()
      landmarkList.forEach { landmarks.pushMap(convertFeature(it)) }
      map.putString("type", "exit")
      map.putArray("landmarks", landmarks)
      sendEvent(EVENT_ON_LANDMARK, map, null)
    }

    override fun enteredHazardRange(hazard: Feature) {
      val map = Arguments.createMap()
      map.putString("type", "enter")
      map.putMap("hazard", convertFeature(hazard))
      sendEvent(EVENT_ON_HAZARD, map, null)
    }

    override fun exitedHazardRange(hazard: Feature) {
      val map = Arguments.createMap()
      map.putString("type", "exit")
      map.putMap("hazard", convertFeature(hazard))
      sendEvent(EVENT_ON_HAZARD, map, null)
    }

    override fun onSegmentEntered(segment: Feature) {
      val map = Arguments.createMap()
      map.putString("type", "enter")
      map.putMap("segment", convertFeature(segment))
      sendEvent(EVENT_ON_SEGMENT, map, null)
    }

    override fun onSegmentLeft(segment: Feature) {
      val map = Arguments.createMap()
      map.putString("type", "exit")
      map.putMap("segment", convertFeature(segment))
      sendEvent(EVENT_ON_SEGMENT, map, null)
    }

    override fun decisionEntered(decision: Feature) {
      val map = Arguments.createMap()
      map.putString("type", "enter")
      map.putMap("decision", convertFeature(decision))
      sendEvent(EVENT_ON_DECISION, map, null)
    }

    override fun decisionExited(decision: Feature) {
      val map = Arguments.createMap()
      map.putString("type", "exit")
      map.putMap("decision", convertFeature(decision))
      sendEvent(EVENT_ON_DECISION, map, null)
    }

    override fun onHostResume() {

    }

    override fun onHostPause() {

    }

    override fun onHostDestroy() {
      proximiioMapbox.onDestroy()
    }

    private fun log(msg: String) {
         Log.d("ProximiioMapboxNative", msg)
    }
}
