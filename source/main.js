/*
Title: RLCS Bump Chart Creation
Developer: Daniel Cavazos (cavazd)
Date (YYYY/MM/DD): 2022/10/05
*/

// Magic Numbers
BUMP_CIRC_RAD = 10;
AXIS_TEXT_BUFFER = 15;
REG_SEL_BUFFER = 180;
REG_SEL_HEIGHT = 40;
REG_SEL_WIDTH = 200;
REG_TEXT_BUFFER = 10;
LEGEND_WIDTH = 140;
LEGEND_HEIGHT = REG_SEL_HEIGHT;
LEGEND_BUFFER = REG_SEL_BUFFER * 7/8;
EVENT_MIN = 1;
EVENT_MAX = 12;
TOP_N = 30;
YTRAN = 800;
Y_AXIS_TRAN_Y = BUMP_CIRC_RAD * -2;
TAG_WIDTH = 100;
TAG_HEIGHT = 25;
LIQUIPEDIA_RANK_LINK = (
  'https://liquipedia.net/rocketleague/'
  + 'Rocket_League_Championship_Series/2021-22/Rankings'
);
GITHUB_REPO_LINK = 'https://github.com/cavazd/rlcs_rank_dashboard';

// declare current_season global variable
ALL_SEASONS = ['2021-2022', '2022-2023']
current_season = ALL_SEASONS[ALL_SEASONS.length - 1];

// Declare main svg
var svg = d3.select('svg');

// Get svg dimensions
svgWidth = +svg.attr('width');
svgHeight = +svg.attr('height');

// declare margins for svg
svgMargin = {'t':95, 'b':50, 'l':70, 'r':85};

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
  'fall_open':'Fall Open',
  'fall_cup': 'Fall Cup',
  'fall_invitational': 'Fall Invitational',
  'fall_major': 'Fall Major',
  'win_open':'Winter Open',
  'win_cup': 'Winter Cup',
  'win_invitational': 'Winter Invitational',
  'win_major': 'Winter Major',
  'spr_open':'Spring Open',
  'spr_cup': 'Spring Cup',
  'spr_invitational': 'Spring Invitational',
  'spr_major': 'Spring Major'
}

eventOrder = {
  '2021-2022': [
    'fall_reg1', 'fall_reg2', 'fall_reg3', 'fall_maj', 'win_reg1', 'win_reg2',
    'win_reg3', 'win_maj', 'spr_reg1', 'spr_reg2', 'spr_reg3', 'spr_maj'
  ],
  'else': [
    'fall_open', 'fall_cup', 'fall_invitational', 'fall_major', 'win_open',
    'win_cup', 'win_invitational', 'win_major', 'spr_open', 'spr_cup',
    'spr_invitational', 'spr_major'
  ]
}
currentEventOrder = current_season === '2021-2022' ?
  eventOrder['2021-2022'] :
  eventOrder['else'];


// Region formal names
regionFormName = {
  '2021-2022':{
    'na':'North America',
    'eu':'Europe',
    'oce':'Oceania',
    'sam':'South America',
    'mena':'MENA',
    'apacn':'APAC North',
    'apacs':'APAC South',
    'ssa':'SSA'
  },
  'else':{
    'na':'North America',
    'eu':'Europe',
    'oce':'Oceania',
    'sam':'South America',
    'mena':'MENA',
    'apac':"Asia-Pacific",
    'ssa':'SSA'
  }
}
regionFormNameKeys = current_season === '2021-2022' ?
  Object.keys(regionFormName['2021-2022']) :
  Object.keys(regionFormName['else']);

currentFormName = current_season === '2021-2022' ?
  regionFormName['2021-2022'] :
  regionFormName['else'];

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

/**
* Dims all teams that are not the team currently hovered over
* and displays the toolTip
* @param {Event} e
* @return {toolTip}
*/
function onHover(e) {
  bumpSvg.selectAll('.teams')
    .classed('dimmed', function(d) {
      return d.team !== e.team;
    });
  return toolTip.show(e);
}

/**
* Undimmes all teams and hides the tooltip
* @param {Event} e
* @return {toolTip}
*/
function offHover(e) {
  bumpSvg.selectAll('.teams')
    .classed('dimmed', false);
  return toolTip.hide(e);
}


// Create BumpTeam constructor function
/**
* Creates a new BumpTeam Object
* @param {String} team
* @param {String} color
*/
function BumpTeam(team, color) {
  this.team = team;
  this.color = color;
}

/**
* Initiate the BumpTeam object
*/
BumpTeam.prototype.init = function() {
}

/**
* Update bump team information
* @param {Node} g
* @param {Array} data
* @param {Object} teamColorMap
* @param {Function} eventScale
* @param {Function} rankScale
*/
BumpTeam.prototype.update = function(g, data, teamColorMap, eventScale, rankScale) {

  // get the data for this team
  this_data = data[teamColorMap[this.team] - 1].values;
  first_data = this_data[0]; // first event data
  last_data = this_data[this_data.length - 1]; // last event data

  // get this team's starting node
  var teamG = d3.select(g);

  // store _this for later use
  var _this = this;

  // add text
  teamG.append('text') // text for the left team
    .attr('class', 'leftName')
    .text(function() {
      return first_data.team;
    })
    .attr('transform', function() {
      box = this.getBoundingClientRect();
      return (`
        translate(${eventScale(EVENT_MIN) + svgMargin.l - box.width - AXIS_TEXT_BUFFER},
        ${rankScale(parseInt(first_data.ranking)) - BUMP_CIRC_RAD * 3/2})
      `)
    })
    .classed('moreTopN', function() {  return first_data.ranking > TOP_N;  });

  teamG.append('text') // text for the right team
    .attr('class', 'rightName')
    .text(function() {
      return last_data.team;
    })
    .attr('transform', function() {
      box = this.getBoundingClientRect();
      return (`
      translate(${eventScale(this_data.length) + svgMargin.l + AXIS_TEXT_BUFFER},
      ${rankScale(parseInt(last_data.ranking)) - BUMP_CIRC_RAD * 3/2})
      `)
    })
    .classed('moreTopN', function() {  return last_data.ranking > TOP_N;  });



  //draw lines between circles
  var teamLines = teamG.append('g') // create line group
    .attr('class', 'teamLine')

  var lines = teamLines.selectAll('.bumpLine') // set data to this_data
    .data(this_data);

  var linesEnter = lines.enter() // enter the data with lines
    .append('line')
    .attr('class', 'bumpLine')
    .style('stroke', _this.color);

  linesEnter.on('mouseover', onHover) // add hover event listeners
    .on('mouseout', offHover);

  lines.merge(linesEnter) // merge with previous data
    .attr("x1", function(d, i) {
      if (i != 0) { // do not draw if the first list of data
        this_event = parseInt(this_data[i-1].event);
        if (this_data[i-1].ranking > TOP_N) {
          x1 = this_event + 0.5;
        } else {
          x1 = this_event;
        }
        return eventScale(x1) + svgMargin.l;
      }
    })
    .attr("y1", function(d, i) {
      if (i != 0) {
        if (this_data[i-1].ranking > TOP_N) {
          y1 = TOP_N;
        } else {
          y1 = parseInt(this_data[i-1].ranking)
        }
        return rankScale(y1) + Y_AXIS_TRAN_Y;
      }
    })
    .attr("x2", function(d, i) {
      if (i != 0) {
        return eventScale(parseInt(d.event)) + svgMargin.l;
      }
    })
    .attr("y2", function(d, i) {
      if (i != 0) {
        return rankScale(parseInt(d.ranking)) + Y_AXIS_TRAN_Y;
      }
    })
    .classed('deduct', function(d, i) { // if the score change is negative, add deduct class
      return ((i !== 0) && (parseInt(d.score_change) < 0));
    })
    .classed('moreTopN', function(d) { // if the ranking is more than the TopN, add moreTopN class
      return d.ranking > TOP_N;
    });

  lines.exit().remove(); // exit and remove data


  // draw dots
  var teamDots = teamG.append('g') // create dot group
    .attr('class', 'teamDot');

  var dots = teamDots.selectAll('.bumpDotG') // set data to this data
    .data(this_data);

  var dotsEnter = dots.enter() // enter the dot dat
    .append('g')
    .attr('class', 'bumpDotG')


  dotsEnter.append('circle') // append a circle
    .attr('class', 'bumpDot')
    .style('fill', _this.color)
    .attr('r', `${BUMP_CIRC_RAD}px`);

  dotsEnter.append('text') // add circle text with the ranking
    .text(function(d) {
      return d.ranking;
    })
    .attr('dx', function() {
      return 0;
    })
    .attr('dy', function() {
      box = this.getBoundingClientRect()
      return (box.height / 4);
    })
    .attr('class', 'teamText');

  dotsEnter.on('mouseover', onHover) // add hover event listener
    .on('mouseout', offHover);

  dots.merge(dotsEnter) // merge with previous data
    .attr('transform', function(d) {
      if (d.ranking > TOP_N) {
        yTran = YTRAN;
      } else {
        yTran = rankScale(parseInt(d.ranking)) + Y_AXIS_TRAN_Y;
      }
      return `translate(
        ${eventScale(parseInt(d.event)) + svgMargin.l},
        ${yTran}
      )`;
    });

  dots.exit().remove(); // exit and remove
}

// define eventScale
var eventScale = d3.scaleLinear()
.domain([EVENT_MIN, EVENT_MAX]).range(
  [svgMargin.l, svgWidth - (svgMargin.r + svgMargin.l * 2)]
);

// create array to store the team objects
var teamObjects = [];

// load in data
d3.csv('../data/rlcs_full_ranks.csv').then(function(dataset) {
  rlcs_ranks = dataset; // store as global variable
  bumpSvg = svg.append('g') // create main group
    .attr('class', 'bumpSvg')

  var legend = svg.append('g').attr('class', 'legend'); // create legend group

  legend.append('rect') // build rectangle
    .attr('width', LEGEND_WIDTH)
    .attr('height', LEGEND_HEIGHT)
    .attr('class', 'legRect')
    .attr('transform', `translate(
      ${svgWidth - LEGEND_BUFFER}, ${REG_SEL_HEIGHT / 4}
    )`);

  legend.append('line') // build line for legend
    .attr('x1', svgWidth - LEGEND_BUFFER + REG_TEXT_BUFFER - 5)
    .attr('x2', svgWidth - LEGEND_BUFFER + REG_TEXT_BUFFER + 40)
    .attr('y1', REG_SEL_HEIGHT * 3/4)
    .attr('y2', REG_SEL_HEIGHT * 3/4)
    .attr('class', 'legLine deduct');

  legend.append('text') // add legend text
    .text('=')
    .attr('transform', `translate(
      ${svgWidth - LEGEND_BUFFER + REG_TEXT_BUFFER + 43},
      ${REG_SEL_HEIGHT * 3/4 + 4}
    )`)
    .attr('class', 'legText');

  legend.append('text') // add legend text
    .text('Deduction due')
    .attr('transform', `translate(
      ${svgWidth - LEGEND_BUFFER + REG_TEXT_BUFFER + 53},
      ${REG_SEL_HEIGHT * 3/4 - 4}
    )`)
    .attr('class', 'legText');

  legend.append('text') // add legend text
    .text('to team change')
    .attr('transform', `translate(
      ${svgWidth - LEGEND_BUFFER + REG_TEXT_BUFFER + 53},
      ${REG_SEL_HEIGHT * 3/4 + 8}
    )`)
    .attr('class', 'legText');

  var info = svg.append('g').attr('class', 'info'); // add info group

  repo_distance = 0;
  var repo_info = info.append('text')
      .text('GitHub Repo')
      .attr('transform', function() {
        box = this.getBoundingClientRect();
        repo_distance = svgWidth - box.width - REG_TEXT_BUFFER;
        return `translate(${repo_distance}, ${svgHeight - BUMP_CIRC_RAD})`;
      });

  repo_info.on('click', function() {
    this.classList.add('infoVisited');
    window.open (GITHUB_REPO_LINK, '_blank');
  });

  var data_info = info.append('text')
      .text('Team Ranking Data Source')
      .attr('transform', function() {
        box = this.getBoundingClientRect();
        data_distance = repo_distance - box.width - REG_TEXT_BUFFER;
        return `translate(${data_distance}, ${svgHeight - BUMP_CIRC_RAD})`
      });

  data_info.on('click', function() {
    this.classList.add('infoVisited');
    window.open (LIQUIPEDIA_RANK_LINK, '_blank');
  });

  // add tabs to change between 2021-2022 and 2022-2023 seasons
  var seasonTags = svg.append('g').attr('class', 'tags');

  var thisSeasonsTag;

  for (var i = 0; i < ALL_SEASONS.length; i++) {
    thisSeasonsTag = seasonTags.append('g')
      .attr('class', 'tag')
      .attr('transform', `translate(${eventScale(EVENT_MIN) + svgMargin.l + (TAG_WIDTH * 1.25) * i},${svgHeight})`);

    thisSeasonsTag.append('path')
      .attr('d', `M0 0 L0 ${-TAG_HEIGHT} L${TAG_WIDTH} ${-TAG_HEIGHT} L${TAG_WIDTH} 0`)
      .attr('class', 'tagPath')
      .classed('tagClickedPath', function() {return ALL_SEASONS[i] === current_season;});


    thisSeasonsTag.append('text')
      .text(ALL_SEASONS[i])
      .attr('class', 'tagText')
      .classed('tagClickedText', function() {return ALL_SEASONS[i] === current_season;})
      .attr('transform', function() {
        box = this.getBoundingClientRect();
        tranX = (TAG_WIDTH - box.width) / 2;
        tranY = box.height / -4;
        return `translate(${tranX},${tranY})`;
      });


    thisSeasonsTag.on('click', updateSeason);

  }


  updateChart('na') // update the chart with North America as default region
});

/**
* Update season and chart when a season tag is clicked
*/
function updateSeason() {
  _this = this;
  thisText = _this.children[1].textContent;
  if (thisText !== current_season) {
    // remove the clicked tag classes from the current selected tag
    document.querySelector('.tagClickedPath')
      .classList.remove('tagClickedPath');
    document.querySelector('.tagClickedText')
      .classList.remove('tagClickedText');

    // add the clicked classes to the currently clicked on tag
    _this.children[0].classList.add('tagClickedPath');
    _this.children[1].classList.add('tagClickedText');

    // update current season
    current_season = thisText;

    // update chart
    current_region = Object.keys(currentFormName).find(
      key => currentFormName[key] === document.querySelector('.regText').textContent
    );
    updateChart(current_region);
  }
}

/**
* Remove region selector selections from the screen
*/
function delSelections() {
  var selections = document.querySelectorAll('.selections');

  selections.forEach(selection => {
    selection.remove();
  });
}

/**
* Remove region selector selections from the screen with checks if the user
* clicked outside of the selection results
*/
function delSelectionsOutside() {
  selectionBounds = {
    'x1':svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER,
    'x2':svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER + REG_SEL_WIDTH,
    'y1':REG_SEL_HEIGHT / 4,
    'y2':REG_SEL_HEIGHT / 4 + REG_SEL_HEIGHT * (regionFormNameKeys.length+1)
  }
  this_pos = d3.mouse(this);
  if ((this_pos[0] < selectionBounds['x1'] || this_pos[0] > selectionBounds['x2']) ||
      (this_pos[1] < selectionBounds['y1'] || this_pos[1] > selectionBounds['y2'])) {
    delSelections();
  }
}

/**
* Displays the region selections
* @param {Node} g
* @param {String} current_region
*/
function genSelections(g, current_region) {
  var sels = g.append('g') // selections group
    .attr('class', 'selections')

  // for every region, draw a selection
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

    // Add region names
    new_sel.append('text')
      .text(currentFormName[regionFormNameKeys[i]])
      .attr(
        'transform',
        `translate(
          ${svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER + REG_TEXT_BUFFER},
          ${REG_SEL_HEIGHT * 15/16 + REG_SEL_HEIGHT * (i+1)}
        )`
      )
      .attr('class', 'regText dimmed');


    // if the region is the one currently selected, bold it
    if (regionFormNameKeys[i] === current_region) {
      new_sel.classed('bolden', true);
    }

    new_sel.on('mouseover', function() { // undim the selection when mouse is over it
      this.children[1].classList.remove('dimmed');
    })
      .on('mouseout', function() { // redim when the mouse moves off
        this.children[1].classList.add('dimmed');
      })
      .on('click', function() {
        // onclick, update the chart, set the current region, and delete the region selections
        current_region = Object.keys(currentFormName).find(
          key => currentFormName[key] === this.children[1].textContent
        );
        delSelections();
        updateChart(current_region);
      });
  }
}

/**
* Generates the Region Selector
* @param {String} current_region
*/
function genRelSel(current_region) {
  var regSel = svg.append('g') // region selector group
    .attr('class', 'regSel')

  regSel.append('rect')
    .attr('width', REG_SEL_WIDTH)
    .attr('height', REG_SEL_HEIGHT)
    .attr('transform', `translate(${svgWidth - REG_SEL_WIDTH - REG_SEL_BUFFER}, ${REG_SEL_HEIGHT / 4})`);

  regSel.append('text')
    .text(currentFormName[current_region])
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

  // add selector click
  selector.on('click', function() {genSelections(regSel, current_region)});
  // add an event listener on the body to check if it is being clicked on outside
  d3.select("body").on('click', delSelectionsOutside);
}

/**
* Updates the bump chart with the new regions data
* @param {String} current_region
*/
function updateChart(current_region) {
  // remove all elements from svg
  var bumpSvg_node = document.querySelector(".bumpSvg");
  while (bumpSvg_node.firstChild) {
    bumpSvg_node.removeChild(bumpSvg_node.firstChild);
  }


  genRelSel(current_region); // generate region selector

  // Create main title
  bumpSvg.append('text').attr('class', 'mainTitle')
    .text(`RLCS Season ${current_season} ${currentFormName[current_region]} Worlds Points`)
    .attr('transform', 'translate(10, 44)');

  // filter the data for regions equal to the current region
  var filtData = rlcs_ranks.filter(function(d) {
    return (d.region === current_region && d.season === current_season);
  })

  // nest data to events
  var nestedEvents = d3.nest()
    .key(function(c) {
      return c.event;
    })
    .entries(filtData);
  // nest data to teams
  var nestedTeams = d3.nest()
    .key(function(v) {
      return v.team;
    })
    .entries(filtData);

  // get all the team names in array
  var teamNames = d3.map(filtData, function(d){return d.team;}).keys()
  // assign each team a color
  var teamColorMap = {};
  for (let i = 0; i < teamNames.length; i++) {
    teamColorMap[teamNames[i]] = i+1
  }

  // Set up axis for the bump chart
  // get maxRank
  var maxRank = d3.max(filtData, function(d){return parseInt(d.ranking);});
  // if the maxRank is greater than the Top N, use Top N
  maxRank = maxRank > TOP_N ? TOP_N : maxRank;

  // define rankScale
  var rankScale = d3.scaleLinear()
    .domain([1, maxRank]).range([svgMargin.t, svgHeight - svgMargin.b]);

  // add event axis
  bumpSvg.append('g').attr('class', 'x axis')
    .attr('transform', function(d) {
      box = this.getBoundingClientRect();
      tranX = svgMargin.l;
      tranY = svgHeight - (svgMargin.b);

      return `translate(${tranX}, ${tranY})`;
    })
    .call(d3.axisBottom(eventScale).tickFormat(function(d){
      return eventFormName[currentEventOrder[d-1]];
    }));


  // add circles to chart
  // define color scale
  let colorScale = d3.scaleSequential()
    .domain([1, teamNames.length])
    .interpolator(d3.interpolateRainbow);

  // add team objects
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

  // add all teams objects onto the svg
  var teamEnter = bumpSvg.selectAll('.teams')
    .data(teamObjects)
    .enter()
    .append('g')
    .attr('class', 'teams');

  // update each team
  teamEnter.each(function(teams) {
    teams.init(this);
    teams.update(this, nestedTeams, teamColorMap, eventScale, rankScale);
  });
}
