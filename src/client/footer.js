var footer = new Vue({
	el: 'footer',
	data: {},
	computed: {

		feedback: function() {
			if (Cookies.get('lang')==='cn') 
				return "反馈";
			return "Send feedback";			
		},
		about: function() {
			if (Cookies.get('lang')==='cn') 
				return "关于";
			return "About";			
		}
	}
});