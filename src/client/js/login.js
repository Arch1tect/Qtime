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
	computed: {
		confirmBtn: function () {
			var text = 'OK';
			if (Cookies.get('lang')==='cn') 
				text = '确定';
			return text;
		},
		cancelBtn: function () {
			var text = 'Cancel';
			if (Cookies.get('lang')==='cn') 
				text = '取消';
			return text;
		},
		rememberMe: function () {
			var text = 'Remember me';
			if (Cookies.get('lang')==='cn') 
				text = '记住我';
			return text;			
		},
		forgotPassword: function () {
			var text = 'Forgot password?';
			if (Cookies.get('lang')==='cn') 
				text = '忘记密码？';
			return text;			
		}

	},
	watch: {
		selected: function () {this.password = '';}
	},
	mounted: function () {

		var that = this;
		this.$nextTick(function () {
 
		});

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
			qRequest('Logging in...', 'POST', 'password-login', data, this.loginSuccess, this.loginFail);

		},
		renderLoginSignup: function(option) {
			if (Cookies.get('lang')==='cn') {

				if (option==='Log in')
					return "登录";
				else
					return "注册";
			}
			return option;			
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
			qRequest('Signing you up...', 'POST', 'signup', data, this.loginSuccess, this.loginFail);

		}

	}
})

