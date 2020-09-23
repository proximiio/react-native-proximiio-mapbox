package com.reactnativeproximiiomapbox

import android.location.Location
import android.os.Handler
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import io.proximi.mapbox.data.model.Amenity
import io.proximi.mapbox.data.model.AmenityCategory
import io.proximi.mapbox.data.model.Feature
import io.proximi.mapbox.library.*
import io.proximi.mapbox.library.NavigationInterface.HazardCallback
import io.proximi.mapbox.navigation.LandmarkSide
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject


class ProximiioMapboxModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
  LifecycleEventListener, NavigationInterface.LandmarkCallback, HazardCallback,
  NavigationInterface.SegmentCallback, NavigationInterface.DecisionCallback {
    private lateinit var proximiioMapbox : ProximiioMapbox
    private var emitter: DeviceEventManagerModule.RCTDeviceEventEmitter? = null
    private var location : Location? = null
    private var level : Int = 0
    private var route : Route? = null
    private var featureCache: WritableArray = Arguments.createArray()

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
        }

        proximiioMapbox.amenities.observeForever {
          log("amenities changed:" + it.count())
            val amenities = Arguments.createArray()
          it.map { convertAmenity(it); }.forEach { amenities.pushMap(it) }
            sendEvent(EVENT_AMENITIES_CHANGED, amenities, null)
        }

        proximiioMapbox.features.observeForever { list ->
          log("features changed:" + list.count())
          val features = Arguments.createArray()
          list.map { feature -> feature.toMapboxFeature().toJson(); }.forEach { features.pushString(it) }
          this.featureCache = features;
          log("features cached")
          sendEvent(EVENT_FEATURES_CHANGED, Arguments.createArray(), null)
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

    @ReactMethod
    fun routeFind(poiId: String, options: ReadableMap, previewRoute: Boolean, startRoute: Boolean, promise: Promise) {
      proximiioMapbox.routeFind(poiId, convertRouteOptions(options), previewRoute, startRoute,  object :RouteCallback{
        override fun onRoute(route: Route?) {
          processRoute(route, startRoute, promise)
        }

        override fun routeEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
          processRouteEvent(eventType, text, additionalText, data)
        }
      })
    }

    @ReactMethod
    fun routeFindTo(latitude: Double, longitude: Double, level: Int, title: String, options: ReadableMap, previewRoute: Boolean, startRoute: Boolean, promise: Promise) {
      val location = Location("")
      location.latitude = latitude
      location.longitude = longitude
      proximiioMapbox.routeFind(location, level, title, convertRouteOptions(options), previewRoute, startRoute, object: RouteCallback{
        override fun onRoute(route: Route?) {
          processRoute(route, startRoute, promise)
        }

        override fun routeEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
          processRouteEvent(eventType, text, additionalText, data)
        }
      })
    }

    @ReactMethod
    fun routeFindFrom(latitudeFrom: Double, longitudeFrom: Double, levelFrom: Int, latitudeTo: Double, longitudeTo: Double, levelTo: Int, title: String, options: ReadableMap, previewRoute: Boolean, startRoute: Boolean, promise: Promise) {
      val locationFrom = Location("")
      locationFrom.latitude = latitudeFrom
      locationFrom.longitude = longitudeFrom
      val locationTo = Location("")
      locationTo.latitude = latitudeTo
      locationTo.longitude = longitudeTo

      proximiioMapbox.routeFind(locationFrom, levelFrom, locationTo, levelTo, title, convertRouteOptions(options), previewRoute, startRoute, object: RouteCallback{
        override fun onRoute(route: Route?) {
          processRoute(route, startRoute, promise)
        }

        override fun routeEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
          processRouteEvent(eventType, text, additionalText, data)
        }
      })
    }

    @ReactMethod
    fun routeFindBetween(idFrom: String, idTo: String, options: ReadableMap, previewRoute: Boolean, startRoute: Boolean, promise: Promise) {
        val featureFrom = proximiioMapbox.features.value?.find { it.id == idFrom }
        val featureTo = proximiioMapbox.features.value?.find { it.id == idTo }

        if (featureFrom != null && featureTo != null) {
            val fromGeometry = JSONObject(featureFrom.featureGeometry?.toJson())
            val toGeometry = JSONObject(featureTo.featureGeometry?.toJson())

            val locationFrom = Location("")
            val coordinatesFrom = fromGeometry.get("coordinates") as JSONArray
            locationFrom.latitude = coordinatesFrom.get(1) as Double
            locationFrom.longitude = coordinatesFrom.get(0) as Double

            val locationTo = Location("")
            val coordinatesTo = toGeometry.get("coordinates") as JSONArray
            locationTo.latitude = coordinatesTo.get(1) as Double
            locationTo.longitude = coordinatesTo.get(0) as Double

            val levelFrom = featureFrom.featureProperties?.get("level")?.asInt ?: 0
            val levelTo = featureTo.featureProperties?.get("level")?.asInt ?: 0

            proximiioMapbox.routeFind(locationFrom, levelFrom, locationTo, levelTo, featureTo.getTitle(), convertRouteOptions(options), previewRoute, startRoute, object : RouteCallback {
                override fun onRoute(route: Route?) {
                    processRoute(route, startRoute, promise)
                }

                override fun routeEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
                    processRouteEvent(eventType, text, additionalText, data)
                }
            })
        }
    }

    @ReactMethod
    fun routeCalculate(latitudeFrom: Double, longitudeFrom: Double, levelFrom: Int, latitudeTo: Double, longitudeTo: Double, levelTo: Int, title: String, options: ReadableMap, promise: Promise) {
        val locationFrom = Location("")
        locationFrom.latitude = latitudeFrom
        locationFrom.longitude = longitudeFrom
        val locationTo = Location("")
        locationTo.latitude = latitudeTo
        locationTo.longitude = longitudeTo

        proximiioMapbox.routeCalculate(locationFrom, levelFrom, locationTo, levelTo, title, convertRouteOptions(options), object: RouteCallback{
            override fun onRoute(route: Route?) {
                processRoute(route, false, promise)
            }

            override fun routeEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
                processRouteEvent(eventType, text, additionalText, data)
            }
        })
    }

    private  fun convertRouteOptions(options: ReadableMap) : RouteOptions {
      val routeOptions = RouteOptions()
      routeOptions.avoidBarriers = options.getBoolean("avoidBarriers")
      routeOptions.avoidElevators = options.getBoolean("avoidElevators")
      routeOptions.avoidEscalators = options.getBoolean("avoidEscalators")
      routeOptions.avoidNarrowPaths = options.getBoolean("avoidNarrowPaths")
      routeOptions.avoidRamps = options.getBoolean("avoidRamps")
      routeOptions.avoidRevolvingDoors = options.getBoolean("avoidRevolvingDoors")
      routeOptions.avoidStaircases = options.getBoolean("avoidStaircases")
      routeOptions.avoidTicketGates = options.getBoolean("avoidTicketGates")
      return  routeOptions
    }

    private fun processRoute(route: Route?, start: Boolean, promise: Promise) {
      if (route != null) {
        this.route = route
        val routeData = Arguments.createMap()
        val distanceInMeters = route.nodeList.fold(0.0) { acc, node -> acc + node.distanceFromLastNode }
        val descriptor = convertJsonToMap(route.asJsonObject())
        if (descriptor != null) {
          descriptor.putDouble("distanceMeters", distanceInMeters)
          descriptor.putDouble("duration", distanceInMeters  / 0.833)
        }
        routeData.putMap("descriptor", descriptor)
        val features = Arguments.createArray()
        route.getLineStringFeatureList().map { convertMapboxFeature(it) }.forEach {
          features.pushMap(convertJsonToMap(JSONObject(it)))
        }
        routeData.putArray("features", features)
        sendEvent(EVENT_ROUTE_STARTED, routeData, promise)
        promise.resolve(routeData)
      } else {
        promise.reject("NotFound", "Route not found")
      }
    }

    private fun processRouteEvent(eventType: RouteUpdateType, text: String, additionalText: String?, data: RouteUpdateData?) {
      log("route event: $eventType $text")
      val event = Arguments.createMap()

      if (this.route != null) {
          event.putMap("descriptor", convertJsonToMap(this.route!!.asJsonObject()))
          val features = Arguments.createArray()
          this.route!!.getLineStringFeatureList().map { convertMapboxFeature(it) }.forEach {
              features.pushMap(convertJsonToMap(JSONObject(it)))
          }
          event.putArray("features", features)
      } else {
          log("route is null")
      }

      if (data != null) {
        event.putMap("data", convertRouteUpdateData(data))
      }

      if (eventType == RouteUpdateType.CANCELED) {
        sendEvent(EVENT_ROUTE_CANCELED, Arguments.createMap(), null)
      } else if (eventType == RouteUpdateType.DIRECTION_IMMEDIATE) {
        event.putString("type", "DIRECTION_IMMEDIATE")
        sendEvent(EVENT_ROUTE_UPDATE, event, null)
      } else if (eventType == RouteUpdateType.DIRECTION_NEW) {
        event.putString("type", "DIRECTION_NEW")
        sendEvent(EVENT_ROUTE_UPDATE, event, null)
      } else if (eventType == RouteUpdateType.DIRECTION_SOON) {
        event.putString("type", "DIRECTION_SOON")
        sendEvent(EVENT_ROUTE_UPDATE, event, null)
      } else if (eventType == RouteUpdateType.DIRECTION_UPDATE) {
        event.putString("type", "DIRECTION_UPDATE")
        sendEvent(EVENT_ROUTE_UPDATE, event, null)
      } else if (eventType == RouteUpdateType.ROUTE_NOT_FOUND) {
        event.putString("type", "ROUTE_NOT_FOUND")
        sendEvent(EVENT_ROUTE_UPDATE, event, null)
      } else {
        log("ignored route event")
      }
    }

    @ReactMethod
    fun routeCancel(promise: Promise) {
      proximiioMapbox.routeCancel()
      route = null
      promise.resolve(Arguments.createMap())
    }

    @ReactMethod
    fun updateLocation(latitude: Double, longitude: Double, promise: Promise) {
      location = Location("")
      location?.latitude = latitude
      location?.longitude = longitude
      proximiioMapbox.updateUserLocation(location)
      promise.resolve(Arguments.createMap())
    }

    @ReactMethod
    fun updateLevel(level: Int, promise: Promise) {
      this.level = level
      proximiioMapbox.updateUserLevel(level)
      promise.resolve(Arguments.createMap())
    }

    @ReactMethod
    fun getAmenities(promise: Promise) {
      val amenities = proximiioMapbox.amenities.value
      val items = Arguments.createArray()
      amenities?.forEach { items.pushMap(convertAmenity(it)) }
      promise.resolve(items)
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

    @ReactMethod
    fun setUnitConversion(unit: String, conversionCoefficient: Double) {
      proximiioMapbox.setUnitConversion(unit, conversionCoefficient)
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

    @ReactMethod
    fun ttsEnable() {
//      proximiioMapbox.ttsEnable();
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
    fun ttsRepeatLastInstruction() {
      proximiioMapbox.ttsRepeatLastInstruction()
    }

    @ReactMethod
    fun ttsHazardAlert(enabled: Boolean) {
      proximiioMapbox.ttsHazardAlert(enabled)
    }

    @ReactMethod
    fun ttsSegmentAlert(enterEnabled: Boolean, exitEnabled: Boolean) {
      proximiioMapbox.ttsSegmentAlert(enterEnabled, exitEnabled)
    }

    @ReactMethod
    fun ttsDecisionAlert(enabled: Boolean) {
      proximiioMapbox.ttsDecisionAlert(enabled)
    }

    @ReactMethod
    fun ttsLandmarkAlert(enabled: Boolean) {
      proximiioMapbox.ttsLandmarkAlert(enabled)
    }

    @ReactMethod
    fun setUserLocationToRouteSnappingEnabled(enabled: Boolean) {
      proximiioMapbox.setUserLocationToRouteSnappingEnabled(enabled)
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

    private fun convertRouteUpdateData(data: RouteUpdateData): WritableMap {
      val map = Arguments.createMap()
      if (data.nextStepBearing != null) {
        map.putDouble("nextStepBearing", data.nextStepBearing!!)
      }
      if (data.nextStepDirection != null) {
        map.putString("nextStepDirection", data.nextStepDirection.toString())
      }
      if (data.nextStepDistance != null) {
        map.putDouble("nextStepDistance", data.nextStepDistance!!)
      }

      if (route != null) {
//        val completedRoute = route!!.getLineStringListUntil(data.nodeIndex, data.position)
        val remainingRoute = route!!.getLineStringListFrom(data.nodeIndex, data.position)
        val remaining = Arguments.createArray()
        remainingRoute.forEach { remaining.pushMap(convertJsonToMap(JSONObject(it.toJson()))) }
        map.putArray("remaining", remaining)
      }

      val positionCoordinates = data.position.coordinates()
      val position = Arguments.createArray()
      position.pushDouble(positionCoordinates[0])
      position.pushDouble(positionCoordinates[1])

      map.putInt("nodeIndex", data.nodeIndex)
      map.putDouble("pathLengthRemaining", data.pathLengthRemaining)
      map.putArray("position", position)
      map.putDouble("stepBearing", data.stepBearing)
      map.putDouble("stepDistance", data.stepDistance)

      if (data.nextStepDirection != null) {
        map.putString("nextStepDirection", data.nextStepDirection.toString())
      }
      if (data.nextStepBearing != null) {
        map.putString("nextStepBearing", data.nextStepBearing.toString())
      }
      if (data.nextStepDistance != null) {
        map.putString("nextStepDistance", data.nextStepDistance.toString())
      }

      return map
    }

    private fun sendEvent(event: String, data: Any, promise: Promise?) {
        if (emitter == null) {
            emitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        }

        log("event:$event data:$data")
        emitter?.emit(event, data)
        promise?.resolve(Arguments.createMap())
    }

    companion object {
      private const val EVENT_INITIALIZED = "ProximiioMapboxInitialized"
      private const val EVENT_ROUTE_STARTED = "ProximiioMapboxRouteStarted"
      private const val EVENT_ROUTE_CANCELED = "ProximiioMapboxRouteCanceled"
      private const val EVENT_ROUTE_UPDATE = "ProximiioMapboxRouteUpdated"
      private const val EVENT_ON_LANDMARK = "ProximiioMapboxOnNavigationLandmark"
      private const val EVENT_ON_HAZARD = "ProximiioMapboxOnNavigationHazard"
      private const val EVENT_ON_SEGMENT = "ProximiioMapboxOnNavigationSegment"
      private const val EVENT_ON_DECISION = "ProximiioMapboxOnNavigationDecision"
      private const val EVENT_AMENITIES_CHANGED = "ProximiioMapboxAmenitiesChanged"
      private const val EVENT_FEATURES_CHANGED = "ProximiioMapboxFeaturesChanged"
      private const val EVENT_STYLE_CHANGED = "ProximiioMapboxStyleChanged"
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
        // Log.d("ProximiioMapboxNative", msg)
    }
}

@Throws(JSONException::class)
fun convertJsonToMap(jsonObject: JSONObject): WritableMap? {
  val map: WritableMap = WritableNativeMap()
  val iterator = jsonObject.keys()
  while (iterator.hasNext()) {
    val key = iterator.next()
    val value = jsonObject[key]
    if (value is JSONObject) {
      map.putMap(key, convertJsonToMap(value))
    } else if (value is JSONArray) {
      map.putArray(key, convertJsonToArray(value))
    } else if (value is Boolean) {
      map.putBoolean(key, value)
    } else if (value is Int) {
      map.putInt(key, value)
    } else if (value is Double) {
      map.putDouble(key, value)
    } else if (value is String) {
      map.putString(key, value)
    } else {
      map.putString(key, value.toString())
    }
  }
  return map
}

@Throws(JSONException::class)
fun convertJsonToArray(jsonArray: JSONArray): WritableArray? {
  val array: WritableArray = WritableNativeArray()
  for (i in 0 until jsonArray.length()) {
    val value = jsonArray[i]
    if (value is JSONObject) {
      array.pushMap(convertJsonToMap(value))
    } else if (value is JSONArray) {
      array.pushArray(convertJsonToArray(value))
    } else if (value is Boolean) {
      array.pushBoolean(value)
    } else if (value is Int) {
      array.pushInt(value)
    } else if (value is Double) {
      array.pushDouble(value)
    } else if (value is String) {
      array.pushString(value)
    } else {
      array.pushString(value.toString())
    }
  }
  return array
}

@Throws(JSONException::class)
fun convertMapToJson(readableMap: ReadableMap?): JSONObject? {
  val `object` = JSONObject()
  val iterator = readableMap!!.keySetIterator()
  while (iterator.hasNextKey()) {
    val key = iterator.nextKey()
    when (readableMap.getType(key)) {
      ReadableType.Null -> `object`.put(key, JSONObject.NULL)
      ReadableType.Boolean -> `object`.put(key, readableMap.getBoolean(key))
      ReadableType.Number -> `object`.put(key, readableMap.getDouble(key))
      ReadableType.String -> `object`.put(key, readableMap.getString(key))
      ReadableType.Map -> `object`.put(key, convertMapToJson(readableMap.getMap(key)))
      ReadableType.Array -> `object`.put(key, convertArrayToJson(readableMap.getArray(key)))
    }
  }
  return `object`
}

@Throws(JSONException::class)
fun convertArrayToJson(readableArray: ReadableArray?): JSONArray? {
  val array = JSONArray()
  for (i in 0 until readableArray!!.size()) {
    when (readableArray.getType(i)) {
      ReadableType.Null -> {
      }
      ReadableType.Boolean -> array.put(readableArray.getBoolean(i))
      ReadableType.Number -> array.put(readableArray.getDouble(i))
      ReadableType.String -> array.put(readableArray.getString(i))
      ReadableType.Map -> array.put(convertMapToJson(readableArray.getMap(i)))
      ReadableType.Array -> array.put(convertArrayToJson(readableArray.getArray(i)))
    }
  }
  return array
}
