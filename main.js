// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

let NUM_YRS = 10;
var teams = {};
var teams_wc = {};

let svg1 = d3version5.select("#graph1")      
    .append("svg")
    .attr("width", graph_1_width)     
    .attr("height", graph_1_height)     
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
let svg2 = d3version5.select("#graph2")      
    .append("svg")
    .attr("width", graph_2_width)     
    .attr("height", graph_2_height);
let projection = d3version5.geoEquirectangular()
    .scale(graph_2_width/6)
    .translate([graph_2_width / 2, graph_2_height / 2]);
let tooltip_2 = d3version5.select("#graph2")     
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let svg3 = d3version5.select("#graph3")      
    .append("svg")
    .attr("width", graph_3_width)     
    .attr("height", graph_3_height)     
    .append("g")
    .attr("transform", `translate(${margin.right}, ${margin.top})`);

function setData(indexVar) {
    d3version5.csv("../data/football.csv").then(function(data) {
        teams = {};
        cleanData(data);
    
        // FOR GRAPH 2: MAP OF TOP 10 WINNING PERCTS
        // calculate winning percentages for each team
        data.forEach(function(d) {
            // add to both team's game counter, there won't be duplicates
            teams[d.home_team][0] += 1;
            teams[d.away_team][0] += 1;
    
            if (d.tournament == 'FIFA World Cup' && d.date >= 2014) {
                teams_wc[d.home_team][0] += 1;
                teams_wc[d.away_team][0] += 1;
            }
    
            // add to winning team's win counter
            // add victory strength to data structure as 3rd input 
            if (d.winner == d.home_team) {
                if (d.tournament == 'FIFA World Cup' && d.date >= 2014) {
                    teams_wc[d.home_team][1] += 1;
                    teams_wc[d.home_team][2] += d.victory_strength;
                }
                teams[d.home_team][1] += 1;
            } else if (d.winner == d.away_team) {
                if (d.tournament == 'FIFA World Cup' && d.date >= 2014) {
                    teams_wc[d.away_team][1] += 1;
                    teams_wc[d.away_team][2] += d.victory_strength;
                }
                teams[d.away_team][1] += 1;
            }
        });

        // do the pct calculation, add as 4th value
        Object.keys(teams_wc).forEach(function(key) {
            // console.log(teams_wc[key]);
            teams_wc[key][3] = (teams_wc[key][1] / teams_wc[key][0])*100;
        });

        //sort by winning_pct, greatest to least, get top 5
        // console.log(teams_wc);
        teams_wc = Object.keys(teams_wc).map( key => ({ key, value: teams_wc[key] }) ).sort(function(a, b) {
            if (!Number.isNaN(b.value[3]) && !Number.isNaN(a.value[3])) {   
                if (b.value[3] > a.value[3]) {
                    return 1;
                } else {
                    return -1;
                }
            } else if (Number.isNaN(b.value[3])) {
                return -1;
            } else if (Number.isNaN(a.value[3])) {
                return 1;
            }
        }).slice(0,5);

        // FOR GRAPH 3: WHO WILL WIN THE WORLD CUP 2022

        // create x-axis, team name
        let x_3 = d3version5.scaleBand()
        .domain(teams_wc.map(function(d) {return d.key}))
        .range([0, (graph_3_width - margin.left - margin.right)])
        .padding(0.1);

        svg3.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(${(graph_3_width - margin.left - margin.right)-430}, ${(graph_3_height - margin.top - margin.bottom)})`)
            .call(d3version5.axisBottom(x_3).tickSize(0))
            .style({'fill': 'none', 'stroke-width': '0px'});

        svg3.append("text")
        .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2},
                                        ${(graph_3_height - margin.top - margin.bottom) + 35})`)       
        .style("text-anchor", "middle")
        .text("Team");
        
        // create y-axis, either win_pct or vic_str
        let y_3 = d3version5.scaleLinear()
        .domain([0, d3version5.max(teams_wc, function(d) {return d.value[indexVar]})])
        .range([graph_3_height - margin.top - margin.bottom, 0]);

        svg3.select('#y3axnums').remove();
        svg3.append("g")
        .attr('id', 'y3axnums')
        .attr('transform', `translate(-25, 0)`)
        .call(d3version5.axisLeft(y_3));

        var text = '';
        if (indexVar == 2) {
            text = 'Victory Strength';
        } else {
            text = 'Winning %';
        };
        svg3.select('#y3axis').remove();
        svg3.append('text')
            .attr("id", "y3axis")
            .attr("transform", `translate(-65, ${(graph_3_height - margin.top - margin.bottom) / 3})`)  
            .style("text-anchor", "middle")
            .text(text);
        
        let lines = svg3.selectAll(".myLine")
            .data(teams_wc)
        lines
            .enter()
            .append("line")
            .attr("class", "myLine")
            .merge(lines)
            .transition()
            .duration(1000)
                .attr("x1", function(d) { return x_3(d.key); })
                .attr("x2", function(d) { return x_3(d.key); })
                .attr("y1", y_3(0))
                .attr("y2", function(d) { return y_3(d.value[indexVar]); })
                .attr("stroke", "black")
        
        let circles = svg3.selectAll('circle')
            .data(teams_wc)
        circles
            .enter()
            .append('circle')
            .merge(circles)
            .transition()
            .duration(1000)
                .attr('cx', function(d) { return x_3(d.key); })
                .attr("cy", function(d) { return y_3(d.value[indexVar]); })
                .attr("r", 15)
                .attr("fill", "#69b3a2");

        // add chart title
        if (indexVar == 2) {
            winner = 'France';
        } else {
            winner = 'Belgium';
        };
        svg3.select('#y3title').remove();
        svg3.append("text")
        .attr("id", "y3title")
        .attr("transform", `translate(${(graph_3_width - margin.left - margin.right)/2.5 }, ${-20})`)       
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text(winner + " will win the 2022 FIFA World Cup!");
    
        // do the pct calculation
        Object.keys(teams).forEach(function(key) {
            // must have played at least 100 games
            if (teams[key][0] >= 100) {
                teams[key].push(teams[key][1] / teams[key][0]);
            }
        });
    
        //sort by winning_pct, greatest to least, get top 10
        teams = Object.keys(teams).map( key => ({ key, value: teams[key] }) ).sort(function(a, b) {
            if (b.value[2] != undefined && a.value[2] != undefined) {
                return b.value[2] - a.value[2]
            }
        }).slice(0,10);
    
        let color_countries = d3version5.scaleOrdinal()
                    .domain(teams.map(function(d) {return d.key}))
                    .range(['#1E96FC'])
    
        let top_10 = teams.map(function(d) {return d.key});
    
        let mouseover = function(d) {
            let color_span = `<span style="color: ${color_countries(d.properties.name)};">`;
            
            if (d.properties.win_pct != null) {
                let html = `${color_span}${d.properties.name}</span><br/>
                Winning %: ${color_span}${(d.properties.win_pct * 100).toFixed(2)}</span>`;       
                // console.log(html);
                // Show the tooltip and set the position relative to the event X and Y location
                tooltip_2.html(html)
                    .style("left", `${(d3version5.event.pageX) -100 }px`)
                    // `${(d3.event.pageX) -220 }px`
                    .style("top", `${(d3version5.event.pageY) - 30}px`)
                    //
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9)
                // console.log('hi');
            }
    
        };
    
        // Mouseout function to hide the tool on exit
        let mouseout = function(d) {
            // Set opacity back to 0 to hide
            tooltip_2.transition()
                .duration(200)
                .style("opacity", 0);
        };
    
        d3version4.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", function(data){
            // add win pct value as field in map data json
            for (var i =0; i < data.features.length; i++) {
                if (top_10.includes(data.features[i].properties.name)) {
                    for (var j = 0; j < teams.length; j++) {
                        if (teams[j].key == data.features[i].properties.name) {
                            data.features[i].properties.win_pct = teams[j].value[2];
                        }
                    }
                }
            }
            let paths = svg2.selectAll('path').data(data.features);
            paths.enter()
                .append('path')
                .attr('d', d3version5.geoPath().projection(projection))
                .style('stroke', '#fff')
                .attr('fill', function(d) { 
                    if (top_10.includes(d.properties.name)){
                        return color_countries(d.properties.name);
                    }
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
            
        });
    
        // add chart title
        svg2.append("text")
        .attr("transform", `translate(${(graph_2_width - margin.left - margin.right)}, ${graph_2_height-35})`)       
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .attr('fill', '#1E96FC')
        .text("Top 10 Winning Nations");
    
    
        // FOR GRAPH 1: # GAMES PER YEAR
        // nest the data by year, count games per year, get 10 most recent years
        let yearCountData = d3version5.nest()
            .key(function(d) { return d.date })
            .rollup(function(byDate){return byDate.length})
            .entries(data.sort(function(a,b){return b.date - a.date})).slice(0,NUM_YRS);
    
        // create x-axis, year
        let x_1 = d3version5.scaleBand()
        .domain(yearCountData.map(function(d) {return d.key}))
        .range([0, (graph_1_width - margin.left - margin.right)])
        .padding(0.1);
        // create y-axis, count of number of games
        let y_1 = d3version5.scaleLinear()
        .domain([0, d3version5.max(yearCountData, function(d) {return d.value})])
        .range([graph_1_height - margin.top - margin.bottom, 0]);
        // add color by year
        let color_yrs = d3version5.scaleOrdinal()
        .domain(yearCountData.map(function(d) {return d.key}))
        .range(d3version5.quantize(d3version5.interpolateHcl("#66a0e2", "#ff5c7a"), NUM_YRS));
    
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
        .call(d3version5.axisBottom(x_1));
    
        svg1.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2},
                                        ${(graph_1_height - margin.top - margin.bottom) + 35})`)       
        .style("text-anchor", "middle")
        .text("Year (Descending from Most Recent)");
    
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
            .attr("x", function(d) { return x_1(d.key) })       
            .attr("y", function(d) { return y_1(d.value) -5 })       
            .style("text-anchor", "start")
            .style("font-size", '11px')
            .text(function(d) { return d.value }); 
        // add chart title
        svg1.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-25})`)       
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Total Number of Games per Year");
    
    });
}


/**
 * change dates to years
 * add a winner column
 * add a victory strength column (winner's score - loser's score)
 * sort by year descending (most recent to oldest)
 */
function cleanData(data) {
    return data.forEach(function(d) {
        // key: team, value1: game counter, value2: win counter, value3: victory strength, value4: win %
        if (!(d.home_team in teams)) {
            teams[d.home_team] = [0,0];
            teams_wc[d.home_team] = [0,0,0,0];
        }
        if (!(d.away_team in teams)) {
            teams[d.away_team] = [0,0];
            teams_wc[d.away_team] = [0,0,0,0];
        }
        
        d.date = parseInt(d.date);
        d.home_score = +d.home_score;
        d.away_score = +d.away_score;
        if (d.home_score > d.away_score) {
            d.winner = d.home_team;
            if (d.tournament == 'FIFA World Cup' && d.date >= 2014) {
                d.victory_strength = d.home_score - d.away_score;
            }
        } else if (d.away_score > d.home_score){
            d.winner = d.away_team;
            if (d.tournament == 'FIFA World Cup' && d.date >= 2014) {
                d.victory_strength = d.away_score - d.home_score;
            }
        } else {
            d.winner = null;
            if (d.tournament == 'FIFA World Cup' && d.date >= 2014) {
                d.victory_strength = 0;
            }
        }
    });
}
// on load, show win_pct first
setData(3);
