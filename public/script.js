/*Example 2: This example demonstrates using Bootstrap UI elements to interact with crossfilter
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
}

function update(arr){
	console.log('--------crossfilter:update--------');
	console.log('Start station: ' + stationMap.get(startStation));
	console.log('End station: ' + stationMap.get(endStation));
	console.log(arr);
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