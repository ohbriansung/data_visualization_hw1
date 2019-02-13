// [Reference] https://blockbuilder.org/sjengle/1e23258249638a508426470a48ff2924
// [Reference] https://beta.observablehq.com/@sjengle/zillow-affordability-heatmap

var svgId = "#svg3"
var bounds = d3.select(svgId).node().getBoundingClientRect();
var policeDistrictAndHour = {};
var policeDistrictAndHourArray = new Array();
var district;
var hours;
var scale;
var axis;

var params = {
  "svg": {
    "width": bounds.width,
    "height": bounds.height
  },
  "margin": {
    "top": 70,
    "right": 180,
    "bottom": 110,
    "left": 90
  }
};

params["plot"] = {
    "x": params["margin"]["left"],
    "y": params["margin"]["top"],
    "width": params["svg"]["width"] - params["margin"]["left"] - params["margin"]["right"],
    "height": params["svg"]["height"] - params["margin"]["top"] - params["margin"]["bottom"]
};

convertRow = function(row) {
  row["Incident Time"] = parseInt(getHour(parseTime(row["Incident Time"])));

  if (!(row["Police District"] in policeDistrictAndHour)) {
    policeDistrictAndHour[row["Police District"]] = {};
    policeDistrictAndHour[row["Police District"]]["values"] = new Array(24);
    policeDistrictAndHour[row["Police District"]]["total"] = 0;

    for (let i = 0; i < 24; i++) {
      policeDistrictAndHour[row["Police District"]]["values"][i] = {
        "hour": i,
        "value": 0
      };
    }
  }

  // increment hour count and total count for sorting later
  policeDistrictAndHour[row["Police District"]]["values"][row["Incident Time"]]["value"] += 1;
  policeDistrictAndHour[row["Police District"]]["total"] += 1;
}

getDistrictAndHour = function() {
  for (let key in policeDistrictAndHour) {
    policeDistrictAndHourArray.push({
      "district": key,
      "total": policeDistrictAndHour[key]["total"],
      "time": policeDistrictAndHour[key]["values"]
    });
  }

  policeDistrictAndHourArray.sort(function(a, b) {
    return a["total"] - b["total"];
  });

  district = policeDistrictAndHourArray.map(function(row) { return row["district"]; });

  let time = policeDistrictAndHourArray[0].time
  hours = time.map(function(row) { return row["hour"]; });
}

loadScaleAndAxis = function() {
  let time = policeDistrictAndHourArray.map(function(d) { return d.time; });
  let merged = d3.merge(time);
  let mapped = merged.map(function(d) { return d.value; });
  let min = d3.min(mapped);
  let max = d3.max(mapped);
  let mid = (min + max) / 2;
  let range = [min, mid, max];

  scale = {
    "x": d3.scaleBand()
      .domain(hours)
      .range([0, params.plot.width]),
    "y": d3.scaleBand()
      .domain(district)
      .range([params.plot.height, 0]),
    "color": d3.scaleSequential(d3.interpolatePurples)
      .domain(range),
    "max": max,
    "min": min
  };

  axis = {
    "x": d3.axisTop(scale.x).tickPadding(0),
    "y": d3.axisLeft(scale.y).tickPadding(0)
  }
}

createSVG = function(id) {
  let svg = d3.select(id);

  let plot = svg.append("g");
  plot.attr("id", "plot3");
  plot.attr("transform", translate(params.plot.x, params.plot.y));

  let rect = plot.append("rect");
  rect.attr("class", "rect-background");
  rect.attr("id", "background2");

  rect.attr("x", 0);
  rect.attr("y", 0);
  rect.attr("width", params.plot.width);
  rect.attr("height", params.plot.height);

  return svg.node();
}

createPlot = function(id) {
  let node = createSVG(id);
  let svg  = d3.select(node);

  let gx = svg.append("g");
  gx.attr("id", "x-axis-3");
  gx.attr("class", "axis-heatmap");
  gx.attr("transform", translate(params.plot.x, params.plot.y));
  gx.attr("text-anchor", "start")
  gx.call(axis.x);

  svg.append("text")  // bottom axis label
    .attr("text-anchor", "middle")
    .attr("class", "label")
    .attr("transform", translate(params.plot.x + params.plot.width / 2, params.plot.y - 20))
    .text("Incident Time");

  let gy = svg.append("g");
  gy.attr("id", "y-axis-3");
  gy.attr("class", "axis-heatmap");
  gy.attr("transform", translate(params.plot.x, params.plot.y));
  gy.call(axis.y);

  svg.append("text")  // bottom axis label
    .attr("text-anchor", "end")
    .attr("class", "label")
    .attr("transform", translate(params.plot.x - 5, params.plot.y - 5))
    .text("Police Distri..");

  return node;
}

createHeatmap = function(id) {
  let node = createPlot(id);
  let svg  = d3.select(node);
  let plot = svg.select("g#plot3");

  // create one group per row
  let rows = plot.selectAll("g.cell")
    .data(policeDistrictAndHourArray)
    .enter()
    .append("g");

  rows.attr("class", "cell");
  rows.attr("id", function(d) { return "District-" + d["district"]; });

  // shift the entire group to the appropriate y-location
  rows.attr("transform", function(d) {
    return translate(0, scale.y(d["district"]));
  });

  // create one rect per cell within row group
  let cells = rows.selectAll("rect")
    .data(function(d) { return d.time; })
    .enter()
    .append("rect");

  cells.attr("x", function(d) { return scale.x(d.hour); });
  cells.attr("y", 0); // handled by group transform
  cells.attr("width", scale.x.bandwidth());
  cells.attr("height", scale.y.bandwidth());
  cells.attr("count", function(d) { return d.value; });

  // here is the color magic!
  cells.style("fill", function(d) { return scale.color(d.value); });
  cells.style("stroke", function(d) { return scale.color(d.value); });

  // position the legend elements
  var legend = plot.selectAll(".legend")
    .data(d3.range(scale.max), function(d) { return d; })
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", translate(params.plot.width + 20, -params.margin.top + 25));

  legend.append("rect")
    .attr("x", function(d, i) { return i * .75; })
    .attr("width", 1)
    .attr("height", 18)
    .style("fill", function(d, i) { return scale.color(d); });

  legend.append("text")
    .attr("class", "label")
    .attr("x", -15)
    .attr("y", -5)
    .style("text-anchor", "start")
    .text("Number of Records");

  legend.append("text")
    .attr("class", "label")
    .attr("x", -15)
    .attr("y", 13)
    .style("text-anchor", "start")
    .text(scale.min);

  legend.append("text")
    .attr("class", "label")
    .attr("x", scale.max * .75 + 5)
    .attr("y", 13)
    .style("text-anchor", "start")
    .text(scale.max);

  // title
  svg.append("text")
    .attr("text-anchor", "start")
    .attr("class", "title")
    .attr("transform", translate(15, 35))
    .text("Incident Frequency Per Hour");

  // caption
  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "0em")
    .attr("transform", translate(-params.margin.left + 10, params.plot.height + 20))
    .text("Author: Brian Sung");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "1em")
    .attr("transform", translate(-params.margin.left + 10, params.plot.height + 20))
    .text("Presenting the number of records per hour. Color shows the count of incident happened in each hour. The thicker the color, the more the");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "2em")
    .attr("transform", translate(-params.margin.left + 10, params.plot.height + 20))
    .text("number of records is. Used color module from d3-scale-chromatic. Set the count to 0 if no record. Splitted records by police district.");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "3em")
    .attr("transform", translate(-params.margin.left + 10, params.plot.height + 20))
    .text("Sorted by the number of records.");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "4em")
    .attr("transform", translate(-params.margin.left + 10, params.plot.height + 20))
    .text("I wanted to know which cities are more danger and which are safer. Moreover, I wanted to observe which hours are more danger");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "5em")
    .attr("transform", translate(-params.margin.left + 10, params.plot.height + 20))
    .text("and which are safer. It's interesting that we would assume that darkness means it's easier for illgal activities. However, it's not necessarily");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "6em")
    .attr("transform", translate(-params.margin.left + 10, params.plot.height + 20))
    .text("true for 1 am to 5 am (dark) shown in the heatmap. Same for 10 am to 5 pm (bright).");

  return node;
}

// start
d3.csv(
  DATA,
  convertRow
).then(function() {
  getDistrictAndHour()
  loadScaleAndAxis()
  createHeatmap(svgId)
})
