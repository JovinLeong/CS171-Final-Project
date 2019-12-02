// import data
d3.queue()
    .defer(d3.csv, "data/aggregate_data.csv")
    .await(function(error, borderData) {
        border_reasons = new borderReason("border_reasons",borderData)
    });

// d3.csv("data/aggregate_data.csv", function (borderData) {
//     createGraph();
// })
//
// function createGraph() {
//
// }


// add border years visualizations
borderReason = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.initVis()
};

borderReason.prototype.initVis = function() {
    var vis = this;

    vis.filteredData = vis.data;

    // set the dimensions and margins of the graph
        vis.margin = {top: 20, right: 20, bottom: 30, left: 50};
        vis.width = 670 - vis.margin.left - vis.margin.right;
        vis.height = 300 - vis.margin.top - vis.margin.bottom;
        vis.radius = Math.min(width, height)/4;

    // Add an SVG element with the desired dimensions and margin.
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    vis.x = d3.scaleLinear()
        .range([0, vis.width]);
    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.donutColor = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

    vis.donutChart = d3.pie()
        .sort(null)
        .value(function (d) {
            return vis.x(d)
        });

    vis.donutPath = d3.arc()
        .outerRadius(vis.radius - 10)
        .innerRadius(vis.radius - 70);

    vis.donutLabel = d3.arc()
        .outerRadius(vis.radius - 40)
        .innerRadius(vis.radius - 40);



    vis.wrangleData();
};

borderReason.prototype.wrangleData = function () {
    var vis = this;

    vis.immigrationCount = 0;
    vis.disputeCount = 0;
    vis.smuggleCount = 0;
    vis.terrorCount = 0;
    vis.otherCount = 0;

    // format the data
    vis.filteredData.forEach (function(d) {
        d.Established = +d.Established;
        d.Removed = +d.Removed;
        d.Illegal_Immigration = +d.Illegal_Immigration;
        vis.immigrationCount += d.Illegal_Immigration;
        d.Interstate_dispute = +d.Interstate_dispute;
        vis.disputeCount += d.Interstate_dispute;
        d.Smuggling_and_contraband = +d.Smuggling_and_contraband;
        vis.smuggleCount += d.Smuggling_and_contraband;
        d.Terrorism_and_Insurgency = +d.Terrorism_and_Insurgency;
        vis.terrorCount += d.Terrorism_and_Insurgency;
        d.Other = +d.Other;
        vis.otherCount += d.Other
    });
    nestedTitles = ['Illegal immigration', 'Interstate dispute', 'Smuggling and Contraband', 'Terrorism and insurgency', 'Other']
    nestedData = [vis.immigrationCount, vis.disputeCount, vis.smuggleCount, vis.terrorCount, vis.otherCount];

    vis.updateVis()

};

borderReason.prototype.updateVis = function() {
    var vis = this;
    // Update domain
    vis.x.domain(d3.extent(nestedData, function(d) { return  d; }));
    vis.y.domain(nestedTitles.map(function(d) { return  d; }));

    vis.arc = g.selectAll(".arc")
        .data(vis.donutChart(nestedData))
        .enter()
        .append("g")
        .attr("class", "arc");




    // console.log("new data", nestedData);
    // Update y-axis and labels
    // vis.svg.select(".y-axis").call(vis.yAxis).transition()
    //     .duration(400);

    // vis.labels = vis.svg.selectAll("text.label")
    //     .data(nestedData);
    //
    // vis.labels
    //     .enter()
    //     .append("text")
    //     .attr("class", "label")
    //     .merge(vis.labels)
    //     .text(function(d){
    //         return "" + d.value
    //     })
    //     .attr("x", function(d){
    //         return vis.x(d.value) + 13
    //     })
    //     .transition()
    //     .duration(400)
    //     .attr("y", function(d){
    //         return (vis.y.bandwidth()/2 + vis.y(d.key)) + 4
    //     })
    //
    //     .attr("text-anchor", "left")
    //     .attr("font-size", 11)
    //     .attr("fill", "black");
    //
    // vis.labels
    //     .exit()
    //     .remove();
    // Generate barchart
    vis.barChart = vis.svg.selectAll("rect")
        .data(nestedData);

    vis.barChart.enter().append("rect")
        .merge(vis.barChart)
        .attr("x", 10)
        .transition()
        .duration(450)
        .attr("y", function(d, i){ return i*30})
        .attr("height", 10)
        .attr("width", function(d){
            return vis.x(d);
        })
        .style("fill", "#ffffff")
        .attr("class", "bar-element");

    vis.barChart.exit().remove();
};

borderReason.prototype.selectionChange = function(brushRegion){
    var vis = this;
    // Filter data based on selection range with areachart's x scale
    vis.filteredData = vis.data.filter(function (value) {
        return (border_years.x(new Date(value.Established)) >= brushRegion[0]) && (border_years.x(new Date(value.Removed)) <= brushRegion[1])
    });

    vis.intervalStart = border_years.x()

    // Update the visualization
    vis.wrangleData();
};