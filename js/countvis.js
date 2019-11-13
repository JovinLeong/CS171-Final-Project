
/*
 * CountVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

CountVis = function(_parentElement, _data, _eventHandler ){
	this.parentElement = _parentElement;
	this.data = _data;
    this.eventHandler = _eventHandler;

	this.initVis();
};


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

CountVis.prototype.initVis = function(){
	var vis = this;

	vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

	vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
	vis.height = 300 - vis.margin.top - vis.margin.bottom,
	vis.h = 45,
	vis.rh = 30;

	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
		.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");



	// SVG clipping path
	vis.svg.append("defs")
		.append("clipPath")
		.attr("id","clip")
		.append("rect")
		.attr("width", vis.width)
		.attr("height", vis.height);


    // Scales and axes
    vis.x = d3.scaleTime()
        .range([0, vis.width]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y)
        .ticks(6);

	// Set domains
	var minMaxY= [0, d3.max(vis.data.map(function(d){ return d.count; }))];
	vis.y.domain(minMaxY);

	var minMaxX = d3.extent(vis.data.map(function(d){ return d.time; }));
	vis.x.domain(minMaxX);

	vis.formatTime = d3.timeFormat("%Y-%m-%d");
	var minDate = vis.formatTime(minMaxX[0]);
	var maxDate = vis.formatTime(minMaxX[1]);


	vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

	vis.svg.append("g")
			.attr("class", "y-axis axis");

	// Axis title
	vis.svg.append("text")
			.attr("x", -50)
			.attr("y", -8)
			.text("Votes");

	// Append a path for the area function, so that it is later behind the brush overlay
	vis.timePath = vis.svg.append("path")
			.attr("class", "area area-time");

    // Define the D3 path generator
    vis.area = d3.area()
        .curve(d3.curveStep)
        .x(function(d) {
            return vis.x(d.time);
        })
        .y0(vis.height)
        .y1(function(d) { return vis.y(d.count); });


	// Initialize brushing component
	vis.currentBrushRegion = null;

	vis.brush = d3.brushX()
		.extent([[0,0], [vis.width, vis.height]])
		.on("brush", function () {
			vis.currentBrushRegion = d3.event.selection;
			vis.currentBrushRegion = vis.currentBrushRegion.map(vis.x.invert);
			$(vis.eventHandler).trigger("selectionChanged", vis.currentBrushRegion)
		});


	// Append brush component here
	vis.brushGroup = vis.svg.append("g")
		.attr("class", "my-brush")
		.call(vis.brush);

	// Add zoom component

	// save original scale
	vis.xOrig = vis.x;
	//
	vis.zoomFunction = function() {
		vis.x = d3.event.transform.rescaleX(vis.xOrig);
		if(vis.currentBrushRegion) {
			vis.brushGroup.call(vis.brush.move, vis.currentBrushRegion.map(vis.x));
		}
		vis.updateVis();
	};


	vis.zoom = d3.zoom()
			.on("zoom", vis.zoomFunction)
			.scaleExtent([1,20]);

	vis.brushGroup = vis.svg.select(".my-brush");

	// disable mousedown and drag in zoom, when you activate zoom (by .call);
	vis.brushGroup.call(vis.zoom)
		.on("mousedown.zoom", null)
		.on("touchstart.zoom", null);

	vis.period = d3.select(".period-range").append("svg")
		.attr("width", 400)
		.attr("height", 50)
		.append("g")
		.attr("transform", "translate(" + vis.margin.left + "," + 0 + ")");


	vis.period.append("rect")
		.attr("x", 15)
		.attr("y", vis.rh)
		.attr("class", "period")
		.attr("height", 20)
		.attr("width", 80)
		.attr("fill", "#DCDCDC");

	vis.period.append("rect")
		.attr("x", 115)
		.attr("y", vis.rh)
		.attr("class", "period")
		.attr("height", 20)
		.attr("width", 80)
		.attr("fill", "#DCDCDC");

	vis.period.append("text")
		.attr("x", 15)
		.attr("y", 20)
		.attr("class", "titling")
		.attr("text-anchor", "start")
		.text("Period selected:");

	vis.period.append("text")
		.attr("x", 20)
		.attr("y", vis.h)
		.attr("class", "starter")
		.attr("text-anchor", "start")
		.text(minDate);

	vis.period.append("text")
		.attr("x", 120)
		.attr("y", vis.h)
		.attr("class", "ender")
		.text(maxDate);
	vis.period.append("text")
		.attr("x", 100)
		.attr("class", "period")
		.attr("y", vis.h)
		.text("—");


	// (Filter, aggregate, modify data)
	vis.wrangleData();
};



/*
 * Data wrangling
 */

CountVis.prototype.wrangleData = function(){
	var vis = this;

	this.displayData = this.data;

	// Update the visualization
	vis.updateVis();
};



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

CountVis.prototype.updateVis = function(){
	var vis = this;

	// Call brush component here
	vis.brushGroup.call(vis.brush).attr("clip-path", "url(#clip)");

	// Call the area function and update the path
	// D3 uses each data point and passes it to the area function.
	// The area function translates the data into positions on the path in the SVG.
	vis.timePath
			.datum(vis.displayData)
			.attr("d", vis.area)
        .attr("clip-path", "url(#clip)");

	// vis.period.selectAll(".period").remove();



	// Call axis functions with the new domain 
	vis.svg.select(".x-axis").call(vis.xAxis.scale(vis.x));
	vis.svg.select(".y-axis").call(vis.yAxis);
};

CountVis.prototype.onSelectionChange = function(selectionStart, selectionEnd){
	var vis = this;


	// Filter original unfiltered data depending on selected time period (brush)
	vis.filteredData = vis.data.filter(function(d){
		return d.time >= selectionStart && d.time <= selectionEnd;
	});

	vis.period.select(".starter").remove();
	vis.period.select(".ender").remove();

	vis.period.append("text")
		.attr("x", 20)
		.attr("y", vis.h)
		.attr("class", "starter")
		.attr("text-anchor", "start")
		.text(vis.formatTime(selectionStart));

	vis.period.append("text")
		.attr("x", 120)
		.attr("y", vis.h)
		.attr("class", "ender")
		.text(vis.formatTime(selectionEnd));




	vis.wrangleData();
};