

// load the data in, including the map
queue()
    .defer(d3.json, "data/Kreise15map.json")
    .defer(d3.csv, "data/variables_clean.csv")
    .await(function(error, mapTopJson, germanData) {
        var tobias_map = new TobiasMap("Tobias-map",mapTopJson, germanData)

        var tobias_scatter = new TobiasScatter ("Tobias-scatter", germanData)


    })



/// object for map
TobiasMap = function(_parentElement, _map, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.map = _map;
    this.eventHandler = _eventHandler;
    this.initVis()
}

TobiasMap.prototype.initVis = function(){
    var vis = this;

    // --> CREATE SVG DRAWING AREA
    vis.margin = {top: 30, right: 90, bottom: 50, left: 30}
    vis.width = 500 - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // define projection
    vis.projection = d3.geoMercator()
        .scale(2000)
        .center([10.3736325636218, 51.053178814923065])
        .translate([200, 250]);

    vis.path = d3.geoPath()
        .projection(vis.projection);

    // colors for map:
    vis.colors = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];

    // scale
    vis.colorScale = d3.scaleQuantize()
    // .domain(extent["UN_population"])
        .range(vis.colors);

    // Convert TopoJSON to GeoJSON (target object = 'collection')
    vis.Germany = topojson.feature(vis.map, vis.map.objects.Kreise15map).features

   this.wrangleData()

}


TobiasMap.prototype.wrangleData = function() {
    var vis = this;

    // Option A
    vis.varX = "East_West, 1990"
    vis.varY = "unemployment rate (%), 2018"

    // // Option B
    // vis.varY = "GDP per employee, 2017"
    // vis.varX = "household income, 2016"


    // convert points into numbers
    vis.data.forEach(function(d,i){
        vis.data[i][vis.varY] = +d[vis.varY]
        vis.data[i][vis.varX] = +d[vis.varX]
        // vis.data[i][vis.varZ] = +d[vis.varZ]
    })

    // calculate extents
    vis.minMaxX = d3.extent(vis.data.map(function(d){ return d[vis.varX] }));
    vis.minMaxY= d3.extent(vis.data.map(function(d){ return d[vis.varY]; }));

    // inject data into json map object
    vis.Germany.forEach(function(d,i){

        vis.data.forEach(function(data, index){
            // console.log(data)
            if (data.ID == d.properties.Kennziffer)
            {
                vis.Germany[i].properties[vis.varY] = data[vis.varY];
                vis.Germany[i].properties[vis.varX] = data[vis.varX]
            }
        })

    })



    this.updateVis()
}



TobiasMap.prototype.updateVis = function() {
    var vis = this;

    // update the domain
    vis.colorScale.domain(vis.minMaxY)

    console.log(vis.Germany)

    // render a map of Germany using the path generator
    vis.map = vis.svg.selectAll("path")
        .data(vis.Germany)
        .enter().append("path")
        .attr("d", vis.path)
        .attr("id", function(d,i){return "map_"+ (d.properties.Kennziffer)})
        .attr("fill", function(d,i){
            return vis.colorScale(d.properties[vis.varY])
        })
        .on("mouseover", function(d,i){
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = "black";
            console.log(document.getElementById(('scatter_'+ d.properties.Kennziffer)))
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).setAttribute("r", 7)
        })
        .on("mouseout", function(d,i){
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = "";
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).setAttribute("r", 5)

        })
    // East v West
        .attr("fill", function(d,i){
            if(d.properties[vis.varX] == 1){
                return "grey"
            }
            else if(d.properties[vis.varX] == 2){
                return "blue"
            }
                else{return "orange"}
        })

}





/// object for scatter plot

/// object for map
TobiasScatter = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.initVis()
}

// scatter plot
TobiasScatter.prototype.initVis = function(){
    var vis = this;

    // --> CREATE SVG DRAWING AREA
    vis.margin = {top: 30, right: 90, bottom: 50, left: 30}
    vis.width = 500 - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    // scales and axes
    vis.x = d3.scaleLinear()
        .rangeRound([0, vis.width])
        // .domain()

    vis.y = d3.scaleLinear()
        .rangeRound([vis.height,0])
        // .domain();

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");


    this.wrangleData()

    };

TobiasScatter.prototype.wrangleData = function() {
    var vis = this;

    vis.varY = "GDP per employee, 2017"
    vis.varX = "household income, 2016"
    vis.varZ = "East_West, 1990"

    // Option B
    vis.varY = "GDP per employee, 2017"
    vis.varX = "household income, 2016"

    // // Option C
    // vis.varY = "GDP per employee, 2017"
    // vis.varX = "household income, 2016"


    // convert points into numbers
    vis.data.forEach(function(d,i){
        vis.data[i][vis.varY] = +d[vis.varY]
        vis.data[i][vis.varX] = +d[vis.varX]
        vis.data[i][vis.varZ] = +d[vis.varZ]
    })

    // calculate extents
    vis.minMaxY= d3.extent(vis.data.map(function(d){ return d[vis.varY]; }));
    vis.minMaxX = d3.extent(vis.data.map(function(d){ return d[vis.varX] }));

        this.updateVis()
        }



TobiasScatter.prototype.updateVis = function(){
    var vis = this;

    // update the domain
    vis.x.domain(vis.minMaxX);
    vis.y.domain(vis.minMaxY);

    console.log(vis.data)

    // update all the bubbles
    vis.svg.selectAll("circle")
        .data(vis.data)
        .enter()
        .append("circle")
        .attr("cx", function(d,i){return vis.x(d[vis.varX])})
        .attr("cy", function(d,i){return vis.y(d[vis.varY])})
        .attr("class", "scatter-circle")
        .attr("r", 5)
        .attr("id", function(d,i){return ("scatter_" + d.ID)})
        .attr("fill", function(d,i){
            if(d[vis.varZ] == 3){
                return "blue"
            }
            else if(d[vis.varZ] == 2){
                return "red"
            }
            else {return "green"}
        })
        .on("mouseover", function(d,i){
            document.getElementById(('map_'+ d.ID)).style.fill = "black";
        })
        .on("mouseout", function(d,i){
            document.getElementById(('map_'+ d.ID)).style.fill = "";
        })



    // Call axis function with the new domain
    vis.svg.select(".y-axis").call(vis.yAxis);
    vis.svg.select(".x-axis").call(vis.xAxis);
}
