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
	watch: {
		selected: function () {this.password = '';}
	},
	mounted: function () {

		var that = this;
		this.$nextTick(function () {
			document.addEventListener("keydown", function(e) {

				if (e.keyCode == 13) {
					console.log('enter');
					that.submit();
				}
				else if (e.keyCode == 27) {
					console.log('esc');
					that.$emit('close');
				}  
			});
		})

	},
	methods: {

		submit: function () {
			if (this.selected == 'Sign up') 
				this.signup();
			else 
				this.login();
		},
		login: function () {

			var data = JSON.stringify({ "username": this.username, "password": this.password});
			qRequest('POST', 'password-login', data, this.loginSuccess, this.loginFail);

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
			if (this.password !== this.password2) {
				this.serverresponse = "Password not match.";
				this.loginOrSignupFailed = true;
				return;
			}
			var data = JSON.stringify({ "username": this.username, "email": this.email, "password": this.password});
			qRequest('POST', 'signup', data, this.loginSuccess, this.loginFail);

		}

	}
})

