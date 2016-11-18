var INIT_OPT_LIST = [{'text': 'all categories', 'value':''}];

// bootstrap the qtime
var qtime = new Vue({
	el: '#qtime-wrapper',
	data: {

		login: false,
		username: null,
		token: null,

		showModal: false,
		loginPopup: null,
		

		tableOptions: ['Trending', 'My stuff'],
		selectedTable: 'My stuff',

		publicData:null,
		userData:null,

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
	computed: {

		canEdit: function() {
			return this.login && this.selectedTable=="My stuff";
		},

		canAddToMyList: function() {
			return this.login && this.selectedTable!=="My stuff";
		}



	},
	watch: {
		selectedTable: function () {
			if (this.selectedTable === 'Trending') {
				if (this.publicData)
					this.loadData(this.publicData);
				else
					this.getPublicData();
			}
			else
				this.loadData(this.userData);
		},

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
		trendingOrMyStuffTitle: function(option) {
			if (option==="My stuff")
				return "show my stuff";
			else
				return "show trending stuff"
		},
		getPublicData: function () {
			// Go fetch the public trending data
			qRequest('GET', 'api/public', null, this.loadPublicData, 
				function () {alert('Error! Failed to get public data.')}
			);

		},
		getUserData: function () {
			// Go fetch user's personal data
			qRequest('GET', 'api/data', null, this.loadUserData, 
				function () {alert('Error! Failed to get user data')}
			);

		},
		loadPublicData: function (rawJSONData) {
			this.publicData = rawJSONData['array'].reverse();
			this.loadData(this.publicData);
		},
		loadUserData: function (rawJSONData) {
			this.userData = rawJSONData['array'].reverse();
			this.loadData(this.userData);
		},
		loadData: function (jsonData) {
			// populate the grid and also category options
			var optionsSet = {};
			qtime.options = JSON.parse(JSON.stringify(INIT_OPT_LIST));
			// load categories into options
			for (var i=0; i<jsonData.length; i++) {
				var entry = jsonData[i];
				if (entry.category && entry.category !='' && !(entry.category in optionsSet)) 
				optionsSet[entry.category] = true;
			}

			for (var key in optionsSet) {
				qtime.options.push({'text':key, 'value': key});
			}

			qtime.gridData = jsonData;
		},
		logout: function () {

			Cookies.remove('token'); // should remove token from server!
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
		addEntryByInput: function (event) {
			var newEntry = {
				name: this.newEntryName,
				duration: this.newEntryDuration? parseInt(this.newEntryDuration): '', 
				category: this.newEntryCategory, 
				link: this.newEntryLink,
				note: this.newEntryNote
			};


			this.addEntry(newEntry, true);

		  
			this.newEntryName = '';
			this.newEntryDuration = '';
			this.newEntryLink = '';
			this.newEntryCategory = '';
			this.newEntryNote = '';
		},
		addEntry: function (newEntry, reloadUserDataFlag) {
			var userData = this.userData;
			var that = this;
			qRequest('POST', 'api/entry', JSON.stringify(newEntry), 
				function (data) { //success
					showAjaxMsg(newEntry['name']+' is added!');
					console.log('Add entry success, id: '+ data.id);
					newEntry.id = data.id;
					userData.unshift(newEntry);
					if (reloadUserDataFlag)
						that.loadData(userData);
				}, 
				function () {alert('Error! Failed to add entry.')}
			);

		}
	}
})

function showAjaxMsg(msg) {
	qtime.ajaxMsg = msg;
	if (typeof showAjaxMsgTimeout != 'undefined')
		clearTimeout(showAjaxMsgTimeout);
	$('#ajaxMsg').fadeIn();
	showAjaxMsgTimeout = setTimeout(function(){$('#ajaxMsg').fadeOut();}, 3000);
}

qtime.$on('login success', function (username) {
	
	//once login success, save username, token, mark state,
	//then go get user's own data

	qtime.username = Cookies.get('username');
	qtime.login = true;

	qtime.getUserData();

});


qtime.$on('edit-cell', function (entry, key) {
	if (!qtime.canEdit)
		return;
	this.editEntry = entry;
	this.editCellName = key;
	this.editCellValObj = {val:entry[key]}; // hacky way, wonder what's better way
	this.showModal = true;

	Vue.nextTick(function () {
		$('textarea').focus();
		$('textarea').select();
	});

});

qtime.$on('remove-entry', function (entry) {

	console.log('deleting entry');
	qRequest('DELETE', 'api/entry/'+entry.id, null, 
		function (data) { //success
			showAjaxMsg(entry['name']+' is deleted!');
			qtime.gridData.splice(qtime.gridData.indexOf(entry),1);
		}, 
		function () {alert('Error! Failed to delete entry.')}
	);
});

qtime.$on('update-cell', function () {

	var entry = this.editEntry;
	var key = this.editCellName;
	var val = this.editCellValObj.val; // hacky way, wonder what's better way

	console.log('changing entry value from '+entry[key]+' to '+val);

	qRequest('PUT', 'api/entry/'+entry.id+'/'+key, val, 
		function (data) { //success
			showAjaxMsg(entry['name']+' is modified!');
			entry[key] = val;
		}, 
		function () {alert('Error! Failed to update entry.')}
	);

	
	this.showModal = false;

});


