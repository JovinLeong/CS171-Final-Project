
// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 650 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// parse the date / time
var parseTime = d3.timeFormat("%Y");

// Scales and axes. Note the inverted domain for the y-scale: bigger is up!
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the line
var line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.walls); });

d3.csv("data/border_years.csv", function(error, data) {

    // format the data
    data.forEach(function(d) {
        d.year = parseInt(d.year);
        d.walls = +d.walls;
    });

    // Compute the minimum and maximum date, and the maximum walls.
    x.domain([data[0].year, data[data.length - 1].year]);
    y.domain([0, d3.max(data, function(d) { return d.walls; })]).nice();

    // Add an SVG element with the desired dimensions and margin.
    var svg = d3.select("#border_years").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add the clip path.
    svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    // Add the X Axis
    svg.append("g")
        .attr('class', 'axisLines')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .ticks(20)
            .tickFormat(d3.format("d")));


    // Add the Y Axis
    svg.append("g")
        .attr('class', 'axisLines')
        .call(d3.axisLeft(y));

    svg.selectAll('.line')
        .data([data])
        .enter()
        .append('path')
        .attr('class', 'line')
        .style('stroke', "#008080")
        .attr('clip-path', 'url(#clip)')
        .attr('d', function(d) {
            return line(d);
        })

    /* Add 'curtain' rectangle to hide entire graph */
    var curtain = svg.append('rect')
        .attr('x', -1 * width)
        .attr('y', -1 * height)
        .attr('height', height)
        .attr('width', width)
        .attr('class', 'curtain')
        .attr('transform', 'rotate(180)')
        .style('fill', '#1D1D1D');

    /* Create a shared transition for anything we're animating */
    var t = svg.transition()
        .delay(0)
        .duration(16000)
        .ease(d3.easeLinear)
        .on('end', function() {
            d3.select('line.guide')
                .transition()
                .style('opacity', 0)
                .remove()
        });

    t.select('rect.curtain')
        .attr('width', 0);
    t.select('line.guide')
        .attr('transform', 'translate(' + width + ', 0)')


});