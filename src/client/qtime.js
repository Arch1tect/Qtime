var INIT_OPT_LIST = [{'text': 'all category', 'value':''}];

// bootstrap the qtime
var qtime = new Vue({
	el: '#qtime-wrapper',
	data: {

		login: false,
		username: null,
		token: null,

		showModal: false,
		loginPopup: null,
		
		ajaxMsg: 'hi',

		editCellName: '',
		editCellValObj: {},
		editEntry: '',

		searchQuery: '',
		gridColumns: ['name', 'duration', 'category', 'link', 'note'],
		gridData: [],

		durationMin: 0,
		durationMax: 0,

		newEntryName: '',
		newEntryDuration: '',
		newEntryCategory: '',
		newEntryLink: '',
		newEntryNote: '',

		newEntryCandidates: [], // parse from imdb
		options: JSON.parse(JSON.stringify(INIT_OPT_LIST)),
		selectedCategory: []

	}, 
	mounted: function () {

		var that = this;
		this.$nextTick(function () {
			document.addEventListener("keydown", function(e) {

				if (e.keyCode == 27) {
					console.log('esc');
					// close cadidates drop down
					that.closeCandidateDropdown();

					// close edit cell modal
					that.showModal = false;
				}
			})  
		})

		// $(window).scroll(function(event) {

		//     var margin = ($(window).height() - $("#leftWrapper").height())/2;
		//     $("#leftWrapper").stop().animate({"top": top+"px"}, "fast" );


		// });

	},
	watch: {
		selectedCategory: function(){
			this.scrollToTop();
		},

		durationMin: function(){
			this.scrollToTop();
		},

		durationMax: function(){
			this.scrollToTop();
		}

	},
	methods: {

		scrollToTop: function () {

			// $("#leftWrapper").css("margin-top", "0px");
			// $(window).scrollTop(false); // put false here so it won't trigger .scroll again
		
		},
		getPublicData: function () {
			// Go fetch the data
			// populate the grid and also category options
			$.get("/api/public", function(jsonData, status){
			  
			  var optionsSet = {};
			  qtime.options = JSON.parse(JSON.stringify(INIT_OPT_LIST));
			  // load categories into optionsArray
			  for (var i=0; i<jsonData.array.length; i++) {
			    var entry = jsonData.array[i];
			    if (! (entry.category in optionsSet))
			      optionsSet[entry.category] = true;
			  }

			  for (var key in optionsSet) {
			    qtime.options.push({'text':key, 'value': key});
			  }

			  qtime.gridData = jsonData['array'].reverse();
			    
			});
		},
		logout: function () {

			Cookies.remove('token');
			location.reload();

		},
		newEntryNameChanged: function (event) {
		// only fired when user input, on keyup

		if (event.keyCode == 27 || event.keyCode == 32) //except esc and space button
			return;

		var query = this.newEntryName.replace(/\s+/g, '+').toLowerCase();
		if (!query)
			return;

		var that = this;
		$.get("http://www.omdbapi.com/?s="+query, 
			function(jsonData, status){
				that.newEntryCandidates = [];
				if (jsonData.Search){
					that.newEntryCandidates = jsonData.Search;
					$('#addEntryCandidate').show();
				}
				console.log("omdb: "+status);
			})

		},
		closeCandidateDropdown: function () {

			// here we have to use setTimeout because when click on a candidate
			// blur event is fired before click event, so click event won't really be fired
			setTimeout(function() {
			this.newEntryCandidates = [];
			$('#addEntryCandidate').hide();
			},200);

		},
		pickCandidate: function (candidate) {
			console.log('click candidate');
			this.newEntryName = candidate.Title;
			this.newEntryCategory = candidate.Type;
			this.newEntryLink = "http://www.imdb.com/title/"+candidate.imdbID;
			if (candidate.Year)
			this.newEntryNote = "Made in " + candidate.Year;
			this.closeCandidateDropdown();
		},
		addEntry: function (event) {
			var gridData = this.gridData;
			var newEntry = {
				name: this.newEntryName,
				duration: this.newEntryDuration? parseInt(this.newEntryDuration): '', 
				category: this.newEntryCategory, 
				link: this.newEntryLink,
				note: this.newEntryNote
			};

			$.ajax({
				type: "POST",
				contentType : 'application/json',
				url: 'api/add-entry',
				dataType: 'json',
				headers: {"Authorization": "Basic " + btoa(qtime.username + ":" + qtime.token)},
				data: JSON.stringify(newEntry),
				success: function (data) {
					showAjaxMsg(newEntry['name']+' is added!');
					console.log('Add entry success, id: '+ data.id);
					newEntry.id = data.id;
					gridData.unshift(newEntry);
				}
			});
		  
			this.newEntryName = '';
			this.newEntryDuration = '';
			this.newEntryLink = '';
			this.newEntryCategory = '';
			this.newEntryNote = '';
		}
	}
})

qtime.$on('login', function (username, token) {

	qtime.username = username;
	qtime.token = token;
	qtime.login = true;
	//once login, get user's own data
	$.ajax({
		type: "GET",
		contentType : 'application/json',
		url: 'api/data',
		dataType: 'json',
		headers: {"Authorization": "Basic " + btoa(username + ":" + token)},
		success: function (jsonData) {

			var optionsSet = {};
			qtime.options = JSON.parse(JSON.stringify(INIT_OPT_LIST));
			// load categories into options
			for (var i=0; i<jsonData.array.length; i++) {
				var entry = jsonData.array[i];
				if (! (entry.category in optionsSet))
				optionsSet[entry.category] = true;
			}

			for (var key in optionsSet) {
				qtime.options.push({'text':key, 'value': key});
			}

			qtime.gridData = jsonData['array'].reverse();

		},
		error: function () {
			alert('Error! Failed to load user data');
		}
	});

	

});

qtime.$on('edit', function (entry, key) {
	this.editEntry = entry;
	this.editCellName = key;
	this.editCellValObj = {val:entry[key]}; // hacky way, wonder what's better way
	this.showModal = true;

	Vue.nextTick(function () {
		$('textarea').focus();
		$('textarea').select();
	});

});
function showAjaxMsg(msg) {
	qtime.ajaxMsg = msg;
	if (typeof showAjaxMsgTimeout != 'undefined')
		clearTimeout(showAjaxMsgTimeout);
	$('#ajaxMsg').fadeIn();
	showAjaxMsgTimeout = setTimeout(function(){$('#ajaxMsg').fadeOut();}, 3000);
}
qtime.$on('save', function () {

	var entry = this.editEntry;
	var key = this.editCellName;
	var val = this.editCellValObj.val; // hacky way, wonder what's better way
  
	//del whole entry
	if (val==='xxx') {
	
		console.log('deleting entry');

		$.ajax({
			type: "DELETE",
			contentType : 'application/json',
			url: 'api/delete-entry',
			dataType: 'json',
			data: JSON.stringify({ "id": entry.id}),
			headers: {"Authorization": "Basic " + btoa(qtime.username + ":" + qtime.token)},

			success: function () {
				showAjaxMsg(entry['name']+' is deleted!');
				qtime.gridData.splice(qtime.gridData.indexOf(entry),1);
			},
			error: function () {
				alert('error! failed to delete');
			}
		});

	}else{
		if (val && key === 'duration')
			val = parseInt(val);
		console.log('changing entry value from '+entry[key]+'to '+val);
	
		//request server to update change
		$.ajax({
			type: "PUT",
			contentType : 'application/json',
			url: 'api/change-entry',
			dataType: 'json',
			headers: {"Authorization": "Basic " + btoa(qtime.username + ":" + qtime.token)},
			data: JSON.stringify({ "id": entry.id, "colName" :key, "val": val }),
			success: function () {

				showAjaxMsg(entry['name']+' is modified!');
				entry[key] = val;
			},
			error: function () {
				alert('error');
			}
		});

	}

	this.showModal = false;

});


