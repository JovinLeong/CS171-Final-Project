typeWriterActivated = false;




// load the data in, including the map
d3.queue()
    .defer(d3.json, "data/Kreise15map.json")
    .defer(d3.csv, "data/variables_CLEAN.csv")
    .defer(d3.csv, "data/East_west2.csv")
    .await(function(error, mapTopJson, germanData, time_data) {
        tobias_map = new TobiasMap("Tobias-map",mapTopJson, germanData)
        tobias_scatter = new TobiasScatter ("Tobias-scatter", germanData)
        tobias_line = new TobiasLine ("Tobias-line", time_data)
        tobias_connected_map = new TobiasConnectedMap("Tobias-connected-map",mapTopJson, germanData)
        tobias_connected_scatter = new TobiasScatter("Tobias-connected-scatter", germanData)

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
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .attr("id", vis.parentElement+"0")
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // define projection
    vis.projection = d3.geoMercator()
        .scale(2000)
        .center([10.3736325636218, 51.053178814923065])
        .translate([150, 250]);

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
        "Household Income (€), 2016",
        "Average pension payouts (€), 2015",
        "Vocational Training per 1,000 Employees, 2015",
        "Average Population Age, 2017",
        "(former) East and West Germany, county level, 2018"
    ]

   this.wrangleData();

    // including interactive content rectangle
    vis.svg.append("rect")
        .attr('id', 'map1rect')
        .attr("x", -1000)
        .attr("y", -1000)
        .attr("width", 4000)
        .attr("height", 4000)
        .style("fill", d3.rgb(29,29,29))
        .style('opacity', 0.75)
        .on("mouseover", function () {
            $( "#map1rect" ).fadeOut( "slow", function () {

            });
            $( "#map1text" ).fadeOut( "slow", function () {

            });
        });
    vis.svg.append("text")
        .attr('id', 'map1text')
        .attr("x", vis.width/2 - 25)
        .attr("y", vis.height/2)
        .attr("font-size", "30px")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("Mouseover for info.");

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

    // console.log(vis.Germany)
    // update the domain


    vis.colorScale.domain(vis.minMaxY)
    // console.log(vis.minMaxY)

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
        .attr("id", vis.parentElement +"-subhead")
        .style("text-anchor", "middle")
        .attr("y", 20)
        .text("(former) East and West Germany, county level, 2018")
        .attr("fill", "white")


    vis.map = vis.svg.selectAll("path")
        .data(vis.Germany)
        .enter().append("path")
        .attr("d", vis.path)
        .attr("class", "tobias-map-element")
        .attr("id", function(d,i){return vis.parentElement+ (d.properties.Kennziffer)})
        .attr("fill", function(d,i){
            if(d.properties[vis.varX] == 1){
                return "grey"
            }
            else if(d.properties[vis.varX] == 2){
                return "#1f77b4"
            }
            else{return "#ff7f0e"}
        })
        .on("mouseover", function(d,i){
            this.parentElement.appendChild(this);

            tobias_connected_scatter.svg.select('#scatter_'+d.properties.Kennziffer)
                .transition()
                .duration(350)
                // .attr("fill", "white")
                .attr("r", 12)

            document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = "white"
            //     .transition()
            //     .duration(400)
            // console.log(document.getElementById(('scatter_'+ d.properties.Kennziffer)))

            document.getElementById('tooltip').innerHTML = ("Name: " + d.properties.Name
                + "<br/>"
                + "Population: "
                + ((isNaN(Math.round(d.properties.Einwohner_2017)
                )) ? "no data" : (Math.round(d.properties.Einwohner_2017)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ','))))

                // + "<br/>" + vis.varY + ": " + (Math.round(d.properties[vis.varY])))

                // ((typeof(d.properties.economy) == "string") ? d.properties.economy.substring(3) : "no data")
                // + "<br/>" +
                // ((typeof(d.properties.income_grp) == "string") ? d.properties.income_grp.substring(3) : "no data")


        })

                .on("mouseout", function(d,i){
            tobias_connected_scatter.svg.select('#scatter_'+d.properties.Kennziffer)
                .transition()
                .duration(350)
                .attr("r", 5)

            //
            //
            document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = ""
            //
            // document.getElementById(('scatter_'+ d.properties.Kennziffer)).setAttribute("r", 5)
            // document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.zIndex = "";


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
                return "#1f77b4"
            }
            else{return "#ff7f0e"}
        })

    }
    else{
        vis.svg.selectAll("path")
            .data(vis.Germany)
            .attr("fill", function(d,i){
            return vis.colorScale(d.properties[vis.varY])
        })
            .on("mouseover", function(d,i) {
                this.parentElement.appendChild(this);

                tobias_connected_scatter.svg.select('#scatter_'+d.properties.Kennziffer)
                    .transition()
                    .duration(350)
                    // .attr("fill", "white")
                    .attr("r", 12)

                document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = "white"
                //     .transition()
                //     .duration(400)
                // console.log(document.getElementById(('scatter_'+ d.properties.Kennziffer)))


            document.getElementById('tooltip').innerHTML = ("Name: " + d.properties.Name
                + "<br/>"
                + "Population: "
                + ((isNaN(Math.round(d.properties.Einwohner_2017)
                )) ? "no data" : (Math.round(d.properties.Einwohner_2017)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')))
                + "<br/>" + vis.varY + ": " + (Math.round(d.properties[vis.varY])))
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
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    // scales and axes
    vis.x = d3.scaleLinear()
        .rangeRound([0, vis.width])

    vis.y = d3.scaleLinear()
        .rangeRound([vis.height,0])
        // .domain();

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
    vis.yAxis = d3.axisLeft()
        .scale(vis.y)

    vis.svg.append("g")
        .attr("class", "x-axis axis tobias-axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis tobias-axis");

    vis.firstLoad = true;

    // Option A
    vis.varY = "averae population age, 2017"
    vis.varX = "averae population age, 2017"
    vis.varZ = "East_West, 1990"


    this.wrangleData()

    vis.svg.append("rect")
        .attr('id', 'mapscatter1rect')
        .attr("x", -1000)
        .attr("y", -1000)
        .attr("width", 4000)
        .attr("height", 4000)
        .style("fill", d3.rgb(29,29,29))
        .style('opacity', 0.75)
        .on("mouseover", function () {
            $( "#connectedmap2rect" ).fadeOut( "slow", function () {
            });
            $( "#connectedmap2text" ).fadeOut( "slow", function () {

            });
            $( "#mapscatter1rect" ).fadeOut( "slow", function () {

            });
            $( "#mapscatter1text" ).fadeOut( "slow", function () {

            });
        });
    vis.svg.append("text")
        .attr('id', 'mapscatter1text')
        .attr("x", vis.width/2 - 10)
        .attr("y", vis.height/2)
        .attr("font-size", "30px")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("explore the connected charts.");

    };

TobiasScatter.prototype.wrangleData = function() {
    var vis = this;



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


    // Update the x-domain via button

    // update the y-domain via new variable


    if(vis.firstLoad == true) {

        // update all the bubbles
        vis.svg.selectAll("circle")
            .data(vis.data)
            .enter()
            .append("circle")
            .attr("cx", function (d, i) {
                return vis.x(d[vis.varX])
            })
            .attr("cy", function (d, i) {
                return vis.y(d[vis.varY])
            })
            .attr("class", "scatter-circle")
            .attr("r", 5)
            .attr("id", function (d, i) {
                return ("scatter_" + d.ID)
            })
            .attr("fill", function (d, i) {
                if (d[vis.varZ] == 3) {
                    return "#ff7f0e"
                } else if (d[vis.varZ] == 2) {
                    return "#1f77b4"
                } else {
                    return "grey"
                }
            })
            .style("opacity", .8)
            .on("mouseover", function (d, i) {
                document.getElementById(('Tobias-connected-map' + d.ID)).style.fill = "white";
            })
            .on("mouseout", function (d, i) {
                document.getElementById(('Tobias-connected-map' + d.ID)).style.fill = "";
            })

    }

    vis.svg.selectAll("circle")
        .data(vis.data)
        .transition()
        .duration(1250)
        .attr("cx", function (d, i) {
            return vis.x(d[vis.varX])
        })
        .attr("cy", function (d, i) {
            return vis.y(d[vis.varY])
        })





    // Call axis function with the new domain
    vis.svg.select(".y-axis").call(vis.yAxis);
    vis.svg.select(".x-axis").call(vis.xAxis);

    vis.firstload = false;
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
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

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
        .attr("class", "tobias-axis")

    // Add the Y Axis
    vis.yAxis = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + ", 0)")
        .attr("class", "tobias-axis")



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

    vis.svg.append("rect")
        .attr('id', 'linechart1rect')
        .attr("x", -1000)
        .attr("y", -1000)
        .attr("width", 4000)
        .attr("height", 4000)
        .style("fill", d3.rgb(29,29,29))
        .style('opacity', 0.75)
        .on("mouseover", function () {
            $( "#linechart1rect" ).fadeOut( "slow", function () {

            });
            $( "#linechart1text" ).fadeOut( "slow", function () {

            });
        });
    vis.svg.append("text")
        .attr('id', 'linechart1text')
        .attr("x", vis.width/2)
        .attr("y", vis.height/2)
        .attr("font-size", "30px")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("Brush over the chart.");
}

TobiasLine.prototype.wrangleData = function(){
    var vis = this;


    vis.displayData = [];

    // console.log(vis.data)
    // console.log(vis.lineVar)
    vis.data.forEach(function(d,i){

        // console.log(vis.data[i])

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

    // console.log(vis.displayData)

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

    console.log(vis.displayData)

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
    vis.line = d3.area()
        .x(function(d) {
            // console.log(d.date)
            return vis.x(d.date); })
        .y0(vis.height)
        .y1(function(d) {
            // console.log(d.data)
            return vis.y(d.data); });

    // Similar helper function for brush
    vis.brushRadar = d3.brushX()
        .extent([[0,0], [vis.width, vis.height]])
        .on("brush", brushed_radar);




    // draw the line for West Germany


    if(vis.firstLoad == true) {
        vis.WestGermany = vis.svg.selectAll('.lineWest')
            .data([vis.displayData[0].combined]);
        vis.WestGermany
            .enter()
            .append('path')
            .attr('class', 'line tobias-line lineWest tobias-line0')
            .attr("transform", "translate(" + vis.margin.left + ", 0)")
            .style("fill", "#1f77b4")
            .style('stroke', 'white')
            .style('stroke-width', '1px')
            .style('stroke-opacity', '1')
            .style("opacity", '0.5')
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

    if(vis.firstLoad == true) {
        // draw the line for overall Germany
        vis.Germany = vis.svg.selectAll('.linecombined')
            .data([vis.displayData[2].combined]);
        vis.Germany
            .enter()
            .append('path')
            .attr('class', 'line tobias-line linecombined tobias-line2')
            .style('fill', "#008080")
            .style('opacity', "0.5")
            .style('stroke', 'white')
            .style('stroke-width', '1px')
            .style('stroke-opacity', '1')
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
            .attr("fill", "white")
    }

    vis.svg.select(".tobias-line2")
        .data([vis.displayData[2].combined])
        .attr('d', function(d) {
            return vis.line(d);
        })



    vis.Germany.exit().remove()



    // draw the line for east Germany
    if(vis.firstLoad == true) {
        vis.EastGermany = vis.svg.selectAll('.lineOst')
            .data([vis.displayData[1].combined]);

        vis.EastGermany
            .enter()
            .append('path')
            .attr("transform", "translate(" + vis.margin.left + ", 0)")
            .attr('class', 'line tobias-line tobias-line1 lineOst')
            .style("fill", "red")
            .style('stroke', 'white')
            .style('stroke-width', '1px')
            .style('stroke-opacity', '1')
            .style("opacity", '0.4')
            // .attr('clip-path', 'url(#Tobias-line-clip)')
            .attr('d', function (d) {
                return vis.line(d);
            })
            .merge(vis.EastGermany)
        // .attr('d', function (d) {
        //     return vis.line(d);
        // })

        // Draw brush
        vis.svg.append("g")
            .attr("transform", "translate(" + vis.margin.left + ", 0)")
            .attr("class", "x brushRadar")
            .select("rect")
            .attr("y", -6)
            .attr("height", vis.height + 7);

    }
    vis.svg.select(".tobias-line1")
        .data([vis.displayData[1].combined])

        .attr('d', function(d) {
            return vis.line(d);
        })

    vis.EastGermany.exit().remove();




    // if(vis.firstLoad == true) {
    //     /* Add 'curtain' rectangle to hide entire graph */
    //     vis.curtain = vis.svg.append('rect')
    //         .attr('x', -1 * (vis.width + vis.margin.left))
    //         .attr('y', -1 * vis.height)
    //         .attr('height', vis.height)
    //         .attr('width', (vis.width))
    //         .attr('class', 'curtain')
    //         .attr("id", "tobias-curtain")
    //         .attr('transform', 'rotate(180)')
    //         // .attr("transform", "translate(" + -vis.margin.left + ", 0)")
    // }

    // call X axis
    vis.xAxis
        .call(d3.axisBottom(vis.x)
            .tickFormat(d3.format("d"))
            .ticks(5)
        )
    ;

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


    // update the brush
    vis.svg.select(".brushRadar")
        .call(vis.brushRadar)
        .select("rect")
        .attr("y", -6)
        .attr("height", vis.height + 7);


    vis.firstLoad = false;
}




// update the map
function updateMap(){

    if (typeWriterActivated == false) {

        $('#Tobias-first-button').fadeToggle(1000)

        // variables for the dynamic text
        // var i = 0;
        // var speed = 1500;
        var dynamic_text = [`Looking at household income, the German map can still be traced, over 30 years after the wall.
        in spite of numerous attempts to close the wealth gap, the East is still significantly worse off than the West
         as can be seen on the map on the left hand side`,
            `... but this is no exception. Differences between East and West are similarly stark when looking at average
        pension payouts...`,
            `... the number of vocational trainings received per 1.000 employees...`,
            `...or the average population age.`,
            `Almost no matter which indicator one is looking at, 30 years after the fall of the wall, the border can still be drawn.    
         Swipe down to explore how different dimensions of life between former East and West Germany remain defined by the now fallen wall...`]

        var i = 0;
    var txt = dynamic_text[tobias_map.currentMapState]
    var speed = 10  ;
    document.getElementById("Tobias-dynamic-text1").innerHTML = "";

    function typeWriter() {
        typeWriterActivated = true;
        if (i < txt.length) {
            document.getElementById("Tobias-dynamic-text1").innerHTML += txt.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            typeWriterActivated = false;
            $('#Tobias-first-button').fadeToggle(1000)
        }
    }

    typeWriter();

    // update the map
    $("#Tobias-map-subhead").text(tobias_map.reserveTitles[tobias_map.currentMapState]);
    tobias_map.varY = tobias_map.reserveVars[tobias_map.currentMapState]

    // adjust text with type writer effect:
    // document.getElementById("Tobias-dynamic-text1").innerHTML = dynamic_text[tobias_map.currentMapState]
    // var txt = dynamic_text[tobias_map.currentMapState];
    // var length = txt.length
    // document.getElementById("Tobias-dynamic-text1").innerHTML = " ";

        if (tobias_map.currentMapState < (tobias_map.reserveVars.length - 1)) {
            tobias_map.currentMapState += 1
        } else {
            tobias_map.currentMapState = 0
        }
        tobias_map.wrangleData()

        // console.log(tobias_map.currentMapState)
        if (tobias_map.currentMapState == 0) {
        document.getElementById("Tobias-first-button").innerText = "start again"
        } else {
        document.getElementById("Tobias-first-button").innerText = "learn more"
        }
    }
else{}
}

function updateConnectedMap(){
    $("#Tobias-connected-map-subhead").text(tobias_connected_map.reserveTitles[tobias_connected_map.currentMapState]);
    // $("#Tobias-map-subhead").style.fill = "red";


    tobias_connected_map.varY = tobias_connected_map.reserveVars[tobias_connected_map.currentMapState]

    if(tobias_connected_map.currentMapState <(tobias_connected_map.reserveVars.length-1))
    {tobias_connected_map.currentMapState +=1}
    else{tobias_connected_map.currentMapState=0}
    tobias_connected_map.wrangleData()

    // and now inject the chosen variables into the scatter plot
    tobias_connected_scatter.varY = tobias_connected_map.varY
    tobias_connected_scatter.wrangleData()

}




function updateLineChart () {

    // // update the line chart, choose next variable
    // console.log(tobias_line.lineVar)

    // console.log('line var', tobias_line.currentState)
    tobias_line.lineVar = tobias_line.potentialLineVars[tobias_line.currentState]
    console.log(tobias_line.potentialLineVars[tobias_line.currentState])
    $("#Tobias-line-subhead").text(tobias_line.titleVars[tobias_line.currentState]);

    var dynamic_text = [`What makes the case of the German border so fascinating is not only the way it came
    down after 30 years, but also how much has stayed the same, and how many indicators, while moving in 
    tandem, have now really made the East and the West move closer together...`,
    `be it ....`, `or ....`, `or this indicator....`];
    // update dynamic text:
    var i = 0;
    var txt = dynamic_text[tobias_line.currentState];
    // console.log(txt)
    var speed = 40;
    document.getElementById("Tobias-dynamic-text2").innerHTML = "";

        function typeWriter() {
            if (i < txt.length) {
                document.getElementById("Tobias-dynamic-text2").innerHTML += txt.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        }


        typeWriter();

    // reset the curtain
    // tobias_line.t.select('rect.curtain').transition();
    // tobias_line.t.duration(0)
    tobias_line.svg.select('rect.curtain').interrupt()
    tobias_line.svg.select('rect.curtain')
        .attr('width', (tobias_line.width))
        .attr("fill", "#1D1D1D")

    // update data in chart
    tobias_line.wrangleData()
    // console.log(tobias_line.currentState)
    //...set state to next variable
    if(tobias_line.currentState <(tobias_line.potentialLineVars.length-1))
    {tobias_line.currentState +=1}
    else{tobias_line.currentState=1}

}

function updateConnectedScatter(){
    var value = document.getElementById("scatter-update-select").value
    // console.log(value)
    tobias_connected_scatter.varX = value;
    tobias_connected_scatter.wrangleData()
}

// function typeWriter(i, txt, speed, target, length) {
//     if (i < length) {
//         document.getElementById(target).innerHTML += txt.charAt(i);
//         i++;
//         setTimeout(typeWriter(i, txt, speed, target, length), speed);
//     }
// }


function updateConnectedScatterandMap () {
    var value = document.getElementById("map-update-select").value
    tobias_connected_scatter.varY = value;
    tobias_connected_scatter.wrangleData()

    //#Todo: Tobias to also make the map adjust :-) incl. headline

    tobias_connected_map.varX = value;
    indicator = 0
    tobias_connected_map.reserveVars.forEach(function(d,i){
        if(d == value){
            indicator = i;
        }
    })
    tobias_connected_map.title_text = tobias_connected_map.reserveTitles[indicator]
    $("#Tobias-connected-map-subhead").text(tobias_connected_map.reserveTitles[indicator]);

    tobias_connected_map.wrangleData()




}



TobiasConnectedMap = function(_parentElement, _map, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.map = _map;
    this.eventHandler = _eventHandler;
    this.initVis()
}

    TobiasConnectedMap.prototype.initVis = function(){
        var vis = this;

        // --> CREATE SVG DRAWING AREA
        vis.margin = {top: 30, right: 90, bottom: 50, left: 30}
        vis.width = 500 - vis.margin.left - vis.margin.right;
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("id", vis.parentElement+"0")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // define projection
        vis.projection = d3.geoMercator()
            .scale(2000)
            .center([10.3736325636218, 51.053178814923065])
            .translate([150, 250]);

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
        // vis.varX = "East_West, 1990"
        vis.varX = "averae population age, 2017"
        vis.title_text = "Average population age, 2017"


            // // List of alternative variables
        vis.reserveVars = [
            // "household income, 2016",
            "averae population age, 2017",
            "unemployment rate (%), 2018",
            "GDP per employee, 2017",

            "forecase demand for new housing, 2030",
            "slots in pension homes (per 100), 2017",
            "tax revenues, 2015",
            "total tax earnings per capita, 2017",
            "long term unemployment rate, 2018",
            "rate of long time unemployment, 2018",
            "pre tax earnings, 2017",
            "household income, 2016",
            // "retirees recieving social security recipients (indicator of poverty in old age), 2017",
            "avg contribution based pension payout, 2015",
            "people in vocational training per 1.000 employed, 2015",
            "averae population age, 2017",
            "household income, 2016",
        ]

        vis.reserveTitles = [
            // "Household income, 2016",
            "Average population age, 2017",
            "Unemployment rate (%), 2018",
            "GDP per employee (€), 2017",
            "Forecast demand for new housing, 2030",
            "Slots in pension homes (per 100), 2017",
            "Tax revenues (€), 2015",
            "Total tax earnings per capita (€), 2017",
            "Long term unemployment rate, 2018",
            "Rate of long time unemployment, 2018",
            "Pre tax earnings (€), 2017",
            "Household income (€), 2016",
            "Average pension payouts (€), 2015",
            "Vocational training per 1.000  employees, 2015",
            "Average population age, 2017",
            "Household income (€), 2016",
        ]

        this.wrangleData()

        this.svg.append("rect")
            .attr('id', 'connectedmap2rect')
            .attr("x", -1000)
            .attr("y", -1000)
            .attr("width", 4000)
            .attr("height", 4000)
            .style("fill", d3.rgb(29,29,29))
            .style('opacity', 0.75)
            .on("mouseover", function () {
                $( "#connectedmap2rect" ).fadeOut( "slow", function () {

                });
                $( "#connectedmap2text" ).fadeOut( "slow", function () {

                });
                $( "#mapscatter1rect" ).fadeOut( "slow", function () {

                });
                $( "#mapscatter1text" ).fadeOut( "slow", function () {

                });
            });
        this.svg.append("text")
            .attr('id', 'connectedmap2text')
            .attr("x", vis.width/2 + 68)
            .attr("y", vis.height/2)
            .attr("font-size", "30px")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text("Use the dropdown menus to");

    }


    TobiasConnectedMap.prototype.wrangleData = function() {
        var vis = this;
        // console.log(vis.varY)

        // convert points into numbers
        vis.data.forEach(function(d,i){
            // console.log(d[vis.varY])
            // vis.data[i][vis.varY] = +d[vis.varY]
            vis.data[i][vis.varX] = +d[vis.varX]
            // vis.data[i][vis.varZ] = +d[vis.varZ]
        })

        // calculate extents
        vis.minMaxX = d3.extent(vis.data.map(function(d){ return d[vis.varX] }));
        // vis.minMaxY= d3.extent(vis.data.map(function(d){ return d[vis.varY]; }));


        // inject data into json map object
        vis.Germany.forEach(function(d,i){

            vis.data.forEach(function(data, index){
                // console.log(data)
                if (data.ID == d.properties.Kennziffer)
                {
                    // vis.Germany[i].properties[vis.varY] = data[vis.varY];
                    vis.Germany[i].properties[vis.varX] = data[vis.varX]
                }
            })

        })
        this.updateVis()
    }



    TobiasConnectedMap.prototype.updateVis = function() {
        var vis = this;

        // update the domain

        // console.log(vis.minMaxX)

        vis.colorScale.domain(vis.minMaxX)

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
                .attr("id", vis.parentElement +"-subhead")
                .style("text-anchor", "middle")
                .attr("y", 20)
                .text(vis.title_text)
                .attr("fill", "white")


            vis.map = vis.svg.selectAll("path")
                .data(vis.Germany)
                .enter().append("path")
                .attr("d", vis.path)
                .attr("class", "tobias-map-element")
                .attr("id", function(d,i){return vis.parentElement+ (d.properties.Kennziffer)})
                .attr("fill", function(d,i){
                    return vis.colorScale(d.properties[vis.varX])
                })
                .on("mouseover", function(d,i){
                    this.parentElement.appendChild(this);

                    tobias_connected_scatter.svg.select('#scatter_'+d.properties.Kennziffer)
                        .transition()
                        .duration(350)
                        // .attr("fill", "white")
                        .attr("r", 12)

                    document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = "white"
                    //     .transition()
                    //     .duration(400)
                    // console.log(document.getElementById(('scatter_'+ d.properties.Kennziffer)))


                })
                .on("mouseout", function(d,i){
                    tobias_connected_scatter.svg.select('#scatter_'+d.properties.Kennziffer)
                        .transition()
                        .duration(350)
                        .attr("r", 5)

                    //
                    //
                    document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.fill = ""
                    //
                    // document.getElementById(('scatter_'+ d.properties.Kennziffer)).setAttribute("r", 5)
                    // document.getElementById(('scatter_'+ d.properties.Kennziffer)).style.zIndex = "";

                })
        }


            vis.svg.selectAll("path")
                .data(vis.Germany)
                .attr("fill", function(d,i){
                    return vis.colorScale(+d.properties[vis.varX])
                })
        vis.firstLoad = false;

    }
