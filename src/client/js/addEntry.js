var addEntry = new Vue({
	el: '#addEntryVM',
	data: {


		newEntryName: '',
		newEntryDuration: '',
		newEntryCategory: '',
		newEntryLink: '',
		newEntryNote: '',

		newEntryCandidates: [], // parse from imdb

	},
	computed: {

		newEntryPlaceHoderName: function() {
			if (Cookies.get('lang')==='cn') 
				return "新条目名";
			return "New Entry Name";
		},
		newEntryPlaceHoderTime: function() {
			if (Cookies.get('lang')==='cn') 
				return "时长";
			return "Time";
		},
		newEntryPlaceHoderLink: function() {
			if (Cookies.get('lang')==='cn') 
				return "链接";
			return "Link";
		},
		newEntryPlaceHoderNote: function() {
			if (Cookies.get('lang')==='cn') 
				return "描述";
			return "Note";
		},
		newEntryPlaceHoderCategory: function() {
			if (Cookies.get('lang')==='cn') 
				return "类别";
			return "Category";
		}

	},
	methods: {

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

			console.log('addEntryByInput');

			var newEntry = {
				name: this.newEntryName,
				duration: this.newEntryDuration? parseInt(this.newEntryDuration): '', 
				category: this.newEntryCategory, 
				link: this.newEntryLink,
				note: this.newEntryNote,
				deleted: false
			};


			this.addEntry(newEntry, true);

		  
			this.newEntryName = '';
			this.newEntryDuration = '';
			this.newEntryLink = '';
			this.newEntryCategory = '';
			this.newEntryNote = '';
		},
		addEntry: function (newEntry, reloadUserDataFlag) {
			// don't reload user data if adding entry from other list
			var userData = this.userData;
			var that = this;
			console.log('adding');
			qRequest('Adding new entry...', 'POST', 'api/entry', JSON.stringify(newEntry), 
				function (data) { //success
					showAjaxMsg(newEntry['name']+' is added!');
					console.log('Add entry success, id: '+ data.id);
					newEntry.id = data.id;
					userData.unshift(newEntry);
					if (reloadUserDataFlag)
						that.loadData(userData);
				}
			);

		}
	}
});
