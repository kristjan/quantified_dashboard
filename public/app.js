/*globals accessToken:true nv:true d3:true Spinner:true*/

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

var DETAILS = {
  fitbit: {
    activities: ['steps']
  }
};

var VALUE_FNS = {
  'fitbit/activities/steps': function(data) {
    var steps = 0;
    data.forEach(function(datum) {
      steps += datum.data.summary.steps;
    });
    return steps;
  }
};

function inRange(date, next) {
  return function(datum) {
    return datum.at >= date && datum.at < next;
  };
}

function count(data) {
  return data.length;
}

function valueFor(name, data) {
  return (VALUE_FNS[name] || count)(data);
}

function byDay(name, data) {
  var values = [];
  for (var i = 28; i >= 0; i--) {
    var date = TODAY.valueOf() - i * ONE_DAY;
    var next = date + ONE_DAY;
    var value = valueFor(name, _.filter(data, inRange(date, next)));
    values.push({
      x: date,
      y: value
    });
  }
  return values;
}

function addMetric(evt) {
  evt.preventDefault();
  spinner.spin($('#chart').get(0));
  var name = $(evt.target).attr('name');
  var base = name.split('/').slice(0, 2).join('/');
  Singly.get('/services/' + base, {
    since: (TODAY.valueOf() - FOUR_WEEKS) / 1000,
    limit: 1000
  }, function(data) {
    chartData[name] = byDay(name, data);
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
      if (DETAILS[service] && DETAILS[service][type]) {
        var details = $('<ul>');
        DETAILS[service][type].sort().forEach(function(metric) {
          details.append(
            $('<li>').append(
              $('<a>', {
                href: '#',
                name: [service, type, metric].join('/')
              }).text(metric)
            )
          );
        });
        item.append(details);
      }
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
  spinner.stop();
}

var spinner;
function initSpinner() {
  spinner = new Spinner();
}

function init() {
  if (!accessToken) return;
  console.log("Access token: ", accessToken);

  $.ajaxSetup({timeout: 0});
  Singly.get('/profiles', null, addServices);
  initSpinner();
  drawChart();
}

$(init);
