/*Example 3: This example is meant to demonstrate a few things:
* how we might begin to structure code so it's more modular
* review the enter-exit-update pattern in full
*/
var m = {t:85,r:100,b:50,l:100},
	w = document.getElementById('plot1').clientWidth - m.l - m.r,
	h = document.getElementById('plot1').clientHeight - m.t - m.b;
var plots = d3.selectAll('.plot')
	.append('svg')
	.attr('width', w + m.l + m.r)
	.attr('height', h + m.t + m.b)
	.append('g')
	.attr('class','canvas')
	.attr('transform','translate('+m.l+','+m.t+')');
var plot1 = plots.filter(function(d,i){ return i===0;}),
	plot2 = plots.filter(function(d,i){return i===1}).classed('time-series',true);

//Use a d3 map to store the list of station name, station id pairs as a map
//d3 Methods to review
	//d3.map()
var	startStation = null, endStation = null,
	stationMap = d3.map();

d3.queue()
	.defer(d3.csv,'./data/hubway_trips_reduced.csv',parseTrips)
	.defer(d3.csv,'./data/hubway_stations.csv',parseStations)
	.await(dataLoaded);

function dataLoaded(err,trips,stations){
	//create a crossfilter
	//and add dimensions for start and end stations
	var cf = crossfilter(trips);
	var tripsByStartStn = cf.dimension(function(d){return d.startStn}),
		tripsByEndStn = cf.dimension(function(d){return d.endStn});

	//Listen for changes in the dropdown menus
	d3.select('#start-station')
		.selectAll('.station')
		.on('click',function(){ 
			startStation = $(this).data('id'); //note how the 'data-id' attribute is retrieved
			tripsByStartStn.filter(startStation.toString());
			update( tripsByStartStn.top(Infinity) );
		});
	d3.select('#end-station')
		.selectAll('.station')
		.on('click',function(){
			endStation = $(this).data('id');
			tripsByEndStn.filter(endStation.toString());
			update( tripsByEndStn.top(Infinity) );
		});

	//A large blcok of code: how do we refractor this?
}

function update(arr){
	console.log(stationMap.get(startStation) + ' to ' + stationMap.get(endStation));
	console.log(arr);

	drawDurationHistogram(arr,plot1);
	drawTimeSeries(arr,plot2);
}

function drawDurationHistogram(arr,plot){
	var MIN_DURATION = 0, MAX_DURATION = 3600; //Note the naming convention: all caps indicate constants
	var histogramDuration = d3.histogram()
		.value(function(d,i){return d.duration})
		.domain([MIN_DURATION,MAX_DURATION])
		.thresholds(d3.range(MIN_DURATION,MAX_DURATION,60));

	//Represent
	var scaleX = d3.scaleLinear().domain([MIN_DURATION,MAX_DURATION]).range([0,w]),
		scaleY = d3.scaleLinear().domain([0,d3.max(histogramDuration(arr),function(d){return d.length})]).range([h,0]);

	var bins = plot.classed('histogram',true).selectAll('.bin')
		.data(histogramDuration(arr)); //UPDATE

	var binsEnter = bins.enter()
		.append('rect').attr('class','bin')
		.attr('x',function(d){return scaleX(d.x0)})
		.attr('width',function(d){return scaleX(d.x1) - scaleX(d.x0)});

	bins.merge(binsEnter)
		.attr('x',function(d){return scaleX(d.x0)})
		.attr('width',function(d){return scaleX(d.x1) - scaleX(d.x0)})
		.transition()
		.attr('y', function(d){return scaleY(d.length)})
		.attr('height',function(d){return h - scaleY(d.length)});

	bins.exit().remove();

	//x and y axis
	var xAxis = d3.axisBottom()
		.scale(scaleX)
		.tickValues(d3.range(MIN_DURATION,MAX_DURATION+1,60*5))
		.tickFormat(function(tick){return tick/60 + " min"});

	var xAxisNode = plot.selectAll('.axis-x')
		.data([0]);

	xAxisNode
		.enter()
		.append('g').attr('class','axis axis-x')
		.attr('transform','translate(0,'+h+')')
		.merge(xAxisNode)
		.transition()
		.call(xAxis);
}

function drawTimeSeries(arr,plot){
	//Time-series
	var t0 = new Date(2011,0,1), t1 = new Date(2013,11,31),
		tThresholds = d3.timeDay.range(t0,t1,1); //interval.range(start, stop[, step]

	var histogramTime = d3.histogram()
		.domain([t0,t1])
		.value(function(d){return d.startTime})
		.thresholds(tThresholds);

	//Represent
	//Line and area
	//Note: new scale function
	var scaleXTime = d3.scaleTime()
		.domain([t0,t1])
		.range([0,w]);
	var scaleYTime = d3.scaleLinear()
		.domain([0,d3.max(histogramTime(arr),function(d){return d.length})])
		.range([h,0])

	var line = d3.line()
		.x(function(d){return scaleXTime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
		.y(function(d){return scaleYTime(d.length)});

	var area = d3.area()
		.x(function(d){return scaleXTime(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
		.y1(function(d){return scaleYTime(d.length)})
		.y0(h);

	var areaNode = plot.selectAll('.area')
		.data([histogramTime(arr)]);
	areaNode.enter()
		.append('path').attr('class','area')
		.merge(areaNode)
		.transition()
		.attr('d',area);

	var lineNode = plot.selectAll('.line')
		.data([histogramTime(arr)]);
	lineNode.enter()
		.append('path').attr('class','line')
		.merge(lineNode)
		.transition()
		.attr('d',line);

	//Axis
	var xAxis = d3.axisBottom()
		.scale(scaleXTime)
		.tickValues(null)
		.tickFormat(null)
		.ticks(d3.timeMonth.every(3));
	var yAxis = d3.axisLeft()
		.tickSize(-w)
		.ticks(5)
		.scale(scaleYTime);

	var xAxisNode = plot.selectAll('.axis-x')
		.data([0]);
	xAxisNode.enter()
		.append('g').attr('transform','translate(0,'+h+')')
		.attr('class','axis axis-x')
		.merge(xAxisNode)
		.transition()
		.call(xAxis);

	var yAxisNode = plot.selectAll('.axis-y')
		.data([0]);
	yAxisNode.enter()
		.insert('g','.line').attr('class','axis axis-y')
		.merge(yAxisNode)
		.transition()
		.call(yAxis);

}

function parseTrips(d){
	return {
		bike_nr:d.bike_nr,
		duration:+d.duration,
		startStn:d.strt_statn,
		startTime:parseTime(d.start_date),
		endStn:d.end_statn,
		endTime:parseTime(d.end_date),
		userType:d.subsc_type,
		userGender:d.gender?d.gender:undefined,
		userBirthdate:d.birth_date?+d.birth_date:undefined
	}
}

function parseStations(d){
	//Populate stationMap
	stationMap.set(d.id,d.station);

	//Populate the two drop-down menus
	d3.select('.control').select('#start-station')
		.append('li')
		.append('a')
		.attr('href','#')
		.attr('data-id',d.id) //note the use of "data-" attributes; you can do this to store data on any HTML element
		.attr('class','station')
		.html(d.station);

	d3.select('.control').select('#end-station')
		.append('li')
		.append('a')
		.attr('href','#')
		.attr('data-id',d.id)
		.attr('class','station')
		.html(d.station);

	return {
		id:d.id,
		lngLat:[+d.lng,+d.lat],
		city:d.municipal,
		name:d.station,
		status:d.status,
		terminal:d.terminal
	}
}

function parseTime(timeStr){
	var time = timeStr.split(' ')[1].split(':'),
		hour = +time[0],
		min = +time[1],
		sec = +time[2];

	var	date = timeStr.split(' ')[0].split('/'),
		year = date[2],
		month = date[0],
		day = date[1];

	return new Date(year,month-1,day,hour,min,sec);
}