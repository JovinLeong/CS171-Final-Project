// import data
d3.queue()
    .defer(d3.csv, "data/aggregate_data.csv")
    .await(function(error, borderData) {
        border_reasons = new borderReason("border_reasons",borderData)
    });

// This is just copied over from the template
var donut = donutChart()
    .width(960)
    .height(500)
    .cornerRadius(3) // sets how rounded the corners are on each slice
    .padAngle(0.015) // effectively dictates the gap between slices
    .variable('Probability')
    .category('Species');



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
        vis.radius = Math.min(vis.width, vis.height)/4;


    // Add an SVG element with the desired dimensions and margin.
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");



    // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    vis.x = d3.scaleLinear()
        .range([0, vis.width/2]);
    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.donutColor = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

    vis.donutChart = d3.pie()
        .sort(null)
        .value(function (d) {
            return (d)
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

    vis.dataDict = {'Illegal immigration': vis.immigrationCount,
                    'Interstate dispute': vis.disputeCount,
                    'Smuggling and Contraband': vis.smuggleCount,
                    'Terrorism and insurgency': vis.terrorCount,
                    'Other': vis.otherCount};

    vis.sortable = [];
    for (vis.item in vis.dataDict) {
        vis.sortable.push([vis.item, vis.dataDict[vis.item]]);
    }

    vis.sortable.sort(function (a,b) {
        return b[1] - a[1];
    });

    vis.dataDictSorted = {};
    vis.sortable.forEach(function (item) {
        vis.dataDictSorted[item[0]]=item[1]
    });

    vis.updateVis()
};

borderReason.prototype.updateVis = function() {
    var vis = this;
    // Update domain
    vis.sortedValues = Object.values(vis.dataDictSorted);
    vis.sortedKeys = Object.keys(vis.dataDictSorted);

    vis.x.domain(d3.extent(vis.sortedValues, function(d) { return  d; }));
    vis.y.domain(vis.sortedKeys.map(function(d) { return  d; }));

    vis.arc = vis.svg.selectAll(".arc")
        .data(vis.donutChart(vis.sortedValues))
        .enter().append("g")
        .attr("class", "arc");

    // I just added another donut on the front page just to test it out - it shows up when inspected but it's not visible somehow????
    d3.select("#donut").append("svg")
        .datum(vis.sortedValues)
        .call(donut);

    // Basically the console log appears and the arc is created but it doesn't really work
    vis.arc.append("path")
        .attr("d", vis.path)
        .attr("fill", function(d) {
            console.log("test path")
            // return vis.donutColor(d)
            return "#fff"
        });

    // This works; just need to add titling later
    vis.barChart = vis.svg.selectAll("rect")
        .data(vis.sortedValues);
    vis.barChart.enter().append("rect")
        .merge(vis.barChart)
        .attr("x", 10)
        .transition()
        .duration(300)
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
        vis.minRange = d3.min([brushRegion[0], brushRegion[1]]);
        vis.maxRange = d3.max([brushRegion[0], brushRegion[1]]);

        return (border_years.x(new Date(value.Established)) >= vis.minRange) && (border_years.x(new Date(value.Removed)) <= vis.maxRange)
    });

    vis.intervalStart = border_years.x();

    // Update the visualization
    vis.wrangleData();
};


function donutChart() {
    var width,
        height,
        margin = {top: 10, right: 10, bottom: 10, left: 10},
        colour = d3.scaleOrdinal(d3.schemeCategory20c), // colour scheme
        variable, // value in data that will dictate proportions on chart
        category, // compare data by
        padAngle, // effectively dictates the gap between slices
        floatFormat = d3.format('.4r'),
        cornerRadius, // sets how rounded the corners are on each slice
        percentFormat = d3.format(',.2%');

    function chart(selection){
        selection.each(function(data) {
            // generate chart

            // ===========================================================================================
            // Set up constructors for making donut. See https://github.com/d3/d3-shape/blob/master/README.md
            var radius = Math.min(width, height) / 2;

            // creates a new pie generator
            var pie = d3.pie()
                .value(function(d) { return floatFormat(d[variable]); })
                .sort(null);

            // contructs and arc generator. This will be used for the donut. The difference between outer and inner
            // radius will dictate the thickness of the donut
            var arc = d3.arc()
                .outerRadius(radius * 0.8)
                .innerRadius(radius * 0.6)
                .cornerRadius(cornerRadius)
                .padAngle(padAngle);

            // this arc is used for aligning the text labels
            var outerArc = d3.arc()
                .outerRadius(radius * 0.9)
                .innerRadius(radius * 0.9);
            // ===========================================================================================

            // ===========================================================================================
            // append the svg object to the selection
            var svg = selection.append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
            // ===========================================================================================

            // ===========================================================================================
            // g elements to keep elements within svg modular
            svg.append('g').attr('class', 'slices');
            svg.append('g').attr('class', 'labelName');
            svg.append('g').attr('class', 'lines');
            // ===========================================================================================

            // ===========================================================================================
            // add and colour the donut slices
            var path = svg.select('.slices')
                .datum(data).selectAll('path')
                .data(pie)
                .enter().append('path')
                .attr('fill', function(d) { return colour(d.data[category]); })
                .attr('d', arc);
            // ===========================================================================================

            // ===========================================================================================
            // add text labels
            var label = svg.select('.labelName').selectAll('text')
                .data(pie)
                .enter().append('text')
                .attr('dy', '.35em')
                .html(function(d) {
                    // add "key: value" for given category. Number inside tspan is bolded in stylesheet.
                    return d.data[category] + ': <tspan>' + percentFormat(d.data[variable]) + '</tspan>';
                })
                .attr('transform', function(d) {

                    // effectively computes the centre of the slice.
                    // see https://github.com/d3/d3-shape/blob/master/README.md#arc_centroid
                    var pos = outerArc.centroid(d);

                    // changes the point to be on left or right depending on where label is.
                    pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                    return 'translate(' + pos + ')';
                })
                .style('text-anchor', function(d) {
                    // if slice centre is on the left, anchor text to start, otherwise anchor to end
                    return (midAngle(d)) < Math.PI ? 'start' : 'end';
                });
            // ===========================================================================================

            // ===========================================================================================
            // add lines connecting labels to slice. A polyline creates straight lines connecting several points
            var polyline = svg.select('.lines')
                .selectAll('polyline')
                .data(pie)
                .enter().append('polyline')
                .attr('points', function(d) {

                    // see label transform function for explanations of these three lines.
                    var pos = outerArc.centroid(d);
                    pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                    return [arc.centroid(d), outerArc.centroid(d), pos]
                });
            // ===========================================================================================

            // ===========================================================================================
            // add tooltip to mouse events on slices and labels
            d3.selectAll('.labelName text, .slices path').call(toolTip);
            // ===========================================================================================

            // ===========================================================================================
            // Functions

            // calculates the angle for the middle of a slice
            function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

            // function that creates and adds the tool tip to a selected element
            function toolTip(selection) {

                // add tooltip (svg circle element) when mouse enters label or slice
                selection.on('mouseenter', function (data) {

                    svg.append('text')
                        .attr('class', 'toolCircle')
                        .attr('dy', -15) // hard-coded. can adjust this to adjust text vertical alignment in tooltip
                        .html(toolTipHTML(data)) // add text to the circle.
                        .style('font-size', '.9em')
                        .style('text-anchor', 'middle'); // centres text in tooltip

                    svg.append('circle')
                        .attr('class', 'toolCircle')
                        .attr('r', radius * 0.55) // radius of tooltip circle
                        .style('fill', colour(data.data[category])) // colour based on category mouse is over
                        .style('fill-opacity', 0.35);

                });

                // remove the tooltip when mouse leaves the slice/label
                selection.on('mouseout', function () {
                    d3.selectAll('.toolCircle').remove();
                });
            }

            // function to create the HTML string for the tool tip. Loops through each key in data object
            // and returns the html string key: value
            function toolTipHTML(data) {

                var tip = '',
                    i   = 0;

                for (var key in data.data) {

                    // if value is a number, format it as a percentage
                    var value = (!isNaN(parseFloat(data.data[key]))) ? percentFormat(data.data[key]) : data.data[key];

                    // leave off 'dy' attr for first tspan so the 'dy' attr on text element works. The 'dy' attr on
                    // tspan effectively imitates a line break.
                    if (i === 0) tip += '<tspan x="0">' + key + ': ' + value + '</tspan>';
                    else tip += '<tspan x="0" dy="1.2em">' + key + ': ' + value + '</tspan>';
                    i++;
                }

                return tip;
            }
            // ===========================================================================================

        });
    }

    // getter and setter functions. See Mike Bostocks post "Towards Reusable Charts" for a tutorial on how this works.
    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return chart;
    };

    chart.radius = function(value) {
        if (!arguments.length) return radius;
        radius = value;
        return chart;
    };

    chart.padAngle = function(value) {
        if (!arguments.length) return padAngle;
        padAngle = value;
        return chart;
    };

    chart.cornerRadius = function(value) {
        if (!arguments.length) return cornerRadius;
        cornerRadius = value;
        return chart;
    };

    chart.colour = function(value) {
        if (!arguments.length) return colour;
        colour = value;
        return chart;
    };

    chart.variable = function(value) {
        if (!arguments.length) return variable;
        variable = value;
        return chart;
    };

    chart.category = function(value) {
        if (!arguments.length) return category;
        category = value;
        return chart;
    };

    return chart;
}