/*globals accessToken:true nv:true d3:true*/

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

var chartData = {};

var TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
var ONE_DAY = 24 * 60 * 60 * 1000;
var FOUR_WEEKS = 28 * ONE_DAY;

function inRange(date, next) {
  return function(datum) {
    return datum.at >= date && datum.at < next;
  };
}

function byDay(data) {
  var counts = [];
  for (var i = 28; i >= 0; i--) {
    var date = TODAY.valueOf() - i * ONE_DAY;
    var next = date + ONE_DAY;
    var count = _.filter(data, inRange(date, next)).length;
    counts.push({
      x: date,
      y: count
    });
  }
  return counts;
}

function addMetric(evt) {
  evt.preventDefault();
  var name = $(evt.target).attr('name');
  Singly.get('/services/' + name, {
    since: (TODAY.valueOf() - FOUR_WEEKS) / 1000,
    limit: 1000
  }, function(data) {
    chartData[name] = byDay(data);
    drawChart();
  });
}

function fillService(service, menu) {
  Singly.get('/services/' + service, null, function(data) {
    var list = menu.find('ul');
    Object.keys(data).sort().forEach(function(type) {
      if (type === 'self') return;

      var item = $('<li>').append(
        $('<a>', {href: '#', name: [service, type].join('/')}).text(type),
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
  menu.on('click', '.service a', addMetric);
}

function dataToNVD3() {
  var data = [];
  Object.keys(chartData).sort().forEach(function(metric) {
    data.push({
      key: metric,
      values: _.map(chartData[metric], function(datum) {
        return {
          source: metric,
          x: datum.x,
          y: datum.y
        };
      })
    });
  });
  return data;
}

function dateFormat(d) {
  return d3.time.format('%x')(new Date(d));
}


function drawChart() {
  nv.addGraph(function() {
    var chart = nv.models.lineWithFocusChart();

    chart.xAxis.tickFormat(dateFormat);
    chart.x2Axis.tickFormat(dateFormat);
    chart.yAxis.tickFormat(d3.format(',.2f'));
    chart.y2Axis.tickFormat(d3.format(',.2f'));

    var data = dataToNVD3();
    d3.select('#chart svg')
      .datum(data)
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
}

function init() {
  if (!accessToken) return;
  console.log("Access token: ", accessToken);

  $.ajaxSetup({timeout: 0});
  Singly.get('/profiles', null, addServices);
  drawChart();
}

$(init);
