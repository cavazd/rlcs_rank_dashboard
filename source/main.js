//py -m http.server

BUMP_CIRC_RAD = 10;
AXIS_TEXT_BUFFER = 15;
REG_SEL_BUFFER = 30;
REG_SEL_HEIGHT = 40;
REG_SEL_WIDTH = 300;
REG_TEXT_BUFFER = 10;

// Code to create rlcs bump chart

var svg = d3.select('svg');

svgWidth = +svg.attr('width');
svgHeight = +svg.attr('height');

svgMargin = {'t':95, 'b':30, 'l':70, 'r':85};
yAxisTranY = -(svgMargin.b / 2);

//Tourn Formal Names
eventFormName = {
  'fall_reg1':'Fall Regional 1',
  'fall_reg2':'Fall Regional 2',
  'fall_reg3':'Fall Regional 3',
  'fall_maj':'Fall Major',
  'win_reg1':'Winter Regional 1',
  'win_reg2':'Winter Regional 2',
  'win_reg3':'Winter Regional 3',
  'win_maj':'Winter Major',
  'spr_reg1':'Spring Regional 1',
  'spr_reg2':'Spring Regional 2',
  'spr_reg3':'Spring Regional 3',
  'spr_maj':'Spring Major',
}

regionFormName = {
  'na':'North America',
  'eu':'Europe'
}
regionFormNameKeys = Object.keys(regionFormName)


// Add d3 brush stuff

// tooltip
var toolTip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-12, 0])
  .html(function(d) {
    return `
    <div class="toolTip">
      <p>
        <span class="bolden">Team Name: </span>${d.team}</br>
        <span class="bolden">Score: </span>${d.score}</br>
        <span class="bolden">Ranking: </span>${d.ranking}
      </p>
    </div>
    `;
  });

svg.call(toolTip);

function onHover(e) {
  bumpSvg.selectAll('.teams')
    .classed('dimmed', function(d) {
      return d.team !== e.team;
    });
  return toolTip.show(e);
}

function offHover(e) {
  bumpSvg.selectAll('.teams')
    .classed('dimmed', false);
  return toolTip.hide(e);
}


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
      box = this.getBoundingClientRect();
      return (`
        translate(${eventScale(1) + svgMargin.l - box.width - AXIS_TEXT_BUFFER},
        ${rankScale(parseInt(first_data.ranking)) - BUMP_CIRC_RAD})
      `)
    })

  teamG.append('text')
    .attr('class', 'rightName')
    .text(function() {
      return last_data.team;
    })
    .attr('transform', function() {
      box = this.getBoundingClientRect();
      return (`
      translate(${eventScale(this_data.length) + svgMargin.l + AXIS_TEXT_BUFFER},
      ${rankScale(parseInt(last_data.ranking)) - BUMP_CIRC_RAD})
      `)
    });

  //draw lines

  var teamLines = teamG.append('g')
    .attr('class', 'teamLine')

  var lines = teamLines.selectAll('.bumpLine')
    .data(this_data);

  var linesEnter = lines.enter()
    .append('line')
    .attr('class', 'bumpLine')
    .style('stroke', _this.color);

  linesEnter.on('mouseover', onHover)
    .on('mouseout', offHover);

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

  dotsEnter.on('mouseover', onHover)
    .on('mouseout', offHover);

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


d3.csv('../data/rlcs_all_ranks.csv').then(function(dataset) {
  rlcs_ranks = dataset;
  bumpSvg = svg.append('g')
    .attr('class', 'bumpSvg')

  updateChart('na')
});


function delSelections() {
  var selections = document.querySelectorAll('.selections');

  selections.forEach(selection => {
    selection.remove();
  });
}

function delSelectionsOutside() {
  selectionBounds = {
    'x1':svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER,
    'x2':svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER + REG_SEL_WIDTH,
    'y1':REG_SEL_HEIGHT / 4,
    'y2':REG_SEL_HEIGHT / 4 + REG_SEL_HEIGHT * (regionFormNameKeys.length+1)
  }
  if ((this_pos[0] < selectionBounds['x1'] || this_pos[0] > selectionBounds['x2']) ||
      (this_pos[1] < selectionBounds['y1'] || this_pos[1] > selectionBounds['y2'])) {
    delSelections();
  }
}

function genSelections(g, current_region) {

  var sels = g.append('g')
    .attr('class', 'selections')


  for (var i = 0; i < regionFormNameKeys.length; i++) {
    var new_sel = sels.append('g')
    new_sel.append('rect')
      .attr('width', REG_SEL_WIDTH)
      .attr('height', REG_SEL_HEIGHT)
      .attr(
        'transform',
        `translate(
          ${svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER},
          ${REG_SEL_HEIGHT / 4 + REG_SEL_HEIGHT * (i+1)}
        )`
      );

    new_sel.append('text')
      .text(regionFormName[regionFormNameKeys[i]])
      .attr(
        'transform',
        `translate(
          ${svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER + REG_TEXT_BUFFER},
          ${REG_SEL_HEIGHT * 15/16 + REG_SEL_HEIGHT * (i+1)}
        )`
      )
      .attr('class', 'regText dimmed')


    if (regionFormNameKeys[i] === current_region) {
      new_sel.classed('bolden', true);
    }

    new_sel.on('mouseover', function() {
      this.children[1].classList.remove('dimmed');
    })
      .on('mouseout', function() {
        this.children[1].classList.add('dimmed');
      })
      .on('click', function() {
        current_region = Object.keys(regionFormName).find(key => regionFormName[key] === this.children[1].textContent);
        delSelections();
        updateChart(current_region);
      })
  }
}

function genRelSel(current_region) {
  var regSel = svg.append('g')
    .attr('class', 'regSel')

  regSel.append('rect')
    .attr('width', REG_SEL_WIDTH)
    .attr('height', REG_SEL_HEIGHT)
    .attr('transform', `translate(${svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER}, ${REG_SEL_HEIGHT / 4})`);

  regSel.append('text')
    .text(regionFormName[current_region])
    .attr('transform', function() {
      return `translate(${svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER + REG_TEXT_BUFFER}, ${REG_SEL_HEIGHT * 15/16})`;
    })
    .attr('class', 'regText')

  var selector = regSel.append('g')
    .attr('class', 'selector')

  selector.append('rect')
    .attr('width', REG_SEL_HEIGHT)
    .attr('height', REG_SEL_HEIGHT)
    .attr('transform', `translate(${svgWidth - REG_SEL_HEIGHT - REG_SEL_BUFFER}, ${REG_SEL_HEIGHT / 4})`);

  selector.append('polygon')
    .attr('points', `
    ${svgWidth - (REG_SEL_HEIGHT * 3/4) - REG_SEL_BUFFER}, ${REG_SEL_HEIGHT * 9/16}
    ${svgWidth - (REG_SEL_HEIGHT * 1/4) - REG_SEL_BUFFER}, ${REG_SEL_HEIGHT * 9/16}
    ${svgWidth - (REG_SEL_HEIGHT * 2/4) - REG_SEL_BUFFER}, ${REG_SEL_HEIGHT}
    `)
    .style('fill', 'black');

  selector.on('click', function() {genSelections(regSel, current_region)});
  d3.select("body").on('click', delSelectionsOutside);
}

function updateChart(current_region) {
  // remove all elements from svg

  var bumpSvg_node = document.querySelector(".bumpSvg");
  while (bumpSvg_node.firstChild) {
    bumpSvg_node.removeChild(bumpSvg_node.firstChild);
  }


  genRelSel(current_region);

  bumpSvg.append('text').attr('class', 'mainTitle')
    .text(`RLCS Season 2021-2022 ${regionFormName[current_region]} Worlds Points`)
    .attr('transform', 'translate(10, 44)');

  var filtData = rlcs_ranks.filter(function(d) {
    return d.region === current_region;
  })

  var nestedEvents = d3.nest()
    .key(function(c) {
      return c.event;
    })
    .entries(filtData);

  var nestedTeams = d3.nest()
    .key(function(v) {
      return v.team;
    })
    .entries(filtData);

  var teamNames = d3.map(filtData, function(d){return d.team;}).keys()
  var teamColorMap = {};
  for (let i = 0; i < teamNames.length; i++) {
    teamColorMap[teamNames[i]] = i+1
  }

  // Set up axis for the bump chart
  var eventMax = d3.max(filtData, function(d) { return parseInt(d.event); } );
  var eventMin = d3.min(filtData, function(d) { return parseInt(d.event); } );
  var maxRank = d3.max(filtData, function(d){return parseInt(d.ranking);});

  var eventScale = d3.scaleLinear()
    .domain([eventMin, eventMax]).range(
      [svgMargin.l, svgWidth - (svgMargin.r + svgMargin.l * 2)]
    );

  var rankScale = d3.scaleLinear()
    .domain([1, maxRank]).range([svgMargin.t, svgHeight - svgMargin.b]);

    bumpSvg.append('g').attr('class', 'x axis')
    .attr('transform', function(d) {
      box = this.getBoundingClientRect();
      tranX = svgMargin.l;
      tranY = svgHeight - (svgMargin.b);

      return `translate(${tranX}, ${tranY})`;
    })
    .call(d3.axisBottom(eventScale).tickFormat(function(d){
      return eventFormName[nestedEvents[d-1].values[0].eventname];
    }));


  // add circles to chart
  let colorScale = d3.scaleSequential()
    .domain([1, teamNames.length])
    .interpolator(d3.interpolateRainbow);

  teamObjects = [];
  for (var i = 0; i < teamNames.length; i++) {
    this_team = teamNames[i]
    teamObjects.push(
      new BumpTeam(
        this_team,
        colorScale(teamColorMap[this_team])
      )
    );
  }

  var teamEnter = bumpSvg.selectAll('.teams')
    .data(teamObjects)
    .enter()
    .append('g')
    .attr('class', 'teams');

  teamEnter.each(function(teams) {
    teams.init(this);
    teams.update(this, nestedTeams, teamColorMap, eventScale, rankScale);
  });
}

var eventScale = d3.scaleLinear()
  .domain()
