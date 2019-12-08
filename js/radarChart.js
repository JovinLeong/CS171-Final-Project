var width = 300,
    height = 300;

// Config for the Radar chart
var config = {
    w: width,
    h: height,
    maxValue: 40,
    levels: 5,
    ExtraWidthX: 300
}

//Call function to draw the Radar chart
// d3.json("./js/data.json", function(error, data) {
//     if (error) throw error;
//     console.log('formatting',data)
//     RadarChart.draw("#radarChart", data, config);
// });

// import data
d3.queue()
    .defer(d3.csv, "data/east_west_radar.csv")
    .await(function(error, radarData) {
        // console.log("radar data", radarData)
        radar_chart = new radarChart("#radarChart", radarData)
    });

radarChart = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.initVis()
};


radarChart.prototype.initVis = function() {
    var vis = this;
    // console.log('does this work', Object.keys(vis.data[0]));

    vis.dataKeys = Object.keys(vis.data[0]).slice(0, 23)
    vis.data.forEach(function (d) {

        vis.dataKeys.forEach(function (data) {
            d[data] = +d[data]
        })
    })

    // console.log('did the cleaning work', vis.data)

    vis.filteredData = vis.data;

    // set the dimensions and margins of the graph
    vis.margin = {top: 20, right: 30, bottom: 30, left: 145};
    vis.width = 400 - vis.margin.left - vis.margin.right;
    vis.height = 400 - vis.margin.top - vis.margin.bottom;

// Config for the Radar chart
    vis.config = {
        w: vis.width,
        h: vis.height,
        maxValue: 40, //Update
        levels: 5, //Update
        ExtraWidthX: 300 //Update
    };

    vis.wrangleData();
};

radarChart.prototype.wrangleData = function() {
    var vis = this;

    // CHECK THE YEAR RANGE FILTER

    vis.radarKeys = [
        "Poverty in old age",
        "Unemployment rate",
        "GDP per capita",
        "School dropout rate (per 100 students)"
    ];

    vis.eastData = [];
    vis.westData = [];

    console.log("vis.filteredD", vis.filteredData)

    vis.filteredData.forEach(function (d) {
        if (d.Raumeinheit === 'Ost') {
            vis.eastData.push(d)
            vis.dataKeys.forEach(function (e) {
            })
        } else {
            vis.westData.push(d)
        }
    });

    // Initialize empty list to match radar data format
    vis.eastSorted = [];
    vis.verticesEast = [];
    vis.eastData.forEach(function (d, index) {
        var values = [];
        vis.dataKeys.forEach(function (e) {
            values.push(d[e])
        });
        var vertice = {"area": vis.radarKeys[index], "value": aveHelper(values)};
        vis.verticesEast.push(vertice)
    });

    vis.eastSorted.push(vis.verticesEast[0]);
    // Push in 2 empty objects so that the plot only occupies one side
    vis.eastSorted.push({"area": "Unemployment rate", "value": 0});
    vis.eastSorted.push({"area": "GDP per capita", "value": 0});
    vis.eastSorted.push(vis.verticesEast[3]);
    vis.eastSorted.push(vis.verticesEast[2]);
    vis.eastSorted.push(vis.verticesEast[1]);

    // Multiply by 10 to get rate per 1000; multiply by 100 to get percentage
    // vis.eastSorted[3].value= vis.eastSorted[3].value * 10
    vis.eastSorted = [vis.eastSorted];

    // Initialize empty list to match radar data format
    vis.westSorted = [];
    vis.verticesWest = [];
    vis.westData.forEach(function (d, index) {
        var values = [];
        vis.dataKeys.forEach(function (e) {
            values.push(d[e])
        });
        var vertice = {"area": vis.radarKeys[index], "value": aveHelper(values)};
        vis.verticesWest.push(vertice)
    });

    vis.westSorted.push(vis.verticesWest[0]);
    // Push in 2 empty objects so that the plot only occupies one side
    vis.westSorted.push(vis.verticesWest[1]);
    vis.westSorted.push(vis.verticesWest[2]);
    vis.westSorted.push(vis.verticesWest[3]);
    vis.westSorted.push({"area": "Unemployment rate", "value": 0});
    vis.westSorted.push({"area": "GDP per capita", "value": 0});

    // Multiply by 10 to get rate per 1000; multiply by 100 to get percentage
    // vis.westSorted[3].value= vis.westSorted[3].value * 10;
    // vis.westSorted[0].value= vis.westSorted[0].value * 100;
    vis.westSorted = [vis.westSorted];

    console.log('west',(vis.verticesWest[2]));
    console.log('est',vis.eastSorted)

    vis.updateVis()
};

radarChart.prototype.updateVis = function () {
    var vis = this;
    vis.radar = RadarChart.draw("#radarChart", vis.eastSorted, config, vis.westSorted);


};

function aveHelper(array) {
    var sums = 0;
    var nans = 0;
    array.forEach(function (item) {
        if (Number.isNaN(item)) {
            nans += 1
        }
        if (isFinite(item)) {
            sums += +item
        }
    });

    console.log('nans',nans)
    console.log('sums',sums)
    console.log('outcome', (sums/(23-nans)))

    var ave = sums/( 23- +nans);
    return ave;
}

function removeElement(id) {
    var elem = document.getElementById(id);
    return elem.parentNode.removeChild(elem);
}

radarChart.prototype.selectionChange = function (brushRegion) {
    var vis = this;

    vis.minRange = Math.round(tobias_line.x.invert(d3.min([brushRegion[0], brushRegion[1]])));
    vis.maxRange = Math.round(tobias_line.x.invert(d3.max([brushRegion[0], brushRegion[1]])));

    // console.log('vd', vis.data);
    vis.filterKeys = Object.keys(vis.data[0]).slice(0, 23);
    // console.log(+Object.keys(vis.data[0]).slice(13, 14) < 2015);

    var tester = vis.filterKeys.filter(function (value) {
        return (+value <= vis.maxRange) && (+value >= vis.minRange)
    });

    console.log('tester', tester);

    var new_test = vis.data[0].filter(function (element) {
        return element
    })

    console.log('new test', new_test)

    // Filter data based on selection range
    // vis.filteredData = vis.data.filter(function (value) {

    //     new_value = {}
    //     console.log(typeof value)
    //     return value
    // })

        // console.log('mn',vis.minRange)
        // console.log('mx',vis.maxRange)

    vis.tempData = vis.data;

    // vis.tempData.forEach(function (d) {
    //     vis.filterKeys.forEach(function (e) {
    //         // if ((+e <= vis.minRange )) {
    //         //     delete d[e]
    //         // }
    //         if ((+e >= vis.maxRange )) {
    //             delete d[e]
    //         }
    //         //
    //         // if ((+e <= vis.minRange )) {
    //         //     delete d[e]
    //         // }
    //     })
    // });




    console.log('check dis out', vis.tempData)
    console.log("new filtered data", vis.filteredData)
}