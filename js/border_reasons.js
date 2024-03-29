// import data
d3.queue()
    .defer(d3.csv, "data/aggregate_data.csv")
    .await(function(error, borderData) {
        border_reasons = new borderReason("border_reasons2",borderData)
    });

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
        vis.margin = {top: 20, right: 30, bottom: 30, left: 145};
        vis.width = 500 - vis.margin.left - vis.margin.right;
        vis.height = 500 - vis.margin.top - vis.margin.bottom;
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
        .range([0, vis.width]);
    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.wrangleData();
};

borderReason.prototype.wrangleData = function () {
    var vis = this;

    vis.immigrationCount = 0;
    vis.disputeCount = 0;
    vis.smuggleCount = 0;
    vis.terrorCount = 0;
    vis.otherCount = 0;

    // console.log('test filter', vis.filteredData)

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
                    'Smuggling & Contraband': vis.smuggleCount,
                    'Terrorism & insurgency': vis.terrorCount,
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

    vis.x.domain([0, d3.max(vis.sortedValues)]);
    vis.y.domain(vis.sortedKeys.map(function(d) { return  d; }));
    vis.labels = vis.svg.selectAll('text.label')
        .data(vis.sortedKeys);

    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function (d) {
            return "<br>Quantity: " + d;
        });

    vis.svg.call(vis.tip);

    vis.labels
        .enter()
        .append('text')
        .attr('class', 'label')
        .merge(vis.labels)
        .text(function(d) {
           return "" + d
        })
        .transition()
        .duration(400)
        .attr('y', function (d, i) {
            return i * 30 + 8
        })
        .attr('x', 0)
        // .attr('x',)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('fill', '#fff');


    // This works; just need to add titling later
    vis.barChart = vis.svg.selectAll("rect.bar-element")
        .data(vis.sortedValues);
    vis.barChart.enter().append("rect")
        .merge(vis.barChart)
        .attr("x", 10)
        .attr("y", function(d, i){ return i*30})
        .attr("height", 10)
        .attr("width", function(d){
            return vis.x(d);
        })
        .style("fill", "#ffffff")
        .attr("class", "bar-element")
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);

    vis.barChart.exit().remove();
};

borderReason.prototype.selectionChange = function(brushRegion){
    var vis = this;
    // Filter data based on selection range with areachart's x scale
    vis.filteredData = vis.data.filter(function (value) {
        vis.minRange = border_years.x.invert(d3.min([brushRegion[0], brushRegion[1]]));
        vis.maxRange = border_years.x.invert(d3.max([brushRegion[0], brushRegion[1]]));
        return (value.Established <= vis.maxRange) && (value.Removed >= vis.minRange)
    });

    // Update the visualization
    vis.wrangleData();
};
