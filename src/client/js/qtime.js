var INIT_OPT_LIST = [{'text': 'all categories', 'value':''}];


// bootstrap the qtime
var qtime = new Vue({
	el: '#qtime-wrapper',
	data: {

		showTip: false,
		login: false,
		username: null,
		token: null,

		showModal: false,
		loginPopup: null,
		

		tableOptions: ['Trending', 'My stuff'],
		selectedTable: 'My stuff',

		publicData:null,
		userData:null,


		editCellName: '',
		editCellValObj: {},
		editEntry: '',

		showDeleted: false,
		searchQuery: '',
		gridColumns: ['name', 'duration', 'category', 'link', 'note'],
		gridData: [],

		durationMin: 0,
		durationMax: 0,


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
					// close login/signup modal
					that.loginPopup = null;

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
		},

		headerIntroduction: function() {
			if (Cookies.get('lang')==='cn') 
				return "欢迎，Qtime是一个简洁的开源项目，它的作用是让您能更快捷有效的管理与查找您感兴趣的东西。您只需将条目加入自己的清单中就可以方便的进行排序，过滤，查找等等操作。";
			return "Welcome! Qtime is a simple open source web app that helps you manage things you are interested in. Once you add items to your list, you can easily sort, filter and search for them."
		},
		headerIntroChromeExtension: function() {
			if (Cookies.get('lang')==='cn') 
				return "Qtime还提供一个谷歌浏览器插件让您可以保存平时偶遇的网站页面。";
			return "Qtime also provides a convenient Chrome Extension for saving web pages you come across. ";
		},
		chromeExtension: function() {
			if (Cookies.get('lang')==='cn') 
				return "安装插件";
			return "Install Chrome Extension";
		},
		headerIntroRegistration: function() {
			if (Cookies.get('lang')==='cn') 
				return "现在，您可以浏览下方最近流行的条目，如果要管理您自己的条目，请先";
			return "Now, you can check out trending items below, if you want to manage your own stuff, please ";
		},
		headerIntroLogin: function() {

			if (Cookies.get('lang')==='cn') 
				return "登录";
			return "Log in";
		},
		headerRegister: function() {
			if (Cookies.get('lang')==='cn') 
				return "注册";
			return "Sign up";
		},
		setTimeRangeTitle: function() {
			if (Cookies.get('lang')==='cn') 
				return "时间范围 (分钟)";
			return "Set Time Range (min)";			
		},
		selectCategoryTitle: function() {
			if (Cookies.get('lang')==='cn') 
				return "选择分类 (可多选)";
			return "Filter by Category";			
		},
		
		headerLogout: function() {
			if (Cookies.get('lang')==='cn') 
				return "登出";
			return "Log off";			
		},

		searchTitle: function() {
			if (Cookies.get('lang')==='cn') 
				return "搜索";
			return "Search";			
		},

		showDeletedTitle: function() {
			if (Cookies.get('lang')==='cn') 
				return "显示已删除条目";
			return "Show Deleted";			
		},
		hideDeletedTitle: function() {
			if (Cookies.get('lang')==='cn') 
				return "隐藏已删除条目";
			return "Hide Deleted";			
		},
		deletedTableHeaderTitle: function() {
			if (Cookies.get('lang')==='cn') 
				return "以下为已删除的条目，再次删除将不能被恢复。";
			return "Showing deleted entries below, you can't recover them if delete again here.";			
		}




	},
	watch: {
		selectedTable: function () {
			if (this.selectedTable === 'Trending') {
				this.showDeleted = false;
				if (this.publicData)
					this.loadData(this.publicData);
				else
					this.getPublicData();
			}
			else
				this.loadData(this.userData);
		},

		selectedCategory: function() {
			this.scrollToTop();
		},

		durationMin: function() {
			this.scrollToTop();
		},

		durationMax: function() {
			this.scrollToTop();
		},

		showDeleted: function() {
			this.populateOption(this.gridData);
		}

	},
	methods: {

		scrollToTop: function () {

			// $("#leftWrapper").css("margin-top", "0px");
			// $(window).scrollTop(false); // put false here so it won't trigger .scroll again
		
		},
		trendingOrMyStuffName: function(option) {
			if (Cookies.get('lang')==='cn') {
				if (option==="My stuff")
					return '我的清单';
				else
					return '流行榜单';
			}
			return option;
		},
		trendingOrMyStuffTitle: function(option) {
			if (option==="My stuff")
				return "show my stuff";
			else
				return "show trending stuff"
		},
		getPublicData: function () {
			// Go fetch the public trending data
			qRequest('Getting trending data...', 'GET', 'api/public', null, this.loadPublicData);

		},
		getUserData: function () {
			// Go fetch user's personal data
			qRequest('Getting your data...', 'GET', 'api/data', null, this.loadUserData);

		},
		loadPublicData: function (rawJSONData) {
			this.publicData = rawJSONData['array'].reverse();
			this.loadData(this.publicData);
		},
		loadUserData: function (rawJSONData) {
			this.userData = rawJSONData['array'].reverse();
			this.loadData(this.userData);
		},
		populateOption: function(jsonData) {
			// populate the grid and also category options
			var optionsSet = {};
			qtime.options = JSON.parse(JSON.stringify(INIT_OPT_LIST));
			// load categories into options
			for (var i=0; i<jsonData.length; i++) {
				var entry = jsonData[i];


				if(qtime.showDeleted != entry.deleted) 
						continue;


				if (entry.category && entry.category !='' && !(entry.category in optionsSet)) 
					optionsSet[entry.category] = true;
			}

			for (var key in optionsSet) {
				qtime.options.push({'text':key, 'value': key});
			}
		},
		loadData: function (jsonData) {


			// for (var i=0; i<jsonData.length; i++) {
			// 	var entry = jsonData[i];
			// 	if (!('deleted' in entry)) {
			// 		entry.deleted = false;
			// 	}
			// }
			// console.log(jsonData);
			qtime.populateOption(jsonData);
			qtime.gridData = jsonData;
		},
		logout: function () {

			Cookies.remove('token'); // should remove token from server!
			location.reload();

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

qtime.$on('add entry from input bar', function (entry) {

	qtime.addEntry(entry, true);

});

qtime.$on('recover entry', function (entry) {

	console.log('recovering entry');
	var m = 'Recovering entry...';
	if (Cookies.get('lang')==='cn') 
		m = '正在恢复条目...';
	qRequest(m, 'PUT', 'api/recover-entry/'+entry.id, null, 
		function (data) { //success
			var msg = entry['name'];
			if (Cookies.get('lang')==='cn') 
				msg += ' 恢复成功';
			else
				msg += ' is recovered';

			showAjaxMsg(msg);

			entry['deleted'] = false;

		}
	);


});

qtime.$on('remove entry', function (entry) {

	console.log('deleting entry');
	var m = 'Deleting entry...';
	if (Cookies.get('lang')==='cn') 
		m = '正在删除条目...';
	qRequest(m, 'DELETE', 'api/entry/'+entry.id, null, 
		function (data) { //success
			var msg = entry['name'];
			if (Cookies.get('lang')==='cn') 
				msg += ' 删除成功';
			else
				msg += ' is deleted';

			showAjaxMsg(msg);

			if (entry.deleted)
				qtime.gridData.splice(qtime.gridData.indexOf(entry),1);
			else
				entry.deleted = true;
		}
	);

});

qtime.$on('update-cell', function () {

	var entry = this.editEntry;
	var key = this.editCellName;
	var val = this.editCellValObj.val; // hacky way, wonder what's better way

	console.log('changing entry value from '+entry[key]+' to '+val);

	var that = this;

	var m = 'Updating entry...';
	if (Cookies.get('lang')==='cn') 
		m = '正在修改条目...';
	qRequest(m, 'PUT', 'api/entry/'+entry.id+'/'+key, val, 
		function (data) { //success
			that.showModal = false;

			var msg = entry['name'];
			if (Cookies.get('lang')==='cn') 
				msg += ' 修改成功';
			else
				msg += ' is modified';

			showAjaxMsg(msg);
			entry[key] = val;
		}
	);

	


});


