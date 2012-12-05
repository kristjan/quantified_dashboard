/*globals accessToken:true nv:true d3:true stream_layers:true*/

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
function testData() {
  if(true) return stream_layers(3,64,0.1).map(function(data, i) {
      return {
            key: 'Stream' + i,
            values: data
          };
    });

  var values = [];
  for (var i = 0; i < 128; i++) {
    values[i] = {
      x: i,
      y: Math.random()
    };
  }
  return [
    {
      key: 'One',
      values: values
    }
  ];
}

function drawChart() {
  nv.addGraph(function() {
    var chart = nv.models.lineWithFocusChart();

    chart.xAxis
    .tickFormat(d3.format(',f'));

    chart.yAxis
      .tickFormat(d3.format(',.2f'));

    chart.y2Axis
      .tickFormat(d3.format(',.2f'));

    d3.select('#chart svg')
      .datum(testData())
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
}

function init() {
  if (!accessToken) return;
  Singly.get('/profiles', null, addServices);
  drawChart();
}

$(init);
