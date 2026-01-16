// Streamlined batch extractor - returns all photos as JSON array
// Run on any photos-XXXX-YYYY page
(function() {
  var NL = String.fromCharCode(10);
  var lines = document.body.innerText.split(NL);

  // Get image URLs
  var imgUrls = [];
  document.querySelectorAll('img').forEach(function(img) {
    if (img.src.indexOf('sitesv') > -1) {
      var url = img.src;
      if (url.indexOf('=w') > -1) url = url.replace(/=w\d+/, '=w1280');
      else url = url + '=w1280';
      imgUrls.push(url);
    }
  });

  // Find photo IDs
  var re4 = new RegExp('^[0-9]{4}$');
  var photoIds = [], photoLineIdx = [];
  for (var i = 0; i < lines.length; i++) {
    var t = lines[i].trim();
    if (re4.test(t)) {
      photoIds.push(t);
      photoLineIdx.push(i);
    }
  }

  // Extract field helper
  function extractField(sectionLines, prefix) {
    for (var i = 0; i < sectionLines.length; i++) {
      var line = sectionLines[i].trim();
      if (line.indexOf(prefix) === 0) return line.substring(prefix.length).trim();
    }
    return null;
  }

  // Extract single photo
  function extractPhoto(sectionLines, imgUrl, photoId) {
    var photo = { id: photoId, imageUrl: imgUrl };
    photo.date = extractField(sectionLines, 'Date: ');
    photo.location = extractField(sectionLines, 'Location: ');
    photo.people = extractField(sectionLines, 'People: ');
    photo.description = extractField(sectionLines, 'Description: ');
    if (!photo.description) {
      for (var i = 0; i < sectionLines.length; i++) {
        if (sectionLines[i].indexOf('Happening') > -1) {
          var idx = sectionLines[i].indexOf(':');
          if (idx > -1) photo.description = sectionLines[i].substring(idx + 1).trim();
        }
      }
    }
    photo.source = extractField(sectionLines, 'Source: ');
    photo.notes = extractField(sectionLines, 'Other Notes: ');
    for (var j = 0; j < sectionLines.length; j++) {
      if (sectionLines[j].indexOf('high-res') > -1) photo.hasHighRes = sectionLines[j].indexOf('Yes') > -1;
      if (sectionLines[j].indexOf('Duplicate') > -1) photo.duplicate = sectionLines[j].trim();
    }
    return photo;
  }

  // Process all photos
  var photos = [];
  for (var i = 0; i < photoIds.length; i++) {
    var startLine = photoLineIdx[i];
    var endLine = (i + 1 < photoLineIdx.length) ? photoLineIdx[i + 1] : lines.length;
    var sectionLines = lines.slice(startLine, endLine);
    photos.push(extractPhoto(sectionLines, imgUrls[i], photoIds[i]));
  }

  // Store in window for retrieval
  window._extractedPhotos = photos;
  window._batchId = photoIds[0] + '-' + photoIds[photoIds.length - 1];
  return 'Extracted ' + photos.length + ' photos: ' + window._batchId;
})();
