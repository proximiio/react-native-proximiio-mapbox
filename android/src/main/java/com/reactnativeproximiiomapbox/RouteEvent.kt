package com.reactnativeproximiiomapbox

import io.proximi.mapbox.library.RouteUpdateData
import io.proximi.mapbox.library.RouteUpdateType

data class RouteEvent(
  val eventType: RouteUpdateType,
  val text: String,
  val additionalText: String? = null,
  val data: RouteUpdateData? = null
)
