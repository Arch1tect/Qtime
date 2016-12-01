Vue.component('add-entry-bar', {
	template: '#add-entry-template',
  	props: {
    	header: String,
    	cellObj: Object
  	},
  	data: function () {

    	return {
			newEntryName: '',
			newEntryDuration: '',
			newEntryCategory: '',
			newEntryLink: '',
			newEntryNote: '',

			newEntryCandidates: [], // parse from imdb
    	}
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
		},
		addEntryBtnTitle: function() {
			if (Cookies.get('lang')==='cn') 
				return "将新条目加入你的清单";
			return "add new entry to your list";
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

			qtime.$emit('add entry from input bar', newEntry);
		  
			this.newEntryName = '';
			this.newEntryDuration = '';
			this.newEntryLink = '';
			this.newEntryCategory = '';
			this.newEntryNote = '';
		}

	}
});
