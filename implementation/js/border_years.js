

// import data
d3.queue()
    .defer(d3.csv, "data/border_years.csv")
    .await(function(error, borderData) {
        border_years = new borderYears("border_years",borderData)
    })


// add border years visualizations
borderYears = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    this.createVis()
}

borderYears.prototype.createVis = function() {
    var vis = this;

    // set the dimensions and margins of the graph
        vis.margin = {top: 20, right: 20, bottom: 30, left: 50},
        vis.width = 650 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    vis.x = d3.scaleLinear().range([0, vis.width]);
    vis.y = d3.scaleLinear().range([vis.height, 0]);

    // define the line
    vis.line = d3.line()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return vis.x(d.year); })
        .y(function(d) { return vis.y(d.walls); });


    // format the data
    vis.data.forEach(function(d) {
        d.year = parseInt(d.year);
        d.walls = +d.walls;
    });

    // Compute the minimum and maximum date, and the maximum walls.
    vis.x.domain([vis.data[0].year, vis.data[vis.data.length - 1].year]);
    vis.y.domain([0, d3.max(vis.data, function(d) { return d.walls; })]).nice();

    // Add an SVG element with the desired dimensions and margin.
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Add the clip path.
    vis.svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // Add the X Axis
    vis.svg.append("g")
        .attr('class', 'axisLines')
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.x)
            .ticks(20)
            .tickFormat(d3.format("d")));


    // Add the Y Axis
    vis.svg.append("g")
        .attr('class', 'axisLines')
        .call(d3.axisLeft(vis.y));

    vis.svg.selectAll('.line')
        .data([vis.data])
        .enter()
        .append('path')
        .attr('class', 'line')
        .style('stroke', "#008080")
        .attr('clip-path', 'url(#clip)')
        .attr('d', function(d) {
            return vis.line(d);
        })

    //Add 'curtain' rectangle to hide entire graph
    vis.curtain = vis.svg.append('rect')
        .attr('x', -1 * vis.width)
        .attr('y', -1 * vis.height)
        .attr('height', vis.height)
        .attr('width', vis.width)
        .attr('class', 'curtain')
        .attr('transform', 'rotate(180)')
        .style('fill', '#1D1D1D');

    // Create a shared transition for anything we're animating
    vis.t = vis.svg.transition()
        .delay(0)
        .duration(16000)
        .ease(d3.easeLinear)
        .on('end', function() {
            d3.select('line.guide')
                .transition()
                .style('opacity', 0)
                .remove()
        });

    vis.t.select('rect.curtain')
        .attr('width', 0);
    vis.t.select('line.guide')
        .attr('transform', 'translate(' + vis.width + ', 0)')



}
