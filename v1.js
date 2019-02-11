var svgId = "#svg1"
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
    "bottom": 30,
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
    policeDistrictAndHour[row["Police District"]]["total"] = 0;
  }

  // creating dictionart for Incident Time (hour)
  if (!(row["Incident Time"] in policeDistrictAndHour[row["Police District"]])) {
    policeDistrictAndHour[row["Police District"]][row["Incident Time"]] = 1;
  } else {
    policeDistrictAndHour[row["Police District"]][row["Incident Time"]] += 1;
  }

  // record total count for sorting later
  policeDistrictAndHour[row["Police District"]]["total"] += 1;
}

loadScaleAndAxis = function() {
  let length = policeDistrictAndHourArray.length

  scale = {
    "x": d3.scaleBand()
      .domain(hours)
      .range([0, params.plot.width]),
    "y": d3.scaleBand()
      .domain(district)
      .range([params.plot.height, 0]),
    "color": d3.scaleSequential(d3.interpolateViridis)
      .domain([
        policeDistrictAndHourArray[length - 1]["time"]["total"],
        policeDistrictAndHourArray[parseInt(length / 2)]["time"]["total"],
        policeDistrictAndHourArray[0]["time"]["total"]
      ])
  };

  axis = {
    "x": d3.axisBottom(scale.x).tickPadding(0),
    "y": d3.axisLeft(scale.y).tickPadding(0)
  }
}

createSVG = function(id) {
  let svg = d3.select(id);

  let plot = svg.append("g");
  plot.attr("id", "plot1");
  plot.attr("transform", translate(params.plot.x, params.plot.y));

  let rect = plot.append("rect");
  rect.attr("id", "background1");

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
  gx.attr("id", "x-axis");
  gx.attr("class", "axis");
  gx.attr("transform", translate(params.plot.x, params.plot.y + params.plot.height));
  gx.call(axis.x);

  let gy = svg.append("g");
  gy.attr("id", "y-axis");
  gy.attr("class", "axis");
  gy.attr("transform", translate(params.plot.x, params.plot.y));
  gy.call(axis.y);

  return node;
}

createHeatmap = function(id) {
  let node = createPlot(id);
  let svg  = d3.select(node);
  let plot = svg.select("g#plot1");

  // create one group per row
  let rows = plot.selectAll("g.cell")
    .data(policeDistrictAndHourArray)
    .enter()
    .append("g");

  rows.attr("class", "cell");

  // shift the entire group to the appropriate y-location
  rows.attr("transform", function(d) {
    return translate(0, scale.y(d["district"]));
  });

  // create one rect per cell within row group
  let cells = rows.selectAll("rect")
    .data(function(d) {
      let values = d["time"]
      delete values["total"]
      return values;
    })
    .enter()
    .append("rect");

  cells.attr("x", function(d) { return scale.x(d.date); });
  cells.attr("y", 0); // handled by group transform
  cells.attr("width", scale.x.bandwidth());
  cells.attr("height", scale.y.bandwidth());
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
  for (let key in policeDistrictAndHour) {
    policeDistrictAndHourArray.push({"district": key, "time": policeDistrictAndHour[key]});
  }

  policeDistrictAndHourArray.sort(function(a, b) {
    return b["time"]["total"] - a["time"]["total"];
  })

  district = policeDistrictAndHourArray.map(function(row) { return row["district"]; });
  hours = Object.keys(policeDistrictAndHourArray[0]["time"])
  hours.pop()  // remove total

  loadScaleAndAxis()
  createHeatmap(svgId)
})
