d3.queue()
	.defer(d3.csv,'./data/hubway_trips_reduced.csv',parseTrips)
	.defer(d3.csv,'./data/hubway_stations.csv',parseStations)
	.await(dataLoaded);

function dataLoaded(err,trips,stations){
	console.log(trips);
	console.log(stations);

	//create a crossfilter
	var cf = crossfilter(trips);

	//Create dimensions on duration, startStn, endStn, startTime, endTime, userType
	var tripsByDuration = cf.dimension(function(d){return d.duration});
	//...

/*	Part 1: the Basics
	Crossfilter dimensions have the .top() and .bottom() methods to return records from the crossfilter
*/	
	//Top 50 trips by duration?

	//All trips, sorted by startTime?


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


	//Same as the previous one, except in the year 2013
	//Sorted by duration


	//All trips ending in station 18 in the year 2013, sorted by time of arrival


/*	Part 3: group by dimension
	Records can be grouped in hierarchies based on similar values on a dimensions

	For example, all of our trips can be grouped by the startStn dimension

	By default, all of the records in each group will be reduced to a "count"

	!!!Groups observe filters on other dimensions!!!
*/
	//Construct a group on the startStn dimension


	//What's wrong with the previous one? How do we fix it?


	//Advanced: how do we tell the group not to automatically reduce by count?


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