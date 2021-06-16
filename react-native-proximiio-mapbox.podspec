require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-proximiio-mapbox"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/proximiio/react-native-proximiio-mapbox.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,swift}"

  s.dependency "React"
  s.dependency "ProximiioMapbox", '5.1.8'
  s.dependency "ProximiioProcessor"
  s.dependency "OpenCombine"
  s.dependency "OpenCombineDispatch"
end
