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
			loginOrSignupFailed: false,
			serverresponse: ''
		}
	},  
	// watch: {
	// 	selected: 'updateModal'
	// },

	methods: {
		submit: function () {
			if (this.selected == 'Sign up') 
				this.signup();
			else 
				this.login();
		},
		login: function () {
			$.ajax({
				type: "POST",
				contentType : 'application/json',
				url: 'login',
				dataType: 'json',
				data: JSON.stringify({ "username": this.username, "password": this.password}),
				success: this.loginSuccess,
				error: this.loginFail
			});
		},
		loginSuccess: function (data) {
			this.loginOrSignupFailed = false;
			this.serverresponse = "Success!";
			this.$root.$emit('login success');
			this.$emit('close');
		},
		loginFail: function (data) {
			this.serverresponse = data.responseJSON.error;
			this.loginOrSignupFailed = true;
		},
		signup: function () {
			$.ajax({
				type: "POST",
				contentType : 'application/json',
				url: 'signup',
				dataType: 'json',
				data: JSON.stringify({ "username": this.username, "email": this.email, "password": this.password}),
				success: this.loginSuccess,
				error: this.loginFail
			});
		}

	}
})

