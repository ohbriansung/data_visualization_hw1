// [Reference] https://blockbuilder.org/sjengle/1e23258249638a508426470a48ff2924
// [Reference] https://beta.observablehq.com/@sjengle/zillow-affordability-heatmap

var svgId = "#svg2"
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
    "top": 10,
    "right": 10,
    "bottom": 35,
    "left": 60
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

  scale = {
    "x": d3.scaleBand()
      .domain(hours)
      .range([0, params.plot.width]),
    "y": d3.scaleBand()
      .domain(district)
      .range([params.plot.height, 0]),
    "color": d3.scaleSequential(d3.interpolatePurples)
      .domain([min, mid, max])
  };

  axis = {
    "x": d3.axisBottom(scale.x).tickPadding(0),
    "y": d3.axisLeft(scale.y).tickPadding(0)
  }
}

createSVG = function(id) {
  let svg = d3.select(id);

  let plot = svg.append("g");
  plot.attr("id", "plot2");
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
  gx.attr("id", "x-axis-2");
  gx.attr("class", "axis");
  gx.attr("transform", translate(params.plot.x, params.plot.y + params.plot.height));
  gx.call(axis.x);

  svg.append("text")  // bottom axis label
    .attr("text-anchor", "middle")
    .attr("class", "label")
    .attr("transform", translate(
      params.plot.x + params.plot.width / 2,
      params.plot.y + params.plot.height + 25
    ))
    .text("Hour");

  let gy = svg.append("g");
  gy.attr("id", "y-axis-2");
  gy.attr("class", "axis");
  gy.attr("transform", translate(params.plot.x, params.plot.y));
  gy.call(axis.y);

  return node;
}

createHeatmap = function(id) {
  let node = createPlot(id);
  let svg  = d3.select(node);
  let plot = svg.select("g#plot2");

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
