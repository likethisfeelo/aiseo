function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  // Base domains -- longest first so dev.aiseo.tips matches before aiseo.tips
  var baseDomains = ['dev.aiseo.tips', 'aiseo.tips'];
  var siteId = '';

  for (var i = 0; i < baseDomains.length; i++) {
    if (host === baseDomains[i]) {
      siteId = '';
      break;
    }
    var suffix = '.' + baseDomains[i];
    if (host.endsWith(suffix)) {
      siteId = host.substring(0, host.length - suffix.length);
      break;
    }
  }

  if (siteId) {
    // Subdomain request -- prepend siteId as S3 prefix
    var uri = request.uri;
    if (uri === '/' || uri === '') {
      request.uri = '/' + siteId + '/index.html';
    } else if (uri.endsWith('/')) {
      request.uri = '/' + siteId + uri + 'index.html';
    } else {
      request.uri = '/' + siteId + uri;
    }
  }

  return request;
}
