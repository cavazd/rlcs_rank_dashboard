//py -m http.server

BUMP_CIRC_RAD = 10;

// Code to create rlcs bump chart

var svg = d3.select('svg');

svgWidth = +svg.attr('width');
svgHeight = +svg.attr('height');

svgMargin = {'t':95, 'b':30, 'l':70, 'r':85};
yAxisTranY = -(svgMargin.b / 2);

// brush
// var brush = d3.brush()
//     .extent(
//       [[0, 0 + svgMargin.t],
//        [svgWidth, svgHeight]])
//     .on("start", brushstart)
//     .on("brush", brushmove)
//     .on("end", brushend);


// Create BumpTeam constructor function
function BumpTeam(team, color) {
  this.team = team;
  this.color = color;
}

BumpTeam.prototype.init = function() {
}

BumpTeam.prototype.update = function(g, data, teamColorMap, eventScale, rankScale) {
  this_data = data[teamColorMap[this.team] - 1].values;
  first_data = this_data[0];
  last_data = this_data[this_data.length - 1];

  var teamG = d3.select(g);

  var _this = this;

  // add text

  teamG.append('text')
    .attr('class', 'leftName')
    .text(function() {
      return first_data.team;
    })
    .attr('transform', function() {
      return `translate(${8}, ${rankScale(parseInt(first_data.ranking)) - BUMP_CIRC_RAD})`
    })

  teamG.append('text')
    .attr('class', 'rightName')
    .text(function() {
      return last_data.team;
    })
    .attr('transform', function() {
      return `translate(${svgWidth - 140}, ${rankScale(parseInt(last_data.ranking)) - BUMP_CIRC_RAD})`
    })

  //draw lines

  var teamLines = teamG.append('g')
    .attr('class', 'teamLine')

  var lines = teamLines.selectAll('.bumpLine')
    .data(this_data);

  var linesEnter = lines.enter()
    .append('line')
    .attr('class', 'bumpLine')
    .style('stroke', _this.color)
    .style('stroke-width', 2);

  lines.merge(linesEnter)
    .attr("x1", function(d, i) {
      if (i != 0) {
        return eventScale(parseInt(this_data[i-1].event)) + svgMargin.l;
      }
    })
    .attr("y1", function(d, i) {
      if (i != 0) {
        return rankScale(parseInt(this_data[i-1].ranking)) + yAxisTranY;
      }
    })
    .attr("x2", function(d, i) {
      if (i != 0) {
        return eventScale(parseInt(d.event)) + svgMargin.l;
      }
    })
    .attr("y2", function(d, i) {
      if (i != 0) {
        return rankScale(parseInt(d.ranking)) + yAxisTranY;
      }
    });

  lines.exit().remove();


  // draw dots

  var teamDots = teamG.append('g')
    .attr('class', 'teamDot');

  var dots = teamDots.selectAll('.bumpDotG')
    .data(this_data);

  var dotsEnter = dots.enter()
    .append('g')
    .attr('class', 'bumpDotG')


  dotsEnter.append('circle')
    .attr('class', 'bumpDot')
    .style('fill', _this.color)
    .attr('r', `${BUMP_CIRC_RAD}px`);

  dotsEnter.append('text')
    .text(function(d) {
      return d.ranking;
    })
    .attr('dx', function() {
      box = this.getBoundingClientRect()
      return 0;
    })
    .attr('dy', function() {
      box = this.getBoundingClientRect()
      return (box.height / 4);
    })
    .attr('class', 'teamText');

  dots.merge(dotsEnter)
    .attr('transform', function(d) {
      return `translate(
        ${eventScale(parseInt(d.event)) + svgMargin.l},
        ${rankScale(parseInt(d.ranking)) + yAxisTranY}
      )`;
    });

  dots.exit().remove();
}

var teamObjects = [];

d3.csv('../data/rlcs_na_ranks.csv').then(function(dataset) {
  console.log(dataset);

  var nestedEvents = d3.nest()
    .key(function(c) {
      return c.event;
    })
    .entries(dataset);
  console.log(nestedEvents);

  var nestedTeams = d3.nest()
    .key(function(v) {
      return v.team;
    })
    .entries(dataset);
  console.log(nestedTeams);

  var teamNames = d3.map(dataset, function(d){return d.team;}).keys()
  var teamColorMap = {};
  for (let i = 0; i < teamNames.length; i++) {
    teamColorMap[teamNames[i]] = i+1
  }


  // Set up axis for the bump chart
  var eventMax = d3.max(dataset, function(d) { return parseInt(d.event); } );
  var eventMin = d3.min(dataset, function(d) { return parseInt(d.event); } );
  var maxRank = d3.max(dataset, function(d){return parseInt(d.ranking);});

  var eventScale = d3.scaleLinear()
    .domain([eventMin, eventMax]).range(
      [svgMargin.l, svgWidth - (svgMargin.r + svgMargin.l * 2)]
    );

  var rankScale = d3.scaleLinear()
    .domain([1, maxRank]).range([svgMargin.t, svgHeight - svgMargin.b]);

  svg.append('g').attr('class', 'x axis')
    .attr('transform', function(d) {
      box = this.getBoundingClientRect();
      tranX = svgMargin.l;
      tranY = svgHeight - (svgMargin.b);

      return `translate(${tranX}, ${tranY})`;
    })
    .call(d3.axisBottom(eventScale).tickFormat(function(d){
      return nestedEvents[d-1].values[0].eventname;
    }));


  // add circles to chart
  let colorScale = d3.scaleSequential()
    .domain([1, teamNames.length])
    .interpolator(d3.interpolateRainbow);

  for (var i = 0; i < teamNames.length; i++) {
    this_team = teamNames[i]
    teamObjects.push(
      new BumpTeam(
        this_team,
        colorScale(teamColorMap[this_team])
      )
    );
  }


  var teamEnter = svg.selectAll('.teams')
    .data(teamObjects)
    .enter()
    .append('g')
    .attr('class', 'teams');

  teamEnter.each(function(teams) {
    teams.init(this);
    teams.update(this, nestedTeams, teamColorMap, eventScale, rankScale);
  });


});

var eventScale = d3.scaleLinear()
  .domain()

svg.append('text').attr('class', 'mainTitle')
  .text('RLCS Season 2021-2022 North America Worlds Points')
  .attr('transform', 'translate(10, 44)');