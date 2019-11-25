

// load the data in, including the map
queue()
    .defer(d3.json, "data/Kreise15map.json")
    .defer(d3.csv, "data/variables_clean.csv")
    .defer(d3.csv, "data/east_west.csv")
    .defer(d3.csv, "data/east_west2.csv")
    .await(function(error, mapTopJson, germanData, time_data,time_data2) {
        console.log(time_data)
        console.log(time_data2)

        tobias_map = new TobiasMap("Tobias-map",mapTopJson, germanData)

        tobias_scatter = new TobiasScatter ("Tobias-scatter", germanData)

        tobias_line = new TobiasLine ("Tobias-line", time_data2)



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
    vis.currentMapState = 0;

    vis.firstLoad = true;

    // set up initial data and potential data options
    // Option A
    vis.varX = "East_West, 1990"
    vis.varY = "unemployment rate (%), 2018"

    // hh income looks great;
    // // List of alternative variables
    vis.reserveVars = [
        "household income, 2016",
        // "averae population age, 2017",
        // "unemployment rate (%), 2018",
        // "GDP per employee, 2017",

        // "forecase demand for new housing, 2030",
        // "slots in pension homes (per 100), 2017",
        // "tax revenues, 2015",
        // "total tax earnings per capita, 2017",
        // "long term unemployment rate, 2018",
        // "rate of long time unemployment, 2018",
        // "pre tax earnings, 2017",
        // "household income, 2016",
        // "retirees recieving social security recipients (indicator of poverty in old age), 2017",
        "avg contribution based pension payout, 2015",
        "people in vocational training per 1.000 employed, 2015",
        "averae population age, 2017",
        "household income, 2016",
    ]

    vis.reserveTitles = [
        "Household income, 2016",
        "Average pension payouts, 2015",
        "Vocational training per 1.000  employees, 2015",
        "Average population age, 2017",
        "(former) East and West Germany, county level, 2018"
    ]

   this.wrangleData()

}


TobiasMap.prototype.wrangleData = function() {
    var vis = this;
    // console.log(vis.varY)

    // convert points into numbers
    vis.data.forEach(function(d,i){
        // console.log(d[vis.varY])
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

    // console.log(vis.currentMapState)
    // console.log(vis.varY)

    // console.log(vis.colorScale.domain())
    // console.log(vis.Germany)
    // console.log(vis.varY)
    // console.log(vis.currentState)
    // render a map of Germany using the path generator
    if (vis.firstLoad == true){
    vis.title = vis.svg.append("text")
        .attr("x", vis.width /2)
        .attr("id", "Tobias-map-subhead")
        .style("text-anchor", "middle")
        .attr("y", 20)
        .text("(former) East and West Germany, county level, 2018")
        .attr("fill", "black")


    vis.map = vis.svg.selectAll("path")
        .data(vis.Germany)
        .enter().append("path")
        .attr("d", vis.path)
        .attr("class", "tobias-map-element")
        .attr("id", function(d,i){return "map_"+ (d.properties.Kennziffer)})
        .attr("fill", function(d,i){
            if(d.properties[vis.varX] == 1){
                return "grey"
            }
            else if(d.properties[vis.varX] == 2){
                return "blue"
            }
            else{return "orange"}
        })
        .on("mouseover", function(d,i){
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = "black";
            // console.log(document.getElementById(('scatter_'+ d.properties.Kennziffer)))
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).setAttribute("r", 7)
        })
        .on("mouseout", function(d,i){
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = "";
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).setAttribute("r", 5)
        })
    }

    if(vis.currentMapState == 0){

        vis.svg.selectAll("path")
            .data(vis.Germany)
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
    else{
        vis.svg.selectAll("path")
            .data(vis.Germany)
            .attr("fill", function(d,i){
            return vis.colorScale(d.properties[vis.varY])
        })
    }

    vis.firstLoad = false;



}





/// object for scatter plot
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

    // console.log(vis.data)

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

// create object for line chart
TobiasLine = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.initVis()
}

TobiasLine.prototype.initVis = function() {
    var vis = this;

    // --> CREATE SVG DRAWING AREA
    vis.margin = {top: 30, right: 90, bottom: 50, left: 30}
    vis.width = 500 - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    vis.x = d3.scaleLinear().range([0, vis.width]);
    vis.y = d3.scaleLinear().range([vis.height, 0]);

    // define the clip path
    // Add the clip path.
    vis.svg.append("clipPath")
        .attr("id", "Tobias-line-clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height)
        // .attr("transform", "translate(" + vis.margin.left + ", 0)");

    // Add the X Axis
    vis.xAxis = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.height + ")")

    // Add the Y Axis
    vis.yAxis = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + ", 0)")



    // calcualte the domain in wrangle data
    vis.potentialLineVars = [
        "Arbeitslosenquote",
        "Bruttowertschöpfung",
        "Bruttoinlandsprodukt je Einwohner",
        "Altersarmut",
        "Schulabbrecherquote",
        "Langzeitarbeitslosenquote",
        "Bruttoverdienst",
        "Haushaltseinkommen",
        // "Ausbildungsplätze",
        "Empfänger von Grundsicherung im Alter (Altersarmut)"]


    vis.titleVars = [
        "Unemployment rate",
        "Gross value added",
        "GDP per capita",
        "Poverty in old age",
        "School dropout rate",
        "Long-term unemployment rate",
        "Gross earnings",
        "Average household income",
        "Share of retired population on benefits"
    ]

    vis.lineVar = vis.potentialLineVars[0]
    vis.currentState = 1;
    vis.firstLoad = true;

    this.wrangleData()
}

TobiasLine.prototype.wrangleData = function(){
    var vis = this;


    vis.displayData = [];

    // console.log(vis.data)
    console.log(vis.lineVar)
    vis.data.forEach(function(d,i){

        console.log(vis.data[i])

        if (d.Aggregat == vis.lineVar) {
        if(d.Raumeinheit == "West")
        {
            vis.displayData[0] = vis.data[i]
        }
        else if(d.Raumeinheit == "Ost"){
            vis.displayData[1] = vis.data[i]
        }
        else {
            vis.displayData[2] = vis.data[i]
        }
        }
    })
    vis.mins = []
    vis.maxs = []

    console.log(vis.displayData)

    vis.displayData.forEach(function(d,i){
        vis.temporary_data = []
        vis.temporary_range = []
        vis.temporary_combined = []

        Object.entries(d).forEach(function(def,index){

            if(def[1] == "no data"){
                delete vis.displayData[i][def[0]]
            }
            if(def[0] != "Kennziffer" && def[0] != "Raumeinheit" && def[0] != "Aggregat" && def[1] != "no data" && isNaN(def[1]) != true){
                vis.displayData[i][def[0]] = +def[1]
                vis.temporary_data.push(+def[1])
                vis.temporary_range.push(+def[0])
                vis.temporary_combined.push({"date": +def[0], "data": +def[1]})
            }
        })
        vis.displayData[i]["combined"] = [];
        vis.displayData[i]["data"] = []
        vis.displayData[i]["range"] = []
        vis.displayData[i]["data"] = vis.temporary_data
        vis.displayData[i]["range"] = vis.temporary_range
        vis.displayData[i]["combined"] = vis.temporary_combined

        vis.mins.push(d3.min(vis.displayData[i]["data"]))
        vis.maxs.push(d3.max(vis.displayData[i]["data"]))

        // console.log(vis.displayData)
    })

    // caluclate minimum and maximum
    vis.min = d3.min(vis.mins)
    vis.max = d3.max(vis.maxs)

    this.updateVis()}
    // Compute the minimum and maximum date, and the maximum walls.

TobiasLine.prototype.updateVis = function(){
    var vis = this;

    // console.log(vis.displayData)
    // console.log(vis.displayData)
    // console.log([vis.displayData[0]["range"][0],vis.displayData[0]["range"][vis.displayData[0]["range"].length-1]])

    // update domains
    vis.y.domain([vis.min, vis.max]);
    vis.x.domain([vis.displayData[0]["range"][0],vis.displayData[0]["range"][vis.displayData[0]["range"].length-1]])
        .nice()

    // define the line, helper function
    vis.line = d3.line()
        .curve(d3.curveMonotoneX)
        .x(function(d) {
            // console.log(d.date)
            return vis.x(d.date); })
        .y(function(d) {
            // console.log(d.data)
            return vis.y(d.data); });

    // draw the line for West Germany


    if(vis.firstLoad == true) {
        vis.WestGermany = vis.svg.selectAll('.lineWest')
            .data([vis.displayData[0].combined]);
        vis.WestGermany
            .enter()
            .append('path')
            .attr('class', 'line')
            .attr("fill", "none")
            .attr('class', 'tobias-line')
            .attr('class', 'lineWest')
            .attr('class', 'tobias-line0')
            .attr("transform", "translate(" + vis.margin.left + ", 0)")
            .style('stroke', "green")
            .attr('clip-path', 'url(#Tobias-line-clip)')
            .attr('d', function (d) {
                return vis.line(d);
            })
            .merge(vis.WestGermany)
            .attr('d', function (d) {
                return vis.line(d);
            })
    }

    vis.svg.select(".tobias-line0")
        .data([vis.displayData[0].combined])
        .attr('d', function(d) {
            return vis.line(d);
        })


    vis.WestGermany.exit().remove()



    // draw the line for east Germany
    if(vis.firstLoad == true) {
        vis.EastGermany = vis.svg.selectAll('.lineOst')
            .data([vis.displayData[1].combined]);

        vis.EastGermany
            .enter()
            .append('path')
            .attr("transform", "translate(" + vis.margin.left + ", 0)")
            .attr('class', 'line')
            .attr("fill", "none")
            .attr('class', 'tobias-line')
            .attr('class', 'lineOst')
            .attr('class', 'tobias-line1')
            .style('stroke', "blue")
            .attr('clip-path', 'url(#Tobias-line-clip)')
            .attr('d', function (d) {
                return vis.line(d);
            })
            .merge(vis.EastGermany)
            .attr('d', function (d) {
                return vis.line(d);
            })
    }
    vis.svg.select(".tobias-line1")
        .data([vis.displayData[1].combined])

        .attr('d', function(d) {
            return vis.line(d);
        })

    vis.EastGermany.exit().remove()

    if(vis.firstLoad == true) {
        // draw the line for overall Germany
        vis.Germany = vis.svg.selectAll('.linecombined')
            .data([vis.displayData[2].combined]);
        vis.Germany
            .enter()
            .append('path')
            .attr('class', 'line')
            .attr("fill", "none")
            .attr('class', 'tobias-line')
            .attr('class', 'linecombined')
            .attr('class', 'tobias-line2')
            .style('stroke', "black")
            .attr("transform", "translate(" + vis.margin.left + ", 0)")
            .attr('clip-path', 'url(#Tobias-line-clip)')
            .attr('d', function (d) {
                return vis.line(d);
            })

        // add title:
        vis.svg.append("text")
           .attr("x", vis.width /2)
           .attr("id", "Tobias-line-subhead")
            .style("text-anchor", "middle")
            .attr("y", 20)
            .text(vis.titleVars[0])
            .attr("fill", "black")
    }

    vis.svg.select(".tobias-line2")
        .data([vis.displayData[2].combined])
        .attr('d', function(d) {
            return vis.line(d);
        })



    vis.Germany.exit().remove()

    if(vis.firstLoad == true) {
        /* Add 'curtain' rectangle to hide entire graph */
        vis.curtain = vis.svg.append('rect')
            .attr('x', -1 * (vis.width + vis.margin.left))
            .attr('y', -1 * vis.height)
            .attr('height', vis.height)
            .attr('width', (vis.width))
            .attr('class', 'curtain')
            .attr('transform', 'rotate(180)')
            // .attr("transform", "translate(" + -vis.margin.left + ", 0)")
            .style('fill', '#ffffff');
    }

    // call X axis
    vis.xAxis
        .call(d3.axisBottom(vis.x)
            .tickFormat(d3.format("d")));

    // call y Axis
        vis.yAxis
        .call(d3.axisLeft(vis.y));


    /* Create a shared transition for anything we're animating */
    vis.t = vis.svg.transition()
        .delay(0)
        .duration(2000)
        .ease(d3.easeLinear)
        // .on('end', function() {
        //     d3.select('line.guide')
        //         .transition()
        //         .style('opacity', 0)
        //         .remove()
        // });

    vis.t.select('rect.curtain')
        .attr('width', 0);


    vis.firstLoad = false;
}


function updateMap(){

    // update the map
    // #TODO: fix on hover in css for both scatter plot and map
    // #TODO: add legend for map and line charts

    console.log("click")
    $("#Tobias-map-subhead").text(tobias_map.reserveTitles[tobias_map.currentMapState]);
    // $("#Tobias-map-subhead").style.fill = "red";


    tobias_map.varY = tobias_map.reserveVars[tobias_map.currentMapState]

    if(tobias_map.currentMapState <(tobias_map.reserveVars.length-1))
    {tobias_map.currentMapState +=1}
    else{tobias_map.currentMapState=0}
    tobias_map.wrangleData()

}

function updateLineChart () {


    // // update the line chart, choose next variable
    // console.log(tobias_line.lineVar)
    // console.log(tobias_line.potentialLineVars[tobias_line.currentState])
    tobias_line.lineVar = tobias_line.potentialLineVars[tobias_line.currentState]
    $("#Tobias-line-subhead").text(tobias_line.titleVars[tobias_line.currentState]);


    // reset the curtain
    // tobias_line.t.select('rect.curtain').transition();
    // tobias_line.t.duration(0)
    tobias_line.svg.select('rect.curtain').interrupt()
    tobias_line.svg.select('rect.curtain')
        .attr('width', (tobias_line.width))

    // update data in chart
    tobias_line.wrangleData()
    // console.log(tobias_line.currentState)
    //...set state to next variable
    if(tobias_line.currentState <(tobias_line.potentialLineVars.length-1))
    {tobias_line.currentState +=1}
    else{tobias_line.currentState=1}

}