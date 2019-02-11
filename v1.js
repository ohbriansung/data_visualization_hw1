// [Reference] https://blockbuilder.org/sjengle/1e23258249638a508426470a48ff2924

countIncident = function(d) {
  let count = {};

  for (let i = 0; i < d.length; i++) {
    let incident = d[i]["Incident Category"];

    if (!(incident in count)) {
      count[incident] = 1;
    } else {
      count[incident] += 1;
    }
  }

  return count;
}

filter = function(d) {
  for (let key in d) {
    if (d[key] < FILTER)  {
      delete d[key];
    }
  }

  return d;
}

convertToArray = function(d) {
  let array = new Array();

  for (let key in d) {
    array.push({"incident": key, "count": d[key]});
  }

  return array
}

sortFunc = function(a, b) {
  return a["count"] - b["count"];
}

incidentFormatter = function (d) {
  let text = d;
  let parts = text.split(/[,-\s]+/);

  if (parts !== null && parts.length >= 2) {
    text = parts[0] + " " + parts[1];

    if (parts.length > 2) {
      text = text + "+";
    }
  }

  return text;
}

drawChar = function(d) {
  let svg = d3.select("#svg1");

  let incidents = d.map(function(row) { return row["incident"]; });
  let counts = d.map(function(row) { return row["count"]; });
  let min = 0;
  let max = d3.max(counts);

  let margin = {
    top: 10,
    right: 20,
    bottom: 30,
    left: 140
  };

  let bounds = svg.node().getBoundingClientRect();
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let countScale = d3.scaleLinear()
    .domain([min, max])
    .range([0, plotWidth])
    .nice();

  let incidentScale = d3.scaleBand()
    .domain(incidents)
    .rangeRound([plotHeight, 0])
    .paddingInner(0.2);

    let plot = svg.append("g");
    plot.attr("id", "plot1");
    plot.attr("transform", translate(margin.left, margin.top));

    let xAxis = d3.axisBottom(countScale);
    let yAxis = d3.axisLeft(incidentScale).tickFormat(incidentFormatter);

    let xGroup = plot.append("g").attr("id", "x-axis-1");
    xGroup.call(xAxis);
    xGroup.attr("transform", translate(0, plotHeight));

    let yGroup = plot.append("g").attr("id", "y-axis-1");
    yGroup.call(yAxis);
    yGroup.attr("transform", translate(0 ,0));

    let bars = plot.selectAll("rect").data(d);
    bars.enter().append("rect")
    .attr("class", "bar")
    .attr("width", function(d) { return countScale(d.count); })
    .attr("height", incidentScale.bandwidth())
    .attr("x", 0)
    .attr("y", function(d) { return incidentScale(d.incident); });
}

d3.csv(
  DATA
)
.then(function(d) {
  let count = countIncident(d);
  let filtered = filter(count);
  let array = convertToArray(filtered);
  let sorted = array.sort(sortFunc);
  drawChar(sorted)
})
