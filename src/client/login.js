Vue.component('login', {
	template: '#login-template',
	props: {
		passin: String,
		loginPopup: String
	},
	data: function () {

		return {
			email: '',
			password: '',
			password2: '',
			remember: true,
			selected: this.passin,
			options: ['Sign up', 'Log in'],
			serverresponse: 'hi'
		}
	},  
	// watch: {
	// 	selected: 'updateModal'
	// },

	methods: {
		submit: function () {
			var that = this;
			$.ajax({
				type: "POST",
				contentType : 'application/json',
				url: 'login',
				dataType: 'json',
				data: JSON.stringify({ "username": this.email, "password": this.password}),
				success: function () {
					serverresponse = "Success!";
					that.$emit('close');
				},
				error: function () {
					alert('error! failed to log in');
				}
			});
		}
	}
})