

function searchDestinationOrgs(searchTerm){
	MapMaker.clearMarkers();
	// Call http://api.aiddata.org/data/destination/organizations?term=Malawi
	$.ajax({
		type: 'GET',
		url:  'http://api.aiddata.org/data/destination/organizations',
		data: {term:searchTerm},
		success:function(response){
			ResultsHandler.setOrgResponse(response.hits[0].name)
			ResultsHandler.setIso3(response.hits[0].iso3)
			ResultsHandler.getReceiverData(response.hits[0].id)
			ResultsHandler.getGisAidData(response.hits[0].id)
		}
	});
}



var ProjectDataHandler = (function(){
	var projectObjs = [];

	return{

		clearProjectTitleList: function(){
			var listHead = document.getElementById('projlist')
			while(listHead.firstChild){
				listHead.removeChild(listHead.firstChild);
			}
		},

		getAllProjects: function(ids){
			projectObjs.length = 0;
			projectObjs = [];
			ProjectDataHandler.clearProjectTitleList()
			for (var i in ids){
				ProjectDataHandler.getProject(ids[i])
			}
		},
		getProject: function(id){
			$.ajax({
				type: 'GET',
				url: 'http://api.aiddata.org/aid/project/' + id,
				success:function(response){
					// projectObjs.push({'response':response.title})
					
					var projTitle = response.title;
					var providers = [];
					if( response.transactions && response.transactions.length > 0){
						for (var x in response.transactions){

							if (response.transactions[x].tr_provider){
								var providerName = response.transactions[x].tr_provider.name
								providers.push(providerName);

							}

						}
					}

					projectObjs.push({'title':projTitle, 'providers':providers})
					var li = document.createElement('li')
					li.className = "list-group-item";
					li.innerHTML = projTitle
					document.getElementById('projlist').appendChild(li)

					
				}
			});
		}

	}


})();



var ResultsHandler = (function(){
	var countryNameField = document.getElementById("resultcountry")
	var iso3field = document.getElementById("iso3")
	var projectcountfield = document.getElementById("projectcount")
	var timespan = '2010,2011,2012,2013,2014,2015'
	return{
		setOrgResponse: function(countryName){
			countryNameField.innerHTML = countryName
		},
		setIso3: function(iso3){
			iso3field.innerHTML = iso3
		},
		getReceiverData: function (receiverId){
			$.ajax({
				type: 'GET',
				url: 'http://api.aiddata.org/aid/receiver',
				data : {ro:receiverId, y:timespan},
				success:function(response){
					projectcountfield.innerHTML = response.project_count + ' projects in '				
				}
			})
		},
		getGisAidData: function(receiverId){
			$.ajax({
				type: 'GET',
				url: 'http://api.aiddata.org/gis/aid',
				data : {ro:receiverId, y:timespan},
				success: function(response){
					var mappedProjIds = MapMaker.processProjectLocationData(response);
					ProjectDataHandler.getAllProjects(mappedProjIds)

			}	
		});
	}
	}
})();

var EventsSetup = (function(){

	return{
		doSetup: function(){
			$('#gobutton').click(function handleSearchDestinationOrgs(){
				
				searchDestinationOrgs($('#destorgsearchfield').val())
			});
		}
	}

})();

var MapMaker = (function(){
	var map;
	
	var lls = []
	var markerList = []
	var markers = new L.MarkerClusterGroup({spiderfyOnMaxZoom: true});

	function assignClickHandler(theMarker, id){
		theMarker.on('click', function(){alert(id)})
	}

	return{
		clearMarkers :function(){
			if(lls.length > 0){
				markers.clearLayers()
				
				lls.length = 0;
				lls = [];

				markerList.length = 0;
				makerList = [];


			}
			
		},

		processProjectLocationData: function(response){
			var projectIds = []
			if (response.items && response.items.length>0){

				document.getElementById('locationscount').innerHTML = response.locations_count + " locations mapped"
				console.log('points response size is ' + response.items.length)

				for (var i in response.items){
					var lat = parseFloat(response.items[i].fields.loc_point.lat)
					var lon = parseFloat(response.items[i].fields.loc_point.lon)
					var ll = new L.LatLng(lat, lon);
					lls.push(ll)
					var theMarker = L.marker(ll);
					markerList.push(theMarker)
					var projId = response.items[i].fields.loc_project_id;
					assignClickHandler(theMarker, projId);

					// make a set of project ids
					if (projectIds.indexOf(projId) == -1){
						projectIds.push(projId)
					}
					// theMarker.on('click', function(){alert(response.items[i].fields.loc_project_id)})

				}
				markers.addLayers(markerList)

				var bounds = L.latLngBounds(lls)
				map.fitBounds(bounds);
				map.addLayer(markers); 
			}
			return projectIds;

		},

		doSetup: function(){
			L.mapbox.accessToken = 'pk.eyJ1Ijoiam9obmRlcmlnZ2kiLCJhIjoiLVhwSTlKRSJ9.ctZzG2VvEiJyk5O_tNwEbQ';
			// Here we don't use the second argument to map, since that would automatically
			// load in non-clustered markers from the layer. Instead we add just the
			// backing tileLayer, and then use the featureLayer only for its data.
			map = L.mapbox.map('map', 'mapbox.streets', {maxZoom: 12});
			
			map.setView([38.9131775, -77.032544], 8);

			
		}
	}

})();

function handlythis(event) {
    if (event.keyCode === 13) {
        searchDestinationOrgs($('#destorgsearchfield').val());
    }
}

$(document).ready(function(){
	EventsSetup.doSetup();
	MapMaker.doSetup();
});