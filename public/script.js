d3.queue()
	.defer(d3.csv,'./data/hubway_trips_reduced.csv',parseTrips)
	.defer(d3.csv,'./data/hubway_stations.csv',parseStations)
	.await(dataLoaded);

function dataLoaded(err,trips,stations){
	//create a crossfilter
	var cf = crossfilter(trips);

	//Create dimensions on duration, startStn, endStn, startTime, endTime, userType, year
	var tripsByDuration = cf.dimension(function(d){return d.duration}),
		tripsByStartTime = cf.dimension(function(d){return d.startTime})
		tripsByEndTime = cf.dimension(function(d){return d.endTime}),
		tripsByStartStn = cf.dimension(function(d){return d.startStn}),
		tripsByEndStn = cf.dimension(function(d){return d.endStn}),
		tripsByType = cf.dimension(function(d){return d.userType}),
		tripsByYear = cf.dimension(function(d){return d.startTime.getFullYear()});

/*	Part 1: the Basics
	Crossfilter dimensions have the .top() and .bottom() methods to return records from the crossfilter
*/	
	//Top 50 trips by duration?
	console.log('Top 50 trips by duration');
	console.log(tripsByDuration.top(50));
	//All trips, sorted by startTime?
	console.log('All trips sorted by startTime in ascending order');
	console.log(tripsByStartTime.bottom(Infinity));

/*	Part2: apply filters on dimensions
	Dimensions can be filtered using 
		.filter
		.filterExact(value)
		.filterRange([min,max])
		.filterFunction(function)
	or unfiltered using
		.filterAll()

	Filters are "stateful" i.e. remembered by the crossfilter. 
	Thus, a filter on dimension A will remain active as you apply another filter on dimension B
*/
	//Trips originating from station id 4, ending in station id 18, in the year 2012
	//Sorted by duration
	tripsByStartStn.filter('4');
	tripsByEndStn.filter('18');
	tripsByYear.filter(2012);

	console.log('Trips originating from station id 4, ending in station id 18, in the year 2012')
	console.log(tripsByDuration.top(Infinity));

	//Same as the previous one, except in the year 2013
	//Sorted by duration
	tripsByYear.filter(2013);

	console.log('Trips originating from station id 4, ending in station id 18, in the year 2013')
	console.log(tripsByDuration.top(Infinity));

	//All trips ending in station 18 in the year 2013, sorted by time of arrival
	tripsByStartStn.filter(null);

	console.log('Trips ending in station id 18, in the year 2013')
	console.log(tripsByEndTime.top(Infinity));

/*	Part 3: group by dimension
	Records can be grouped in hierarchies based on similar values on a dimensions

	For example, all of our trips can be grouped by the startStn dimension

	By default, all of the records in each group will be reduced to a "count"

	!!!Groups observe filters on other dimensions!!!
*/
	//Construct a group on the startStn dimension
	var tripsByStartStnGroup = tripsByStartStn.group(function(d){return d});
	console.log('*****')
	console.log('Trips grouped by startStn')
	console.log(tripsByStartStnGroup.top(Infinity));

	//What's wrong with the previous one? How do we fix it?
	tripsByEndStn.filterAll();
	tripsByYear.filterAll();
	console.log('Trips grouped by startStn, 2nd try')
	console.log(tripsByStartStnGroup.top(Infinity));

	//Advanced: how do we tell the group not to automatically reduce by count?
	tripsByStartStnGroup.reduce(
		function(p,v){
			p.totalDuration += v.duration;
			p.count += 1;
			p.avgDuration = p.totalDuration/p.count;
			return p;
		},
		function(p,v){
			p.totalDuration -= v.duration;
			p.count -= 1;
			p.avgDuration = p.totalDuration/p.count;
			return p;
		},
		function(){
			return {
				totalDuration:0,
				count:0,
				avgDuration:0
			};
		}
	);
	tripsByStartStnGroup.order(function(d){return d.avgDuration});
	console.log('Trips grouped by startStn, showing count and average trip duration')
	console.log(tripsByStartStnGroup.top(Infinity));

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