// import data
queue()
    .defer(d3.json, "data/Kreise15map.json")
    .defer(d3.csv, "data/variables_clean.csv")
    .defer(d3.csv, "data/east_west2.csv")
    .await(function(error, mapTopJson, germanData, time_data) {

        radar_chart = new radarChart("radarChart", time_data);

    })

d3.queue()
    .defer(d3.csv, "data/aggregate_data.csv")
    .await(function(error, borderData) {
        // radar_chart = new radarChart("border_reasons2",borderData)
    });

// add border years visualizations
radarChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.initVis()
};

radarChart.prototype.initVis = function() {
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

    vis.wrangleData();
};

radarChart.prototype.wrangleData = function () {
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

radarChart.prototype.updateVis = function() {
    var vis = this;
    // Update domain
    vis.sortedValues = Object.values(vis.dataDictSorted);
    vis.sortedKeys = Object.keys(vis.dataDictSorted);

    vis.x.domain([0, d3.max(vis.sortedValues)]);
    vis.y.domain(vis.sortedKeys.map(function(d) { return  d; }));
    vis.labels = vis.svg.selectAll('text.label')
        .data(vis.sortedKeys);

    vis.labels
        .enter()
        .append('text')
        .attr('class', 'label')
        .merge(vis.labels)
        .text(function(d) {
            // console.log("label test",d);
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
            // console.log("what is the sum function", d)
            return vis.x(d);
        })
        .style("fill", "#ffffff")
        .attr("class", "bar-element");

    vis.barChart.exit().remove();
};

radarChart.prototype.selectionChange = function(brushRegion){
    var vis = this;
    // Filter data based on selection range with areachart's x scale
    vis.filteredData = vis.data.filter(function (value) {
        vis.minRange = border_years.x.invert(d3.min([brushRegion[0], brushRegion[1]]));
        vis.maxRange = border_years.x.invert(d3.max([brushRegion[0], brushRegion[1]]));

        console.log(brushRegion)

        // console.log(((new Date(value.Established).getFullYear()) <= vis.maxRange) && ((new Date(value.Established).getFullYear()) <= vis.minRange) && ((new Date(value.Removed).getFullYear()) >= vis.minRange))
        // return (value.Established <= vis.maxRange) && (value.Removed >= vis.minRange)
    });

    // Update the visualization
    vis.wrangleData();
};





















//////////////////////////////////////////////////////////////
//////////////////////// Set-Up //////////////////////////////
//////////////////////////////////////////////////////////////
var margin = {top: 100, right: 100, bottom: 100, left: 100},
    width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
    height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

//////////////////////////////////////////////////////////////
////////////////////////// Data //////////////////////////////
//////////////////////////////////////////////////////////////
var data = [
    [//iPhone
        {axis:"This should be where the split is",value:0.22},
        {axis:"Percentage with college education",value:0.28},
        {axis:"Average life expectancy",value:0.29},
        {axis:"Unemployment rate",value:0.17},
        {axis:"Placeholder",value:0.22},
        {axis:"Unemployment rate",value:0.02},
        {axis:"Average life expectancy",value:0.21},
        {axis:"Percentage with college education",value:0.50}
    ],[//Samsung
        {axis:"Battery Life",value:0.27},
        {axis:"Brand",value:0.16},
        {axis:"Contract Cost",value:0.35},
        {axis:"Design And Quality",value:0.13},
        {axis:"Have Internet Connectivity",value:0.20},
        {axis:"Large Screen",value:0.13},
        {axis:"Price Of Device",value:0.35},
        {axis:"To Be A Smartphone",value:0.38}
    ],[//Nokia Smartphone
        {axis:"Battery Life",value:0.26},
        {axis:"Brand",value:0.10},
        {axis:"Contract Cost",value:0.30},
        {axis:"Design And Quality",value:0.14},
        {axis:"Have Internet Connectivity",value:0.22},
        {axis:"Large Screen",value:0.04},
        {axis:"Price Of Device",value:0.41},
        {axis:"To Be A Smartphone",value:0.30}
    ]
];
//////////////////////////////////////////////////////////////
//////////////////// Draw the Chart //////////////////////////
//////////////////////////////////////////////////////////////
var color = d3.scaleOrdinal()
    .range(["#EDC951","#CC333F","#00A0B0"]);

var radarChartOptions = {
    w: width,
    h: height,
    margin: margin,
    maxValue: 0.5,
    levels: 5,
    roundStrokes: true,
    color: color
};
//Call function to draw the Radar chart
RadarChart(".radarChart", data, radarChartOptions);

/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////

function RadarChart(id, data, options) {
    var cfg = {
        w: 600,				//Width of the circle
        h: 600,				//Height of the circle
        margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
        levels: 3,				//How many levels or inner circles should there be drawn
        maxValue: 0, 			//What is the value that the biggest circle will represent
        labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, 	//The opacity of the area of the blob
        dotRadius: 4, 			//The size of the colored circles of each blog
        opacityCircles: 0.1, 	//The opacity of the circles of each blob
        strokeWidth: 2, 		//The width of the stroke around each blob
        roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
        color: d3.scaleOrdinal(d3.schemeCategory10)	//Color function
    };

    //Put all of the options into a variable called cfg
    if('undefined' !== typeof options){
        for(var i in options){
            if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
        }//for i
    }//if

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));

    var allAxis = (data[0].map(function(i, j){return i.axis})),	//Names of each axis
        total = allAxis.length,					//The number of different axes
        radius = Math.min(cfg.w/2, cfg.h/2), 	//Radius of the outermost circle
        Format = d3.format('%'),			 	//Percentage formatting
        angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

    //Scale for the radius
    var rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////

    //Remove whatever chart with the same id/class was present before
    d3.select(id).select("svg").remove();

    //Initiate the radar chart SVG
    var svg = d3.select(id).append("svg")
        .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar"+id);
    //Append a g element
    var g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

    /////////////////////////////////////////////////////////
    ////////// Glow filter for some extra pizzazz ///////////
    /////////////////////////////////////////////////////////

    //Filter for the outside glow
    var filter = g.append('defs').append('filter').attr('id','glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    //Wrapper for the grid & axes
    var axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1,(cfg.levels+1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", function(d, i){return radius/cfg.levels*d;})
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter" , "url(#glow)");

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1,(cfg.levels+1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", function(d){return -d*radius/cfg.levels;})
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(function(d,i) { return Format(maxValue * d/cfg.levels); });

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

    //Create the straight lines radiating outward from the center
    var axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
        .text(function(d){return d})
        .call(wrap, cfg.wrapWidth);

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    var radarLine = d3.radialLine()
        // .interpolate("linear-closed")
        .curve(d3.curveLinearClosed)
        .radius(function(d) { return rScale(d.value); })
        .angle(function(d,i) {	return i*angleSlice; });

    //Create a wrapper for the blobs
    var blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    //Append the backgrounds
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("fill", function(d,i) { return cfg.color(i); })
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function (d,i){
            //Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            //Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', function(){
            //Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

    //Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", function(d,i) { return cfg.color(i); })
        .style("fill", "none")
        .style("filter" , "url(#glow)");

    //Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data(function(d,i) { return d; })
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", function(d,i,j) { return cfg.color(j); })
        .style("fill-opacity", 0.8);

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////

    //Wrapper for the invisible circles on top
    var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(function(d,i) { return d; })
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius*1.5)
        .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(d,i) {
            newX =  parseFloat(d3.select(this).attr('cx')) - 10;
            newY =  parseFloat(d3.select(this).attr('cy')) - 10;

            tooltip
                .attr('x', newX)
                .attr('y', newY)
                .text(Format(d.value))
                .transition().duration(200)
                .style('opacity', 1);
        })
        .on("mouseout", function(){
            tooltip.transition().duration(200)
                .style("opacity", 0);
        });

    //Set up the small tooltip for when you hover over a circle
    var tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

    /////////////////////////////////////////////////////////
    /////////////////// Helper Function /////////////////////
    /////////////////////////////////////////////////////////

    //Taken from http://bl.ocks.org/mbostock/7555321
    //Wraps SVG text
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }//wrap

}//RadarChart