// time formating
var DATA = "Police_Department_Incident_Reports__2018_to_Present.csv";
var FILTER = 25;

var parseDatetime = d3.timeParse("%Y/%m/%d %I:%M:%S %p");
var parseTime = d3.timeParse("%H:%M");
var getHour = d3.timeFormat("%H");

translate = function(a, b) {
  return "translate(" + a + ", " + b + ")";
}
