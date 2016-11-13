Vue.component('login', {
	template: '#login-template',
	props: {
		passin: String
	},
	data: function () {

		return {
			username: '',
			email: '',
			password: '', //password never live outside this component
			password2: '',
			remember: true,
			selected: this.passin,
			options: ['Sign up', 'Log in'],
			loginFailed: false,
			serverresponse: ''
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
				headers: {"Authorization": "Basic " + btoa(this.username + ":" + this.password)},
				success: function (data) {
					token = data.token;
					that.loginFailed = false;
					that.serverresponse = "Success!";
					that.$root.$emit('login', that.username, token);
					Cookies.set('username', that.username, { expires: 100 });
					Cookies.set('token', token, { expires: 30 });
					// setTimeout(function(){that.$emit('close');}, 1000);
					that.$emit('close');
					
				},
				error: function (data) {
					that.serverresponse = data.responseJSON.error;
					that.loginFailed = true;
				}
			});
		}

	}
})

