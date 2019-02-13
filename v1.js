// [Reference] https://blockbuilder.org/sjengle/1e23258249638a508426470a48ff2924
// [Reference] https://beta.observablehq.com/@sjengle/zillow-affordability-heatmap

// Count incident per category into dictionary
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

// Remove records with counts less than 25
filter = function(d) {
  for (let key in d) {
    if (d[key] < FILTER)  {
      delete d[key];
    }
  }

  return d;
}

// Convert dictionary into array of entries
convertToArray = function(d) {
  let array = new Array();

  for (let key in d) {
    array.push({"incident": key, "count": d[key]});
  }

  return array
}

// Sort the array by count
sortFunc = function(a, b) {
  return a["count"] - b["count"];
}

// Decrement the length of incident axis by leaving two words
incidentFormatter = function (d) {
  let text = d;

  if (text.length > 26) {
    text = text.substring(0, 24) + "..";
  }

  return text;
}

drawChar = function(d) {
  let svg = d3.select("#svg1");

  let incidents = d.map(function(row) { return row["incident"]; });
  let counts = d.map(function(row) { return row["count"]; });
  let min = 0;
  let max = d3.max([d3.max(counts), 4250]);

  let margin = {
    top: 60,
    right: 20,
    bottom: 100,  // count axis
    left: 170  // incident axis
  };

  let bounds = svg.node().getBoundingClientRect();
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let countScale = d3.scaleLinear()
    .domain([min, max])
    .range([0, plotWidth]);

  let incidentScale = d3.scaleBand()
    .domain(incidents)
    .rangeRound([plotHeight, 0])
    .paddingInner(0.3);  // spaces between bars

  let plot = svg.append("g");
  plot.attr("id", "plot1");
  plot.attr("transform", translate(margin.left, margin.top));

  let xAxis = d3.axisBottom(countScale).tickSize(-plotHeight);
  let yAxis = d3.axisLeft(incidentScale).tickFormat(incidentFormatter);

  let xGroup = plot.append("g").attr("id", "x-axis-1");
  xGroup.call(xAxis);
  xGroup.attr("transform", translate(0, plotHeight));  // bottom
  xGroup.attr("class", "axis");

  plot.append("text")  // bottom axis label
    .attr("text-anchor", "middle")
    .attr("class", "label")
    .attr("transform", translate(plotWidth / 2, plotHeight + 32))
    .text("Number of Records");

  let yGroup = plot.append("g").attr("id", "y-axis-1");
  yGroup.call(yAxis);
  yGroup.attr("transform", translate(0 ,0));  // left
  yGroup.attr("class", "axis");

  plot.append("text")  // bottom axis label
    .attr("text-anchor", "end")
    .attr("class", "label")
    .attr("transform", translate(-5, -5))
    .text("Incident Category");

  let bars = plot.selectAll("rect").data(d);
  bars.enter().append("rect")
  .attr("class", "bar")  // css for color
  .attr("width", function(d) { return countScale(d.count); })  // length is the count
  .attr("height", incidentScale.bandwidth())  // fixed height
  .attr("x", 0)  // bars go from left side
  .attr("y", function(d) { return incidentScale(d.incident); });  // based on incident axis

  // title
  svg.append("text")
    .attr("text-anchor", "start")
    .attr("class", "title")
    .attr("transform", translate(15, 35))
    .text("Incident Distribution");

  // caption
  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "0em")
    .attr("transform", translate(-margin.left + 10, plotHeight + margin.bottom / 2 + 5))
    .text("Author: Brian Sung");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "1em")
    .attr("transform", translate(-margin.left + 10, plotHeight + margin.bottom / 2 + 5))
    .text("Presenting count for each incident category. Filtered the data to remove incidents with less than 25 records. Sorted by the number of records.");

  plot.append("text")
    .attr("text-anchor", "start")
    .attr("class", "captions")
    .attr("dy", "2em")
    .attr("transform", translate(-margin.left + 10, plotHeight + margin.bottom / 2 + 5))
    .text("I wanted to figure out what were the most incidents occured in San Francisco. Apparently, stealing is the most common type of indicents happended in San Francisco.");
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
