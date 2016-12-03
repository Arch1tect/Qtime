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
		},
		usernamePlaceHolder: function () {
			var text = 'Username';
			if (Cookies.get('lang')==='cn') {
				text = '用户名';
				if (this.selected=='Sign up')
					text += '（可含字母、数字与下划线）';

			}
			return text;			
		},
		passwordPlaceHolder: function () {
			var text = 'Password';
			if (Cookies.get('lang')==='cn') {
				text = '密码';
				if (this.selected=='Sign up')
					text += '（可含字母、数字与下划线）';
			}
			return text;			
		},
		confirmPasswordPlaceHolder: function () {
			var text = 'Confirm password';
			if (Cookies.get('lang')==='cn') 
				text = '确认密码';
			return text;			
		},
		emailPlaceHolder: function () {
			var text = 'Email';
			if (Cookies.get('lang')==='cn') 
				text = '电子邮箱';
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
			var msg = 'Logging in...';
			if (Cookies.get('lang')==='cn') 
				msg = '登录中...';
			qRequest(msg, 'POST', 'password-login', data, this.loginSuccess, this.loginFail);

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

