Vue.component('login', {
	template: '#login-template',
	props: {
		passin: String,
	},
	data: function () {

		return {
			email: '',
			password: '',
			password2: '',
			remember: true,
			selected: this.passin,
			options: ['Sign up', 'Log in']
		}
	}
	// ,  
	// watch: {
	// 	selected: 'updateModal'
	// },

	// methods: {
	// 	updateModal: function () {
	// 		console.log('ha');
	// 	}
	// }
})