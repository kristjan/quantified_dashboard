/*globals accessToken:true*/

// The URL of the Singly API endpoint
var API_BASE = 'https://api.singly.com';

// A small wrapper for getting data from the Singly API
var Singly = {
  get: function(url, options, callback) {
    if (!options) options = {};
    options.access_token = accessToken;
    $.getJSON(API_BASE + url, options, callback);
  }
};

function fillService(service, menu) {
  Singly.get('/services/' + service, null, function(data) {
    var list = menu.find('ul');
    Object.keys(data).sort().forEach(function(type) {
      if (type === 'self') return;

      var item = $('<li>').append(
        $('<label>').text(type),
        $('<span>', {'class': 'count'}).text(data[type])
      );
      list.append(item);
    });
  });
}

function addServices(services) {
  var menu = $('#menu');
  menu.empty();
  Object.keys(services).sort().forEach(function(service) {
    if (service === 'id') return;

    var item = $('<li>', {'class': 'service'}).append(
      $('<h3>').text(service),
      $('<ul>')
    );
    menu.append(item);
    fillService(service, item);
  });
}

function init() {
  if (!accessToken) return;
  console.log("Token: " + accessToken);
  Singly.get('/profiles', null, addServices);
}

$(init);
