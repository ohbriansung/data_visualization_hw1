// [Reference] https://blockbuilder.org/sjengle/1e23258249638a508426470a48ff2924
// [Reference] https://beta.observablehq.com/@sjengle/zillow-affordability-heatmap
// [Reference] http://bl.ocks.org/tmaybe/6144082
var resCategory = [
  "Open or Active",
  "Cite or Arrest Adult",
  "Cite or Arrest Juvenile",
  "Exceptional Adult",
  "Exceptional Juvenile",
  "Unfounded"
];

var colors = d3.scaleOrdinal().range([
  "#97CFD0",
  "#00A2B3",
  "#F1788D",
  "#CF3E53",
  "#B9CA5D",
  "#4EB2A7"
]).domain(resCategory);

countResolution = function(d) {
  let count = {};

  for (let i = 0; i < d.length; i++) {
    let district = d[i]["Police District"];
    let resolution = d[i]["Resolution"];

    if (!(district in count)) {
      count[district] = {};
      count[district]["values"] = {};
      count[district]["total"] = 0;
    }

    if (!(resolution in count[district]["values"])) {
      count[district]["values"][resolution] = 0;
    }

    count[district]["values"][resolution] += 1;
    count[district]["total"] += 1;
  }

  return count;
}

// Convert dictionary into array of entries and calculate percent with start points
_convertToArray = function(d) {
  let array = new Array();

  for (let key in d) {
    let temp = {
      "district": key,
      "total": d[key]["total"],
      "values": resCategory.map(function(row) {
        return {
          "resolution": row,
          "percent": (row in d[key]["values"])
            ? d[key]["values"][row] / d[key]["total"] * 100
            : 0
        };
      })
    }

    for (let i = resCategory.length - 1, pre = 0; i >= 0; i--) {
      temp["values"][i]["start"] = pre;
      pre += temp["values"][i]["percent"];
    }

    array.push(temp);
  }

  return array
}

// Sort the array by count
_sortFunc = function(a, b) {
  return b["total"] - a["total"];
}

drawStackedChar = function(d) {
  let svg = d3.select("#svg3");

  let districts = d.map(function(row) { return row["district"]; });
  let values = d.map(function(row) { return row["values"]; });

  let margin = {
    top: 10,
    right: 145,
    bottom: 30,  // district axis
    left: 50  // percent axis
  };

  let bounds = svg.node().getBoundingClientRect();
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let percentScale = d3.scaleLinear()
    .domain([0, 100], .1)
    .range([plotHeight, 0]);

  let positionScale = d3.scaleLinear()
    .domain([0, 100], .1)
    .range([0, plotHeight]);

  let districtsScale = d3.scaleBand()
    .domain(districts)
    .rangeRound([0, plotWidth])
    .paddingInner(0.2);  // spaces between bars

  let plot = svg.append("g");
  plot.attr("id", "plot3");
  plot.attr("transform", translate(margin.left, margin.top));

  // create axis
  let xAxis = d3.axisBottom(districtsScale);
  let yAxis = d3.axisLeft(percentScale);

  let xGroup = plot.append("g").attr("id", "x-axis-3");
  xGroup.call(xAxis);
  xGroup.attr("transform", translate(0, plotHeight));  // bottom

  let yGroup = plot.append("g").attr("id", "y-axis-3");
  yGroup.call(yAxis);
  yGroup.attr("transform", translate(0 ,0));  // left

  plot.append("text")  // bottom axis label
    .attr("text-anchor", "middle")
    .attr("class", "label")
    .attr("transform", translate(-32, plotHeight / 2) + "rotate(-90)")
    .text("% of Total Number of Records");

  // create bars
  var district = plot.selectAll(".district")
		.data(d)
		.enter().append("g")
		.attr("transform", function(d) {
      return translate(districtsScale(d.district), 0);
    });

  district.selectAll("rect")
		.data(function(d) { return d.values; })
		.enter().append("rect")
    .attr("x", 0)
    .attr("y", function(d) { return positionScale(d.start); })
		.attr("width", districtsScale.bandwidth())
		.attr("height", function(d) { return positionScale(d.percent); })
		.style("fill", function(d) { return colors(d.resolution); });

  // position the legend elements
	var legend = plot.selectAll(".legend")
		.data(colors.domain())
		.enter().append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) {
      return translate(plotWidth + 10, plotHeight - 10 - i * 20);
    });

	legend.append("rect")
		.attr("x", 0)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", colors);

	legend.append("text")
    .attr("class", "label")
		.attr("x", 25)
		.attr("y", 12)
		.style("text-anchor", "start")
		.text(function(d) { return d; });
}

d3.csv(
  DATA
).then(function(d) {
  let counts = countResolution(d);
  let array = _convertToArray(counts);
  let sorted = array.sort(_sortFunc);
  console.log(sorted)
  drawStackedChar(sorted);
})
