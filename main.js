// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

let NUM_YRS = 10;


let svg1 = d3.select("#graph1")      
    .append("svg")
    .attr("width", graph_1_width)     
    .attr("height", graph_1_height)     
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
let svg2 = d3.select("#graph2")      
    .append("svg")
    .attr("width", graph_2_width)     
    .attr("height", graph_2_height)     
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.bottom})`);
let svg3 = d3.select("#graph3")      
    .append("svg")
    .attr("width", graph_3_width)     
    .attr("height", graph_3_height)     
    .append("g")
    .attr("transform", `translate(${margin.right}, ${margin.top})`);

let tooltip = d3.select("graph3")     
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


d3.csv("../data/football.csv").then(function(data) {
    cleanData(data);
    data = data.sort(function(a,b){return b.date - a.date});

    // nest the data by groups, group is the home_team 
    let teamData = d3.nest()
        .key(function(d) { return d.home_team })
        .entries(data);

    // nest the data by year, count games per year, get 10 most recent years
    let yearCountData = d3.nest()
        .key(function(d) { return d.date })
        .rollup(function(byDate){return byDate.length})
        .entries(data).slice(0,NUM_YRS);

    console.log(yearCountData)
    // console.log(data)

    // create x-axis, year
    let x_1 = d3.scaleBand()
    .domain(yearCountData.map(function(d) {return d.key}))
    .range([0, (graph_1_width - margin.left - margin.right)])
    .padding(0.1);
    // create y-axis, count of number of games
    let y_1 = d3.scaleLinear()
    .domain([0, d3.max(yearCountData, function(d) {return d.value})])
    .range([graph_1_height - margin.top - margin.bottom, 0]);
    // add color by year
    let color_yrs = d3.scaleOrdinal()
    .domain(yearCountData.map(function(d) {return d.key}))
    .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#ff5c7a"), NUM_YRS));

    let bars = svg1.selectAll("rect").data(yearCountData);
    bars.enter()
    .append("rect")
    .merge(bars)
    .attr("fill", function(d) { return color_yrs(d.key) }) 
    .attr("x", function(d) { return x_1(d.key) })
    .attr("y", function(d) { return y_1(d.value) })              
    .attr("width", x_1.bandwidth())
    .attr("height", function(d) { return graph_1_height - margin.top - margin.bottom - y_1(d.value) });
    // add x axis label
    svg1.append("g")
    .attr("transform", `translate(0, ${(graph_1_height - margin.top - margin.bottom)})`)      
    .call(d3.axisBottom(x_1));

    // add y axis label
    svg1.append("text")
    .attr("transform", `translate(-50, ${(graph_1_height - margin.top - margin.bottom) / 2})`)       
    .style("text-anchor", "middle")
    .text("Number of Games");

    // counts above the bars
    let counts = svg1.append("g").selectAll("text").data(yearCountData);
    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(1000)
        .attr("x", function(d) { return x_1(d.key) +5})       // HINT: Add a small offset to the right edge of the bar, found by x(d.count)
        .attr("y", function(d) { return y_1(d.value) -5 })       // HINT: Add a small offset to the top edge of the bar, found by y(d.artist)
        .style("text-anchor", "start")
        .text(function(d) { return d.value }); 
    // add chart title
    svg1.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-25})`)       
    .style("text-anchor", "middle")
    .style("font-size", 15)
    .text("Number of Games in the Last 10 Years");

});

/**
 * change dates to years
 * add a winner column
 * add a victory strength column (winner's score - loser's score)
 * sort by year descending (most recent to oldest)
 */
function cleanData(data) {
    return data.forEach(function(d) {
        d.date = parseInt(d.date);
        d.home_score = +d.home_score;
        d.away_score = +d.away_score;
        if (d.home_score > d.away_score) {
            d.winner = d.home_team;
            d.victory_strength = d.home_score - d.away_score;
        } else if (d.away_score > d.home_score){
            d.winner = d.away_team;
            d.victory_strength = d.away_score - d.home_score;
        } else {
            d.winner = null;
            d.victory_strength = 0;
        }
    });
}

